"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SaveProductButtonProps {
  productId: string;
  className?: string;
}

export default function SaveProductButton({ productId, className = "" }: SaveProductButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSavedStatus();
  }, [productId]);

  const checkSavedStatus = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/save`);
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.saved);
      }
    } catch (error) {
      console.error("Failed to check saved status:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggleSave = async () => {
    setLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/products/${productId}/save`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsSaved(false);
        }
      } else {
        const res = await fetch(`/api/products/${productId}/save`, {
          method: "POST",
        });
        if (res.ok) {
          setIsSaved(true);
        } else if (res.status === 401) {
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Failed to toggle save:", error);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return null;
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={loading}
      className={`inline-flex items-center justify-center w-12 h-12 rounded-lg border transition-all ${
        isSaved
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300"
          : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 hover:border-zinc-400"
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isSaved ? "Remove from saved" : "Save product"}
    >
      {isSaved ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      )}
    </button>
  );
}

