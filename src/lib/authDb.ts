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

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function createUser(input: { name?: string; username: string; password: string; email?: string }): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({
    where: { username: input.username },
  });
  if (existing) throw new Error("Username already taken");
  
  // Check if email is already taken
  if (input.email) {
    const existingEmail = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase() },
    });
    if (existingEmail) throw new Error("Email already taken");
  }
  
  // Auto-promote @admin or admin username to admin
  const isAdmin = input.username === "@admin" || input.username === "admin";
  
  const user = await prisma.user.create({
    data: {
      name: input.name,
      username: input.username,
      email: input.email?.toLowerCase(),
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

/**
 * Generate username from name: "MAX VERSTAPPEN" -> "max_verstappen"
 * If username exists, append underscore and random numbers: "max_verstappen_12345"
 */
function generateUsernameFromName(name: string | undefined): string {
  if (!name) {
    // Fallback to random username if no name
    return `user_${crypto.randomBytes(4).toString('hex')}`;
  }

  // Convert to lowercase, replace spaces with underscores, remove invalid characters
  let baseUsername = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, '') // Remove invalid characters
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  // If empty after processing, use fallback
  if (!baseUsername) {
    return `user_${crypto.randomBytes(4).toString('hex')}`;
  }

  return baseUsername;
}

/**
 * Generate a unique username, appending underscore and random numbers if needed
 */
async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let attempts = 0;
  const maxAttempts = 10;

  // Check if base username is available
  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (!existing) {
    return username;
  }

  // If exists, append underscore and random numbers
  while (attempts < maxAttempts) {
    const randomSuffix = crypto.randomInt(1000, 99999); // 4-5 digit random number
    username = `${baseUsername}_${randomSuffix}`;
    
    const check = await prisma.user.findUnique({
      where: { username },
    });

    if (!check) {
      return username;
    }

    attempts++;
  }

  // Last resort: use timestamp + random
  return `${baseUsername}_${Date.now().toString().slice(-6)}${crypto.randomInt(100, 999)}`;
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
    // Update existing user (keep existing username, update name/email if needed)
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: input.email,
        name: input.name || user.name,
        // Keep existing username, don't regenerate
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
      // Generate username from name
      const baseUsername = generateUsernameFromName(input.name);
      const username = await generateUniqueUsername(baseUsername);

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


