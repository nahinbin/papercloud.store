import crypto from "crypto";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

export interface AuthUser {
  id: string;
  name?: string;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: number;
}

export interface PublicUser {
  id: string;
  name?: string;
  username: string;
  email?: string;
  isAdmin: boolean;
  createdAt: number;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function createUser(input: { name?: string; username: string; password: string }): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({
    where: { username: input.username },
  });
  if (existing) throw new Error("Username already taken");
  
  // Auto-promote @admin or admin username to admin
  const isAdmin = input.username === "@admin" || input.username === "admin";
  
  const user = await prisma.user.create({
    data: {
      name: input.name,
      username: input.username,
      passwordHash: hashPassword(input.password),
      isAdmin,
    },
  });
  
  return toPublicUser(user);
}

export async function verifyUser(username: string, password: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) return null;
  if (user.passwordHash !== hashPassword(password)) return null;
  return toPublicUser(user);
}

export function toPublicUser(user: { id: string; name: string | null; username: string | null; email: string | null; isAdmin: boolean; createdAt: Date }): PublicUser {
  // For existing users without username, generate a temporary one
  // This should only happen during migration
  const username = user.username || `user_${user.id.substring(0, 8)}`;
  
  return {
    id: user.id,
    name: user.name ?? undefined,
    username,
    email: user.email ?? undefined,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.getTime(),
  };
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(24).toString("hex");
  await prisma.session.create({
    data: {
      token,
      userId,
    },
  });
  return token;
}

const cachedUserBySessionToken = unstable_cache(
  async (token: string) => {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            isAdmin: true,
            createdAt: true,
          },
        },
      },
    });
    if (!session) return null;
    return toPublicUser(session.user);
  },
  ["user", "session"],
  { revalidate: 60 }, // Cache for 1 minute
);

export async function getUserBySessionToken(token: string | undefined | null): Promise<PublicUser | null> {
  if (!token) return null;
  return cachedUserBySessionToken(token) as Promise<PublicUser | null>;
}

export async function deleteSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await prisma.session.deleteMany({
    where: { token },
  });
}

export async function createOrUpdateGoogleUser(input: {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}): Promise<PublicUser> {
  // Check if user exists by Google ID
  let user = await prisma.user.findUnique({
    where: { googleId: input.googleId },
  });

  if (user) {
    // Update existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: input.email,
        name: input.name || user.name,
        // Update username if it's auto-generated and user has email
        username: user.username || input.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      },
    });
  } else {
    // Check if user exists by email (link accounts)
    const existingByEmail = await prisma.user.findFirst({
      where: { email: input.email },
    });

    if (existingByEmail) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: input.googleId,
          name: input.name || existingByEmail.name,
        },
      });
    } else {
      // Create new user
      // Generate username from email
      const baseUsername = input.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_");
      let username = baseUsername;
      let counter = 1;

      // Ensure username is unique
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          googleId: input.googleId,
          email: input.email,
          name: input.name,
          username,
          passwordHash: null, // Google users don't have passwords
          isAdmin: false,
        },
      });
    }
  }

  return toPublicUser(user);
}


