/**
 * Get avatar URL for a user (client-side)
 * Uses identicon for all cases (since we can't hash MD5 on client)
 * For proper Gravatar, use server-side functions
 */
export function getUserAvatarUrl(
  email?: string | null,
  username?: string | null,
  name?: string | null,
  size: number = 40
): string {
  // For client-side, use identicon for all
  // Server-side components should use gravatar-server.ts
  const identifier = email || username || name || "default";
  const normalized = identifier.trim().toLowerCase();
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(normalized)}&size=${size}`;
}

