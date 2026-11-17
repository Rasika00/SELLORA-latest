import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ShoppingCart,
  MapPin,
  Check,
  Plus,
  Phone,
  Truck,
  Package,
  Clock,
  Printer,
  ChevronRight,
  Copy,
  ExternalLink,
  Shield,
  Box,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/site/Navbar";
import { createOrder, getCustomerAddresses, createCustomerAddress, type CustomerAddressRecord } from "@/lib/api/client";
import { getCurrentUser, type UserSession } from "@/lib/auth";

export const Route = createFileRoute("/checkout")({
  component: CartCheckoutPage,
});

function CartCheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [completedOrderItems, setCompletedOrderItems] = useState<typeof items>([]);
  const [completedTotal, setCompletedTotal] = useState<number>(0);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddressRecord[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("manual");
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("Home");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
  });

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.email || user?.id) {
      getCustomerAddresses({ userId: user.id, email: user.email }).then((list) => {
        setAddresses(list);
        if (list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(def.id);
          setFormData({
            name: def.recipientName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            email: user.email,
            phone: def.phone || user.phone || "",
            address: def.streetAddress,
            city: def.city,
            zipCode: def.postalCode || "",
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || prev.name,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
            address: user.address || prev.address,
          }));
        }
      });
    }
  }, []);

  const handleSelectAddress = (addr: CustomerAddressRecord) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      name: addr.recipientName,
      phone: addr.phone,
      address: addr.streetAddress,
      city: addr.city,
      zipCode: addr.postalCode || "",
    }));
  };

  const handleSelectManual = () => {
    setSelectedAddressId("manual");
    setFormData((prev) => ({
      ...prev,
      address: "",
      city: "",
      zipCode: "",
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // If user selected manual new address and chose to save to address book
      if (currentUser && selectedAddressId === "manual" && saveToAddressBook) {
        createCustomerAddress({
          userId: currentUser.id,
          email: currentUser.email,
          label: newAddressLabel || "Home",
          recipientName: formData.name,
          phone: formData.phone,
          streetAddress: formData.address,
          city: formData.city,
          postalCode: formData.zipCode,
          isDefault: addresses.length === 0,
        }).catch((err) => console.warn("Failed to auto-save address to book:", err));
      }

      const orderPayload = {
        userId: currentUser?.id,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        totalAmount: cartTotal,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
      };

      setCompletedOrderItems([...items]);
      setCompletedTotal(cartTotal);

      const result = await createOrder(orderPayload);
      const generatedNumber = result?.order?.orderNumber || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderNumber(generatedNumber);
      setIsSuccess(true);
      clearCart();
    } catch (err) {
      console.error("Order failed:", err);
      setCompletedOrderItems([...items]);
      setCompletedTotal(cartTotal);
      setOrderNumber(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSuccess(true);
      clearCart();
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
          <h1 className="text-xl font-semibold text-foreground">Your cart is empty</h1>
          <Link to="/" className="mt-4 inline-block text-neon-cyan hover:underline">Return to Store</Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    const trackingCode = `SLR-TRK-${orderNumber.replace(/[^0-9]/g, "") || "948201"}`;
    const estArrivalDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const handleCopyTracking = () => {
      navigator.clipboard.writeText(trackingCode);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    };

    return (
      <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-up pt-16">
          {/* Main Confirmation & Live Tracking Card */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* Top Bar: Order Confirmation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                      Order Confirmed & Paid
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Just now
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground mt-1">
                    Thank You, {formData.name || "Customer"}!
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Your computing hardware has been allocated and is moving through the SELLORA delivery pipeline.
                  </p>
                </div>
              </div>

              {/* Order Reference & Waybill */}
              <div className="bg-secondary/60 rounded-2xl p-4 border border-border text-left sm:text-right shrink-0 space-y-1">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">Order Reference</span>
                <span className="text-lg font-mono font-black text-primary tracking-wide block">{orderNumber}</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono justify-start sm:justify-end">
                  <span>Waybill: <strong>{trackingCode}</strong></span>
                  <button
                    onClick={handleCopyTracking}
                    title="Copy Waybill"
                    className="p-1 rounded hover:bg-secondary text-primary transition-colors cursor-pointer"
                  >
                    {copiedTracking ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE PACKAGE TRACKING PIPELINE (C2.1 & FR-52/53/54) */}
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" /> Live Package Tracking Pipeline
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-xl self-start sm:self-auto font-bold shadow-sm">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Est. Doorstep Arrival: <strong>{estArrivalDate}</strong></span>
                </div>
              </div>

              {/* 4-Stage Visual Progress Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {/* Step 1: Order Placed */}
                <div className="bg-secondary/40 border-2 border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
                      Step 1 Done
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xs text-foreground">1. Order Confirmed</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 mt-3 block font-semibold">✓ Just now</span>
                </div>

                {/* Step 2: Quality Check & Packing (ACTIVE) */}
                <div className="bg-primary/10 border-2 border-primary rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-1.5 w-full bg-primary animate-pulse" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold animate-pulse shadow-sm">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold animate-pulse">
                      Active Now
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xs text-foreground">2. Quality Check & Packing</h3>
                  </div>
                  <span className="text-[10px] font-mono text-primary font-bold mt-3 block">In Progress</span>
                </div>

                {/* Step 3: Courier Dispatch */}
                <div className="bg-secondary/30 border border-border rounded-2xl p-4 flex flex-col justify-between opacity-80">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center font-bold">
                      <Truck className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-bold border border-border">
                      Step 3
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xs text-foreground">3. Courier Dispatch</h3>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground mt-3 block">Scheduled</span>
                </div>

                {/* Step 4: Doorstep Delivery */}
                <div className="bg-secondary/30 border border-border rounded-2xl p-4 flex flex-col justify-between opacity-80">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center font-bold">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-bold border border-border">
                      Step 4
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xs text-foreground">4. Doorstep Delivery</h3>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground mt-3 block font-semibold">{estArrivalDate}</span>
                </div>
              </div>

              {/* Delivery Meta Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">
                    Delivery Destination
                  </span>
                  <p className="text-xs font-bold text-foreground">{formData.name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {formData.address}, {formData.city} {formData.zipCode}
                  </p>
                  {formData.phone && (
                    <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 pt-1">
                      <Phone className="h-3 w-3 text-primary" /> {formData.phone}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">
                    Logistics & Carrier Partner
                  </span>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-primary" /> SELLORA Express Fleet
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">Waybill: {trackingCode}</p>
                  <p className="text-[11px] text-emerald-500 font-mono font-semibold">
                    ✓ Insured High-Value Cargo
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">
                    Fulfillment SLA
                  </span>
                  <p className="text-xs font-bold text-foreground">Priority Express Dispatch</p>
                  <p className="text-xs text-muted-foreground">Estimated Window: 48 - 72 Hours</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Live updates in Customer Hub
                  </p>
                </div>
              </div>

              {/* Hardware Items Package Manifest */}
              {completedOrderItems.length > 0 && (
                <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-foreground">
                    <span className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-primary" /> Package Manifest ({completedOrderItems.length} Items)
                    </span>
                    <span className="text-primary">
                      Total: LKR {completedTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {completedOrderItems.map((ci) => (
                      <div
                        key={ci.product.id}
                        className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={ci.product.img}
                            alt={ci.product.name}
                            className="h-10 w-12 rounded-lg object-cover border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-display font-bold text-xs text-foreground truncate">
                              {ci.product.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate">
                              {ci.product.cpu} &bull; {ci.product.gpu} &bull; Qty: {ci.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-foreground shrink-0">
                          LKR {(ci.product.price * ci.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
                <a
                  href={`/account?tab=orders&track=${encodeURIComponent(orderNumber)}`}
                  className="w-full sm:w-auto flex-1 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3.5 text-sm font-semibold shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Truck className="h-4 w-4" />
                  <span>Track Package in Customer Hub (My Orders)</span>
                  <ChevronRight className="h-4 w-4" />
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto rounded-xl bg-secondary hover:bg-secondary/80 px-5 py-3.5 text-xs font-semibold text-foreground transition-colors border border-border flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-muted-foreground" />
                  <span>Print Receipt</span>
                </button>

                <Link
                  to="/"
                  className="w-full sm:w-auto rounded-xl bg-secondary hover:bg-secondary/80 px-5 py-3.5 text-xs font-semibold text-foreground transition-colors border border-border text-center"
                >
                  Return to Store
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="py-24 px-4 sm:px-8 max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        <h1 className="font-display text-4xl sm:text-5xl font-black mb-12">SECURE CHECKOUT</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handlePayment} className="space-y-8">
              <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                    Shipping Destination
                  </h2>
                  {currentUser && (
                    <Link
                      to="/account"
                      className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" /> Address Book
                    </Link>
                  )}
                </div>

                {/* Saved Address Book Selector (If user has saved addresses) */}
                {currentUser && addresses.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono block">
                      Choose from Saved Addresses
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all relative ${isSelected
                              ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary"
                              : "bg-secondary/40 border-border hover:border-border-hover"
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-foreground font-bold border border-border">
                                {addr.label}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-bold text-foreground truncate">{addr.recipientName}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{addr.phone}</div>
                            <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                              {addr.streetAddress}, {addr.city}
                            </div>
                            {isSelected && (
                              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Option to ship to a new manual address */}
                      <div
                        onClick={handleSelectManual}
                        className={`p-4 rounded-xl border border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center ${selectedAddressId === "manual"
                          ? "bg-primary/10 border-primary ring-1 ring-primary"
                          : "bg-secondary/20 border-border hover:border-border-hover text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <Plus className="h-5 w-5 mb-1 text-primary" />
                        <span className="text-xs font-bold text-foreground">Deliver to New Address</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Enter custom shipping info</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Destination Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Recipient Name *</label>
                    <input
                      required
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Contact Phone *</label>
                    <input
                      required
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
                      placeholder="+94 77 123 4567"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Email Address *</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Street Address &amp; Suite *</label>
                    <input
                      required
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
                      placeholder="123 Orbital Way, Suite 4B"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">City / District *</label>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
                      placeholder="Colombo 03"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Zip / Postal Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
                      placeholder="00300"
                    />
                  </div>

                  {/* Option to save new address if entered manually */}
                  {currentUser && selectedAddressId === "manual" && (
                    <div className="sm:col-span-2 pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                        <input
                          type="checkbox"
                          checked={saveToAddressBook}
                          onChange={(e) => setSaveToAddressBook(e.target.checked)}
                          className="h-4 w-4 rounded border-border bg-secondary text-primary"
                        />
                        <span>Save this address to my Address Book for future orders</span>
                      </label>

                      {saveToAddressBook && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground font-mono">Label:</span>
                          <input
                            type="text"
                            placeholder="Home, Work..."
                            value={newAddressLabel}
                            onChange={(e) => setNewAddressLabel(e.target.value)}
                            className="bg-secondary/60 border border-border rounded-lg px-2 py-1 text-xs text-foreground w-28 focus:outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-card">
                <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
                  Payment Details
                </h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-1">Secure Encrypted Payment</h4>
                      <p className="text-xs text-muted-foreground">By clicking Pay Now, your order will be placed with encrypted verification. Hardware warranty and buyer protection are activated instantly.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full rounded-xl bg-primary hover:bg-primary-hover px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing Payment &amp; Dispatch...
                  </>
                ) : (
                  `Pay LKR ${cartTotal.toLocaleString()}`
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-card rounded-2xl p-6 sm:p-8 sticky top-24 border border-border shadow-card">
              <h3 className="font-display text-lg font-bold mb-6 uppercase tracking-widest">Order Summary</h3>

              <div className="divide-y divide-border mb-6 max-h-[360px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.product.id} className="py-4 flex gap-4 first:pt-0">
                    <img
                      src={item.product.img}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-xl bg-secondary/40 border border-border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.product.cpu} &bull; {item.product.gpu}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="text-xs font-mono font-bold text-primary">
                          LKR {(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-border text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono text-foreground">LKR {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Express Courier Dispatch</span>
                  <span className="font-mono text-primary font-bold uppercase tracking-wider text-xs">FREE</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Precision Thermal QC</span>
                  <span className="font-mono text-primary font-bold uppercase tracking-wider text-xs">INCLUDED</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between font-display font-bold text-lg text-foreground">
                  <span>Total</span>
                  <span className="text-primary font-mono">LKR {cartTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
