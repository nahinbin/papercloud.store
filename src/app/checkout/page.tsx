"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

declare global {
  interface Window {
    braintree: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCart();
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [dropinInstance, setDropinInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectingOrderId, setRedirectingOrderId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const initializedRef = useRef(false);

  const [shippingInfo, setShippingInfo] = useState({
    email: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(true);
  const [saveAddress, setSaveAddress] = useState(false);
  
  // Coupon state - MUST be declared before calculations
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    name: string;
    discountAmount: number;
  } | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Calculate totals after state declarations
  const subtotal = getTotal();
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal - discountAmount);
  const isFreeOrder = total === 0;

  // Load available coupons
  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      try {
        const res = await fetch("/api/coupons/available");
        if (res.ok) {
          const data = await res.json();
          setAvailableCoupons(data.coupons || []);
        }
      } catch (err) {
        console.error("Failed to load available coupons:", err);
      }
    };
    fetchAvailableCoupons();
  }, []);

  // Load saved addresses if user is logged in
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const addressRes = await fetch("/api/account/addresses");
          if (addressRes.ok) {
            const data = await addressRes.json();
            setSavedAddresses(data.addresses || []);
            // Auto-select default address if available
            const defaultAddress = data.addresses?.find((a: any) => a.isDefault);
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id);
              setShippingInfo({
                email: "",
                name: defaultAddress.name,
                address: defaultAddress.address,
                city: defaultAddress.city,
                state: defaultAddress.state || "",
                zip: defaultAddress.zip,
                country: defaultAddress.country,
              });
              setShowNewAddressForm(false);
            }
          }
        }
      } catch (error) {
        // User not logged in or error loading addresses - continue with manual entry
      }
    };
    loadAddresses();
  }, []);

  // Load Braintree script (only if order has a price)
  useEffect(() => {
    if (isFreeOrder) {
      setLoading(false);
      return;
    }
    
    if (scriptLoadedRef.current || document.querySelector('script[src*="braintreegateway.com"]')) {
      scriptLoadedRef.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.braintreegateway.com/web/dropin/1.33.7/js/dropin.min.js";
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      // Force re-check for initialization
      setTimeout(() => {
        if (containerRef.current && !initializedRef.current) {
          // Trigger initialization check
          const event = new Event('braintree-ready');
          window.dispatchEvent(event);
        }
      }, 100);
    };
    script.onerror = () => {
      console.error("Failed to load Braintree script");
      setError("Failed to load payment script. Please refresh the page.");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup
    };
  }, [isFreeOrder]);

  // Initialize Braintree Drop-in when container and script are ready
  useEffect(() => {
    if (items.length === 0) {
      if (!redirectingOrderId) {
        router.push("/cart");
      }
      return;
    }

    // Skip Braintree initialization for free orders
    if (isFreeOrder) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const initializeBraintree = async () => {
      // Wait for container to be available
      if (!containerRef.current) {
        console.log("Waiting for container...");
        return;
      }

      // Wait for Braintree script
      if (!window.braintree) {
        console.log("Waiting for Braintree script...");
        return;
      }

      // Don't initialize if already done
      if (initializedRef.current) {
        console.log("Already initialized");
        return;
      }

      const container = containerRef.current;
      
      // Get client token first
      try {
        setLoading(true);
        const res = await fetch("/api/braintree/token");
        
        if (!res.ok) {
          throw new Error(`Failed to fetch token: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.details || data.error || "Failed to get payment token");
        }
        
        if (!data.clientToken) {
          throw new Error("No client token received from server");
        }

        setClientToken(data.clientToken);

        // Wait for next tick to ensure React has finished rendering
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!mounted || !containerRef.current) return;

        // Get container and ensure it's completely empty RIGHT before initialization
        let containerEl = containerRef.current;
        
        if (!containerEl) {
          throw new Error("Container element not found");
        }
        
        // Clear container completely
        containerEl.innerHTML = '';
        
        // If container still has content, replace it with a fresh one
        if (containerEl.children.length > 0) {
          const parent = containerEl.parentNode;
          if (parent) {
            const newContainer = document.createElement('div');
            newContainer.id = 'braintree-dropin-container';
            newContainer.className = 'mb-6 min-h-[200px]';
            newContainer.setAttribute('suppressHydrationWarning', 'true');
            parent.replaceChild(newContainer, containerEl);
            containerRef.current = newContainer;
            containerEl = newContainer;
          }
        }
        
        // Wait for DOM to settle
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mounted || !containerRef.current) return;
        
        containerEl = containerRef.current;
        
        // Initialize Braintree with error handling
        try {
          
          window.braintree.dropin.create(
            {
              authorization: data.clientToken,
              container: containerEl,
              card: {
                cardholderName: {
                  required: true,
                },
              },
            },
            (err: any, instance: any) => {
              if (!mounted) return;
              
              if (err) {
                // Handle DropinError more gracefully - this is usually a config issue
                if (err.name === 'DropinError' || err.type === 'DropinError' || err.message?.includes('All payment options failed')) {
                  // Don't spam console with this - it's usually a configuration issue
                  console.warn("Braintree payment options failed to load. Check your Braintree credentials in .env.local");
                  setError("Payment form could not be loaded. Please check your payment configuration or try refreshing the page.");
                } else {
                  // Other errors - log with details
                  console.error("Braintree Drop-in error:", err);
                  let errorMsg = "Failed to initialize payment form";
                  
                  // Handle different error types
                  if (err.message) {
                    errorMsg += ": " + err.message;
                  } else if (typeof err === 'string') {
                    errorMsg += ": " + err;
                  } else if (err.type) {
                    errorMsg += ` (${err.type})`;
                  }
                  
                  // Check for specific error types
                  if (err.message?.includes('authorization') || err.message?.includes('credentials') || err.message?.includes('Invalid')) {
                    errorMsg += ". Please check your Braintree credentials in .env.local";
                  }
                  
                  setError(errorMsg);
                }
                
                setLoading(false);
                initializedRef.current = false;
                return;
              }
              
              if (!instance) {
                console.error("Braintree returned no instance");
                setError("Payment form failed to initialize. Please refresh and try again.");
                setLoading(false);
                initializedRef.current = false;
                return;
              }
              
              console.log("Braintree Drop-in initialized successfully");
              setDropinInstance(instance);
              setLoading(false);
              initializedRef.current = true;
            }
          );
        } catch (createErr: any) {
          console.error("Error calling braintree.dropin.create:", createErr);
          setError("Failed to create payment form: " + (createErr.message || "Unknown error"));
          setLoading(false);
          initializedRef.current = false;
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error("Failed to initialize Braintree:", err);
        setError("Failed to load payment form: " + (err.message || "Unknown error"));
        setLoading(false);
      }
    };

    // Try to initialize
    initializeBraintree();

    // Listen for script ready event
    const handleBraintreeReady = () => {
      if (mounted) {
        initializeBraintree();
      }
    };
    window.addEventListener('braintree-ready', handleBraintreeReady);

    // Polling fallback
    const interval = setInterval(() => {
      if (mounted && !initializedRef.current && containerRef.current && window.braintree) {
        initializeBraintree();
      }
    }, 1000);

    return () => {
      mounted = false;
      window.removeEventListener('braintree-ready', handleBraintreeReady);
      clearInterval(interval);
      if (dropinInstance) {
        try {
          dropinInstance.teardown();
          initializedRef.current = false;
        } catch (e) {
          // Ignore teardown errors
        }
      }
    };
  }, [items.length, router]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          items: items.map((item) => ({
            productId: item.productId,
            price: item.price,
            quantity: item.quantity,
          })),
          subtotal,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({
          id: data.coupon.id,
          code: data.coupon.code,
          name: data.coupon.name,
          discountAmount: data.discountAmount,
        });
        setCouponCode("");
        setCouponError(null);
      } else {
        setCouponError(data.error || "Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError("Failed to validate coupon. Please try again.");
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  const handleSelectCoupon = async (coupon: any) => {
    setCouponCode(coupon.code);
    setShowAvailableCoupons(false);
    await handleApplyCoupon();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    try {
      // For free orders, skip payment processing
      if (isFreeOrder) {
        // Save address if requested
        if (saveAddress && !selectedAddressId) {
          try {
            await fetch("/api/account/addresses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: shippingInfo.name,
                address: shippingInfo.address,
                city: shippingInfo.city,
                state: shippingInfo.state,
                zip: shippingInfo.zip,
                country: shippingInfo.country,
                isDefault: savedAddresses.length === 0, // Set as default if first address
              }),
            });
          } catch (error) {
            // Continue with checkout even if address save fails
            console.error("Failed to save address:", error);
          }
        }

        const res = await fetch("/api/braintree/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethodNonce: null, // No payment for free orders
            amount: total.toFixed(2),
            items: items.map((item) => ({
              productId: item.productId,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
            })),
            shippingInfo,
            couponId: appliedCoupon?.id,
            couponCode: appliedCoupon?.code,
            discountAmount: appliedCoupon?.discountAmount || 0,
          }),
        });

        const data = await res.json();
        console.log("Free order checkout response:", data);

        if (data.success && data.orderId) {
          console.log("Free order successful, redirecting to order confirmation:", data.orderId);
          setRedirectingOrderId(data.orderId);
          clearCart();
          router.push(`/order-confirmation/${data.orderId}`);
          router.refresh();
        } else {
          console.error("Free order failed:", data);
          setError(data.error || data.details || "Order failed. Please try again.");
          setProcessing(false);
        }
        return;
      }

      // For paid orders, require payment
      if (!dropinInstance) {
        setError("Payment form not ready");
        setProcessing(false);
        return;
      }

      // Request payment method nonce
      const payload = await dropinInstance.requestPaymentMethod();

      // Save address if requested
      if (saveAddress && !selectedAddressId) {
        try {
          await fetch("/api/account/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: shippingInfo.name,
              address: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              zip: shippingInfo.zip,
              country: shippingInfo.country,
              isDefault: savedAddresses.length === 0, // Set as default if first address
            }),
          });
        } catch (error) {
          // Continue with checkout even if address save fails
          console.error("Failed to save address:", error);
        }
      }

      // Submit to checkout API
      const res = await fetch("/api/braintree/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodNonce: payload.nonce,
          amount: total.toFixed(2),
          items: items.map((item) => ({
            productId: item.productId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
          shippingInfo,
          couponId: appliedCoupon?.id,
          couponCode: appliedCoupon?.code,
          discountAmount: appliedCoupon?.discountAmount || 0,
        }),
      });

      const data = await res.json();
      
      console.log("Checkout response:", data);

      if (data.success && data.orderId) {
        console.log("Payment successful, redirecting to order confirmation:", data.orderId);
        setRedirectingOrderId(data.orderId);
        clearCart();
        router.push(`/order-confirmation/${data.orderId}`);
        router.refresh();
      } else {
        console.error("Payment failed:", data);
        setError(data.error || data.details || "Payment failed. Please try again.");
        setProcessing(false);
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "An error occurred. Please try again.");
      setProcessing(false);
    }
  };

  if (redirectingOrderId) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl">
            ✓
          </div>
          <div>
            <h1 className="text-2xl font-semibold mb-2">Redirecting to your order summary…</h1>
            <p className="text-zinc-600">Order ID: <span className="font-mono">{redirectingOrderId.slice(0, 12)}...</span></p>
            <p className="text-sm text-zinc-500 mt-4">If you are not redirected automatically, <button className="underline text-black" onClick={() => router.push(`/order-confirmation/${redirectingOrderId}`)}>click here</button>.</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            
            {/* Saved Addresses Selector */}
            {savedAddresses.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Use Saved Address</label>
                <select
                  value={selectedAddressId || ""}
                  onChange={(e) => {
                    const addressId = e.target.value;
                    setSelectedAddressId(addressId || null);
                    if (addressId) {
                      const address = savedAddresses.find((a) => a.id === addressId);
                      if (address) {
                        setShippingInfo({
                          email: shippingInfo.email, // Keep email
                          name: address.name,
                          address: address.address,
                          city: address.city,
                          state: address.state || "",
                          zip: address.zip,
                          country: address.country,
                        });
                        setShowNewAddressForm(false);
                      }
                    } else {
                      setShowNewAddressForm(true);
                    }
                  }}
                  className="w-full border rounded px-3 py-2 mb-2"
                >
                  <option value="">Enter new address</option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label || "Address"} - {address.name} {address.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={shippingInfo.email}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, email: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            {showNewAddressForm && (
              <>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={shippingInfo.name}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={shippingInfo.address}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, address: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.city}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, city: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={shippingInfo.state}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, state: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.zip}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, zip: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.country}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, country: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              {savedAddresses.length > 0 && (
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Save this address to my account</span>
                  </label>
                </div>
              )}
              </>
            )}
            </div>
          </div>

          {/* Payment & Order Summary */}
          <div>
            {isFreeOrder ? (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-semibold mb-2">Free Order</p>
                  <p className="text-sm text-green-700">No payment required for this order.</p>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Payment</h2>
                <div 
                  ref={containerRef}
                  id="braintree-dropin-container" 
                  className="mb-6 min-h-[200px]"
                  suppressHydrationWarning
                />

                {loading && (
                  <p className="text-sm text-zinc-600 mb-4">Loading payment form...</p>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    {error}
                  </div>
                )}
              </>
            )}

            {/* Coupon Section */}
            <div className="border-t pt-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Coupon Code</h3>
                <button
                  type="button"
                  onClick={() => setShowAvailableCoupons(!showAvailableCoupons)}
                  className="text-sm text-zinc-600 hover:text-black underline"
                >
                  {showAvailableCoupons ? "Hide" : "See Available Coupons"}
                </button>
              </div>

              {showAvailableCoupons && availableCoupons.length > 0 && (
                <div className="mb-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                  <p className="text-sm font-medium mb-2">Available Coupons:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableCoupons.map((coupon) => (
                      <button
                        key={coupon.id}
                        type="button"
                        onClick={() => handleSelectCoupon(coupon)}
                        className="w-full text-left p-3 rounded-lg border border-zinc-200 hover:border-black hover:bg-white transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono font-semibold text-sm">{coupon.code}</div>
                            <div className="text-xs text-zinc-600 mt-0.5">{coupon.name}</div>
                            {coupon.description && (
                              <div className="text-xs text-zinc-500 mt-1">{coupon.description}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {coupon.discountType === "percentage"
                                ? `${coupon.discountValue}% OFF`
                                : `$${coupon.discountValue.toFixed(2)} OFF`}
                            </div>
                            {coupon.minPurchaseAmount && (
                              <div className="text-xs text-zinc-500 mt-0.5">
                                Min: ${coupon.minPurchaseAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {appliedCoupon ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-semibold text-sm">{appliedCoupon.code}</div>
                      <div className="text-xs text-zinc-600">{appliedCoupon.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-600">
                        -${appliedCoupon.discountAmount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="Enter coupon code"
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    disabled={validatingCoupon}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validatingCoupon ? "..." : "Apply"}
                  </button>
                </div>
              )}

              {couponError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                  {couponError}
                </div>
              )}
            </div>

            <div className="border-t pt-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>
                      {item.title} × {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedCoupon.code}):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={(!isFreeOrder && (loading || !dropinInstance)) || processing}
              className="w-full rounded bg-black px-6 py-3 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Processing..." : isFreeOrder ? "Confirm Free Order" : "Complete Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

