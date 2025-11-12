import crypto from "crypto";
import { prisma } from "./prisma";

export interface AuthUser {
  id: string;
  name?: string;
  username: string;
  email?: string;
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
  
  // Auto-promote @admin username to admin
  const isAdmin = input.username === "@admin";
  
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

export function toPublicUser(user: { id: string; name: string | null; username: string; email: string | null; isAdmin: boolean; createdAt: Date }): PublicUser {
  return {
    id: user.id,
    name: user.name ?? undefined,
    username: user.username,
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

export async function getUserBySessionToken(token: string | undefined | null): Promise<PublicUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  return toPublicUser(session.user);
}

export async function deleteSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await prisma.session.deleteMany({
    where: { token },
  });
}


