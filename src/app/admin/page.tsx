"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingPageShell, Skeleton } from "@/components/LoadingSkeletons";

interface RecentOrder {
  id: string;
  amount: number;
  status: string;
  email: string;
  createdAt: string;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

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
  recentOrders: RecentOrder[];
  salesData: SalesData[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-zinc-100 text-zinc-800"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SalesChart({ data }: { data: SalesData[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((day, index) => {
          const height = (day.revenue / maxRevenue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end h-full">
                <div
                  className="w-full bg-gradient-to-t from-black to-zinc-700 rounded-t transition-all duration-500 hover:from-zinc-800 hover:to-zinc-600"
                  style={{ height: `${height}%` }}
                  title={`${formatCurrency(day.revenue)} - ${day.orders} orders`}
                />
              </div>
              <span className="text-xs text-zinc-500 mt-1">
                {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
        <span>Last 7 days</span>
        <span>Total: {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  if (loading || isAdmin === null || hasAccess === null) {
    return (
      <LoadingPageShell title="Admin" subtitle="Loading dashboard" widthClassName="max-w-7xl">
        <div className="space-y-6">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          
          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-32 w-full" />
            </div>
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Admin Dashboard</h1>
            <p className="mt-2 text-zinc-600">Comprehensive analytics and management</p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        {stats && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue */}
              <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-600">Total Revenue</p>
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-zinc-900 mb-1">{formatCurrency(stats.revenue.total)}</p>
                <p className="text-xs text-zinc-500">All time sales</p>
              </div>

              {/* Today's Revenue */}
              <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-600">Today's Revenue</p>
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-zinc-900 mb-1">{formatCurrency(stats.revenue.today)}</p>
                <p className="text-xs text-zinc-500">Sales today</p>
              </div>

              {/* Monthly Revenue */}
              <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-600">This Month</p>
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-zinc-900 mb-1">{formatCurrency(stats.revenue.month)}</p>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${stats.revenue.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {stats.revenue.growth >= 0 ? "↑" : "↓"} {Math.abs(stats.revenue.growth).toFixed(1)}%
                  </span>
                  <span className="text-xs text-zinc-500">vs last month</span>
                </div>
              </div>

              {/* Average Order Value */}
              <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-600">Avg Order Value</p>
                  <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-zinc-900 mb-1">{formatCurrency(stats.averageOrderValue)}</p>
                <p className="text-xs text-zinc-500">Per order average</p>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Sales Chart */}
              <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Sales Trend</h2>
                {stats.salesData && stats.salesData.length > 0 ? (
                  <SalesChart data={stats.salesData} />
                ) : (
                  <div className="h-32 flex items-center justify-center text-zinc-400">
                    No sales data available
                  </div>
                )}
              </div>

              {/* Order Status Breakdown */}
              <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Order Status</h2>
                <div className="space-y-3">
                  {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={status} />
                        <span className="text-sm text-zinc-600 capitalize">{status}</span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Products */}
              {isAdmin || permissions.includes("products.view") ? (
              <Link
                href="/admin/products"
                className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-900">Products</h2>
                  <span className="text-3xl font-bold text-zinc-800">{stats.products}</span>
                </div>
                <p className="text-sm text-zinc-600 mb-4">Total products in store</p>
                <div className="flex items-center text-sm font-medium text-black hover:underline">
                  Manage Products
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-2xl border border-zinc-100 bg-white/40 p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-500">Products</h2>
                  <span className="text-3xl font-bold text-zinc-400">{stats.products}</span>
                </div>
                <p className="text-sm text-zinc-500 mb-4">Total products in store</p>
                <div className="flex items-center text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}

              {/* Users */}
              {isAdmin || permissions.includes("users.view") ? (
              <Link
                href="/admin/users"
                className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-900">Users</h2>
                  <span className="text-3xl font-bold text-zinc-800">{stats.users}</span>
                </div>
                <p className="text-sm text-zinc-600 mb-4">Total registered users</p>
                <div className="flex items-center text-sm font-medium text-black hover:underline">
                  Manage Users
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-2xl border border-zinc-100 bg-white/40 p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-500">Users</h2>
                  <span className="text-3xl font-bold text-zinc-400">{stats.users}</span>
                </div>
                <p className="text-sm text-zinc-500 mb-4">Total registered users</p>
                <div className="flex items-center text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}

              {/* Orders */}
              {isAdmin || permissions.includes("orders.view") ? (
              <Link
                href="/admin/orders"
                className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-900">Orders</h2>
                  <span className="text-3xl font-bold text-zinc-800">{stats.orders}</span>
                </div>
                <p className="text-sm text-zinc-600 mb-4">Total customer orders</p>
                <div className="flex items-center text-sm font-medium text-black hover:underline">
                  Manage Orders
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-2xl border border-zinc-100 bg-white/40 p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-500">Orders</h2>
                  <span className="text-3xl font-bold text-zinc-400">{stats.orders}</span>
                </div>
                <p className="text-sm text-zinc-500 mb-4">Total customer orders</p>
                <div className="flex items-center text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}

              {/* Banners */}
              {isAdmin || permissions.includes("banners.view") ? (
              <Link
                href="/admin/banners"
                className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-900">Banners</h2>
                  <svg className="h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-600 mb-4">Manage homepage banners</p>
                <div className="flex items-center text-sm font-medium text-black hover:underline">
                  Manage Banners
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-2xl border border-zinc-100 bg-white/40 p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-500">Banners</h2>
                  <svg className="h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-500 mb-4">Manage homepage banners</p>
                <div className="flex items-center text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}

              {/* Catalogues */}
              {isAdmin || permissions.includes("catalogues.view") ? (
              <Link
                href="/admin/catalogues"
                className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-900">Catalogues</h2>
                  <svg className="h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-600 mb-4">Control the square catalogue tiles</p>
                <div className="flex items-center text-sm font-medium text-black hover:underline">
                  Manage Catalogues
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-2xl border border-zinc-100 bg-white/40 p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-500">Catalogues</h2>
                  <svg className="h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-500 mb-4">Control the square catalogue tiles</p>
                <div className="flex items-center text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}

              {/* Roles */}
              {isAdmin || permissions.includes("roles.view") ? (
              <Link
                href="/admin/roles"
                className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-900">Roles & Permissions</h2>
                  <svg className="h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-600 mb-4">Manage custom roles and permissions</p>
                <div className="flex items-center text-sm font-medium text-black hover:underline">
                  Manage Roles
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ) : (
              <div className="rounded-2xl border border-zinc-100 bg-white/40 p-6 shadow-sm opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-500">Roles & Permissions</h2>
                  <svg className="h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-500 mb-4">Manage custom roles and permissions</p>
                <div className="flex items-center text-sm font-medium text-zinc-400">
                  No Access
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              )}
            </div>

            {/* Recent Orders */}
            {stats.recentOrders && stats.recentOrders.length > 0 && (
              <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-zinc-900">Recent Orders</h2>
                  <Link
                    href="/admin/orders"
                    className="text-sm font-medium text-black hover:underline flex items-center gap-1"
                  >
                    View All
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600">Order ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600">Customer</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3 px-4 text-sm font-mono text-zinc-600">{order.id.slice(0, 8)}...</td>
                          <td className="py-3 px-4 text-sm text-zinc-900">{order.email}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-zinc-900">{formatCurrency(order.amount)}</td>
                          <td className="py-3 px-4">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-600">{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8">
          <Link href="/" className="text-zinc-600 hover:text-black underline flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
