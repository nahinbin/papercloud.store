import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "Only admins can upload images" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size too large. Maximum size is 5MB." }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Store image in database
    // We'll create a temporary product record or use a dedicated image table
    // For now, we'll return the image data as base64 for the client to store with the product
    // Actually, let's create a simple approach: return the image data and mime type
    // The product creation will store it directly
    
    // Convert buffer to base64 for JSON response (or we can return binary)
    // Actually, for now we'll return a reference ID that can be used
    // But the better approach is to store it directly when creating the product
    
    // For immediate use, let's return the data as base64 data URL
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    return NextResponse.json({ 
      url: dataUrl,
      mimeType: file.type,
      size: file.size
    }, { status: 200 });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
