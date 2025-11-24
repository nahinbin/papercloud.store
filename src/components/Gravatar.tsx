"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { getUserAvatarUrl } from "@/lib/gravatar";

interface GravatarProps {
  email?: string | null;
  username?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export default function Gravatar({
  email,
  username,
  name,
  size = 40,
  className = "",
}: GravatarProps) {
  const [gravatarHash, setGravatarHash] = useState<string | null>(null);

  useEffect(() => {
    if (email) {
      // Fetch hash from API
      fetch(`/api/gravatar/${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.hash) {
            setGravatarHash(data.hash);
          }
        })
        .catch(() => {
          // Fallback to identicon on error
        });
    }
  }, [email]);

  const avatarUrl = useMemo(() => {
    if (email && gravatarHash) {
      // Use proper Gravatar with hash
      return `https://www.gravatar.com/avatar/${gravatarHash}?s=${size}&d=identicon&r=pg`;
    }
    // Fallback to identicon
    return getUserAvatarUrl(email, username, name, size);
  }, [email, username, name, size, gravatarHash]);

  const displayName = name || username || email || "User";

  return (
    <div className={`relative inline-block ${className}`}>
      <Image
        src={avatarUrl}
        alt={displayName}
        width={size}
        height={size}
        className="rounded-full"
        unoptimized
      />
    </div>
  );
}

