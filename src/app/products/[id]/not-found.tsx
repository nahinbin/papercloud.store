import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <Breadcrumbs className="mb-6 justify-center" />
        <h1 className="text-2xl font-semibold mb-4">Product Not Found</h1>
        <p className="text-zinc-600 mb-6">The product you're looking for doesn't exist.</p>
        <Link href="/" className="inline-block bg-black text-white rounded px-6 py-2 hover:bg-gray-800">
          Go to Store
        </Link>
      </div>
    </div>
  );
}

