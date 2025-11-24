import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Check if admin or has dashboard.view permission
  const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
  const canViewDashboard = isAdmin || await hasPermission(user, "dashboard.view");
  
  if (!canViewDashboard) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today);
  thisWeek.setDate(today.getDate() - 7);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Get counts and sales data in parallel
  const [
    usersCount,
    productsCount,
    ordersCount,
    totalRevenue,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    lastMonthRevenue,
    ordersByStatus,
    recentOrders,
    averageOrderValue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    // Total revenue
    prisma.order.aggregate({
      where: { status: { not: "cancelled" } },
      _sum: { totalAmount: true },
    }),
    // Today's revenue
    prisma.order.aggregate({
      where: {
        status: { not: "cancelled" },
        createdAt: { gte: today },
      },
      _sum: { totalAmount: true },
    }),
    // This week's revenue
    prisma.order.aggregate({
      where: {
        status: { not: "cancelled" },
        createdAt: { gte: thisWeek },
      },
      _sum: { totalAmount: true },
    }),
    // This month's revenue
    prisma.order.aggregate({
      where: {
        status: { not: "cancelled" },
        createdAt: { gte: thisMonth },
      },
      _sum: { totalAmount: true },
    }),
    // Last month's revenue
    prisma.order.aggregate({
      where: {
        status: { not: "cancelled" },
        createdAt: { gte: lastMonth, lt: thisMonth },
      },
      _sum: { totalAmount: true },
    }),
    // Orders by status
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
    // Recent orders (last 5)
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        email: true,
      },
    }),
    // Average order value
    prisma.order.aggregate({
      where: { status: { not: "cancelled" } },
      _avg: { totalAmount: true },
    }),
  ]);

  // Calculate revenue growth
  const currentMonthRevenue = monthRevenue._sum.totalAmount || 0;
  const previousMonthRevenue = lastMonthRevenue._sum.totalAmount || 0;
  const revenueGrowth = previousMonthRevenue > 0
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0;

  // Format orders by status
  const statusBreakdown = ordersByStatus.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {} as Record<string, number>);

  // Get sales data for last 7 days
  const salesData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayRevenue = await prisma.order.aggregate({
      where: {
        status: { not: "cancelled" },
        createdAt: { gte: date, lt: nextDate },
      },
      _sum: { totalAmount: true },
      _count: true,
    });
    
    salesData.push({
      date: date.toISOString().split("T")[0],
      revenue: dayRevenue._sum.totalAmount || 0,
      orders: dayRevenue._count,
    });
  }

  const response = NextResponse.json({
    stats: {
      users: usersCount,
      products: productsCount,
      orders: ordersCount,
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        today: todayRevenue._sum.totalAmount || 0,
        week: weekRevenue._sum.totalAmount || 0,
        month: currentMonthRevenue,
        growth: Math.round(revenueGrowth * 100) / 100,
      },
      averageOrderValue: averageOrderValue._avg.totalAmount || 0,
      ordersByStatus: statusBreakdown,
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        amount: order.totalAmount,
        status: order.status,
        email: order.email,
        createdAt: order.createdAt.toISOString(),
      })),
      salesData,
    },
  });
  // Cache stats for 30 seconds (more frequent updates for analytics)
  response.headers.set("Cache-Control", "private, s-maxage=30, stale-while-revalidate=60");
  return response;
}

