"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Username</label>
          <input className="w-full rounded border px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input className="w-full rounded border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button disabled={loading} className="rounded bg-black px-4 py-2 text-white">{loading ? "Signing in..." : "Sign in"}</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-sm">No account? <a className="underline" href="/register">Register</a></p>
      </form>
    </div>
  );
}


