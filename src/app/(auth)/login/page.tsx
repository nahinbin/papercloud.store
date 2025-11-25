"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInvalidChars, setHasInvalidChars] = useState(false);

  // Check for OAuth errors in URL
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    }
  }, [searchParams]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert to lowercase and check for invalid characters
    const lowercased = value.toLowerCase();
    const hasInvalid = /[^a-z0-9_]/.test(lowercased);
    
    // Filter out invalid characters (keep only lowercase letters, numbers, underscore)
    const filtered = lowercased.replace(/[^a-z0-9_]/g, '');
    
    setUsername(filtered);
    // Only show hint if invalid chars were detected and field is not empty
    setHasInvalidChars(hasInvalid && filtered.length > 0);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Login failed");
      }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/50 p-8 md:p-10 backdrop-blur-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center text-zinc-900 mb-2">Welcome Back</h1>
            <p className="text-center text-zinc-500 text-sm">Sign in to your account to continue</p>
          </div>
          
          {/* Google Sign In Button - Prominent */}
          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-zinc-200 px-5 py-3.5 font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm hover:shadow-md mb-6 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign in with Google</span>
          </a>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-zinc-400 font-medium">Or sign in with username</span>
            </div>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-800">Username</label>
              <input 
                className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white hover:border-zinc-400 ${
                  hasInvalidChars 
                    ? 'border-amber-300 focus:ring-amber-500' 
                    : 'border-zinc-300 focus:ring-black'
                }`}
                value={username} 
                onChange={handleUsernameChange}
                placeholder="Enter your username"
                required
                autoFocus
              />
              {hasInvalidChars && (
                <p className="mt-1.5 text-xs text-amber-600 animate-in fade-in">
                  Only lowercase letters, numbers, and _ are allowed. Invalid characters removed.
                </p>
              )}
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-800">Password</label>
              <input 
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white hover:border-zinc-400" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button 
              disabled={loading} 
              className="w-full rounded-xl bg-black px-4 py-3.5 text-white font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center pt-6 border-t border-zinc-200">
              <p className="text-sm text-zinc-600">
                Don't have an account?{" "}
                <Link href="/register" className="font-semibold text-black hover:text-zinc-700 transition-colors underline underline-offset-2">
                  Create one now
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


