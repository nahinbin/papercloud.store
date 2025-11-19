"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Username validation: only lowercase letters, numbers, and underscore
const isValidUsername = (username: string): boolean => {
  return /^[a-z0-9_]+$/.test(username);
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Filter out invalid characters in real-time
    const filtered = value.replace(/[^a-z0-9_]/g, '').toLowerCase();
    setUsername(filtered);
    
    // Validate and show error immediately
    if (filtered.length > 0 && !isValidUsername(filtered)) {
      setUsernameError("Username can only contain lowercase letters, numbers, and underscores");
      setUsernameStatus("idle");
    } else {
      setUsernameError(null);
      if (filtered.length === 0) {
        setUsernameStatus("idle");
      }
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
        body: JSON.stringify({ name: name || undefined, username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Registration failed");
      }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Image 
              src="/nav.png" 
              alt="PaperCloud" 
              width={200} 
              height={60} 
              className="h-16 w-auto mx-auto" 
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border shadow-sm p-8">
          <h1 className="mb-6 text-2xl font-semibold text-center">Create Account</h1>
          
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Name <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input 
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">Username</label>
              <input 
                className={`w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  usernameError 
                    ? "border-red-300 focus:ring-red-500" 
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
                <p className="mt-1.5 text-xs text-red-600">{usernameError}</p>
              )}
          {!usernameError && usernameStatus === "taken" && (
            <p className="mt-1.5 text-xs text-red-600">Username taken</p>
          )}
          {!usernameError && usernameStatus === "checking" && (
            <p className="mt-1.5 text-xs text-zinc-500">Checking availability...</p>
          )}
          {!usernameError && usernameStatus === "available" && (
            <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
              <span>✓</span> Username available
            </p>
          )}
          {username.length === 0 && usernameStatus === "idle" && (
                <p className="mt-1.5 text-xs text-zinc-500">Lowercase letters, numbers, and _ only</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">Password</label>
              <input 
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button 
              disabled={loading} 
              className="w-full rounded-lg bg-black px-4 py-2.5 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className="text-center pt-4 border-t border-zinc-200">
              <p className="text-sm text-zinc-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-black hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


