"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingPageShell, Skeleton } from "@/components/LoadingSkeletons";
import Breadcrumbs from "@/components/Breadcrumbs";

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
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-zinc-400 text-sm">
        No sales data available
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue || 0), 1);
  const totalRevenue = data.reduce((sum, d) => sum + (d.revenue || 0), 0);
  
  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-end justify-between h-24 sm:h-32 gap-1 sm:gap-1.5">
        {data.map((day, index) => {
          const revenue = day.revenue || 0;
          const height = maxRevenue > 0 ? Math.max((revenue / maxRevenue) * 100, 2) : 2;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-1.5">
              <div className="w-full flex flex-col justify-end h-full relative group">
                <div
                  className="w-full bg-gradient-to-t from-black to-zinc-700 rounded-t transition-all duration-300 hover:from-zinc-800 hover:to-zinc-600 cursor-pointer touch-manipulation"
                  style={{ height: `${height}%`, minHeight: revenue > 0 ? '4px' : '0px' }}
                  title={`${formatDate(day.date)}: ${formatCurrency(revenue)} - ${day.orders || 0} orders`}
                />
                {revenue > 0 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[10px] sm:text-xs rounded opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {formatCurrency(revenue)}
                  </div>
                )}
              </div>
              <span className="text-[10px] sm:text-xs text-zinc-500">
                {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100">
        <span>Last 7 days</span>
        <span className="font-medium">Total: {formatCurrency(totalRevenue)}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
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
        
        setPermissions(userPermissions);
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
      <LoadingPageShell title="Analytics" subtitle="Loading analytics" widthClassName="max-w-7xl">
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm space-y-3">
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
                <Skeleton className="h-3 w-12 sm:w-16" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
              <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
              <Skeleton className="h-24 sm:h-32 w-full" />
            </div>
            <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
              <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
              <Skeleton className="h-24 sm:h-32 w-full" />
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Breadcrumbs className="mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Analytics</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-zinc-600">Detailed analytics and insights</p>
        </div>

        {stats && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Total Revenue */}
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-zinc-600">Total Revenue</p>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-1">{formatCurrency(stats.revenue.total)}</p>
                <p className="text-xs text-zinc-500">All time sales</p>
              </div>

              {/* Today's Revenue */}
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-zinc-600">Today's Revenue</p>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-1">{formatCurrency(stats.revenue.today)}</p>
                <p className="text-xs text-zinc-500">Sales today</p>
              </div>

              {/* Monthly Revenue */}
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-zinc-600">This Month</p>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-1">{formatCurrency(stats.revenue.month)}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={`text-xs font-medium ${stats.revenue.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {stats.revenue.growth >= 0 ? "↑" : "↓"} {Math.abs(stats.revenue.growth).toFixed(1)}%
                  </span>
                  <span className="text-xs text-zinc-500">vs last month</span>
                </div>
              </div>

              {/* Average Order Value */}
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-zinc-600">Avg Order Value</p>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-1">{formatCurrency(stats.averageOrderValue)}</p>
                <p className="text-xs text-zinc-500">Per order average</p>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Sales Chart */}
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm">
                <h2 className="text-base sm:text-lg font-semibold text-zinc-900 mb-3 sm:mb-4">Sales Trend</h2>
                {stats && stats.salesData && Array.isArray(stats.salesData) && stats.salesData.length > 0 ? (
                  <SalesChart data={stats.salesData} />
                ) : (
                  <div className="h-32 flex items-center justify-center text-zinc-400 text-sm">
                    <div className="text-center">
                      <p>No sales data available</p>
                      <p className="text-xs mt-1 text-zinc-400">Sales will appear here once orders are placed</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Status Breakdown */}
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm">
                <h2 className="text-base sm:text-lg font-semibold text-zinc-900 mb-3 sm:mb-4">Order Status</h2>
                <div className="space-y-2 sm:space-y-3">
                  {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <StatusBadge status={status} />
                        <span className="text-xs sm:text-sm text-zinc-600 capitalize truncate">{status}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-zinc-900 whitespace-nowrap">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm">
                <p className="text-xs sm:text-sm font-medium text-zinc-600 mb-2">This Week</p>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900">{formatCurrency(stats.revenue.week)}</p>
                <p className="text-xs text-zinc-500 mt-1">Weekly revenue</p>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm">
                <p className="text-xs sm:text-sm font-medium text-zinc-600 mb-2">Total Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900">{stats.orders}</p>
                <p className="text-xs text-zinc-500 mt-1">All time orders</p>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm">
                <p className="text-xs sm:text-sm font-medium text-zinc-600 mb-2">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900">{stats.users}</p>
                <p className="text-xs text-zinc-500 mt-1">Registered users</p>
              </div>
            </div>

            {/* Recent Orders */}
            {stats.recentOrders && stats.recentOrders.length > 0 && (
              <div className="rounded-xl sm:rounded-2xl border border-zinc-100 bg-white/80 p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-zinc-900">Recent Orders</h2>
                  <Link
                    href="/admin/orders"
                    className="text-xs sm:text-sm font-medium text-black hover:underline flex items-center gap-1 w-fit"
                  >
                    View All
                    <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                {/* Mobile Card Layout */}
                <div className="block md:hidden space-y-3">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-600">Order ID</span>
                        <span className="text-xs font-mono text-zinc-900">{order.id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-600">Customer</span>
                        <span className="text-xs text-zinc-900 truncate max-w-[60%]">{order.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-600">Amount</span>
                        <span className="text-xs font-semibold text-zinc-900">{formatCurrency(order.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-600">Status</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                        <span className="text-xs font-medium text-zinc-600">Date</span>
                        <span className="text-xs text-zinc-600">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto">
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

      </div>
    </div>
  );
}

