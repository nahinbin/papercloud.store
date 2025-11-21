"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name?: string;
  username: string;
  email?: string;
  phone?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Address {
  id: string;
  label?: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
}

interface Order {
  id: string;
  email: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState?: string;
  shippingZip: string;
  shippingCountry: string;
  totalAmount: number;
  status: string;
  braintreeTxId?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

type Tab = "profile" | "orders" | "addresses";

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    currentPassword: "",
  });

  const [addressForm, setAddressForm] = useState({
    label: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    phone: "",
    isDefault: false,
  });

  const [editingAddress, setEditingAddress] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setProfileForm({
        name: data.user.name || "",
        username: data.user.username || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        password: "",
        currentPassword: "",
      });
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (activeTab === "addresses") {
      try {
        const res = await fetch("/api/account/addresses");
        if (res.ok) {
          const data = await res.json();
          setAddresses(data.addresses || []);
        }
      } catch (error) {
        console.error("Failed to load addresses:", error);
      }
    } else if (activeTab === "orders") {
      try {
        const res = await fetch("/api/account/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Failed to load orders:", error);
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {};
      if (profileForm.name !== user?.name) updateData.name = profileForm.name;
      if (profileForm.email !== user?.email) updateData.email = profileForm.email;
      if (profileForm.phone !== user?.phone) updateData.phone = profileForm.phone;
      if (profileForm.username !== user?.username) updateData.username = profileForm.username;
      if (profileForm.password) {
        updateData.password = profileForm.password;
        updateData.currentPassword = profileForm.currentPassword;
      }

      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }

      setUser(data.user);
      setProfileForm({
        ...profileForm,
        password: "",
        currentPassword: "",
      });
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const url = editingAddress
        ? `/api/account/addresses/${editingAddress}`
        : "/api/account/addresses";
      const method = editingAddress ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save address");
        return;
      }

      setAddressForm({
        label: "",
        name: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "US",
        phone: "",
        isDefault: false,
      });
      setEditingAddress(null);
      setSuccess(editingAddress ? "Address updated!" : "Address saved!");
      setTimeout(() => setSuccess(null), 3000);
      loadData();
    } catch (error: any) {
      setError(error.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete address");
        return;
      }

      setSuccess("Address deleted!");
      setTimeout(() => setSuccess(null), 3000);
      loadData();
    } catch (error: any) {
      setError(error.message || "Failed to delete address");
    }
  };

  const handleEditAddress = (address: Address) => {
    setAddressForm({
      label: address.label || "",
      name: address.name,
      address: address.address,
      city: address.city,
      state: address.state || "",
      zip: address.zip,
      country: address.country,
      phone: address.phone || "",
      isDefault: address.isDefault,
    });
    setEditingAddress(address.id);
  };

  const downloadReceipt = (orderId: string) => {
    window.open(`/api/account/orders/${orderId}/receipt`, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <p className="text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-3xl font-semibold mb-8">My Account</h1>

        {/* Tabs */}
        <div className="border-b border-zinc-200 mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "profile"
                  ? "border-b-2 border-black text-black"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "orders"
                  ? "border-b-2 border-black text-black"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "addresses"
                  ? "border-b-2 border-black text-black"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              Delivery Addresses
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
            {success}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, username: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="border-t pt-4 mt-6">
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={profileForm.password}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, password: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-black px-6 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Order History</h2>
            {orders.length === 0 ? (
              <p className="text-zinc-600">You haven't placed any orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold">
                          Order #{order.id.slice(0, 12).toUpperCase()}
                        </p>
                        <p className="text-sm text-zinc-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          ${order.totalAmount.toFixed(2)}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-zinc-600 mb-2">Items:</p>
                      <ul className="space-y-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-sm">
                            {item.productTitle} × {item.quantity} - $
                            {(item.productPrice * item.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-4">
                      <Link
                        href={`/order-confirmation/${order.id}`}
                        className="text-sm text-black hover:underline"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => downloadReceipt(order.id)}
                        className="text-sm text-black hover:underline"
                      >
                        Download Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === "addresses" && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Delivery Addresses</h2>
            <form onSubmit={handleAddressSubmit} className="mb-8 border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Label (e.g., Home, Work)
                  </label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, label: e.target.value })
                    }
                    placeholder="Home"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, name: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.address}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, address: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, state: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.zip}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, zip: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.country}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, country: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, phone: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          isDefault: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Set as default address</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-black px-6 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
                </button>
                {editingAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddress(null);
                      setAddressForm({
                        label: "",
                        name: "",
                        address: "",
                        city: "",
                        state: "",
                        zip: "",
                        country: "US",
                        phone: "",
                        isDefault: false,
                      });
                    }}
                    className="rounded border px-6 py-2 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-4">
              {addresses.length === 0 ? (
                <p className="text-zinc-600">No saved addresses yet.</p>
              ) : (
                addresses.map((address) => (
                  <div
                    key={address.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        {address.label && (
                          <p className="font-semibold mb-1">{address.label}</p>
                        )}
                        {address.isDefault && (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded mb-2">
                            Default
                          </span>
                        )}
                        <p className="font-medium">{address.name}</p>
                        <p className="text-sm text-zinc-600">{address.address}</p>
                        <p className="text-sm text-zinc-600">
                          {address.city}, {address.state || ""} {address.zip}
                        </p>
                        <p className="text-sm text-zinc-600">{address.country}</p>
                        {address.phone && (
                          <p className="text-sm text-zinc-600 mt-1">
                            Phone: {address.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="text-sm text-black hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

