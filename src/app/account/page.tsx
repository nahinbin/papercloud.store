"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Gravatar from "@/components/Gravatar";
import { useUser } from "@/contexts/UserContext";

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

type Tab = "profile" | "orders" | "addresses" | "saved";

export default function AccountPage() {
  const router = useRouter();
  const { user: contextUser, isAuthenticated, isLoading: userLoading } = useUser();
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
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Check auth and load full user profile
  useEffect(() => {
    if (userLoading) return;
    
    if (!isAuthenticated || !contextUser) {
      router.push("/login");
      return;
    }

    // Fetch full user profile (includes phone and updatedAt)
    const loadUserProfile = async () => {
      try {
        const res = await fetch("/api/account/profile");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        const fullUser = data.user;
        
        setUser({
          id: fullUser.id,
          name: fullUser.name || undefined,
          username: fullUser.username,
          email: fullUser.email || undefined,
          phone: fullUser.phone || undefined,
          isAdmin: fullUser.isAdmin,
          createdAt: new Date(fullUser.createdAt).toISOString(),
          updatedAt: new Date(fullUser.updatedAt).toISOString(),
        });
        
        setProfileForm({
          name: fullUser.name || "",
          username: fullUser.username || "",
          email: fullUser.email || "",
          phone: fullUser.phone || "",
          password: "",
          currentPassword: "",
        });
      } catch (error) {
        console.error("Failed to load user profile:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [contextUser, isAuthenticated, userLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    if (activeTab === "profile") {
      // Load orders and saved products in parallel for profile tab stats
      if (orders.length === 0 || savedProducts.length === 0) {
        const promises: Promise<void>[] = [];
        
        if (orders.length === 0) {
          promises.push(
            fetch("/api/account/orders")
              .then(async (res) => {
                if (res.ok) {
                  const data = await res.json();
                  setOrders(data.orders || []);
                }
              })
              .catch((error) => {
                console.error("Failed to load orders:", error);
              })
          );
        }
        
        if (savedProducts.length === 0) {
          promises.push(
            fetch("/api/account/saved-products")
              .then(async (res) => {
                if (res.ok) {
                  const data = await res.json();
                  setSavedProducts(data.products || []);
                }
              })
              .catch((error) => {
                console.error("Failed to load saved products:", error);
              })
          );
        }
        
        await Promise.all(promises);
      }
    } else if (activeTab === "addresses") {
      setLoadingAddresses(true);
      try {
        const res = await fetch("/api/account/addresses");
        if (res.ok) {
          const data = await res.json();
          setAddresses(data.addresses || []);
        }
      } catch (error) {
        console.error("Failed to load addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    } else if (activeTab === "orders") {
      setLoadingOrders(true);
      try {
        const res = await fetch("/api/account/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    } else if (activeTab === "saved") {
      setLoadingSaved(true);
      try {
        const res = await fetch("/api/account/saved-products");
        if (res.ok) {
          const data = await res.json();
          setSavedProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to load saved products:", error);
      } finally {
        setLoadingSaved(false);
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
      setShowAddressForm(false);
      setSuccess(editingAddress ? "Address updated!" : "Address saved!");
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
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
    setShowAddressForm(true);
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
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
  };

  const handleUnsaveProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/save`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedProducts(savedProducts.filter((p) => p.id !== productId));
        setSuccess("Product removed from saved items");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError("Failed to remove product");
    }
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
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">My Account</h1>
          <p className="text-zinc-600">Manage your profile, orders, and preferences</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-200 mb-8">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-3 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === "profile"
                  ? "border-b-2 border-black text-black"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-3 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === "orders"
                  ? "border-b-2 border-black text-black"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`px-4 py-3 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === "addresses"
                  ? "border-b-2 border-black text-black"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              Addresses
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-4 py-3 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === "saved"
                  ? "border-b-2 border-black text-black"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              Saved
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="max-w-2xl">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm mb-6">
              <div className="flex items-start gap-6">
                {user && (
                  <Gravatar
                    email={user.email}
                    username={user.username}
                    name={user.name}
                    size={96}
                    className="shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-zinc-900 mb-1">{user?.name || `@${user?.username}`}</h2>
                  {user?.name && (
                    <p className="text-base text-zinc-600 mb-3">@{user?.username}</p>
                  )}
                  <p className="text-sm text-zinc-600 mb-4">
                    {user?.email}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : ""}</span>
                    </div>
                    {orders.length > 0 && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                    {savedProducts.length > 0 && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{savedProducts.length} saved</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-3">
                    Profile picture from Gravatar
                  </p>
                </div>
              </div>
            </div>

            {/* Edit Profile Section - Collapsible */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-zinc-900">Profile Information</h3>
                <button
                  onClick={() => setShowEditProfile(!showEditProfile)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  {showEditProfile ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Hide
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Edit
                    </>
                  )}
                </button>
              </div>
              {showEditProfile && (
                <form onSubmit={handleProfileUpdate} className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Username</label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, username: e.target.value })
                  }
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto rounded-lg bg-black px-6 py-3 text-white font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}
            </div>

            {/* Change Password Section - Collapsible */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-zinc-900">Change Password</h3>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  {showPasswordForm ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Hide
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Change
                    </>
                  )}
                </button>
              </div>
              {showPasswordForm && (
                <form onSubmit={handleProfileUpdate} className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
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
                      className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={profileForm.password}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, password: e.target.value })
                      }
                      className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto rounded-lg bg-black px-6 py-3 text-white font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-6">Order History</h2>
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-zinc-600">You haven't placed any orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-zinc-200 rounded-xl bg-white p-6 hover:shadow-lg transition-all"
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-zinc-900">Delivery Addresses</h2>
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Address
                </button>
              )}
            </div>
            {showAddressForm && (
              <form onSubmit={handleAddressSubmit} className="mb-8 border border-zinc-200 rounded-xl bg-white p-6 sm:p-8 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-lg font-semibold text-zinc-900 mb-6">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Label (e.g., Home, Work)
                  </label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, label: e.target.value })
                    }
                    placeholder="Home"
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, name: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Address *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.address}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, address: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, state: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">ZIP Code *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.zip}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, zip: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Country *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.country}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, country: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, phone: e.target.value })
                    }
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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
                  className="rounded-lg bg-black px-6 py-2.5 text-white font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelAddressForm}
                  className="rounded-lg border border-zinc-300 px-6 py-2.5 hover:bg-zinc-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
            )}

            <div className="space-y-4">
              {loadingAddresses ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
              ) : addresses.length === 0 ? (
                <p className="text-zinc-600">No saved addresses yet.</p>
              ) : (
                addresses.map((address) => (
                  <div
                    key={address.id}
                    className="border border-zinc-200 rounded-xl bg-white p-6 hover:shadow-lg transition-all"
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

        {/* Saved Products Tab */}
        {activeTab === "saved" && (
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-6">Saved Products</h2>
            {loadingSaved ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : savedProducts.length === 0 ? (
              <p className="text-zinc-600">You haven't saved any products yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-zinc-200 rounded-xl bg-white overflow-hidden hover:shadow-lg transition-all"
                  >
                    <Link href={`/products/${product.id}`} className="block">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
                        <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                      </div>
                    </Link>
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => handleUnsaveProduct(product.id)}
                        className="w-full py-2 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50 transition-colors"
                      >
                        Remove from Saved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

