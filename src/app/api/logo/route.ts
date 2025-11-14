import { NextResponse } from "next/server";
import { writeFile, readFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const LOGO_EXTENSIONS = ["png", "svg", "jpg", "jpeg", "gif", "webp"];

export async function GET() {
  try {
    // Check for logo with different extensions
    for (const ext of LOGO_EXTENSIONS) {
      const logoPath = join(UPLOADS_DIR, `logo.${ext}`);
      if (existsSync(logoPath)) {
        return NextResponse.json({ url: `/uploads/logo.${ext}`, exists: true });
      }
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Delete old logo files
    for (const ext of LOGO_EXTENSIONS) {
      const oldLogoPath = join(uploadsDir, `logo.${ext}`);
      if (existsSync(oldLogoPath)) {
        try {
          await unlink(oldLogoPath);
        } catch (error) {
          // Ignore errors when deleting old files
        }
      }
    }

    // Determine file extension
    const extension = file.type === "image/svg+xml" ? "svg" : 
                     file.type.includes("png") ? "png" :
                     file.type.includes("jpeg") || file.type.includes("jpg") ? "jpg" :
                     file.type.includes("gif") ? "gif" : "png";
    
    // Save as logo.png (or logo.svg)
    const filename = `logo.${extension}`;
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: publicUrl, message: "Logo updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}

