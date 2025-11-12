import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  
  if (!user) {
    return { error: "Unauthorized", status: 401, user: null };
  }
  
  const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
  if (!isAdmin) {
    return { error: "Forbidden", status: 403, user: null };
  }
  
  return { error: null, status: 200, user };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
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

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update user" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { id } = await params;

  try {
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete user" }, { status: 400 });
  }
}

