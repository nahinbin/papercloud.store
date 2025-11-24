import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requirePermission("users.view");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      roles: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return createSuccessResponse({ users });
}

