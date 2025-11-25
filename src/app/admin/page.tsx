"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingPageShell, Skeleton } from "@/components/LoadingSkeletons";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Stats {
  users: number;
  products: number;
  orders: number;
  revenue: {
    total: number;
    today: number;
    week: number;
    month: number;
    growth: number;
  };
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  recentOrders: Array<{
    id: string;
    amount: number;
    status: string;
    email: string;
    createdAt: string;
  }>;
  salesData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}


export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchData = async () => {
    try {
      const [authRes, statsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/stats", { cache: "no-store" }),
      ]);

      if (authRes.ok) {
        const authData = await authRes.json();
        const user = authData.user;
        const userPermissions = authData.permissions || [];
        const admin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
        setIsAdmin(admin);
        
        // Check permissions - now available from auth response
        setPermissions(userPermissions);
        // Check if user has dashboard.view permission or is admin
        const canViewDashboard = admin || userPermissions.includes("dashboard.view");
        setHasAccess(canViewDashboard);
        
        if (!canViewDashboard) {
          router.push("/admin/unauthorized");
          return;
        }
      } else {
        setIsAdmin(false);
        setHasAccess(false);
        router.push("/admin/unauthorized");
        return;
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  if (loading || isAdmin === null || hasAccess === null) {
    return (
      <LoadingPageShell title="Admin" subtitle="Loading dashboard" widthClassName="max-w-7xl">
        <div className="space-y-4 sm:space-y-6">
          {/* Analytics Banner Skeleton */}
          <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm">
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm space-y-3">
                <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
                <Skeleton className="h-3 w-32 sm:w-40" />
              </div>
            ))}
          </div>
        </div>
      </LoadingPageShell>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Breadcrumbs className="mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Admin Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-zinc-600">Comprehensive analytics and management</p>
        </div>

        {stats && (
          <>
            {/* Analytics Preview Banner */}
            <Link
              href="/admin/analytics"
              className="block rounded-xl sm:rounded-2xl border border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200 mb-6 sm:mb-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="text-base sm:text-lg font-semibold text-zinc-900">Analytics Overview</h2>
                  </div>
                  
                  {/* Mobile: Compact view */}
                  <div className="block sm:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600">Total Revenue</span>
                      <span className="text-sm font-semibold text-zinc-900">{formatCurrency(stats.revenue.total)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600">Today</span>
                      <span className="text-sm font-semibold text-zinc-900">{formatCurrency(stats.revenue.today)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                      <span className="text-xs text-zinc-600">Orders</span>
                      <span className="text-sm font-semibold text-zinc-900">{stats.orders}</span>
                    </div>
                  </div>

                  {/* Desktop: More detailed view */}
                  <div className="hidden sm:grid sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">Total Revenue</p>
                      <p className="text-lg font-bold text-zinc-900">{formatCurrency(stats.revenue.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">Today's Revenue</p>
                      <p className="text-lg font-bold text-zinc-900">{formatCurrency(stats.revenue.today)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">Total Orders</p>
                      <p className="text-lg font-bold text-zinc-900">{stats.orders}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors whitespace-nowrap">
                  See more
                  <svg className="ml-1 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Products */}
              {isAdmin || permissions.includes("products.view") ? (
              <Link
                href="/admin/products"
                className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">Products</h2>
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-800">{stats.products}</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 mb-3 sm:mb-4">Total products in store</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-black hover:underline">
                  Manage Products
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/40 p-4 sm:p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-500">Products</h2>
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-400">{stats.products}</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">Total products in store</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}

              {/* Users */}
              {isAdmin || permissions.includes("users.view") ? (
              <Link
                href="/admin/users"
                className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">Users</h2>
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-800">{stats.users}</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 mb-3 sm:mb-4">Total registered users</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-black hover:underline">
                  Manage Users
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/40 p-4 sm:p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-500">Users</h2>
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-400">{stats.users}</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">Total registered users</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}

              {/* Orders */}
              {isAdmin || permissions.includes("orders.view") ? (
              <Link
                href="/admin/orders"
                className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">Orders</h2>
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-800">{stats.orders}</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 mb-3 sm:mb-4">Total customer orders</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-black hover:underline">
                  Manage Orders
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/40 p-4 sm:p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-500">Orders</h2>
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-400">{stats.orders}</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">Total customer orders</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}

              {/* Banners */}
              {isAdmin || permissions.includes("banners.view") ? (
              <Link
                href="/admin/banners"
                className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">Banners</h2>
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 mb-3 sm:mb-4">Manage homepage banners</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-black hover:underline">
                  Manage Banners
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/40 p-4 sm:p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-500">Banners</h2>
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">Manage homepage banners</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}

              {/* Categories */}
              {isAdmin || permissions.includes("catalogues.view") ? (
              <Link
                href="/admin/catalogues"
                className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">Categories</h2>
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 mb-3 sm:mb-4">Control the square category tiles</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-black hover:underline">
                  Manage Categories
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/40 p-4 sm:p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-500">Categories</h2>
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">Control the square category tiles</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}

              {/* Roles */}
              {isAdmin || permissions.includes("roles.view") ? (
              <Link
                href="/admin/roles"
                className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-xl font-semibold text-zinc-900">Roles & Permissions</h2>
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 mb-3 sm:mb-4">Manage custom roles and permissions</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-black hover:underline">
                  Manage Roles
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/40 p-4 sm:p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-xl font-semibold text-zinc-500">Roles & Permissions</h2>
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">Manage custom roles and permissions</p>
                <div className="flex items-center text-xs sm:text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
