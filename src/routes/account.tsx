import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getCurrentUser, setCurrentUser, logout, type UserSession } from "@/lib/auth";
import { useUIMode } from "@/context/UIModeContext";
import {
  getCustomerOrders,
  getCustomerReviews,
  updateCustomerReview,
  deleteCustomerReview,
  updateCustomerProfile,
  submitProductReview,
  getCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  setDefaultCustomerAddress,
  deleteCustomerAddress,
  type CustomerOrderRecord,
  type CustomerReviewRecord,
  type CustomerAddressRecord,
} from "@/lib/api/client";
import {
  User,
  ShoppingBag,
  Star,
  Settings,
  LayoutDashboard,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Home,
  Shield,
  RefreshCw,
  Search,
  Filter,
  Printer,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Edit2,
  Send,
  X,
  Check,
  Building,
  Phone,
  MapPin,
  Mail,
  Store,
  Plus,
  Trash2,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/account")({
  component: CustomerAccountHub,
});

export function CustomerAccountHub() {
  const navigate = useNavigate();
  const { mode, toggleMode } = useUIMode();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "addresses" | "reviews" | "settings">("overview");

  // Orders, reviews, and addresses state
  const [orders, setOrders] = useState<CustomerOrderRecord[]>([]);
  const [reviews, setReviews] = useState<CustomerReviewRecord[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Address Modal State
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddressRecord | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    recipientName: "",
    phone: "",
    streetAddress: "",
    city: "",
    postalCode: "",
    isDefault: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");

  // Profile Form (C1.1)
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });
  const [selectedDefaultAddressId, setSelectedDefaultAddressId] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Live Order Tracking state
  const [trackingModalOrder, setTrackingModalOrder] = useState<CustomerOrderRecord | null>(null);
  const [searchTrackOrder, setSearchTrackOrder] = useState<string | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED">("ALL");
  const [expandedTrackingIds, setExpandedTrackingIds] = useState<string[]>([]);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);
  const [guestOrderQuery, setGuestOrderQuery] = useState("");

  // Review Modal state (C3.1)
  const [reviewModalOrder, setReviewModalOrder] = useState<CustomerOrderRecord | null>(null);
  const [reviewModalProduct, setReviewModalProduct] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewModalError, setReviewModalError] = useState("");
  const [reviewModalSuccess, setReviewModalSuccess] = useState("");

  // Edit Review Modal state (C3.1)
  const [editingReview, setEditingReview] = useState<CustomerReviewRecord | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editReviewError, setEditReviewError] = useState("");
  const [editReviewSuccess, setEditReviewSuccess] = useState("");

  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Read URL search params for deep linking (e.g. ?tab=orders&track=ORD-123456)
    let urlTrack: string | null = null;
    let urlTab: string | null = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      urlTab = params.get("tab");
      urlTrack = params.get("track");
      if (urlTab && ["overview", "orders", "addresses", "reviews", "settings"].includes(urlTab)) {
        setActiveTab(urlTab as any);
      }
      if (urlTrack) {
        setSearchTrackOrder(urlTrack);
        setActiveTab("orders");
        setExpandedTrackingIds((prev) => Array.from(new Set([...prev, urlTrack!])));
      }
    }

    if (currentUser?.email || currentUser?.id) {
      loadCustomerData(currentUser, urlTrack);
      setProfileForm({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
      });
    } else {
      // Guest or local browser orders
      getCustomerOrders({}).then((ords) => {
        setOrders(ords);
        if (urlTrack && ords.length > 0) {
          const matched = ords.find(
            (o) =>
              o.orderNumber?.toLowerCase() === urlTrack!.toLowerCase() ||
              o.id === urlTrack ||
              o.orderNumber?.replace(/[^0-9]/g, "") === urlTrack!.replace(/[^0-9]/g, "")
          );
          if (matched) {
            setTrackingModalOrder(matched);
            setExpandedTrackingIds((prev) => Array.from(new Set([...prev, matched.id])));
          }
        }
        setIsLoading(false);
      });
    }
  }, []);

  const loadCustomerData = async (curr: UserSession, targetTrack?: string | null) => {
    try {
      const [ords, revs, addrs] = await Promise.all([
        getCustomerOrders({ userId: curr.id, email: curr.email }),
        getCustomerReviews({ userId: curr.id, email: curr.email }),
        getCustomerAddresses({ userId: curr.id, email: curr.email }),
      ]);
      setOrders(ords);
      setReviews(revs);
      setAddresses(addrs);

      // Handle deep-link tracking
      const trackToFind = targetTrack || searchTrackOrder;
      if (trackToFind && ords.length > 0) {
        const matched = ords.find(
          (o) =>
            o.orderNumber?.toLowerCase() === trackToFind.toLowerCase() ||
            o.id === trackToFind ||
            o.orderNumber?.replace(/[^0-9]/g, "") === trackToFind.replace(/[^0-9]/g, "")
        );
        if (matched) {
          setTrackingModalOrder(matched);
          setExpandedTrackingIds((prev) => Array.from(new Set([...prev, matched.id])));
          setActiveTab("orders");
        }
      }

      if (addrs.length > 0) {
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        setSelectedDefaultAddressId(def.id);
        setProfileForm((prev) => ({
          ...prev,
          address: `${def.streetAddress}, ${def.city}${def.postalCode ? " " + def.postalCode : ""}`,
        }));
      }
    } catch (err) {
      console.error("Failed to load customer hub data:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (user) {
      setRefreshing(true);
      loadCustomerData(user);
    }
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  // Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      label: "Home",
      recipientName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
      phone: user?.phone || "",
      streetAddress: "",
      city: "",
      postalCode: "",
      isDefault: addresses.length === 0,
    });
    setAddressError("");
    setAddressSuccess("");
    setAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: CustomerAddressRecord) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      streetAddress: addr.streetAddress,
      city: addr.city,
      postalCode: addr.postalCode || "",
      isDefault: addr.isDefault,
    });
    setAddressError("");
    setAddressSuccess("");
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (
      !addressForm.recipientName.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.streetAddress.trim() ||
      !addressForm.city.trim()
    ) {
      setAddressError("Please fill in recipient name, phone, street address, and city.");
      return;
    }

    setIsSavingAddress(true);
    setAddressError("");
    try {
      if (editingAddress) {
        const res = await updateCustomerAddress(editingAddress.id, addressForm);
        if (res.success) {
          setAddressSuccess("Address updated successfully!");
          await loadCustomerData(user);
          setTimeout(() => setAddressModalOpen(false), 800);
        } else {
          setAddressError(res.error || "Failed to update address.");
        }
      } else {
        const res = await createCustomerAddress({
          userId: user.id,
          email: user.email,
          ...addressForm,
        });
        if (res.success) {
          setAddressSuccess("Address saved to address book!");
          await loadCustomerData(user);
          setTimeout(() => setAddressModalOpen(false), 800);
        } else {
          setAddressError(res.error || "Failed to save address.");
        }
      }
    } catch (err: any) {
      setAddressError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;
    try {
      const res = await setDefaultCustomerAddress(id);
      if (res.success) {
        await loadCustomerData(user);
      }
    } catch (err) {
      console.error("Failed to set default address:", err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to remove this delivery address?")) return;
    try {
      const res = await deleteCustomerAddress(id);
      if (res.success) {
        await loadCustomerData(user);
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
    }
  };

  const handleSelectDefaultAddressChange = (addrId: string) => {
    setSelectedDefaultAddressId(addrId);
    const chosen = addresses.find((a) => a.id === addrId);
    if (chosen) {
      setProfileForm((prev) => ({
        ...prev,
        address: `${chosen.streetAddress}, ${chosen.city}${chosen.postalCode ? " " + chosen.postalCode : ""}`,
      }));
    }
  };

  // Save profile changes (C1.1)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSavingProfile(true);
    setProfileMsg(null);

    try {
      if (selectedDefaultAddressId) {
        await setDefaultCustomerAddress(selectedDefaultAddressId);
      }
      const res = await updateCustomerProfile(user.id, profileForm);
      if (res.success && res.user) {
        const updatedSession: UserSession = {
          ...user,
          firstName: res.user.firstName,
          lastName: res.user.lastName,
          phone: res.user.phone,
          address: res.user.address,
        };
        setCurrentUser(updatedSession);
        setUser(updatedSession);
        setProfileMsg({ type: "success", text: "Profile & default delivery address updated successfully!" });
        await loadCustomerData(updatedSession);
      } else {
        setProfileMsg({ type: "error", text: res.error || "Failed to update profile." });
      }
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Open modal to review an order item (C3.1)
  const handleOpenReviewModal = (order: CustomerOrderRecord, product: any) => {
    setReviewModalOrder(order);
    setReviewModalProduct(product);
    setReviewRating(5);
    setReviewComment("");
    setReviewModalError("");
    setReviewModalSuccess("");
  };

  // Submit new review from customer orders list (C3.1)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewModalProduct || !reviewModalOrder) return;

    if (!reviewComment.trim() || reviewComment.trim().length < 8) {
      setReviewModalError("Please write at least 8 characters describing your experience.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewModalError("");
    try {
      const res = await submitProductReview(reviewModalProduct.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
        userId: user.id,
        email: user.email,
        orderId: reviewModalOrder.id,
      });

      if (res.success) {
        setReviewModalSuccess("Verified review submitted successfully!");
        await loadCustomerData(user);
        setTimeout(() => {
          setReviewModalOrder(null);
          setReviewModalProduct(null);
        }, 1200);
      } else {
        setReviewModalError(res.error || "Failed to submit review.");
      }
    } catch (err: any) {
      setReviewModalError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Open Edit review modal (C3.1)
  const handleOpenEditReview = (rev: CustomerReviewRecord) => {
    setEditingReview(rev);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
    setEditReviewError("");
    setEditReviewSuccess("");
  };

  // Save updated review (C3.1)
  const handleSaveEditReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    if (!editComment.trim() || editComment.trim().length < 8) {
      setEditReviewError("Please write at least 8 characters.");
      return;
    }

    setIsEditingReview(true);
    setEditReviewError("");
    try {
      const res = await updateCustomerReview(editingReview.id, {
        rating: editRating,
        comment: editComment.trim(),
      });

      if (res.success) {
        setEditReviewSuccess("Review updated successfully!");
        if (user) await loadCustomerData(user);
        setTimeout(() => {
          setEditingReview(null);
        }, 1200);
      } else {
        setEditReviewError(res.error || "Failed to update review.");
      }
    } catch (err: any) {
      setEditReviewError(err.message || "Failed to update review.");
    } finally {
      setIsEditingReview(false);
    }
  };

  // Delete Customer Review
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this verified review?")) return;
    setDeletingReviewId(reviewId);
    try {
      const res = await deleteCustomerReview(reviewId);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        if (user) await loadCustomerData(user);
      } else {
        alert(res.error || "Failed to delete review");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (!mounted) return null;

  const handleTrackGuestOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = guestOrderQuery.trim();
    if (!clean) return;

    const matched = orders.find(
      (o) =>
        o.orderNumber?.toLowerCase() === clean.toLowerCase() ||
        o.id === clean ||
        o.orderNumber?.replace(/[^0-9]/g, "") === clean.replace(/[^0-9]/g, "")
    );
    if (matched) {
      setTrackingModalOrder(matched);
      setExpandedTrackingIds((prev) => Array.from(new Set([...prev, matched.id])));
      setActiveTab("orders");
      return;
    }

    try {
      const all = await getCustomerOrders({});
      const found = all.find(
        (o) =>
          o.orderNumber?.toLowerCase() === clean.toLowerCase() ||
          o.orderNumber?.replace(/[^0-9]/g, "") === clean.replace(/[^0-9]/g, "")
      );
      if (found) {
        setTrackingModalOrder(found);
        setOrders((prev) => [found, ...prev]);
        setExpandedTrackingIds((prev) => Array.from(new Set([...prev, found.id])));
        setActiveTab("orders");
      } else {
        alert(`No package found for order reference "${clean}". Please verify your reference number.`);
      }
    } catch {
      alert(`Could not locate package "${clean}".`);
    }
  };

  // Route guard: if not signed in and has no active order to view, show sign-in with quick tracker
  if (!user && orders.length === 0 && !searchTrackOrder) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Sellora" className="h-8 w-auto object-contain" />
            <span className="font-display font-black tracking-widest text-base">SELLORA</span>
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <Home className="h-4 w-4" /> Storefront
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-card space-y-6">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Truck className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold mb-2">Customer Order Hub</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to view your account orders, or track any package directly with your Order Reference Number.
              </p>
            </div>

            {/* Direct Package Tracker Input */}
            <form onSubmit={handleTrackGuestOrder} className="bg-secondary/40 p-4 rounded-xl border border-border text-left space-y-3">
              <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-primary" /> Track Order by Reference Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ORD-102941"
                  value={guestOrderQuery}
                  onChange={(e) => setGuestOrderQuery(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-mono text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Track
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-3 pt-2">
              <Link
                to="/login"
                className="w-full py-3 bg-secondary hover:bg-secondary/80 text-foreground font-display text-xs font-semibold uppercase tracking-wider rounded-xl transition-all text-center border border-border"
              >
                Sign In to Full Account
              </Link>
              <Link
                to="/"
                className="w-full py-2.5 border border-border text-xs text-muted-foreground hover:text-foreground rounded-xl transition-colors text-center"
              >
                Return to Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active counts for C1.1
  const totalOrdersCount = orders.length;
  const processingCount = orders.filter((o) => o.status === "PROCESSING").length;
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;
  const completedCount = orders.filter((o) => o.status === "DELIVERED").length;

  // Sidebar navigation items
  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "My Orders", icon: ShoppingBag, badge: orders.length },
    { id: "addresses", label: "Address Book", icon: MapPin, badge: addresses.length },
    { id: "reviews", label: "Rate & Reviews", icon: Star, badge: reviews.length },
    { id: "settings", label: "Profile Settings", icon: Settings },
  ];

  const userInitials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Top Application Bar matching Admin/Seller Design */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-sm">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Sellora"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-display font-black tracking-widest text-base hidden sm:inline text-foreground">
            SELLORA CUSTOMER PORTAL
          </span>
        </Link>

        {/* Right Header Navigation & Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* UI Mode Toggle (HUD vs Simple) */}
          <button
            type="button"
            onClick={toggleMode}
            id="account-ui-mode-toggle"
            aria-label={`Switch to ${mode === "hud" ? "simple" : "HUD"} mode`}
            title={`Current: ${mode.toUpperCase()} mode. Click to switch.`}
            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary hover:border-primary/50 px-2.5 py-1 text-xs text-muted-foreground transition-all shrink-0 cursor-pointer"
          >
            <Layers className={`h-3.5 w-3.5 ${mode === "hud" ? "text-primary" : "text-accent"} transition-transform hover:scale-110`} />
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider hidden sm:inline">
              {mode === "hud" ? <span className="text-primary">HUD</span> : <span className="text-accent">SIMPLE</span>}
            </span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Refresh Account Data"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
          </button>

          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            <Home className="h-3.5 w-3.5" /> Storefront
          </Link>

          {user.role === "admin" && (
            <Link
              to="/admin"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Shield className="h-3.5 w-3.5" /> Admin Panel
            </Link>
          )}

          {user.role === "seller" && (
            <Link
              to="/seller"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Store className="h-3.5 w-3.5" /> Seller Hub
            </Link>
          )}

          <div className="flex items-center gap-3 pl-2 border-l border-border">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px] shadow-sm">
              <div className="h-full w-full bg-card rounded-full flex items-center justify-center text-xs font-bold font-mono text-primary">
                {userInitials}
              </div>
            </div>

            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-foreground leading-tight">
                {user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Customer Operator"}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono leading-tight">
                {user.email}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Work Area: Left Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Menu */}
        <aside className="w-56 border-r border-border bg-card flex flex-col shrink-0 py-4 z-40 relative shadow-sm">
          <div className="px-4 pb-3 mb-2 border-b border-border">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Account ID</div>
            <div className="text-xs font-bold text-foreground truncate mt-0.5">
              {user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Verified Buyer"}
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold inline-block bg-primary/20 text-primary border border-primary/30 mt-1">
              Active Member
            </span>
          </div>

          <nav className="flex flex-col gap-1.5 px-3 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${isActive
                    ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? "bg-primary/20 text-primary font-bold" : "bg-secondary text-muted-foreground"
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-4 pt-3 border-t border-border text-[10px] font-mono text-muted-foreground">
            <div>SELLORA Buyer Protection</div>
            <div className="text-muted-foreground/60 mt-0.5">100% Genuine Hardware</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative scroll-smooth bg-background">
          <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-up">

            {/* TAB 1: OVERVIEW & COMMAND CENTER (C1.1) */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-up">
                {/* Welcome Banner */}
                <div className="relative rounded-2xl bg-card border border-border p-6 sm:p-8 overflow-hidden shadow-card">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary uppercase font-semibold">
                        Customer Command Center
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-foreground mt-2">
                        Welcome back, {user.firstName || "Customer"}!
                      </h1>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Track your dispatched computing rigs, review delivered hardware, and manage your delivery address.
                      </p>
                    </div>

                    <Link
                      to="/"
                      className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-display text-xs font-semibold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Browse Hardware</span>
                    </Link>
                  </div>
                </div>

                {/* 4 Account Summary KPI Cards (C1.1) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div
                    onClick={() => setActiveTab("orders")}
                    className="rounded-2xl bg-card border border-border p-6 hover:border-primary/50 shadow-card transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-mono text-muted-foreground uppercase">Total Orders Placed</p>
                    <h3 className="text-3xl font-display font-black text-foreground mt-1.5">{totalOrdersCount}</h3>
                    <div className="mt-3 text-[11px] font-mono text-primary flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" /> All-time purchase orders
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab("orders")}
                    className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-6 hover:border-blue-400 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-mono text-muted-foreground uppercase">Processing (Packing)</p>
                    <h3 className="text-3xl font-display font-black text-blue-500 dark:text-blue-300 mt-1.5">{processingCount}</h3>
                    <div className="mt-3 text-[11px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Package className="h-3 w-3" /> Preparing at vendor warehouse
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab("orders")}
                    className="rounded-2xl bg-purple-500/10 border border-purple-500/30 p-6 hover:border-purple-400 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-mono text-muted-foreground uppercase">Shipped (In Transit)</p>
                    <h3 className="text-3xl font-display font-black text-purple-600 dark:text-purple-300 mt-1.5">{shippedCount}</h3>
                    <div className="mt-3 text-[11px] font-mono text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Truck className="h-3 w-3" /> With express courier
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab("orders")}
                    className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 hover:border-emerald-400 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-mono text-muted-foreground uppercase">Completed &amp; Delivered</p>
                    <h3 className="text-3xl font-display font-black text-emerald-600 dark:text-emerald-300 mt-1.5">{completedCount}</h3>
                    <div className="mt-3 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Delivered &bull; Ready for review
                    </div>
                  </div>
                </div>

                {/* Active Shipment In-Transit Live Tracker (C2.1 & FR-52/53) */}
                {(() => {
                  const activeOrder = orders.find((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED") || orders[0];
                  if (!activeOrder) return null;

                  const stages = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
                  const stageIdx = stages.indexOf(activeOrder.status);
                  const estDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div className="rounded-2xl bg-card border-2 border-primary/40 shadow-card p-6 space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-primary via-accent to-emerald-500 animate-pulse" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 animate-pulse">
                            <Truck className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                                Active Package In-Transit
                              </span>
                              <span className="text-xs font-mono font-bold text-foreground">
                                {activeOrder.orderNumber}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Carrier: SELLORA Express Logistics &bull; Waybill: SLR-TRK-{activeOrder.orderNumber.replace(/[^0-9]/g, "") || "94821"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingModalOrder(activeOrder);
                              setExpandedTrackingIds((prev) => Array.from(new Set([...prev, activeOrder.id])));
                              setActiveTab("orders");
                            }}
                            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            <span>Track Live Package</span>
                          </button>
                        </div>
                      </div>

                      {/* Stepper Progress Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "1. Order Placed", desc: "Payment Confirmed", step: 0 },
                          { label: "2. Quality Check", desc: "Thermal & Packing", step: 1 },
                          { label: "3. Dispatched", desc: "Express Transit", step: 2 },
                          { label: "4. Doorstep Delivery", desc: estDate, step: 3 },
                        ].map((s) => {
                          const isDone = stageIdx > s.step || (stageIdx === s.step && s.step === 3);
                          const isCurrent = stageIdx === s.step && s.step < 3;
                          return (
                            <div
                              key={s.label}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                isDone
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : isCurrent
                                  ? "bg-primary/10 border-primary ring-1 ring-primary text-foreground"
                                  : "bg-secondary/30 border-border text-muted-foreground opacity-60"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase mb-1">
                                <span>Step {s.step + 1}</span>
                                {isDone ? <span>✓ Done</span> : isCurrent ? <span className="text-primary animate-pulse">Active</span> : <span>Pending</span>}
                              </div>
                              <div className="text-xs font-bold truncate">{s.label}</div>
                              <div className="text-[10px] text-muted-foreground truncate mt-0.5">{s.desc}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Secondary Section: Fast Access Recent Orders & Profile Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Orders Fast Access (C1.1) */}
                  <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-sm tracking-wide uppercase text-foreground flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-primary" /> Recent Orders
                      </h3>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                      >
                        View Full Pipeline <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {orders.length > 0 ? (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((ord) => (
                          <div
                            key={ord.id}
                            className="p-4 rounded-xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                <Package className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-foreground">{ord.orderNumber}</span>
                                  <span
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${ord.status === "DELIVERED"
                                      ? "bg-emerald-500/20 text-emerald-500 dark:text-emerald-300 border border-emerald-500/30"
                                      : ord.status === "SHIPPED"
                                        ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30"
                                        : ord.status === "PROCESSING"
                                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                                          : "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                                      }`}
                                  >
                                    {ord.status}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {ord.items.map((it) => it.product?.name).join(", ")}
                                </div>
                              </div>
                            </div>

                            <div className="text-right sm:shrink-0">
                              <div className="text-sm font-display font-bold text-foreground">
                                LKR {Number(ord.totalAmount ?? 0).toLocaleString()}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                {new Date(ord.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        You have not placed any orders yet. Visit the storefront to configure your dream machine.
                      </div>
                    )}
                  </div>

                  {/* Profile Summary Card */}
                  <div className="lg:col-span-1 rounded-2xl bg-card border border-border shadow-card p-6 space-y-4">
                    <h3 className="font-display font-bold text-sm tracking-wide uppercase text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-accent" /> Delivery Profile
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-semibold text-foreground">
                          {user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Not set"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-mono text-foreground truncate max-w-[170px]">{user.email}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="text-foreground">{user.phone || "Not set"}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">Address:</span>
                        <span className="text-foreground text-right max-w-[170px] truncate">
                          {user.address || "Not set"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => setActiveTab("addresses")}
                        className="w-full py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Manage Address Book ({addresses.length})</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("settings")}
                        className="w-full py-2 rounded-xl bg-secondary border border-border hover:bg-secondary/80 text-xs font-medium text-foreground transition-all flex items-center justify-center gap-2"
                      >
                        <span>Edit Account Settings</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MY ORDERS & REAL-TIME TRACKING PIPELINE (C2.1 & C3.1) */}
            {activeTab === "orders" && (
              <div className="space-y-6 animate-fade-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                      <span>My Hardware Orders</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-mono border border-primary/30">
                        {orders.length} Total
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Real-time package dispatch tracking, courier milestones, and post-delivery hardware reviews.
                    </p>
                  </div>

                  <Link
                    to="/"
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-mono font-semibold border border-border flex items-center gap-2 transition-colors"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>New Order</span>
                  </Link>
                </div>

                {/* Deep-link / Targeted Tracking Banner */}
                {searchTrackOrder && (
                  <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 animate-pulse">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-mono uppercase font-bold text-primary block">
                          Target Shipment Selected
                        </span>
                        <p className="text-foreground font-mono">
                          Viewing package tracking pipeline for: <strong>{searchTrackOrder}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSearchTrackOrder(null)}
                      className="text-xs font-mono text-muted-foreground hover:text-foreground underline cursor-pointer self-start sm:self-auto"
                    >
                      Clear Filter
                    </button>
                  </div>
                )}

                {/* Orders Search & Status Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-3 sm:p-4 rounded-2xl shadow-sm">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search orders by reference # or laptop rig..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary/50 border border-border text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: "ALL", label: `All (${orders.length})` },
                      { id: "ACTIVE", label: `In Transit (${processingCount + shippedCount})` },
                      { id: "DELIVERED", label: `Delivered (${completedCount})` },
                      { id: "CANCELLED", label: `Cancelled (${orders.filter(o => o.status === "CANCELLED").length})` },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setOrderStatusFilter(f.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
                          orderStatusFilter === f.id
                            ? "bg-primary text-primary-foreground font-bold shadow-sm"
                            : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders List with Inline & Modal Package Tracking */}
                {(() => {
                  const filteredOrders = orders.filter((o) => {
                    const matchesQuery =
                      !orderSearchQuery ||
                      o.orderNumber?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                      o.items?.some((it) => it.product?.name?.toLowerCase().includes(orderSearchQuery.toLowerCase()));

                    if (!matchesQuery) return false;

                    if (orderStatusFilter === "ACTIVE") {
                      return o.status === "PENDING" || o.status === "PROCESSING" || o.status === "SHIPPED";
                    }
                    if (orderStatusFilter === "DELIVERED") {
                      return o.status === "DELIVERED";
                    }
                    if (orderStatusFilter === "CANCELLED") {
                      return o.status === "CANCELLED";
                    }
                    return true;
                  });

                  if (filteredOrders.length === 0) {
                    return (
                      <div className="p-12 rounded-2xl bg-card border border-dashed border-border text-center space-y-3">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
                        <h4 className="font-display font-bold text-foreground text-base">No Matching Orders Found</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          {orders.length === 0
                            ? "You have not placed any orders yet. Visit the storefront to configure your dream machine."
                            : "No orders match your current search query or filter."}
                        </p>
                        {orders.length > 0 && (
                          <button
                            onClick={() => {
                              setOrderSearchQuery("");
                              setOrderStatusFilter("ALL");
                              setSearchTrackOrder(null);
                            }}
                            className="px-4 py-2 rounded-xl bg-secondary text-xs font-mono font-bold hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filteredOrders.map((ord) => {
                        const isTracked = Boolean(
                          searchTrackOrder &&
                            (ord.orderNumber.toLowerCase() === searchTrackOrder.toLowerCase() ||
                              ord.id === searchTrackOrder)
                        );
                        const isExpanded = expandedTrackingIds.includes(ord.id) || isTracked;
                        const waybillCode = `SLR-TRK-${ord.orderNumber.replace(/[^0-9]/g, "") || "94821"}`;
                        const estDeliveryDate = new Date(
                          new Date(ord.createdAt).getTime() + 2 * 24 * 60 * 60 * 1000
                        ).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        });

                        const stages = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
                        const currentStageIdx = stages.indexOf(ord.status);

                        const toggleExpand = () => {
                          setExpandedTrackingIds((prev) =>
                            prev.includes(ord.id) ? prev.filter((id) => id !== ord.id) : [...prev, ord.id]
                          );
                        };

                        const handleCopyCode = (code: string) => {
                          navigator.clipboard.writeText(code);
                          setCopiedTrackingId(code);
                          setTimeout(() => setCopiedTrackingId(null), 2000);
                        };

                        return (
                          <div
                            key={ord.id}
                            className={`rounded-2xl bg-card border shadow-card p-4 sm:p-5 transition-all space-y-4 ${
                              isTracked
                                ? "border-primary ring-2 ring-primary/40 bg-primary/[0.02]"
                                : "border-border hover:border-border-hover"
                            }`}
                          >
                            {/* Top Header Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-xs text-primary">{ord.orderNumber}</span>
                                  <button
                                    onClick={() => handleCopyCode(ord.orderNumber)}
                                    title="Copy Order #"
                                    className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  >
                                    {copiedTrackingId === ord.orderNumber ? (
                                      <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>

                                <span
                                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                                    ord.status === "DELIVERED"
                                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                                      : ord.status === "SHIPPED"
                                      ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30"
                                      : ord.status === "PROCESSING"
                                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                                      : ord.status === "CANCELLED"
                                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                                      : "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                                  }`}
                                >
                                  {ord.status === "PENDING"
                                    ? "Order Placed"
                                    : ord.status === "PROCESSING"
                                    ? "Packed & Verified"
                                    : ord.status === "SHIPPED"
                                    ? "In Transit"
                                    : ord.status === "DELIVERED"
                                    ? "Delivered"
                                    : ord.status === "CANCELLED"
                                    ? "Cancelled"
                                    : ord.status}
                                </span>

                                <span className="text-[11px] text-muted-foreground font-mono">
                                  Placed {new Date(ord.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2.5">
                                <span className="font-display font-bold text-xs text-foreground mr-1">
                                  LKR {Number(ord.totalAmount ?? 0).toLocaleString()}
                                </span>

                                {/* Inline Timeline Toggle */}
                                <button
                                  type="button"
                                  onClick={toggleExpand}
                                  className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[11px] font-mono font-medium flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <span>Pipeline</span>
                                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>

                                {/* Full Tracking Modal Button */}
                                <button
                                  type="button"
                                  onClick={() => setTrackingModalOrder(ord)}
                                  className="px-3 py-1 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                >
                                  <Truck className="h-3 w-3" />
                                  <span>Track Live</span>
                                </button>
                              </div>
                            </div>

                            {/* INLINE PACKAGE TRACKING PIPELINE (Expandable) */}
                            {isExpanded && (
                              <div className="bg-secondary/30 border border-primary/20 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/80">
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wide">
                                      Real-Time Package Pipeline
                                    </span>
                                    <span className="text-[11px] font-mono text-muted-foreground">
                                      &bull; Waybill: <strong>{waybillCode}</strong>
                                    </span>
                                    <button
                                      onClick={() => handleCopyCode(waybillCode)}
                                      className="p-1 rounded hover:bg-secondary text-primary transition-colors cursor-pointer"
                                    >
                                      {copiedTrackingId === waybillCode ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-mono text-muted-foreground">
                                      Carrier: <strong>SELLORA Express</strong>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setTrackingModalOrder(ord)}
                                      className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
                                    >
                                      <span>Full Modal</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* 4-Step Stepper Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                  {[
                                    { step: 0, title: "1. Order Placed", desc: "Payment Confirmed", status: "PENDING" },
                                    { step: 1, title: "2. QC & Packing", desc: "Thermal QC Passed", status: "PROCESSING" },
                                    { step: 2, title: "3. Dispatched", desc: "Express Courier", status: "SHIPPED" },
                                    { step: 3, title: "4. Delivered", desc: estDeliveryDate, status: "DELIVERED" },
                                  ].map((st) => {
                                    const isDone = currentStageIdx > st.step || (currentStageIdx === st.step && st.step === 3);
                                    const isCurrent = currentStageIdx === st.step && st.step < 3;

                                    return (
                                      <div
                                        key={st.title}
                                        className={`p-3 rounded-xl border text-left transition-all ${
                                          isDone
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                            : isCurrent
                                            ? "bg-primary/10 border-primary ring-1 ring-primary text-foreground shadow-sm"
                                            : "bg-secondary/40 border-border text-muted-foreground opacity-60"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase mb-1">
                                          <span>Step {st.step + 1}</span>
                                          {isDone ? (
                                            <span className="text-emerald-500">✓ Done</span>
                                          ) : isCurrent ? (
                                            <span className="text-primary font-bold animate-pulse">Active</span>
                                          ) : (
                                            <span>Pending</span>
                                          )}
                                        </div>
                                        <div className="text-xs font-bold truncate">{st.title}</div>
                                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">{st.desc}</div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Address and Estimated Delivery Footer */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground pt-1">
                                  <span>
                                    <strong>Shipping To:</strong> {ord.shippingAddress}, {ord.city}
                                  </span>
                                  <span>
                                    <strong>SLA Window:</strong> {ord.status === "DELIVERED" ? "Delivered to Customer" : "Est. 24 - 48 Hours"}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Compact Items List */}
                            <div className="space-y-1.5">
                              {ord.items.map((item) => {
                                const alreadyReviewed = ord.reviews?.some((r) => r.productId === item.productId);

                                return (
                                  <div
                                    key={item.id}
                                    className="p-2 sm:p-2.5 rounded-xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <img
                                        src={item.product?.img}
                                        alt={item.product?.name}
                                        className="h-9 w-11 rounded-lg object-cover border border-border shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="font-display font-bold text-xs text-foreground truncate">
                                          {item.product?.name || "Computing Rig"}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                                          {item.product?.cpu} &bull; {item.product?.gpu}
                                          {item.product?.seller?.storeName && ` • Sold by: ${item.product.seller.storeName}`}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                      <div className="text-right">
                                        <div className="text-xs font-mono font-bold text-foreground">
                                          LKR {(item.price * item.quantity).toLocaleString()}
                                        </div>
                                        <div className="text-[9px] font-mono text-muted-foreground">
                                          Qty: {item.quantity}
                                        </div>
                                      </div>

                                      {ord.status === "DELIVERED" ? (
                                        alreadyReviewed ? (
                                          <button
                                            onClick={() => setActiveTab("reviews")}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                                          >
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>Reviewed</span>
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleOpenReviewModal(ord, item.product)}
                                            className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-[10px] font-display font-semibold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                                          >
                                            <Star className="h-3 w-3 fill-current" />
                                            <span>Rate &amp; Review</span>
                                          </button>
                                        )
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB: ADDRESS BOOK (Multiple Saved Addresses) */}
            {activeTab === "addresses" && (
              <div className="space-y-6 animate-fade-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                      <span>Saved Delivery Addresses</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-mono border border-primary/30">
                        {addresses.length} Saved
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manage your shipping locations. Your primary address is selected automatically during checkout.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-display font-semibold text-xs uppercase tracking-wider transition-all shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`rounded-2xl p-5 border transition-all flex flex-col justify-between relative group ${addr.isDefault
                          ? "bg-primary/5 border-primary/50 shadow-sm ring-1 ring-primary/20"
                          : "bg-card border-border hover:border-border-hover shadow-card"
                          }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary border border-border text-foreground font-bold">
                              {addr.label || "Home"}
                            </span>

                            {addr.isDefault ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold flex items-center gap-1">
                                <Check className="h-3 w-3 stroke-[3]" /> Primary Default
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>

                          <div>
                            <div className="font-display font-bold text-sm text-foreground">
                              {addr.recipientName}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                              <span>{addr.phone}</span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                              <div>
                                <div className="text-foreground">{addr.streetAddress}</div>
                                <div className="text-muted-foreground font-mono mt-0.5">
                                  {addr.city} {addr.postalCode ? `• ${addr.postalCode}` : ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-border">
                          <button
                            onClick={() => handleOpenEditAddress(addr)}
                            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Delete Address"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 rounded-2xl bg-card border border-dashed border-border text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <h4 className="font-display font-bold text-foreground text-base">No Saved Addresses</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
                      Add your home or office address to save time during checkout.
                    </p>
                    <button
                      onClick={handleOpenAddAddress}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-display font-semibold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add First Address</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RATE & REVIEWS MANAGER (C3.1) */}
            {activeTab === "reviews" && (
              <div className="space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                    <span>My Hardware Reviews &amp; Ratings</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-mono border border-primary/30">
                      {reviews.length} Published
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage your verified operator ratings and edit submitted hardware reviews.
                  </p>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-6 rounded-2xl bg-card border border-border hover:border-border-hover shadow-card transition-all space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={rev.product?.img}
                              alt={rev.product?.name}
                              className="h-12 w-14 rounded-lg object-cover border border-border shrink-0"
                            />
                            <div>
                              <div className="font-display font-bold text-sm text-foreground">
                                {rev.product?.name || "Machine Unit"}
                              </div>
                              <div className="text-[10px] font-mono text-primary mt-0.5">
                                Verified Order #{rev.order?.orderNumber} &bull; {new Date(rev.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-amber-500">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-4 w-4 ${s <= rev.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                                    }`}
                                />
                              ))}
                            </div>

                            {/* Edit & Delete Submitted Review Buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditReview(rev)}
                                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                disabled={deletingReviewId === rev.id}
                                onClick={() => handleDeleteReview(rev.id)}
                                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-destructive/10 text-foreground hover:text-destructive border border-border hover:border-destructive/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                title="Delete Review"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>{deletingReviewId === rev.id ? "Deleting..." : "Delete"}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-foreground/90 italic leading-relaxed pt-1">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 rounded-2xl bg-card border border-dashed border-border text-center">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <h4 className="font-display font-bold text-foreground text-base">No Reviews Submitted Yet</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Once your ordered laptops are delivered, you can submit verified reviews directly from your Orders tab.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PROFILE SETTINGS (C1.1) */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                    <span>Customer Profile &amp; Delivery Settings</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage your contact credentials and default shipping destination.
                  </p>
                </div>

                {profileMsg && (
                  <div
                    className={`max-w-2xl p-4 rounded-xl text-xs flex items-center gap-2 ${profileMsg.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                      : "bg-destructive/10 border border-destructive/30 text-destructive"
                      }`}
                  >
                    {profileMsg.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="max-w-2xl rounded-2xl bg-card border border-border shadow-card p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-muted-foreground font-mono uppercase text-[10px] block mb-1.5 font-bold">
                        First Name
                      </label>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground font-mono uppercase text-[10px] block mb-1.5 font-bold">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-muted-foreground font-mono uppercase text-[10px] block mb-1.5 font-bold">
                      Account Email
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user.email}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-muted-foreground font-mono opacity-80"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground font-mono uppercase text-[10px] block mb-1.5 font-bold">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+94 77 123 4567"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-muted-foreground font-mono uppercase text-[10px] font-bold flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        Default Delivery Address
                      </label>
                      <button
                        type="button"
                        onClick={handleOpenAddAddress}
                        className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add New Address
                      </button>
                    </div>

                    {addresses.length > 0 ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <select
                            value={selectedDefaultAddressId}
                            onChange={(e) => handleSelectDefaultAddressChange(e.target.value)}
                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none font-sans cursor-pointer shadow-sm"
                          >
                            {addresses.map((addr) => (
                              <option key={addr.id} value={addr.id} className="bg-card text-foreground py-2">
                                [{addr.label.toUpperCase()}] {addr.recipientName} - {addr.streetAddress}, {addr.city} {addr.isDefault ? "★ (Default)" : ""}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                            <ChevronRight className="h-4 w-4 rotate-90" />
                          </div>
                        </div>

                        {/* Selected Address Preview Card */}
                        {(() => {
                          const currentSelected =
                            addresses.find((a) => a.id === selectedDefaultAddressId) ||
                            addresses.find((a) => a.isDefault) ||
                            addresses[0];
                          if (!currentSelected) return null;
                          return (
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-start justify-between gap-3 shadow-sm">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                                    {currentSelected.label}
                                  </span>
                                  <span className="font-bold text-foreground">{currentSelected.recipientName}</span>
                                  <span className="text-muted-foreground font-mono">({currentSelected.phone})</span>
                                </div>
                                <div className="text-muted-foreground">
                                  {currentSelected.streetAddress}, {currentSelected.city}{" "}
                                  {currentSelected.postalCode ? `• ${currentSelected.postalCode}` : ""}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-primary uppercase tracking-wider shrink-0 bg-primary/10 px-2 py-0.5 rounded border border-primary/20 font-bold">
                                Active Default
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-card border border-dashed border-border text-center space-y-2">
                        <p className="text-xs text-muted-foreground">
                          No saved addresses found in your address book.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddAddress}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-semibold transition-all cursor-pointer"
                        >
                          + Create Your First Saved Address
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-display font-semibold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isSavingProfile ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Save Profile Settings</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* C2.1 LIVE ORDER TRACKING MODAL */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shrink-0">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display font-bold text-foreground flex items-center gap-2">
                    <span>Live Package Tracking</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 font-bold">
                      {trackingModalOrder.orderNumber}
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                    <span>Placed: {new Date(trackingModalOrder.createdAt).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span>Total: LKR {Number(trackingModalOrder.totalAmount ?? 0).toLocaleString()}</span>
                    <span>&bull;</span>
                    <span className="text-primary font-bold">
                      Waybill: SLR-TRK-{trackingModalOrder.orderNumber.replace(/[^0-9]/g, "") || "94821"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Status Highlight Banner */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-muted-foreground block font-bold tracking-wider">
                  Current Shipment Status
                </span>
                <span className="text-sm font-display font-bold text-foreground flex items-center gap-2 mt-0.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${trackingModalOrder.status === "DELIVERED"
                      ? "bg-emerald-500 shadow-sm"
                      : trackingModalOrder.status === "CANCELLED"
                        ? "bg-destructive shadow-sm"
                        : "bg-primary animate-pulse shadow-sm"
                      }`}
                  />
                  {trackingModalOrder.status === "PENDING"
                    ? "Order Placed & Awaiting Vendor Dispatch"
                    : trackingModalOrder.status === "PROCESSING"
                      ? "Packed & Verified (Thermal QC Check Complete)"
                      : trackingModalOrder.status === "SHIPPED"
                        ? "In Transit (Express Courier Dispatch)"
                        : trackingModalOrder.status === "DELIVERED"
                          ? "Delivered & Verified by Operator"
                          : trackingModalOrder.status === "CANCELLED"
                            ? "Order Cancelled & Refunded"
                            : trackingModalOrder.status}
                </span>
              </div>
              <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold flex items-center gap-1.5 shrink-0">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {trackingModalOrder.status === "DELIVERED"
                    ? "Delivered to Customer"
                    : trackingModalOrder.status === "CANCELLED"
                      ? "Cancelled"
                      : "Estimated Delivery: 24 - 48h"}
                </span>
              </div>
            </div>

            {/* 4-Stage Visual Progress Timeline */}
            {(() => {
              const stages = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
              const currentStageIndex = stages.indexOf(trackingModalOrder.status);
              const isCancelled = trackingModalOrder.status === "CANCELLED";

              if (isCancelled) {
                return (
                  <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>This order has been cancelled.</span>
                  </div>
                );
              }

              const steps = [
                { key: "PENDING", label: "Order Placed", desc: "Logged & Verified" },
                { key: "PROCESSING", label: "Packed & Verified", desc: "Thermal QC check" },
                { key: "SHIPPED", label: "In Transit", desc: "Express Courier Hub" },
                { key: "DELIVERED", label: "Delivered", desc: "Doorstep Handover" },
              ];

              return (
                <div className="p-6 rounded-2xl bg-secondary/40 border border-border space-y-6">
                  <div className="grid grid-cols-4 gap-2 relative">
                    {/* Connecting progress bar line */}
                    <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-border/60 -z-0">
                      <div
                        className="h-full bg-primary transition-all duration-500 shadow-sm"
                        style={{
                          width: `${Math.min(100, Math.max(0, (currentStageIndex / (steps.length - 1)) * 100))}%`,
                        }}
                      />
                    </div>

                    {steps.map((step, idx) => {
                      const isComplete = currentStageIndex >= idx;
                      const isCurrent = currentStageIndex === idx;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center z-10">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all mb-2 ${isComplete
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-card text-muted-foreground border border-border"
                              } ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                          >
                            {isComplete ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
                          </div>
                          <div className={`text-xs font-bold leading-tight ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
                            {step.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Carrier & Quality Assurance Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">
                  Carrier Logistics Partner
                </span>
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                  <span>SELLORA Express Rapid Logistics</span>
                </p>
                <p className="text-muted-foreground font-mono text-[11px]">
                  Service: Priority Surface/Air Insured Courier
                </p>
                <p className="text-emerald-500 font-mono text-[11px] font-semibold">
                  ✓ Anti-Theft Tamper Seal Verified
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">
                  Rig Quality Assurance Inspection
                </span>
                <ul className="text-[11px] text-muted-foreground space-y-0.5 font-mono">
                  <li className="flex items-center gap-1 text-emerald-500">✓ 100% Thermal & BIOS Stress Test Passed</li>
                  <li className="flex items-center gap-1 text-emerald-500">✓ Sealed Antistatic Hardware Packaging</li>
                  <li className="flex items-center gap-1 text-emerald-500">✓ Manufacturer Warranty Card Affixed</li>
                </ul>
              </div>
            </div>

            {/* Shipping & Delivery Address Details Card */}
            <div className="p-5 rounded-2xl bg-secondary/40 border border-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase text-primary tracking-wider pb-2 border-b border-border">
                <MapPin className="h-4 w-4" />
                <span>Shipping & Delivery Destination</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">
                    Recipient Customer
                  </span>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{trackingModalOrder.customerName}</span>
                  </p>
                  <p className="text-muted-foreground font-mono flex items-center gap-2 mt-1">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{trackingModalOrder.customerPhone || "Phone not provided"}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">
                    Delivery Street Address
                  </span>
                  <p className="text-foreground leading-relaxed font-mono">
                    {trackingModalOrder.shippingAddress}
                  </p>
                  {(trackingModalOrder.city || trackingModalOrder.zipCode) && (
                    <p className="text-muted-foreground font-mono text-[11px]">
                      {[trackingModalOrder.city, trackingModalOrder.zipCode].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Package Contents */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase text-foreground tracking-wider">
                <Package className="h-4 w-4 text-accent" />
                <span>Hardware Packages in this Shipment ({trackingModalOrder.items.length})</span>
              </div>

              <div className="space-y-2">
                {trackingModalOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-secondary/30 border border-border flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.product?.img}
                        alt={item.product?.name}
                        className="h-10 w-12 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {item.product?.name || "Computing Rig"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {item.product?.cpu} &bull; {item.product?.gpu}
                          {item.product?.seller?.storeName && ` • Sold by: ${item.product.seller.storeName}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-foreground font-mono">
                        LKR {(item.price * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-mono text-xs flex items-center justify-center gap-2 border border-border transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Print Shipping Waybill</span>
              </button>

              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-display text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm text-center"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C3.1 WRITE REVIEW MODAL */}
      {reviewModalOrder && reviewModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                <h3 className="text-base font-display font-bold text-foreground">
                  Review {reviewModalProduct.name}
                </h3>
              </div>
              <button onClick={() => setReviewModalOrder(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {reviewModalError && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {reviewModalError}
              </div>
            )}

            {reviewModalSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs">
                {reviewModalSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-2 font-bold">
                  Star Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setReviewRating(s)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 ${s <= reviewRating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                          }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono text-amber-500 font-bold ml-2">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5 font-bold">
                  Your Review &amp; Experience *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share feedback on thermal performance, build quality, screen clarity, or daily workflow speed..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-secondary/30 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOrder(null)}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-display font-semibold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isSubmittingReview ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C3.1 EDIT REVIEW MODAL */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" />
                <h3 className="text-base font-display font-bold text-foreground">
                  Edit Review &bull; {editingReview.product?.name}
                </h3>
              </div>
              <button onClick={() => setEditingReview(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {editReviewError && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {editReviewError}
              </div>
            )}

            {editReviewSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs">
                {editReviewSuccess}
              </div>
            )}

            <form onSubmit={handleSaveEditReview} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-2 font-bold">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setEditRating(s)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 ${s <= editRating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                          }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono text-amber-500 font-bold ml-2">
                    {editRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5 font-bold">
                  Updated Review Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full bg-secondary/30 border border-border rounded-xl p-3 text-foreground focus:outline-none focus:border-primary resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingReview}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-display font-semibold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isEditingReview ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADDRESS MODAL (Add / Edit Address) */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg text-foreground">
                  {editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h3>
              </div>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addressError && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {addressError}
              </div>
            )}

            {addressSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs">
                {addressSuccess}
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                  Address Label (e.g. Home, Work, Studio, Warehouse) *
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {["Home", "Work", "Studio", "Other"].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm((f) => ({ ...f, label: lbl }))}
                      className={`py-1.5 px-2 rounded-lg text-center font-mono text-[11px] font-bold transition-all cursor-pointer ${addressForm.label === lbl
                        ? "bg-primary/20 border border-primary text-primary shadow-sm"
                        : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Custom label name"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Recipient's Name"
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm((f) => ({ ...f, recipientName: e.target.value }))}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+94 7X XXX XXXX"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                  Street Address &amp; Suite / Building *
                </label>
                <input
                  type="text"
                  required
                  placeholder="No. 45/A Galle Road, Apt 4"
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm((f) => ({ ...f, streetAddress: e.target.value }))}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Colombo 03"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                    Postal / Zip Code
                  </label>
                  <input
                    type="text"
                    placeholder="00300"
                    value={addressForm.postalCode || ""}
                    onChange={(e) => setAddressForm((f) => ({ ...f, postalCode: e.target.value }))}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="h-4 w-4 rounded border-border bg-secondary text-primary focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-foreground text-xs select-none">
                    Make this my primary delivery address
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-display font-semibold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isSavingAddress ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>{editingAddress ? "Save Changes" : "Save Address"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
