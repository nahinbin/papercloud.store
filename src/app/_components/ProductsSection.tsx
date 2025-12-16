import { cookies } from "next/headers";
import { listHomeProductsPage } from "@/lib/productDb";
import { getUserBySessionToken } from "@/lib/authDb";
import ProductsGrid from "./ProductsGrid";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return getUserBySessionToken(token);
}

export default async function ProductsSection() {
  const INITIAL_PAGE_SIZE = 16;
  const [{ products, nextCursor, total }, user] = await Promise.all([
    listHomeProductsPage(INITIAL_PAGE_SIZE),
    getCurrentUser(),
  ]);

  const isAdmin = Boolean(user?.isAdmin || user?.username === "admin");

  return (
    <section id="products" className="space-y-5 pb-16 pt-10" suppressHydrationWarning>
      <div className="flex items-center justify-between" suppressHydrationWarning>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Available now</h2>
        </div>
        <span className="text-sm text-zinc-500">
          {total} item{total === 1 ? "" : "s"}
        </span>
      </div>

      <ProductsGrid
        initialProducts={products}
        initialNextCursor={nextCursor}
        isAdmin={isAdmin}
      />
    </section>
  );
}


