import { Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import {
  getCustomerAddresses,
  createCustomerAddress,
  type CustomerAddressRecord,
} from "@/lib/api/client";
import { getCurrentUser, type UserSession } from "@/lib/auth";
import { CheckoutError, type ConfirmedOrder } from "@/lib/api/checkout";
import { CheckoutSubmission } from "@/lib/checkout-submission";

export interface CheckoutItem {
  product: { id: string; name: string; price: number; img: string; cpu: string; gpu: string };
  quantity: number;
}

export function CheckoutPage({
  items,
  onConfirmed,
}: {
  items: CheckoutItem[];
  onConfirmed?: () => void;
}) {
  const cartTotal = items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [addressWarning, setAddressWarning] = useState("");
  const [submission] = useState(() => new CheckoutSubmission());
  const submitting = useRef(false);
  const isSuccess = confirmedOrder !== null;
  const orderNumber = confirmedOrder?.orderNumber || "";

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
    if (submitting.current || confirmedOrder || items.length === 0) return;
    submitting.current = true;
    setIsProcessing(true);
    setCheckoutError("");
    try {
      const order = await submission.submit({
        requireSession: Boolean(currentUser),
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        totalAmount: cartTotal,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });
      if (!order) return;
      setConfirmedOrder(order);
      onConfirmed?.();
      // Optional address-book saving happens only after a confirmed order.
      if (currentUser && selectedAddressId === "manual" && saveToAddressBook) {
        try {
          await createCustomerAddress({
            userId: currentUser.id,
            email: currentUser.email,
            label: newAddressLabel || "Home",
            recipientName: formData.name,
            phone: formData.phone,
            streetAddress: formData.address,
            city: formData.city,
            postalCode: formData.zipCode,
            isDefault: addresses.length === 0,
          });
        } catch {
          setAddressWarning(
            "Your order is confirmed, but the address could not be saved to your Address Book.",
          );
        }
      }
    } catch (error) {
      setCheckoutError(
        error instanceof CheckoutError
          ? error.message
          : "We could not confirm your order. Your cart is saved; please retry the same checkout.",
      );
    } finally {
      submitting.current = false;
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
          <h1 className="text-xl font-semibold text-foreground">Your cart is empty</h1>
          <Link to="/" className="mt-4 inline-block text-neon-cyan hover:underline">
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl p-8 text-center animate-fade-up border border-border shadow-xl">
          <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">Order Confirmed!</h2>
          <p className="text-muted-foreground mb-8">
            Your order is confirmed. You can view its current delivery status in your Customer Hub.
          </p>
          <div className="bg-secondary/40 rounded-xl p-4 mb-8 text-left border border-border space-y-1">
            <p className="text-xs text-muted-foreground">
              Order Reference:{" "}
              <span className="text-foreground font-mono font-bold">{orderNumber}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Order total:{" "}
              <span className="text-foreground font-bold">
                LKR {confirmedOrder?.totalAmount.toLocaleString()}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Delivery To:{" "}
              <span className="text-foreground">
                {formData.address}, {formData.city}
              </span>
            </p>
          </div>
          {addressWarning && (
            <p role="status" className="mb-4 text-sm text-amber-500">
              {addressWarning}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <Link
              to="/account"
              className="block w-full rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 text-sm font-semibold shadow-sm transition-all text-center"
            >
              View Order in Customer Hub
            </Link>
            <Link
              to="/"
              className="block w-full rounded-xl bg-secondary hover:bg-secondary/80 px-6 py-2.5 text-xs font-semibold text-foreground transition-colors border border-border text-center"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="py-24 px-4 sm:px-8 max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        <h1 className="font-display text-4xl sm:text-5xl font-black mb-12">SECURE CHECKOUT</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handlePayment} className="space-y-8" aria-busy={isProcessing}>
              {checkoutError && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                >
                  {checkoutError}
                </div>
              )}
              <fieldset disabled={isProcessing} className="space-y-8 min-w-0">
                <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        1
                      </span>
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
                              className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                                isSelected
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
                              <div className="text-xs font-bold text-foreground truncate">
                                {addr.recipientName}
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {addr.phone}
                              </div>
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
                          className={`p-4 rounded-xl border border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                            selectedAddressId === "manual"
                              ? "bg-primary/10 border-primary ring-1 ring-primary"
                              : "bg-secondary/20 border-border hover:border-border-hover text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Plus className="h-5 w-5 mb-1 text-primary" />
                          <span className="text-xs font-bold text-foreground">
                            Deliver to New Address
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            Enter custom shipping info
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Destination Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Recipient Name *
                      </label>
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
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Contact Phone *
                      </label>
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
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Email Address *
                      </label>
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
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Street Address &amp; Suite *
                      </label>
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
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        City / District *
                      </label>
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
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Zip / Postal Code
                      </label>
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
                            <span className="text-[11px] text-muted-foreground font-mono">
                              Label:
                            </span>
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
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                      2
                    </span>
                    Order confirmation
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-start gap-4">
                      <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">
                          Review and place your order
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Review your details before placing your order. No payment is collected on
                          this page.
                        </p>
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
                      Placing your order...
                    </>
                  ) : (
                    `Place order · LKR ${cartTotal.toLocaleString()}`
                  )}
                </button>
              </fieldset>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-card rounded-2xl p-6 sm:p-8 sticky top-24 border border-border shadow-card">
              <h3 className="font-display text-lg font-bold mb-6 uppercase tracking-widest">
                Order Summary
              </h3>

              <div className="divide-y divide-border mb-6 max-h-[360px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.product.id} className="py-4 flex gap-4 first:pt-0">
                    <img
                      src={item.product.img}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-xl bg-secondary/40 border border-border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {item.product.cpu} &bull; {item.product.gpu}
                      </p>
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
                  <span className="font-mono text-foreground">
                    LKR {cartTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Express Courier Dispatch</span>
                  <span className="font-mono text-primary font-bold uppercase tracking-wider text-xs">
                    FREE
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Precision Thermal QC</span>
                  <span className="font-mono text-primary font-bold uppercase tracking-wider text-xs">
                    INCLUDED
                  </span>
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
