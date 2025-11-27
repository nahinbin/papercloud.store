"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to reset password.");
      }

      setStatus("success");
    } catch (err: any) {
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
            <h1 className="text-3xl font-bold text-zinc-900">Choose a new password</h1>
            <p className="text-sm text-zinc-500">Enter a strong password to secure your account.</p>
          </div>

          {status === "success" ? (
            <div className="space-y-4 text-center">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Your password has been updated. You can now sign in with your new password.
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-3.5 text-white font-semibold hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl"
              >
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-800">Reset token</label>
                <input
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white hover:border-zinc-400"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste the token from your email"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-800">New password</label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white hover:border-zinc-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a new password"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-800">Confirm password</label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white hover:border-zinc-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter the new password"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <button
                disabled={loading}
                className="w-full rounded-xl bg-black px-4 py-3.5 text-white font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? "Updating password..." : "Reset password"}
              </button>
            </form>
          )}

          <div className="text-center text-sm text-zinc-600">
            <Link href="/forgot-password" className="font-semibold text-black hover:text-zinc-700 transition-colors underline underline-offset-2">
              Need a new link?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

