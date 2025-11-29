import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requirePermission("emails.send");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const users = await prisma.user.findMany({
    where: {
      email: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return createSuccessResponse({
    users,
    count: users.length,
  });
}


