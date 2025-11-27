import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  
  // In development, verify models exist on first access
  if (process.env.NODE_ENV === "development") {
    // Check if models exist (lazy check)
    const checkModels = () => {
      try {
        const hasEmailVerificationToken = typeof (client as any).emailVerificationToken !== "undefined";
        const hasPendingRegistration = typeof (client as any).pendingRegistration !== "undefined";
        if (!hasEmailVerificationToken || !hasPendingRegistration) {
          console.error("⚠️  Prisma client missing required models!");
          console.error("   Please run: npx prisma generate");
          console.error("   Then restart your Next.js dev server");
        }
      } catch (e) {
        // Ignore check errors
      }
    };
    
    // Check after a short delay to ensure client is initialized
    setTimeout(checkModels, 100);
  }
  
  return client;
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

