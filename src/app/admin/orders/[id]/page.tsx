"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
}

interface Order {
  id: string;
  userId: string | null;
  email: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string | null;
  shippingZip: string;
  shippingCountry: string;
  totalAmount: number;
  status: string;
  braintreeTxId: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Fetch auth first, then order if authorized
    fetch("/api/auth/me")
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          const user = data.user;
          const admin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
          setIsAdmin(admin);
          if (!admin) {
            router.push("/");
            return;
          }
          // Fetch order after auth check passes
          fetchOrder();
        } else {
          setIsAdmin(false);
          router.push("/");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.push("/");
      });
  }, [router, orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      } else {
        setError("Failed to load order");
      }
    } catch (err) {
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        showToast("Order status updated successfully", "success");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to update order status", "error");
      }
    } catch (err) {
      showToast("Failed to update order status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (error || !order) {
    return (
      <div className="min-h-screen w-full bg-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link href="/admin/orders" className="text-zinc-600 hover:text-black underline mb-4 inline-block">
            ← Back to Orders
          </Link>
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
            {error || "Order not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px] ${
              toast.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <Link href="/admin/orders" className="text-zinc-600 hover:text-black underline mb-4 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="text-3xl font-semibold">Order Details</h1>
          <p className="mt-2 text-zinc-600">Order ID: {order.id}</p>
        </div>

        <div className="space-y-6">
          {/* Order Info Card */}
          <div className="border-2 border-zinc-200 rounded-lg p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Order ID</p>
                <p className="font-mono text-sm break-all">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Date Created</p>
                <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Last Updated</p>
                <p className="text-sm">{new Date(order.updatedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold">${order.totalAmount.toFixed(2)}</p>
              </div>
              {order.braintreeTxId && (
                <div>
                  <p className="text-sm text-zinc-600 mb-1">Transaction ID</p>
                  <p className="font-mono text-sm break-all">{order.braintreeTxId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="border-2 border-zinc-200 rounded-lg p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Email</p>
                <p className="text-sm font-medium">{order.email}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Name</p>
                <p className="text-sm font-medium">{order.shippingName}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-zinc-600 mb-1">Shipping Address</p>
                <div className="text-sm">
                  <p className="font-medium">{order.shippingAddress}</p>
                  <p>
                    {order.shippingCity}, {order.shippingState || ""} {order.shippingZip}
                  </p>
                  <p>{order.shippingCountry}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items Card */}
          <div className="border-2 border-zinc-200 rounded-lg p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.productTitle}</div>
                        <div className="text-xs text-zinc-500 mt-1">Product ID: {item.productId}</div>
                        <Link
                          href={`/products/${item.productId}`}
                          target="_blank"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View Product →
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">${item.productPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        ${(item.productPrice * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-right font-semibold">
                      Total:
                    </td>
                    <td className="px-4 py-4 text-lg font-bold">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Status Update Card */}
          <div className="border-2 border-zinc-200 rounded-lg p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Update Order Status</h2>
            <div className="flex gap-4 items-center">
              <select
                value={order.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updating}
                className="border rounded px-4 py-2 text-sm disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {updating && (
                <span className="text-sm text-zinc-600">Updating...</span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Select a new status to update the order. The customer will be able to see the updated status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

