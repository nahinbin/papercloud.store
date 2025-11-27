import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to") || process.env.DEBUG_TEST_EMAIL || process.env.BREVO_SENDER_EMAIL;

  if (!to) {
    return NextResponse.json(
      { error: "Missing recipient email. Pass ?to=you@example.com or set DEBUG_TEST_EMAIL/BREVO_SENDER_EMAIL." },
      { status: 400 },
    );
  }

  try {
    await sendWelcomeEmail({
      to,
      name: "PaperCloud Debug",
    });

    return NextResponse.json({
      success: true,
      to,
      message: "Test email requested. Check Brevo logs and the inbox/spam folder.",
    });
  } catch (error: any) {
    console.error("Debug send-test-email failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send test email" },
      { status: 500 },
    );
  }
}


