"use server";
import type { Order, OrderItem } from "@prisma/client";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function isEmailConfigured() {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
}

async function dispatchEmail(payload: EmailPayload) {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[email] Brevo is not configured. Skipping email:", payload.subject);
    }
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          email: process.env.BREVO_SENDER_EMAIL!,
          name: process.env.BREVO_SENDER_NAME || "PaperCloud",
        },
        to: [{ email: payload.to }],
        subject: payload.subject,
        htmlContent: payload.html,
        textContent: payload.text,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => undefined);
      throw new Error(`Brevo responded with ${response.status}: ${errorBody || response.statusText}`);
    }
  } catch (error) {
    console.error("[email] Failed to send email", {
      subject: payload.subject,
      to: payload.to,
      error,
    });
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendWelcomeEmail(options: { to: string; name?: string | null }) {
  const recipientName = options.name || "there";
  const subject = "Welcome to PaperCloud";
  const appUrl = getBaseUrl();
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0a0a0a; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Hi ${escapeHtml(recipientName)},</h1>
      <p>Welcome to PaperCloud! We're excited to have you on board.</p>
      <p>Here are a few things you can do next:</p>
      <ul>
        <li>Browse our latest collections</li>
        <li>Save your favorite products</li>
        <li>Track orders and manage your account</li>
      </ul>
      <p style="margin-top: 24px;">
        <a href="${appUrl}" style="background: #111827; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; display: inline-block;">Start exploring</a>
      </p>
      <p style="margin-top: 32px; font-size: 12px; color: #6b7280;">If you did not create this account, please ignore this email.</p>
    </div>
  `;

  const text = [
    `Hi ${recipientName},`,
    "",
    "Welcome to PaperCloud! We're excited to have you on board.",
    "Visit your dashboard to explore the latest drops:",
    appUrl,
    "",
    "If you did not create this account, you can ignore this email.",
  ].join("\n");

  await dispatchEmail({ to: options.to, subject, html, text });
}

export async function sendPasswordResetEmail(options: { to: string; name?: string | null; resetUrl: string; expiresAt: Date }) {
  const subject = "Reset your PaperCloud password";
  const expires = options.expiresAt.toLocaleString();

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0a0a0a; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Password reset requested</h1>
      <p>Hello ${escapeHtml(options.name || "there")},</p>
      <p>We received a request to reset the password for your PaperCloud account. Click the button below to choose a new password.</p>
      <p style="margin: 24px 0;">
        <a href="${options.resetUrl}" style="background: #111827; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none;">Reset password</a>
      </p>
      <p>This link will expire on <strong>${expires}</strong>. If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  const text = [
    "Password reset requested",
    "",
    `Reset link: ${options.resetUrl}`,
    `Expires: ${expires}`,
    "",
    "If you did not request this, you can ignore the email.",
  ].join("\n");

  await dispatchEmail({ to: options.to, subject, html, text });
}

export async function sendOrderConfirmationEmail(options: { to: string; order: Order & { items: OrderItem[] }; orderUrl?: string }) {
  const { order, orderUrl } = options;
  const subject = `Order confirmation · ${order.id}`;
  const summaryRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.productTitle)}</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.productPrice)}</td>
        </tr>
      `,
    )
    .join("");

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0a0a0a; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Thanks for your order!</h1>
      <p>We've received your order <strong>${order.id}</strong> totalling <strong>${formatCurrency(order.totalAmount)}</strong>.</p>
      <table style="width: 100%; margin-top: 24px; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; border-bottom: 2px solid #111827; padding-bottom: 8px;">Item</th>
            <th style="text-align: center; border-bottom: 2px solid #111827; padding-bottom: 8px;">Qty</th>
            <th style="text-align: right; border-bottom: 2px solid #111827; padding-bottom: 8px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRows}
        </tbody>
      </table>
      <p style="margin-top: 24px;">We'll send another email once your order ships.</p>
      ${
        orderUrl
          ? `<p style="margin-top: 16px;">
              <a href="${orderUrl}" style="background: #111827; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none;">View your order</a>
            </p>`
          : ""
      }
      <p style="margin-top: 32px; font-size: 12px; color: #6b7280;">If you have any questions, just reply to this email.</p>
    </div>
  `;

  const text = [
    "Thanks for your order!",
    `Order ID: ${order.id}`,
    `Total: ${formatCurrency(order.totalAmount)}`,
    "",
    "Items:",
    ...order.items.map((item) => `• ${item.productTitle} × ${item.quantity} (${formatCurrency(item.productPrice)})`),
    "",
    orderUrl ? `View your order: ${orderUrl}` : "",
  ].join("\n");

  await dispatchEmail({ to: options.to, subject, html, text });
}

