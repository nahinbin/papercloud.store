"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState<string | null>(null);

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
    
    // Fetch current logo
    fetch("/api/logo")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.exists && data.url) {
            setLogoUrl(data.url);
          }
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, [router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setLogoError(null);
      setLogoSuccess(null);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      setLogoError("Please select a file");
      return;
    }

    setLogoLoading(true);
    setLogoError(null);
    setLogoSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", logoFile);

      const res = await fetch("/api/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to upload logo");
      }

      const data = await res.json();
      setLogoUrl(data.url);
      setLogoSuccess("Logo updated successfully!");
      setLogoFile(null);
      setLogoPreview(null);
      
      // Reload page after a short delay to show updated logo
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setLogoError(err?.message || "Failed to upload logo");
    } finally {
      setLogoLoading(false);
    }
  };

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

        {/* Logo Upload Section */}
        <div className="mb-8 p-6 border-2 border-zinc-200 rounded-lg bg-white">
          <h2 className="text-xl font-semibold mb-4">Site Logo</h2>
          <p className="text-sm text-zinc-600 mb-4">Upload or change the navbar logo</p>
          
          <div className="space-y-4">
            {/* Current Logo Preview */}
            <div>
              <label className="block text-sm font-medium mb-2">Current Logo Preview</label>
              <div className="border rounded p-4 bg-zinc-50 inline-block">
                <Image 
                  src={logoPreview || logoUrl || "/nav.png"} 
                  alt="Logo Preview" 
                  width={120} 
                  height={32} 
                  className="h-8 w-auto"
                />
              </div>
              {!logoUrl && (
                <p className="text-xs text-zinc-500 mt-1">Using default logo</p>
              )}
            </div>

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Upload New Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-zinc-500 mt-1">Recommended: PNG, SVG, or JPG (max 2MB)</p>
            </div>

            {/* Upload Button */}
            {logoFile && (
              <button
                onClick={handleLogoUpload}
                disabled={logoLoading}
                className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logoLoading ? "Uploading..." : "Upload Logo"}
              </button>
            )}

            {/* Messages */}
            {logoError && (
              <p className="text-sm text-red-600">{logoError}</p>
            )}
            {logoSuccess && (
              <p className="text-sm text-green-600">{logoSuccess}</p>
            )}
          </div>
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

