"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus("idle");

    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Unable to process request");
      }

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 px-4 py-12">
      <div className="w-full max-w-md">
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

        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/50 p-8 md:p-10 backdrop-blur-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-zinc-900">Forgot password?</h1>
            <p className="text-sm text-zinc-500">Enter your email and we will send you a reset link.</p>
          </div>

          {status === "success" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              If an account exists for <strong>{email}</strong>, a password reset link is on its way to your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-800">Email address</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white hover:border-zinc-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {status === "error" && error && (
                <div className="rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <button
                disabled={loading}
                className="w-full rounded-xl bg-black px-4 py-3.5 text-white font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? "Sending link..." : "Send reset link"}
              </button>
            </form>
          )}

          <div className="text-center text-sm text-zinc-600">
            <Link href="/login" className="font-semibold text-black hover:text-zinc-700 transition-colors underline underline-offset-2">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

