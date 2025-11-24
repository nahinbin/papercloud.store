import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  const { email } = await params;
  
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Hash email with MD5 for Gravatar
  const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  
  return NextResponse.json({ hash });
}

