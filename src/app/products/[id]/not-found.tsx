import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Product Not Found</h1>
        <p className="text-zinc-600 mb-6">The product you're looking for doesn't exist.</p>
        <Link href="/" className="inline-block bg-black text-white rounded px-6 py-2 hover:bg-gray-800">
          Back to Store
        </Link>
      </div>
    </div>
  );
}

