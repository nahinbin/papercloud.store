import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("users.edit");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Validate username format if provided
  if (typeof body.username === "string" && body.username && !/^[a-z0-9_]+$/.test(body.username)) {
    return NextResponse.json({ 
      error: "Username can only contain lowercase letters, numbers, and underscores" 
    }, { status: 400 });
  }

  try {
    const updateData: any = {};
    if (typeof body.username === "string") updateData.username = body.username;
    if (typeof body.name === "string") updateData.name = body.name || null;
    if (typeof body.isAdmin === "boolean") updateData.isAdmin = body.isAdmin;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return createSuccessResponse({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update user" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("users.delete");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await params;

  try {
    await prisma.user.delete({
      where: { id },
    });

    return createSuccessResponse({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete user" }, { status: 400 });
  }
}

