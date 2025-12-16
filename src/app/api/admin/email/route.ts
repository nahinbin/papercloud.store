import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { isEmailConfigured, sendCustomEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return Boolean(url.protocol === "http:" || url.protocol === "https:");
  } catch {
    return false;
  }
}

export async function GET() {
  const auth = await requirePermission("emails.send");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  return createSuccessResponse({
    configured: isEmailConfigured(),
    sender: {
      email: process.env.BREVO_SENDER_EMAIL || null,
      name: process.env.BREVO_SENDER_NAME || "PaperCloud",
    },
  });
}

export async function POST(request: Request) {
  const auth = await requirePermission("emails.send");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return createErrorResponse("Invalid JSON payload", 400);
  }

  const {
    mode,
    to,
    userIds,
    subject,
    previewText,
    heading,
    intro,
    message,
    buttonLabel,
    buttonUrl,
    footerNote,
    recipientName,
  } = payload || {};

  const rawMode = typeof mode === "string" ? mode : "single";
  const recipientMode = rawMode === "user" ? "users" : rawMode;

  if (!["single", "users", "all"].includes(recipientMode)) {
    return createErrorResponse("Invalid recipient mode", 400);
  }

  if (recipientMode === "single") {
    if (typeof to !== "string" || !isValidEmail(to.trim())) {
      return createErrorResponse("A valid recipient email is required", 400);
    }
  }

  if (recipientMode === "users") {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return createErrorResponse("Select at least one user", 400);
    }
  }

  if (typeof subject !== "string" || !subject.trim()) {
    return createErrorResponse("Subject is required", 400);
  }

  if (typeof message !== "string" || !message.trim()) {
    return createErrorResponse("Message body is required", 400);
  }

  if (buttonUrl && (typeof buttonUrl !== "string" || !isValidUrl(buttonUrl))) {
    return createErrorResponse("Button URL must be a valid http(s) link", 400);
  }

  if (!isEmailConfigured()) {
    return createErrorResponse("Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.", 503);
  }

  const trimmedPreview = typeof previewText === "string" ? previewText.trim() : undefined;
  const trimmedHeading = typeof heading === "string" ? heading.trim() : undefined;
  const trimmedIntro = typeof intro === "string" ? intro.trim() : undefined;
  const trimmedFooter = typeof footerNote === "string" ? footerNote.trim() : undefined;
  const trimmedRecipient = typeof recipientName === "string" ? recipientName.trim() : undefined;
  const trimmedButtonLabel = typeof buttonLabel === "string" ? buttonLabel.trim() : undefined;
  const trimmedButtonUrl = typeof buttonUrl === "string" ? buttonUrl.trim() : undefined;

  if (recipientMode === "all") {
    const users = await prisma.user.findMany({
      where: { email: { not: null } },
      select: { id: true, name: true, username: true, email: true },
    });

    if (!users.length) {
      return createErrorResponse("No users with an email address were found", 404);
    }

    for (const user of users) {
      const resolvedRecipientName =
        trimmedRecipient || user.name || user.username || null;

      await sendCustomEmail({
        to: user.email!,
        subject: subject.trim(),
        previewText: trimmedPreview,
        heading: trimmedHeading,
        intro: trimmedIntro,
        message,
        button: trimmedButtonUrl
          ? {
              label: trimmedButtonLabel || "View details",
              url: trimmedButtonUrl,
            }
          : undefined,
        footerNote: trimmedFooter,
        recipientName: resolvedRecipientName || undefined,
      });
    }

    return createSuccessResponse({
      success: true,
      mode: recipientMode,
      count: users.length,
    });
  }

  if (recipientMode === "users") {
    const uniqueUserIds: string[] = Array.from(
      new Set(
        (userIds as unknown[]).filter(
          (id): id is string => typeof id === "string" && Boolean((id as string).trim())
        )
      )
    );

    if (!uniqueUserIds.length) {
      return createErrorResponse("Select at least one valid user", 400);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
        email: { not: null },
      },
      select: { id: true, name: true, username: true, email: true },
    });

    if (!users.length) {
      return createErrorResponse("Selected users do not have email addresses", 400);
    }

    for (const user of users) {
      await sendCustomEmail({
        to: user.email!,
        subject: subject.trim(),
        previewText: trimmedPreview,
        heading: trimmedHeading,
        intro: trimmedIntro,
        message,
        button: trimmedButtonUrl
          ? {
              label: trimmedButtonLabel || "View details",
              url: trimmedButtonUrl,
            }
          : undefined,
        footerNote: trimmedFooter,
        recipientName: trimmedRecipient || user.name || user.username || undefined,
      });
    }

    return createSuccessResponse({
      success: true,
      mode: recipientMode,
      count: users.length,
    });
  }

  await sendCustomEmail({
    to: (to as string).trim(),
    subject: subject.trim(),
    previewText: trimmedPreview,
    heading: trimmedHeading,
    intro: trimmedIntro,
    message,
    button: trimmedButtonUrl
      ? {
          label: trimmedButtonLabel || "View details",
          url: trimmedButtonUrl,
        }
      : undefined,
    footerNote: trimmedFooter,
    recipientName: trimmedRecipient,
  });

  return createSuccessResponse({
    success: true,
    mode: recipientMode,
  });
}


