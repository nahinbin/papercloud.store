"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  productIds: string[];
}

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl?: string | null;
}

export default function CouponsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Helper to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Set default dates
  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(now.getFullYear() + 1);

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minPurchaseAmount: "",
    maxDiscountAmount: "",
    usageLimit: "",
    userUsageLimit: "1",
    validFrom: formatDateTimeLocal(now),
    validUntil: formatDateTimeLocal(oneYearLater),
    isActive: true,
    productIds: [] as string[],
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (authRes) => {
        if (authRes.ok) {
          const authData = await authRes.json();
          const user = authData.user;
          const permissions = authData.permissions || [];
          const admin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
          setIsAdmin(admin);

          const canViewCoupons = admin || permissions.includes("coupons.view");

          if (!canViewCoupons) {
            router.push("/admin/unauthorized");
            return;
          }

          await Promise.all([fetchCoupons(), fetchProducts()]);
        } else {
          setIsAdmin(false);
          router.push("/admin/unauthorized");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.push("/admin/unauthorized");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      } else {
        setError("Failed to load coupons");
      }
    } catch (err) {
      setError("Failed to load coupons");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  const resetForm = () => {
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);

    setForm({
      code: "",
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minPurchaseAmount: "",
      maxDiscountAmount: "",
      usageLimit: "",
      userUsageLimit: "1",
      validFrom: formatDateTimeLocal(now),
      validUntil: formatDateTimeLocal(oneYearLater),
      isActive: true,
      productIds: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Only validate code and name - everything else is optional
    if (!form.code.trim()) {
      setError("Coupon code is required");
      return;
    }
    if (!form.name.trim()) {
      setError("Coupon name is required");
      return;
    }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }

    try {
      const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
      const method = editingId ? "PATCH" : "POST";

      // Set default dates if not provided
      const now = new Date();
      const oneYearLater = new Date(now);
      oneYearLater.setFullYear(now.getFullYear() + 1);

      const validFrom = form.validFrom || formatDateTimeLocal(now);
      const validUntil = form.validUntil || formatDateTimeLocal(oneYearLater);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discountValue: Number(form.discountValue),
          minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : null,
          maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          userUsageLimit: form.userUsageLimit ? Number(form.userUsageLimit) : null,
          validFrom: validFrom,
          validUntil: validUntil,
        }),
      });

      if (res.ok) {
        await fetchCoupons();
        resetForm();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save coupon");
      }
    } catch (err) {
      setError("Failed to save coupon");
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    
    // Format dates properly for datetime-local input
    const formatDateTimeLocal = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minPurchaseAmount: coupon.minPurchaseAmount?.toString() || "",
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || "",
      usageLimit: coupon.usageLimit?.toString() || "",
      userUsageLimit: coupon.userUsageLimit?.toString() || "1",
      validFrom: formatDateTimeLocal(coupon.validFrom),
      validUntil: formatDateTimeLocal(coupon.validUntil),
      isActive: coupon.isActive,
      productIds: coupon.productIds || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchCoupons();
    } else {
      alert("Failed to delete coupon");
    }
  };

  const toggleProductSelection = (productId: string) => {
    setForm((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists ? prev.productIds.filter((id) => id !== productId) : [...prev.productIds, productId],
      };
    });
  };

  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}% OFF`;
    } else {
      return `$${coupon.discountValue.toFixed(2)} OFF`;
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Breadcrumbs className="mb-3 md:mb-2" />
            <h1 className="text-3xl font-semibold">Coupons</h1>
            <p className="mt-2 text-zinc-600">Manage discount coupons and promotional codes.</p>
          </div>
          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="rounded-full bg-black px-5 py-2 text-white text-sm font-medium hover:bg-zinc-800"
          >
            {showForm ? "Close form" : "Add Coupon"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Coupon" : "New Coupon"}</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Coupon Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="e.g. SAVE25"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="e.g. 25% Off Sale"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={2}
                  placeholder="Coupon description..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as "percentage" | "fixed" })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Discount Value {form.discountType === "percentage" ? "(0-100)" : "($)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={form.discountType === "percentage" ? "100" : undefined}
                    step={form.discountType === "percentage" ? "0.01" : "0.01"}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder={form.discountType === "percentage" ? "25" : "10.00"}
                  />
                </div>
              </div>

              {form.discountType === "percentage" && (
                <div>
                  <label className="text-sm font-medium text-zinc-700">Max Discount Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="e.g. 50.00"
                  />
                  <p className="mt-1 text-xs text-zinc-500">Maximum discount amount (optional)</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Min Purchase Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minPurchaseAmount}
                    onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="e.g. 50.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Usage Limit</label>
                  <input
                    type="number"
                    min="0"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="Unlimited if empty"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">Per User Usage Limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.userUsageLimit}
                  onChange={(e) => setForm({ ...form, userUsageLimit: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
                <p className="mt-1 text-xs text-zinc-500">How many times a single user can use this coupon</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Valid From</label>
                  <input
                    type="datetime-local"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-zinc-500">Defaults to now if empty</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Valid Until</label>
                  <input
                    type="datetime-local"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-zinc-500">Defaults to 1 year from now if empty</p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-zinc-700">Active</span>
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">Applicable Products</label>
                <p className="mb-2 text-xs text-zinc-500">Leave empty to apply to all products</p>
                <div className="max-h-60 overflow-y-auto rounded-lg border p-3">
                  {products.length === 0 ? (
                    <p className="text-sm text-zinc-500">Loading products...</p>
                  ) : (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <label key={product.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={form.productIds.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="rounded"
                          />
                          <span className="text-sm">{product.title}</span>
                          <span className="text-xs text-zinc-500 ml-auto">${product.price.toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-2 text-white text-sm font-medium hover:bg-zinc-800"
                >
                  {editingId ? "Update Coupon" : "Create Coupon"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>

        <div className="space-y-4">
          {filteredCoupons.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 p-8 text-center">
              <p className="text-zinc-600">No coupons found</p>
            </div>
          ) : (
            filteredCoupons.map((coupon) => {
              const now = new Date();
              const validFrom = new Date(coupon.validFrom);
              const validUntil = new Date(coupon.validUntil);
              const isExpired = now > validUntil;
              const isNotYetValid = now < validFrom;
              const isUsageLimitReached = coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;

              return (
                <div
                  key={coupon.id}
                  className={`rounded-lg border p-4 ${
                    !coupon.isActive || isExpired || isUsageLimitReached
                      ? "border-zinc-200 bg-zinc-50"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-semibold text-lg">{coupon.code}</span>
                        <span className="text-sm font-medium text-green-600">{formatDiscount(coupon)}</span>
                        {!coupon.isActive && (
                          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700">
                            Inactive
                          </span>
                        )}
                        {isExpired && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Expired
                          </span>
                        )}
                        {isNotYetValid && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                            Not Yet Valid
                          </span>
                        )}
                        {isUsageLimitReached && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                            Limit Reached
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium mb-1">{coupon.name}</h3>
                      {coupon.description && (
                        <p className="text-sm text-zinc-600 mb-2">{coupon.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                        <span>
                          Valid: {validFrom.toLocaleDateString()} - {validUntil.toLocaleDateString()}
                        </span>
                        {coupon.minPurchaseAmount && (
                          <span>Min: ${coupon.minPurchaseAmount.toFixed(2)}</span>
                        )}
                        {coupon.usageLimit && (
                          <span>
                            Usage: {coupon.usageCount} / {coupon.usageLimit}
                          </span>
                        )}
                        {coupon.productIds.length > 0 && (
                          <span>{coupon.productIds.length} product(s)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

