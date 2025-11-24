"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-zinc-900">Access Denied</h1>
          <p className="text-lg text-zinc-600">
            Sorry, you don't have permission to access this page.
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            You need the appropriate permissions to view this page. Please contact an administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/admin"
            className="rounded bg-black px-6 py-2 text-white hover:bg-zinc-800 transition-colors"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={() => router.back()}
            className="rounded border border-zinc-300 px-6 py-2 text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

