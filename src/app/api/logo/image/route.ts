import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
  try {
    // Get the most recent logo from database
    const logo = await prisma.logo.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!logo) {
      return NextResponse.json({ error: "Logo not found" }, { status: 404 });
    }

    // Convert to buffer and return
    const buffer = Buffer.from(logo.imageData);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": logo.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Logo serve error:", error);
    return NextResponse.json({ error: "Failed to serve logo" }, { status: 500 });
  }
}

