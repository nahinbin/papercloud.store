"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Filter out invalid characters in real-time
    const filtered = value.replace(/[^a-z0-9_]/g, '').toLowerCase();
    setUsername(filtered);
    
    // Validate and show error immediately
    if (filtered.length > 0 && !isValidUsername(filtered)) {
      setUsernameError("Username can only contain lowercase letters, numbers, and underscores");
    } else if (filtered.length === 0) {
      setUsernameError(null);
    } else {
      setUsernameError(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate username before submitting
    if (!username || !isValidUsername(username)) {
      setUsernameError("Username can only contain lowercase letters, numbers, and underscores");
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
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Register</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Name (optional)</label>
          <input className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Username</label>
          <input 
            className={`w-full rounded border px-3 py-2 ${usernameError ? "border-red-500" : ""}`}
            value={username} 
            onChange={handleUsernameChange}
            placeholder="Only lowercase letters, numbers, and _"
          />
          {usernameError && (
            <p className="mt-1 text-sm text-red-600">{usernameError}</p>
          )}
          {!usernameError && username.length > 0 && (
            <p className="mt-1 text-xs text-green-600">✓ Valid username format</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input className="w-full rounded border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button disabled={loading} className="rounded bg-black px-4 py-2 text-white">{loading ? "Creating..." : "Create account"}</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-sm">Already have an account? <a className="underline" href="/login">Login</a></p>
      </form>
    </div>
  );
}


