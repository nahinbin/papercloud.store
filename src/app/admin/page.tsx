"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stats {
  users: number;
  products: number;
  orders: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          const user = data.user;
          const admin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
          setIsAdmin(admin);
          if (!admin) {
            router.push("/");
          }
        } else {
          setIsAdmin(false);
          router.push("/");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.push("/");
      })
      .finally(() => setLoading(false));
    
    // Fetch stats
    fetch("/api/admin/stats")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, [router]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <p className="text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="mt-2 text-zinc-600">Manage your platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border-2 border-zinc-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Products</h2>
              {stats && (
                <span className="text-2xl font-bold text-zinc-800">{stats.products}</span>
              )}
            </div>
            <p className="text-sm text-zinc-600 mb-4">Total products in store</p>
            <Link
              href="/admin/products"
              className="inline-block rounded bg-black px-4 py-2 text-white text-sm hover:bg-zinc-800 transition-colors"
            >
              Manage Products →
            </Link>
          </div>

          <div className="p-6 border-2 border-zinc-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Users</h2>
              {stats && (
                <span className="text-2xl font-bold text-zinc-800">{stats.users}</span>
              )}
            </div>
            <p className="text-sm text-zinc-600 mb-4">Total registered users</p>
            <Link
              href="/admin/users"
              className="inline-block rounded bg-black px-4 py-2 text-white text-sm hover:bg-zinc-800 transition-colors"
            >
              Manage Users →
            </Link>
          </div>

          <div className="p-6 border-2 border-zinc-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Orders</h2>
              {stats && (
                <span className="text-2xl font-bold text-zinc-800">{stats.orders}</span>
              )}
            </div>
            <p className="text-sm text-zinc-600 mb-4">Total customer orders</p>
            <Link
              href="/admin/orders"
              className="inline-block rounded bg-black px-4 py-2 text-white text-sm hover:bg-zinc-800 transition-colors"
            >
              Manage Orders →
            </Link>
          </div>

          <div className="p-6 border-2 border-zinc-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Banners</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">Manage homepage banners</p>
            <Link
              href="/admin/banners"
              className="inline-block rounded bg-black px-4 py-2 text-white text-sm hover:bg-zinc-800 transition-colors"
            >
              Manage Banners →
            </Link>
          </div>

        </div>

        <div className="mt-8">
          <Link href="/" className="text-zinc-600 hover:text-black underline">
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}

