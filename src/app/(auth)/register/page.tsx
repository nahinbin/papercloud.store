"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";

// Username validation: only lowercase letters, numbers, and underscore
const isValidUsername = (username: string): boolean => {
  return /^[a-z0-9_]+$/.test(username);
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useUser();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showSecondCard, setShowSecondCard] = useState(false);
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
    
    // Clear username error when typing
    if (usernameError) {
      setUsernameError(null);
    }
    
    // Reset status if field is empty
    if (filtered.length === 0) {
      setUsernameStatus("idle");
    }
  };

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault();
    setEmailError(null);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Please enter a valid email");
      return;
    }

    // Check if email is taken
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        throw new Error("Failed to check email");
      }
      const data = await res.json();
      if (!data.available) {
        setEmailError("Email is taken already");
        return;
      }
      
      // Email is available, proceed to next card
      setShowSecondCard(true);
      // Focus name field after card appears
      setTimeout(() => {
        const nameInput = document.querySelector('input[placeholder="Enter your name"]') as HTMLInputElement;
        nameInput?.focus();
      }, 100);
    } catch {
      setEmailError("Failed to verify email. Please try again.");
    }
  };

  useEffect(() => {
    if (!username || usernameError) {
      setUsernameStatus("idle");
      return;
    }

    if (!isValidUsername(username)) {
      setUsernameStatus("idle");
      return;
    }

    let isCancelled = false;
    setUsernameStatus("checking");

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Failed to check username");
        }
        const data = await res.json();
        if (!isCancelled) {
          setUsernameStatus(data.available ? "available" : "taken");
        }
      } catch {
        if (!isCancelled) {
          setUsernameStatus("idle");
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [username, usernameError]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate username before submitting
    if (!username || !isValidUsername(username)) {
      setUsernameError("Username can only contain lowercase letters, numbers, and underscores");
      return;
    }

    if (usernameStatus === "taken") {
      setUsernameError("Username taken");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, username, password, email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Registration failed");
      }
      // Refresh user context immediately after registration to update UI
      await refreshUser();
      // Then navigate to home
      router.push("/");
    } catch (err: any) {
      setError(err?.message ?? "Registration failed");
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

        {/* Email Card - First Card */}
        {!showSecondCard && (
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/50 p-8 md:p-10 backdrop-blur-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center text-zinc-900 mb-2">Create Account</h1>
            <p className="text-center text-zinc-500 text-sm">Join PaperCloud and start shopping today</p>
          </div>

          {/* Google Sign Up Button - Prominent */}
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
            <span>Sign up with Google</span>
          </a>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-zinc-400 font-medium">Or create account with email</span>
            </div>
          </div>
          
          <form>
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-zinc-800">Email</label>
              <input 
                className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white hover:border-zinc-400 ${
                  emailError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-zinc-300 focus:ring-black"
                }`}
                type="email"
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                placeholder="Enter your email"
                required
                autoFocus
              />
              {emailError && (
                <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in">
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={email.trim().length === 0}
              className="w-full rounded-xl bg-black px-4 py-3.5 text-white font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] mb-5"
            >
              Continue
            </button>

            <div className="text-center pt-6 border-t border-zinc-200">
              <p className="text-sm text-zinc-600">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-black hover:text-zinc-700 transition-colors underline underline-offset-2">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
        )}

        {/* Second Card - Name, Username, Password */}
        {showSecondCard && (
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/50 p-8 md:p-10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-800">
                  Name <span className="text-zinc-400 font-normal text-xs">(optional)</span>
                </label>
                <input 
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white hover:border-zinc-400" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-800">Username</label>
                <input 
                  className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white hover:border-zinc-400 ${
                    usernameError 
                      ? "border-red-300 focus:ring-red-500" 
                  : hasInvalidChars
                  ? "border-amber-300 focus:ring-amber-500"
                  : usernameStatus === "available"
                  ? "border-green-300 focus:ring-green-500"
                      : "border-zinc-300 focus:ring-black"
                  }`}
                  value={username} 
                  onChange={handleUsernameChange}
                  placeholder="Enter your username"
                  required
                />
                {usernameError && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in">{usernameError}</p>
                )}
                {!usernameError && hasInvalidChars && (
                  <p className="mt-1.5 text-xs text-amber-600 animate-in fade-in">
                    Only lowercase letters, numbers, and _ are allowed. Invalid characters removed.
                  </p>
                )}
                {!usernameError && !hasInvalidChars && usernameStatus === "taken" && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in">Username taken</p>
                )}
                {!usernameError && !hasInvalidChars && usernameStatus === "checking" && (
                  <p className="mt-1.5 text-xs text-zinc-500 flex items-center gap-1.5">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Checking availability...
                  </p>
                )}
                {!usernameError && !hasInvalidChars && usernameStatus === "available" && (
                  <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Username available
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
                disabled={loading || usernameStatus === "checking" || usernameStatus === "taken"} 
                className="w-full rounded-xl bg-black px-4 py-3.5 text-white font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


