import crypto from "crypto";

/**
 * Generate MD5 hash for Gravatar (server-side only)
 */
function md5(str: string): string {
  return crypto.createHash("md5").update(str.trim().toLowerCase()).digest("hex");
}

/**
 * Get Gravatar URL for an email address (server-side)
 */
export function getGravatarUrl(email: string, size: number = 40, defaultType: string = "identicon"): string {
  const hash = md5(email);
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultType}&r=pg`;
}

/**
 * Get avatar URL for a user (server-side)
 * Uses Gravatar for email, identicon for username/name
 */
export function getUserAvatarUrl(
  email?: string | null,
  username?: string | null,
  name?: string | null,
  size: number = 40
): string {
  if (email) {
    return getGravatarUrl(email, size);
  }
  
  // Fallback to identicon for username/name
  const identifier = username || name || "default";
  const normalized = identifier.trim().toLowerCase();
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(normalized)}&size=${size}`;
}

