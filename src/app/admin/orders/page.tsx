"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function OrdersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ orderId: string; orderName: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    // Fetch auth (which now includes permissions), then orders if authorized
    fetch("/api/auth/me")
      .then(async (authRes) => {
        if (authRes.ok) {
          const authData = await authRes.json();
          const user = authData.user;
          const permissions = authData.permissions || [];
          const admin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
          setIsAdmin(admin);
          
          // Check permissions - now available from auth response
          const canViewOrders = admin || permissions.includes("orders.view");
          
          if (!canViewOrders) {
            router.push("/admin/unauthorized");
            return;
          }
          
          // Fetch orders after auth check passes
          fetchOrders();
        } else {
          setIsAdmin(false);
          router.push("/admin/unauthorized");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.push("/admin/unauthorized");
      });
  }, [router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        setError("Failed to load orders");
      }
    } catch (err) {
      setError("Failed to load orders");
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

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(orders.map(o => o.id === orderId ? data.order : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
        showToast("Order status updated successfully", "success");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to update order status", "error");
      }
    } catch (err) {
      showToast("Failed to update order status", "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const orderToDelete = orders.find(o => o.id === orderId);
        setOrders(orders.filter(o => o.id !== orderId));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
        showToast("Order deleted successfully", "success");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to delete order", "error");
      }
    } catch (err) {
      showToast("Failed to delete order", "error");
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

  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 border border-zinc-200">
            <h3 className="text-lg font-semibold mb-3">Delete Order?</h3>
            <p className="text-sm text-zinc-600 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteOrder(deleteConfirm.orderId);
                  if (selectedOrder?.id === deleteConfirm.orderId) {
                    setSelectedOrder(null);
                  }
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <Link href="/admin" className="text-zinc-600 hover:text-black underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold">Order Management</h1>
          <p className="mt-2 text-zinc-600">View and manage all customer orders</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
            {error}
          </div>
        )}

        {/* Status Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded text-sm font-medium ${
              statusFilter === "all"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 rounded text-sm font-medium ${
              statusFilter === "pending"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            Pending ({orders.filter(o => o.status === "pending").length})
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-4 py-2 rounded text-sm font-medium ${
              statusFilter === "paid"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            Paid ({orders.filter(o => o.status === "paid").length})
          </button>
          <button
            onClick={() => setStatusFilter("shipped")}
            className={`px-4 py-2 rounded text-sm font-medium ${
              statusFilter === "shipped"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            Shipped ({orders.filter(o => o.status === "shipped").length})
          </button>
          <button
            onClick={() => setStatusFilter("delivered")}
            className={`px-4 py-2 rounded text-sm font-medium ${
              statusFilter === "delivered"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            Delivered ({orders.filter(o => o.status === "delivered").length})
          </button>
          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`px-4 py-2 rounded text-sm font-medium ${
              statusFilter === "cancelled"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            Cancelled ({orders.filter(o => o.status === "cancelled").length})
          </button>
        </div>

        {/* Orders Table */}
        <div className="border rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm font-mono text-zinc-600">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{order.shippingName}</div>
                      <div className="text-xs text-zinc-500">
                        {order.shippingCity}, {order.shippingState || order.shippingCountry}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{order.email}</td>
                    <td className="px-4 py-3 text-sm">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center flex-wrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Quick View
                        </button>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Details →
                        </Link>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          disabled={updatingStatus === order.id}
                          className={`text-sm border rounded px-2 py-1 ${
                            updatingStatus === order.id ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => setDeleteConfirm({ orderId: order.id, orderName: order.shippingName })}
                          className="text-sm text-red-600 hover:text-red-800 hover:underline"
                          title="Delete order"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrders.length === 0 && !loading && (
          <p className="mt-8 text-center text-zinc-600">No orders found</p>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-zinc-600 hover:text-black text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Order Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Order Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-zinc-600">Order ID</p>
                      <p className="font-mono text-sm">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600">Status</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600">Date</p>
                      <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600">Total Amount</p>
                      <p className="text-lg font-semibold">${selectedOrder.totalAmount.toFixed(2)}</p>
                    </div>
                    {selectedOrder.braintreeTxId && (
                      <div>
                        <p className="text-sm text-zinc-600">Transaction ID</p>
                        <p className="font-mono text-sm">{selectedOrder.braintreeTxId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-zinc-600">Email</p>
                      <p className="text-sm">{selectedOrder.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600">Name</p>
                      <p className="text-sm">{selectedOrder.shippingName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-zinc-600">Shipping Address</p>
                      <p className="text-sm">
                        {selectedOrder.shippingAddress}<br />
                        {selectedOrder.shippingCity}, {selectedOrder.shippingState || ""} {selectedOrder.shippingZip}<br />
                        {selectedOrder.shippingCountry}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-zinc-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Price</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Quantity</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-4 py-3">
                              <div className="font-medium">{item.productTitle}</div>
                              <div className="text-xs text-zinc-500">ID: {item.productId}</div>
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
                          <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                            Total:
                          </td>
                          <td className="px-4 py-3 text-lg font-semibold">
                            ${selectedOrder.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Update Status</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        handleStatusUpdate(selectedOrder.id, e.target.value);
                      }}
                      className="border rounded px-4 py-2"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Delete Order */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
                  <button
                    onClick={() => {
                      setDeleteConfirm({ orderId: selectedOrder.id, orderName: selectedOrder.shippingName });
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete Order
                  </button>
                  <p className="text-sm text-zinc-600 mt-2">This action cannot be undone. All order items will be permanently deleted.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

