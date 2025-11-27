"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token. Please use the link from your email.");
      return;
    }

    const verify = async () => {
      setStatus("verifying");
      try {
        const res = await fetch("/api/auth/email-verification/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data?.error || "Verification failed");
        }

        setStatus("success");
        setMessage("Your email has been verified. You can now continue using your account.");

        // Optionally redirect to account/home after a short delay
        setTimeout(() => {
          router.push("/account");
        }, 2500);
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Verification failed. Your link may have expired.");
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-zinc-200/50 p-8 md:p-10 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">Verify your email</h1>
          <p className="text-sm text-zinc-500">
            We&apos;re confirming that this email address belongs to you.
          </p>
        </div>

        <div className="space-y-3 text-sm text-zinc-700">
          {status === "verifying" && (
            <p className="text-zinc-700">Verifying your email, please wait...</p>
          )}
          {status === "success" && (
            <p className="text-emerald-700">
              {message || "Your email has been verified successfully."}
            </p>
          )}
          {status === "error" && (
            <p className="text-red-700">
              {message || "We couldn&apos;t verify your email. The link may be invalid or expired."}
            </p>
          )}
        </div>

        <div className="text-center text-sm text-zinc-600">
          <Link
            href="/account"
            className="font-semibold text-black hover:text-zinc-700 transition-colors underline underline-offset-2"
          >
            Go to your account
          </Link>
        </div>
      </div>
    </div>
  );
}


