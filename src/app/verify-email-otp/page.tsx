"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function VerifyEmailOTPPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const pendingIdParam = searchParams.get("pendingId");
    const emailParam = searchParams.get("email");
    
    if (!pendingIdParam || !emailParam) {
      setStatus("error");
      setMessage("Invalid verification link. Please register again.");
      return;
    }

    setUserId(pendingIdParam);
    setEmail(emailParam);
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !otp || otp.length !== 6) {
      setMessage("Please enter a valid 6-digit code");
      setStatus("error");
      return;
    }

    setStatus("verifying");
    setMessage(null);

    try {
      const res = await fetch("/api/auth/email-verification/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId: userId, otp }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Verification failed");
      }

      setStatus("success");
      setMessage("Your account has been created and verified! Redirecting...");

      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Invalid verification code. Please try again.");
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || !userId) return;

    setIsResending(true);
    try {
      const res = await fetch("/api/auth/email-verification/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId: userId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed to resend code");
      }

      setMessage("Verification code has been resent to your email.");
      setStatus("idle");
      setResendCooldown(60); // 60 second cooldown
    } catch (err: any) {
      setMessage(err?.message || "Failed to resend code. Please try again.");
      setStatus("error");
    } finally {
      setIsResending(false);
    }
  };

  if (!userId || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-zinc-200/50 p-8 md:p-10">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-4">Invalid Link</h1>
            <p className="text-sm text-zinc-600 mb-6">
              This verification link is invalid or expired. Please register again.
            </p>
            <Link
              href="/register"
              className="inline-block rounded-xl bg-black px-6 py-3 text-white font-semibold hover:bg-zinc-800 transition-all"
            >
              Go to Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Image 
              src="/nav.png" 
              alt="PaperCloud" 
              width={200} 
              height={60} 
              className="h-16 w-auto mx-auto drop-shadow-sm" 
              priority
              unoptimized
            />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/50 p-8 md:p-10 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">Verify your email</h1>
            <p className="text-sm text-zinc-600">
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-sm font-semibold text-zinc-900">{email}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-800">
                Enter verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(value);
                  setMessage(null);
                  setStatus("idle");
                }}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3.5 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white hover:border-zinc-400"
                placeholder="000000"
                autoFocus
                disabled={status === "verifying" || status === "success"}
              />
            </div>

            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm font-medium animate-in fade-in ${
                  status === "error"
                    ? "bg-red-50 border-2 border-red-200 text-red-700"
                    : status === "success"
                    ? "bg-emerald-50 border-2 border-emerald-200 text-emerald-700"
                    : "bg-blue-50 border-2 border-blue-200 text-blue-700"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={otp.length !== 6 || status === "verifying" || status === "success"}
              className="w-full rounded-xl bg-black px-4 py-3.5 text-white font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {status === "verifying" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify Email"
              )}
            </button>

            <div className="text-center space-y-2">
              <p className="text-sm text-zinc-600">
                Didn&apos;t receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || isResending || status === "verifying" || status === "success"}
                className="text-sm font-semibold text-black hover:text-zinc-700 transition-colors underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending
                  ? "Sending..."
                  : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend verification code"}
              </button>
            </div>
          </form>

          <div className="text-center pt-6 border-t border-zinc-200">
            <p className="text-sm text-zinc-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-black hover:text-zinc-700 transition-colors underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

