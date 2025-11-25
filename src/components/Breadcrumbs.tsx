"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Admin pages
    if (paths[0] === "admin") {
      breadcrumbs.push({ label: "Dashboard", href: "/admin" });
      
      if (paths[1] === "analytics") {
        breadcrumbs.push({ label: "Analytics", href: "/admin/analytics" });
      } else if (paths[1] === "products") {
        breadcrumbs.push({ label: "Products", href: "/admin/products" });
        if (paths[2] && paths[2] !== "new") {
          if (paths[3] === "edit") {
            breadcrumbs.push({ label: "Edit", href: pathname });
          } else {
            breadcrumbs.push({ label: "Details", href: pathname });
          }
        } else if (paths[2] === "new") {
          breadcrumbs.push({ label: "New Product", href: "/admin/products/new" });
        }
      } else if (paths[1] === "orders") {
        breadcrumbs.push({ label: "Orders", href: "/admin/orders" });
        if (paths[2]) {
          breadcrumbs.push({ label: "Order Details", href: pathname });
        }
      } else if (paths[1] === "users") {
        breadcrumbs.push({ label: "Users", href: "/admin/users" });
      } else if (paths[1] === "banners") {
        breadcrumbs.push({ label: "Banners", href: "/admin/banners" });
      } else if (paths[1] === "catalogues") {
        breadcrumbs.push({ label: "Categories", href: "/admin/catalogues" });
      } else if (paths[1] === "roles") {
        breadcrumbs.push({ label: "Roles & Permissions", href: "/admin/roles" });
      }
    } else if (paths[0] === "products" && paths[1]) {
      breadcrumbs.push({ label: "Store", href: "/" });
      breadcrumbs.push({ label: "Product", href: pathname });
    } else if (paths[0] === "users" && paths[1]) {
      breadcrumbs.push({ label: "Store", href: "/" });
      breadcrumbs.push({ label: "Profile", href: pathname });
    } else if (paths[0] === "catalogues" && paths[1]) {
      breadcrumbs.push({ label: "Store", href: "/" });
      breadcrumbs.push({ label: "Category", href: pathname });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={item.href} className="flex items-center gap-2">
              {index > 0 && (
                <svg
                  className="h-4 w-4 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {isLast ? (
                <span className="text-zinc-900 font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

