"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  iconOnly?: boolean;
  variant?: "solid" | "ghost" | "minimal";
}

export default function ShareButton({
  url,
  title,
  description,
  className = "",
  iconOnly = false,
  variant = "solid",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareText = description ? `${title}\n\n${description}\n\n${url}` : `${title}\n\n${url}`;

  const handleShare = async () => {
    // Check if Web Share API is available (mobile browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: url,
        });
        setShowShareMenu(false);
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      // Fallback: show share menu
      setShowShareMenu(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShowShareMenu(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
    setShowShareMenu(false);
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct link sharing, so we copy the link
    copyToClipboard();
    // Open Instagram in new tab (user can paste the link)
    window.open("https://www.instagram.com/", "_blank");
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent(`Check out: ${title}`);
    const body = encodeURIComponent(shareText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  const isGhost = variant === "ghost";
  const isMinimal = variant === "minimal";
  const buttonBaseClasses = iconOnly
    ? `${
        isMinimal
          ? "flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50"
          : isGhost
          ? "h-12 w-12 rounded-2xl border border-zinc-200 bg-white/80 text-zinc-600 hover:border-zinc-400 hover:bg-white"
          : "h-12 w-12 rounded-2xl bg-black text-white hover:bg-zinc-800"
      }`
    : `${
        isMinimal
          ? "flex items-center justify-center gap-2 rounded-full bg-transparent px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          : isGhost
          ? "flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:bg-white"
          : "flex items-center justify-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      }`;

  const buttonClasses = `${buttonBaseClasses} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`.trim();
  const wrapperClasses = `relative ${className}`.trim();

  return (
    <div className={wrapperClasses}>
      <button
        onClick={handleShare}
        type="button"
        className={`${buttonClasses} ${iconOnly ? "relative w-12" : "w-full sm:w-auto"}`}
        aria-label="Share product"
        title={copied ? "Link copied" : "Share product"}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="7" cy="12" r="2.25" strokeWidth={1.8} />
          <circle cx="17" cy="6.5" r="2.25" strokeWidth={1.8} />
          <circle cx="17" cy="17.5" r="2.25" strokeWidth={1.8} />
          <path strokeWidth={1.8} strokeLinecap="round" d="M8.9 10.8l5.2-3" />
          <path strokeWidth={1.8} strokeLinecap="round" d="M8.9 13.2l5.2 3.1" />
        </svg>
        {iconOnly ? (
          <>
            <span className="sr-only">{copied ? "Link copied" : "Share product"}</span>
            {copied && (
              <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-lg">
                Copied
              </span>
            )}
          </>
        ) : (
          <span>{copied ? "Copied!" : "Share"}</span>
        )}
      </button>

      {/* Share Menu Dropdown */}
      {showShareMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-zinc-200 z-50 overflow-hidden">
            <div className="py-1">
              <button
                onClick={copyToClipboard}
                className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex items-center gap-3 transition-colors"
              >
                <svg className="h-5 w-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-zinc-900">Copy Link</span>
              </button>
              
              <button
                onClick={shareToWhatsApp}
                className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex items-center gap-3 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-sm text-zinc-900">WhatsApp</span>
              </button>
              
              <button
                onClick={shareToFacebook}
                className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex items-center gap-3 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm text-zinc-900">Facebook</span>
              </button>
              
              <button
                onClick={shareToTwitter}
                className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex items-center gap-3 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1DA1F2">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span className="text-sm text-zinc-900">Twitter</span>
              </button>
              
              <button
                onClick={shareToEmail}
                className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex items-center gap-3 transition-colors"
              >
                <svg className="h-5 w-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-zinc-900">Email</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

