import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the most recent logo from database
    const logo = await prisma.logo.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (logo) {
      return NextResponse.json({ 
        url: `/api/logo/image`, 
        exists: true 
      });
    }
    
    return NextResponse.json({ url: null, exists: false });
  } catch (error: any) {
    console.error("Error checking logo:", error);
    return NextResponse.json({ url: null, exists: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const user = await getUserBySessionToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Check if admin
    const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Only admins can upload logo" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
    }

    // Validate file size (max 2MB for logo)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size too large. Maximum size is 2MB." }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageData = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) as any;

    // Store logo in database (upsert - delete old and create new)
    await prisma.logo.deleteMany({});
    
    await prisma.logo.create({
      data: {
        imageData: imageData,
        mimeType: file.type,
      },
    });

    // Return success
    return NextResponse.json({ 
      url: `/api/logo/image`, 
      message: "Logo updated successfully" 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}
