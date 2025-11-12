"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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
          <Link
            href="/admin/products"
            className="block p-6 border-2 border-zinc-200 rounded-lg hover:border-black hover:shadow-lg transition-all"
          >
            <h2 className="text-xl font-semibold mb-2">Products</h2>
            <p className="text-sm text-zinc-600">Manage all products - view, edit, delete, and create new products</p>
          </Link>

          <Link
            href="/admin/users"
            className="block p-6 border-2 border-zinc-200 rounded-lg hover:border-black hover:shadow-lg transition-all"
          >
            <h2 className="text-xl font-semibold mb-2">Users</h2>
            <p className="text-sm text-zinc-600">View all users, manage accounts, and control access</p>
          </Link>

          <Link
            href="/admin/products/new"
            className="block p-6 border-2 border-zinc-200 rounded-lg hover:border-black hover:shadow-lg transition-all"
          >
            <h2 className="text-xl font-semibold mb-2">Add Product</h2>
            <p className="text-sm text-zinc-600">Create a new product for your store</p>
          </Link>
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

