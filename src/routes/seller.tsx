import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getCurrentUser, setCurrentUser, logout, type UserSession } from "@/lib/auth";
import {
  getSellerStats,
  getSellerProducts,
  getSellerOrders,
  getSellerEarnings,
  updateSellerOrderFulfillment,
  updateSellerProfile,
  createProduct,
  updateProduct,
  updateProductStock,
  type SellerStatsResponse,
  type SellerOrderRecord,
  type SellerEarningsRecord,
} from "@/lib/api/client";
import { type Product } from "@/data/products";
import {
  Store,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Home,
  Shield,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Truck,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Inbox,
  Eye,
  LayoutDashboard,
  Settings,
  Bell,
  Cpu,
  Plus,
  Edit2,
  X,
  Check,
  Printer,
  FileText,
  MapPin,
  Phone,
  Mail,
  User,
  ChevronRight,
  Save,
  Globe,
  Building,
  CreditCard,
  PieChart,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/seller")({
  component: SellerHubView,
});

export function SellerHubView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "inventory" | "orders" | "earnings" | "settings">("dashboard");

  // Live seller data
  const [sellerStats, setSellerStats] = useState<SellerStatsResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrderRecord[]>([]);
  const [earnings, setEarnings] = useState<SellerEarningsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Inventory filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Orders filters
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  // Add / Edit Laptop Modal state (S2.2)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Packing Slip & Fulfillment Modal state (S3.1)
  const [selectedOrder, setSelectedOrder] = useState<SellerOrderRecord | null>(null);
  const [isPackingSlipOpen, setIsPackingSlipOpen] = useState(false);
  const [isFulfillmentUpdating, setIsFulfillmentUpdating] = useState(false);
  const [fulfillmentSuccessMsg, setFulfillmentSuccessMsg] = useState("");

  // Store Profile & Branding Form state (S4.1)
  const [profileForm, setProfileForm] = useState({
    storeName: "",
    storeBio: "",
    phone: "",
    address: "",
    firstName: "",
    lastName: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    badge: "",
    badgeColor: "cyan" as "cyan" | "purple" | "blue",
    category: "Gaming" as "Gaming" | "Ultrabook" | "Workstation",
    processor: "Intel i7" as any,
    price: "",
    priceUsd: "",
    stock: "15",
    cpu: "",
    ram: "16GB DDR5",
    gpu: "",
    display: "",
    batteryWeight: "",
    specialHighlight: "",
    img: "",
  });

  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser?.id) {
      loadSellerData(currentUser.id);
      setProfileForm({
        storeName: currentUser.storeName || "",
        storeBio: currentUser.storeBio || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
      });
    } else {
      setLoading(false);
    }
  }, []);

  const loadSellerData = async (sellerId: string) => {
    try {
      const [statsData, productsData, ordersData, earningsData] = await Promise.all([
        getSellerStats(sellerId),
        getSellerProducts(sellerId),
        getSellerOrders(sellerId),
        getSellerEarnings(sellerId),
      ]);
      setSellerStats(statsData);
      setProducts(productsData);
      setOrders(ordersData);
      setEarnings(earningsData);
    } catch (err) {
      console.error("Failed to load seller data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (user?.id) {
      setRefreshing(true);
      loadSellerData(user.id);
    }
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  // Open modal for Create
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      badge: "STORE EXCLUSIVE",
      badgeColor: "cyan",
      category: "Gaming",
      processor: "Intel i7",
      price: "",
      priceUsd: "",
      stock: "15",
      cpu: "",
      ram: "16GB DDR5",
      gpu: "",
      display: '16" QHD+ 165Hz IPS',
      batteryWeight: "80Wh · 2.10 kg",
      specialHighlight: "",
      img: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    });
    setModalError("");
    setModalSuccess("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || "",
      badge: prod.badge || "",
      badgeColor: (prod.badgeColor as any) || "cyan",
      category: (prod.category as any) || "Gaming",
      processor: (prod.processor as any) || "Intel i7",
      price: String(prod.price || ""),
      priceUsd: prod.priceUsd || "",
      stock: String(prod.stock !== undefined ? prod.stock : 15),
      cpu: prod.cpu || "",
      ram: prod.ram || "16GB DDR5",
      gpu: prod.gpu || "",
      display: prod.display || "",
      batteryWeight: prod.batteryWeight || "",
      specialHighlight: prod.specialHighlight || "",
      img: prod.img || "",
    });
    setModalError("");
    setModalSuccess("");
    setIsModalOpen(true);
  };

  // Quick Inline Stock increment / decrement
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);
  const handleQuickStockChange = async (productId: string, delta: number) => {
    setUpdatingStockId(productId);
    try {
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            const cur = typeof p.stock === "number" ? p.stock : 15;
            return { ...p, stock: Math.max(0, cur + delta) };
          }
          return p;
        })
      );
      await updateProductStock(productId, { delta });
    } catch (err) {
      console.error("Failed to update stock:", err);
      if (user?.id) loadSellerData(user.id);
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Submit product creation or update (S2.2)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!formData.name.trim()) {
      setModalError("Product model name is required.");
      return;
    }
    const numericPrice = parseFloat(formData.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setModalError("Please enter a valid price in LKR.");
      return;
    }

    const numericStock = parseInt(formData.stock, 10);
    const validStock = isNaN(numericStock) ? 15 : Math.max(0, numericStock);

    setIsSubmitting(true);
    setModalError("");
    setModalSuccess("");

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formData.name.trim(),
          badge: formData.badge.trim() || undefined,
          badgeColor: formData.badgeColor,
          category: formData.category,
          processor: formData.processor,
          price: numericPrice,
          priceUsd: formData.priceUsd.trim() || `$${Math.round(numericPrice / 300)}`,
          stock: validStock,
          cpu: formData.cpu.trim() || "High-Performance CPU",
          ram: formData.ram.trim(),
          gpu: formData.gpu.trim() || "Dedicated Graphics",
          display: formData.display.trim() || undefined,
          batteryWeight: formData.batteryWeight.trim() || undefined,
          specialHighlight: formData.specialHighlight.trim() || undefined,
          img: formData.img.trim() || undefined,
        });

        setModalSuccess("Listing specifications and stock updated successfully!");
      } else {
        await createProduct({
          name: formData.name.trim(),
          badge: formData.badge.trim() || undefined,
          badgeColor: formData.badgeColor,
          category: formData.category,
          processor: formData.processor,
          price: numericPrice,
          priceUsd: formData.priceUsd.trim() || `$${Math.round(numericPrice / 300)}`,
          stock: validStock,
          cpu: formData.cpu.trim() || "High-Performance CPU",
          ram: formData.ram.trim(),
          gpu: formData.gpu.trim() || "Dedicated Graphics",
          display: formData.display.trim() || undefined,
          batteryWeight: formData.batteryWeight.trim() || undefined,
          specialHighlight: formData.specialHighlight.trim() || undefined,
          img: formData.img.trim() || undefined,
          sellerId: user.id,
          submittedByRole: user.role,
        });

        setModalSuccess("Listing submitted for review! It is now PENDING APPROVAL by SELLORA administrators.");
      }

      await loadSellerData(user.id);
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1400);
    } catch (err: any) {
      console.error("Product submission failed:", err);
      setModalError(err.message || "Failed to submit product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update order status from Seller Hub (S3.1)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user?.id) return;
    setIsFulfillmentUpdating(true);
    setFulfillmentSuccessMsg("");

    try {
      const res = await updateSellerOrderFulfillment(orderId, {
        status: newStatus,
        sellerId: user.id,
        trackingNumber: `EXP-LK-${Math.floor(100000 + Math.random() * 900000)}`,
      });

      if (res.success) {
        setFulfillmentSuccessMsg(`Order updated to ${newStatus}!`);
        // Refresh orders and stats
        await loadSellerData(user.id);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsFulfillmentUpdating(false);
    }
  };

  // Save Storefront Profile & Branding Settings (S4.1)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!profileForm.storeName.trim()) {
      setProfileError("Store name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const res = await updateSellerProfile(user.id, {
        storeName: profileForm.storeName.trim(),
        storeBio: profileForm.storeBio.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        firstName: profileForm.firstName.trim() || undefined,
        lastName: profileForm.lastName.trim() || undefined,
      });

      if (res.success && res.user) {
        // Update user in local storage so all components immediately reflect new store branding
        const updatedSession: UserSession = {
          ...user,
          storeName: res.user.storeName,
          storeBio: res.user.storeBio,
          phone: res.user.phone,
          address: res.user.address,
          firstName: res.user.firstName,
          lastName: res.user.lastName,
        };
        setCurrentUser(updatedSession);
        setUser(updatedSession);
        setProfileSuccess("Storefront profile and dispatch settings updated successfully!");
        // Refresh metrics
        await loadSellerData(user.id);
      } else {
        setProfileError(res.error || "Failed to update store settings.");
      }
    } catch (err: any) {
      console.error("Failed to save store profile:", err);
      setProfileError(err.message || "Failed to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePrintPackingSlip = () => {
    window.print();
  };

  if (!mounted) {
    return null;
  }

  // Route Guard: Ensure user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-between">
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Sellora" className="h-8 w-auto object-contain" />
            <span className="font-display font-black tracking-widest text-base">SELLORA</span>
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-white flex items-center gap-1.5">
            <Home className="h-4 w-4" /> Storefront
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full bg-card/70 border border-white/10 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Store className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Seller Portal Access</h2>
            <p className="text-sm text-muted-foreground mb-6">
              You must be signed in with a registered Seller account to access the Vendor Hub.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-display text-xs font-bold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:opacity-95 transition-all text-center"
              >
                Sign In as Seller
              </Link>
              <Link
                to="/seller-register"
                className="w-full py-2.5 bg-neon-purple/20 border border-neon-purple/40 text-xs text-neon-purple hover:bg-neon-purple/30 rounded-xl transition-colors text-center font-bold"
              >
                Create Seller Account
              </Link>
              <Link
                to="/"
                className="w-full py-2.5 border border-white/10 text-xs text-muted-foreground hover:text-white rounded-xl transition-colors text-center"
              >
                Return to Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPending = user.sellerStatus === "PENDING";
  const isSuspended = user.sellerStatus === "SUSPENDED";

  // Sidebar navigation items
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Package, badge: products.length },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: orders.length },
    { id: "earnings", label: "Earnings & Payouts", icon: DollarSign },
    { id: "settings", label: "Store Settings", icon: Settings },
  ];

  // Filtered inventory
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      searchQuery === "" ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.cpu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.gpu.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || prod.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || prod.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Filtered orders
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      orderSearchQuery === "" ||
      ord.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      ord.sellerItems.some((it) => it.product?.name?.toLowerCase().includes(orderSearchQuery.toLowerCase()));
    const matchesStatus = orderStatusFilter === "all" || ord.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const sellerInitials = user.storeName
    ? user.storeName.slice(0, 2).toUpperCase()
    : (user.firstName?.[0] || "S").toUpperCase();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col font-sans selection:bg-neon-cyan/30">
      {/* Top Application Bar matching Admin Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-md">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Sellora"
            className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] transition-transform group-hover:scale-105"
          />
          <span className="font-display font-black tracking-widest text-base hidden sm:inline">
            SELLORA SELLER HUB
          </span>
        </Link>

        {/* Global Hub Search Bar */}
        <div className="flex-1 max-w-lg mx-6 relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-neon-cyan transition-colors" />
          <input
            type="text"
            placeholder="Search store inventory, orders, customer specs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-xs focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
          />
        </div>

        {/* Right Header Navigation & Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh Store Telemetry"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-neon-cyan" : ""}`} />
          </button>

          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          >
            <Home className="h-3.5 w-3.5" /> Storefront
          </Link>

          {user.role === "admin" && (
            <Link
              to="/admin"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Shield className="h-3.5 w-3.5" /> Admin Panel
            </Link>
          )}

          <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-neon-cyan to-neon-purple p-[2px] shadow-[0_0_10px_rgba(0,242,254,0.5)]">
              <div className="h-full w-full bg-[#0B0F19] rounded-full flex items-center justify-center text-xs font-bold font-mono text-neon-cyan">
                {sellerInitials}
              </div>
            </div>

            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">
                {user.storeName || user.firstName || "Merchant"}
              </div>
              <div className="text-[10px] text-neon-cyan font-mono leading-tight">
                {user.sellerStatus === "APPROVED" ? "Verified Partner" : user.sellerStatus}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Log Out of Seller Hub"
              className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Work Area: Left Sidebar + Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left-Side Selection Menu (Identical layout to Admin Side) */}
        <aside className="w-56 border-r border-white/10 bg-[#0B0F19] flex flex-col shrink-0 py-4 z-40 relative shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
          {/* Store Quick Badge */}
          <div className="px-4 pb-3 mb-2 border-b border-white/5">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Store Entity</div>
            <div className="text-xs font-bold text-white truncate mt-0.5">
              {user.storeName || "My Store"}
            </div>
            <div className="mt-1">
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold inline-block ${
                  user.sellerStatus === "APPROVED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : user.sellerStatus === "SUSPENDED"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                {user.sellerStatus === "APPROVED" ? "Verified Merchant" : user.sellerStatus || "PENDING"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 px-3 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 shadow-[inset_3px_0_0_rgba(0,242,254,1)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "animate-pulse" : ""}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-neon-cyan/30 text-neon-cyan" : "bg-white/10 text-muted-foreground"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer info */}
          <div className="px-4 pt-3 border-t border-white/5 text-[10px] font-mono text-muted-foreground">
            <div>SELLORA Merchant Engine</div>
            <div className="text-white/40 mt-0.5">SLA: 24h Express Dispatch</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative scroll-smooth">
          <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-up">
            {/* Status alerts */}
            {isPending && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
                  <span>Vendor Account Under Review</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your store credentials are being audited by operations. You can browse metrics and catalog layouts, but direct customer order fulfillment actions are locked.
                </p>
              </div>
            )}

            {isSuspended && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>Store Suspended</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your seller privileges have been paused by platform administrators. Contact support to resolve compliance issues.
                </p>
              </div>
            )}

            {/* TAB 1: DASHBOARD (S1.1) */}
            {activeTab === "dashboard" && (
              <div className="space-y-8 animate-fade-up">
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                      <span>{user.storeName || "Vendor"} Operating Center</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Real-time store gross sales, dispatch queue, and machine inventory metrics.
                    </p>
                  </div>

                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-muted-foreground hover:text-white flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-neon-cyan" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* 4 Main KPI Cards matching Admin Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Gross Revenue */}
                  <div className="rounded-2xl bg-gradient-to-br from-neon-cyan/10 via-white/[0.02] to-transparent border border-neon-cyan/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(0,242,254,0.1)]">
                    <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-neon-cyan">
                      <TrendingUp className="h-24 w-24 -mr-6 -mt-6" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Gross Store Sales</p>
                      <h3 className="text-3xl font-display font-black text-white mt-1.5">
                        LKR {((sellerStats?.stats.totalGrossRevenue || 0)).toLocaleString()}
                      </h3>
                      <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-neon-cyan bg-neon-cyan/15 w-fit px-2.5 py-1 rounded-full border border-neon-cyan/30">
                        <CheckCircle2 className="h-3 w-3" /> Catalog Sales Revenue
                      </div>
                    </div>
                  </div>

                  {/* Units Dispatched */}
                  <div className="rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/[0.02] to-transparent border border-neon-purple/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(123,44,191,0.1)]">
                    <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-neon-purple">
                      <ShoppingBag className="h-24 w-24 -mr-6 -mt-6" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Units Sold</p>
                      <h3 className="text-3xl font-display font-black text-white mt-1.5">
                        {sellerStats?.stats.totalUnitsSold || 0}
                      </h3>
                      <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-neon-purple bg-neon-purple/15 w-fit px-2.5 py-1 rounded-full border border-neon-purple/30">
                        <Package className="h-3 w-3" /> Hardware Rigs
                      </div>
                    </div>
                  </div>

                  {/* Pending Fulfillment */}
                  <div
                    onClick={() => setActiveTab("orders")}
                    className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-500/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.1)] cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-amber-400">
                      <Truck className="h-24 w-24 -mr-6 -mt-6" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Pending Orders</p>
                      <h3 className="text-3xl font-display font-black text-white mt-1.5">
                        {sellerStats?.stats.pendingFulfillments || 0}
                      </h3>
                      <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-amber-400 bg-amber-500/15 w-fit px-2.5 py-1 rounded-full border border-amber-500/30">
                        <Clock className="h-3 w-3" /> Requires Dispatch
                      </div>
                    </div>
                  </div>

                  {/* Active Inventory */}
                  <div
                    onClick={() => setActiveTab("inventory")}
                    className="rounded-2xl bg-gradient-to-br from-blue-500/10 via-white/[0.02] to-transparent border border-blue-500/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.1)] cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-blue-400">
                      <Layers className="h-24 w-24 -mr-6 -mt-6" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Assigned Catalog</p>
                      <h3 className="text-3xl font-display font-black text-white mt-1.5">
                        {products.length}
                      </h3>
                      <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-blue-400 bg-blue-500/15 w-fit px-2.5 py-1 rounded-full border border-blue-500/30">
                        <CheckCircle2 className="h-3 w-3" /> Live Laptop Fleet
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Row: Store Identity + Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Store Profile Card */}
                  <div className="lg:col-span-1 rounded-2xl bg-white/[0.02] border border-white/10 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-sm tracking-wide uppercase text-white flex items-center gap-2">
                        <Store className="h-4 w-4 text-neon-cyan" /> Store Identity
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-muted-foreground">
                        ID: {user.id.slice(0, 8)}...
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-muted-foreground">Store Name</span>
                        <span className="font-semibold text-white">{user.storeName || "Unassigned"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-muted-foreground">Merchant Email</span>
                        <span className="font-mono text-white">{user.email}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-muted-foreground">Vendor Hotline</span>
                        <span className="text-white">{user.phone || "Not set"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-muted-foreground">Warehouse / Dispatch</span>
                        <span className="text-white text-right max-w-[180px] truncate">{user.address || "Sri Lanka Hub"}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">Catalog Health</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 100% Operational
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab("inventory")}
                        className="w-full py-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 hover:bg-neon-cyan/20 text-xs font-bold text-neon-cyan transition-all flex items-center justify-center gap-2"
                      >
                        <span>Manage Store Catalog</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Recent Customer Orders Feed */}
                  <div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-display font-bold text-sm tracking-wide uppercase text-white flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-neon-purple" /> Recent Orders From Your Catalog
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Real-time orders for laptops listed under your store identity.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-xs text-neon-cyan hover:underline flex items-center gap-1 font-mono"
                      >
                        View All Pipeline <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                    {orders && orders.length > 0 ? (
                      <div className="space-y-3">
                        {orders.slice(0, 4).map((ord) => (
                          <div
                            key={ord.id}
                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-neon-purple shrink-0 mt-0.5">
                                <ShoppingBag className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-neon-cyan">{ord.orderNumber}</span>
                                  <span
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                                      ord.status === "DELIVERED"
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        : ord.status === "SHIPPED"
                                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                        : ord.status === "PROCESSING"
                                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    }`}
                                  >
                                    {ord.status}
                                  </span>
                                </div>
                                <div className="text-xs text-white font-medium mt-1">
                                  Customer: {ord.customerName}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {ord.sellerItems.map((it: any) => `${it.product?.name || "Hardware"} (x${it.quantity})`).join(", ")}
                                </div>
                              </div>
                            </div>

                            <div className="text-right sm:shrink-0 flex items-center gap-3">
                              <div>
                                <div className="text-sm font-display font-bold text-white">
                                  LKR {ord.sellerSubtotal.toLocaleString()}
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                  {new Date(ord.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setIsPackingSlipOpen(true);
                                }}
                                className="p-2 rounded-lg bg-white/5 hover:bg-neon-cyan/20 text-white hover:text-neon-cyan border border-white/10 transition-all"
                                title="Open Dispatch Details & Packing Slip"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
                        <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-muted-foreground">
                          No customer orders have been placed for your store products yet.
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">
                          As soon as buyers purchase your laptops, dispatch requests will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INVENTORY (S2.1 & S2.2) */}
            {activeTab === "inventory" && (
              <div className="space-y-6 animate-fade-up">
                {/* Inventory Top Title & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                      <span>Store Laptop Fleet</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan font-mono border border-neon-cyan/40">
                        {filteredProducts.length} Machines
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manage specs, stock status, and submit new laptop models for admin marketplace approval.
                    </p>
                  </div>

                  {/* Add Laptop Button (S2.2) */}
                  <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2.5 rounded-xl bg-neon-cyan text-black text-xs font-display font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(0,242,254,0.4)] hover:shadow-[0_0_25px_rgba(0,242,254,0.7)] transition-all flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Laptop</span>
                  </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search laptops by name, CPU, GPU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">Category:</span>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                      >
                        <option value="all">All Categories</option>
                        <option value="Gaming">Gaming</option>
                        <option value="Ultrabook">Ultrabook</option>
                        <option value="Workstation">Workstation</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground font-mono">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                      >
                        <option value="all">All Statuses</option>
                        <option value="APPROVED">Live (Approved)</option>
                        <option value="PENDING_APPROVAL">Pending Review</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Inventory Table */}
                {filteredProducts.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02] shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                            <th className="py-3.5 px-4">Laptop Specification</th>
                            <th className="py-3.5 px-4">Category</th>
                            <th className="py-3.5 px-4">Core Hardware</th>
                            <th className="py-3.5 px-4">Unit Price</th>
                            <th className="py-3.5 px-4">Stock Units</th>
                            <th className="py-3.5 px-4">Listing Status</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs">
                          {filteredProducts.map((prod) => (
                            <tr key={prod.id} className="hover:bg-white/5 transition-colors group">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={prod.img}
                                    alt={prod.name}
                                    className="h-12 w-14 rounded-lg object-cover border border-white/10 shrink-0 bg-black/40"
                                  />
                                  <div>
                                    <div className="font-display font-bold text-white group-hover:text-neon-cyan transition-colors">
                                      {prod.name}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                                      <span>ID: {prod.id}</span>
                                      {prod.badge && (
                                        <span className="px-1.5 py-0.2 rounded bg-neon-purple/20 text-neon-purple text-[9px] uppercase font-bold">
                                          {prod.badge}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-white/5 border border-white/10 text-white">
                                  {prod.category}
                                </span>
                              </td>

                              <td className="py-4 px-4">
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-white">{prod.cpu}</div>
                                  <div className="text-[11px] text-muted-foreground font-mono">
                                    {prod.gpu} &bull; {prod.ram}
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <div className="font-display font-bold text-white text-sm">
                                  LKR {prod.price.toLocaleString()}
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground">
                                  {prod.priceUsd || `$${Math.round(prod.price / 300)}`}
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider inline-flex items-center gap-1 ${
                                        (prod.stock ?? 15) > 5
                                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                          : (prod.stock ?? 15) > 0
                                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                          : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                      }`}
                                    >
                                      {(prod.stock ?? 15) > 5 ? (
                                        <>
                                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                          <span>{prod.stock ?? 15} Available</span>
                                        </>
                                      ) : (prod.stock ?? 15) > 0 ? (
                                        <>
                                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                          <span>{prod.stock ?? 15} Low Stock</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                          <span>Out of Stock</span>
                                        </>
                                      )}
                                    </span>
                                  </div>

                                  {/* Inline Quick +/- Adjusters */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={updatingStockId === prod.id || (prod.stock ?? 15) <= 0}
                                      onClick={() => handleQuickStockChange(prod.id, -1)}
                                      className="h-6 w-6 rounded bg-white/5 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-300 border border-white/10 flex items-center justify-center font-mono text-xs transition-colors disabled:opacity-40 cursor-pointer"
                                      title="Decrease stock by 1"
                                    >
                                      -
                                    </button>
                                    <span className="font-mono font-bold text-xs text-white min-w-[22px] text-center">
                                      {prod.stock ?? 15}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={updatingStockId === prod.id}
                                      onClick={() => handleQuickStockChange(prod.id, 1)}
                                      className="h-6 w-6 rounded bg-white/5 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-300 border border-white/10 flex items-center justify-center font-mono text-xs transition-colors disabled:opacity-40 cursor-pointer"
                                      title="Increase stock by 1"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                    prod.status === "APPROVED"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : prod.status === "REJECTED"
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      prod.status === "APPROVED"
                                        ? "bg-emerald-400"
                                        : prod.status === "REJECTED"
                                        ? "bg-rose-400"
                                        : "bg-amber-400 animate-pulse"
                                    }`}
                                  />
                                  {prod.status === "APPROVED"
                                    ? "Live in Store"
                                    : prod.status === "PENDING_APPROVAL"
                                    ? "Pending Admin Review"
                                    : prod.status || "Pending"}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenEditModal(prod)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-neon-purple/20 text-white hover:text-neon-purple border border-white/10 transition-all"
                                    title="Edit Specs & Pricing"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <Link
                                    to="/product/$productId"
                                    params={{ productId: prod.id }}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-neon-cyan/20 text-white hover:text-neon-cyan border border-white/10 transition-all"
                                    title="View Live Product Page"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h4 className="font-display font-bold text-white text-base">No Products Found</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                        ? "Try adjusting your search query or filter settings to locate machines."
                        : "Your store has no laptop listings assigned yet."}
                    </p>
                    <button
                      onClick={handleOpenAddModal}
                      className="mt-4 px-4 py-2 rounded-xl bg-neon-cyan text-black text-xs font-bold font-display uppercase tracking-wider inline-flex items-center gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Your First Machine
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ORDERS & FULFILLMENT PIPELINE (S3.1) */}
            {activeTab === "orders" && (
              <div className="space-y-6 animate-fade-up">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                      <span>Vendor Fulfillment Pipeline</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple font-mono border border-neon-purple/40">
                        {filteredOrders.length} Orders
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Direct fulfillment pipeline for customer orders containing machines from your store catalog.
                    </p>
                  </div>
                </div>

                {/* Filter and Search Bar for Orders */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by order number, customer name, or laptop model..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-mono">Fulfillment Status:</span>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                    >
                      <option value="all">All Orders</option>
                      <option value="PENDING">Pending (New)</option>
                      <option value="PROCESSING">Processing (Packing)</option>
                      <option value="SHIPPED">Shipped (Dispatched)</option>
                      <option value="DELIVERED">Delivered (Completed)</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all space-y-4"
                      >
                        {/* Top Order Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono font-bold text-base text-neon-cyan">{ord.orderNumber}</span>
                            <span
                              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                                ord.status === "DELIVERED"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : ord.status === "SHIPPED"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : ord.status === "PROCESSING"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : ord.status === "CANCELLED"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {ord.status}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              Ordered on {new Date(ord.createdAt).toLocaleDateString()} at{" "}
                              {new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          {/* Quick Fulfillment Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            {ord.status === "PENDING" && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, "PROCESSING")}
                                disabled={isFulfillmentUpdating}
                                className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                              >
                                <Package className="h-3.5 w-3.5" />
                                <span>Mark Packed &amp; Processing</span>
                              </button>
                            )}
                            {ord.status === "PROCESSING" && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, "SHIPPED")}
                                disabled={isFulfillmentUpdating}
                                className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                              >
                                <Truck className="h-3.5 w-3.5" />
                                <span>Dispatch / Mark Shipped</span>
                              </button>
                            )}
                            {ord.status === "SHIPPED" && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, "DELIVERED")}
                                disabled={isFulfillmentUpdating}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Mark Delivered</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedOrder(ord);
                                setIsPackingSlipOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
                            >
                              <Printer className="h-3.5 w-3.5 text-neon-cyan" />
                              <span>Packing Slip</span>
                            </button>
                          </div>
                        </div>

                        {/* Middle Order Content: Items & Destination */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Products in this order */}
                          <div className="lg:col-span-2 space-y-2">
                            <div className="text-[10px] font-mono uppercase text-muted-foreground">
                              Assigned Hardware Units
                            </div>
                            <div className="space-y-2">
                              {ord.sellerItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-4"
                                >
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={item.product?.img}
                                      alt={item.product?.name}
                                      className="h-10 w-12 rounded-lg object-cover border border-white/10 shrink-0"
                                    />
                                    <div>
                                      <div className="text-xs font-bold text-white">
                                        {item.product?.name || "Hardware Machine"}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground font-mono">
                                        {item.product?.cpu} &bull; {item.product?.gpu}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-xs font-display font-bold text-white">
                                      LKR {(item.price * item.quantity).toLocaleString()}
                                    </div>
                                    <div className="text-[10px] font-mono text-muted-foreground">
                                      Qty: {item.quantity} &times; LKR {item.price.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Customer & Destination */}
                          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                            <div className="text-[10px] font-mono uppercase text-muted-foreground">
                              Delivery Destination
                            </div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-neon-cyan" />
                              <span>{ord.customerName}</span>
                            </div>
                            <div className="text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-neon-purple" />
                              <span className="font-mono">{ord.customerEmail}</span>
                            </div>
                            {ord.customerPhone && (
                              <div className="text-muted-foreground flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                                <span>{ord.customerPhone}</span>
                              </div>
                            )}
                            <div className="text-muted-foreground flex items-start gap-1.5 pt-1 border-t border-white/5">
                              <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>
                                {ord.shippingAddress}
                                {ord.city ? `, ${ord.city}` : ""}
                                {ord.zipCode ? ` (${ord.zipCode})` : ""}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                              <span className="text-muted-foreground font-mono uppercase text-[10px]">Your Store Payout:</span>
                              <span className="font-display font-bold text-neon-cyan text-sm">
                                LKR {ord.sellerSubtotal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h4 className="font-display font-bold text-white text-base">No Customer Orders Found</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {orderSearchQuery || orderStatusFilter !== "all"
                        ? "Try adjusting your order search keyword or status filter."
                        : "Orders containing your store's laptop listings will appear here for fulfillment."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: STORE SETTINGS (S4.1) */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <span>Storefront Profile &amp; Branding Settings</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage your store brand name, hardware bio specialization, partner hotline, and dispatch origin address.
                  </p>
                </div>

                {/* Notifications */}
                {profileError && (
                  <div className="max-w-2xl p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{profileError}</span>
                  </div>
                )}

                {profileSuccess && (
                  <div className="max-w-2xl p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
                  {/* Left Form: Edit Parameters */}
                  <form onSubmit={handleSaveProfile} className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/10 p-6 space-y-5 text-xs">
                    {/* Store Title */}
                    <div>
                      <label className="text-muted-foreground font-mono uppercase text-[10px] block mb-1.5 font-bold">
                        Public Storefront Name *
                      </label>
                      <div className="relative">
                        <Building className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Apex Workstation Labs"
                          value={profileForm.storeName}
                          onChange={(e) => setProfileForm({ ...profileForm, storeName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white font-medium focus:outline-none focus:border-neon-cyan transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Displays on the storefront as "Sold &amp; Dispatched by {profileForm.storeName || "Your Store"}".
                      </p>
                    </div>

                    {/* Bio / Hardware Specialization */}
                    <div>
                      <label className="text-muted-foreground font-mono uppercase text-[10px] block mb-1.5 font-bold">
                        Store Bio &amp; Hardware Specialization
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Authorized high-end workstation integrator specializing in CAD, AI vision models, and color-accurate displays."
                        value={profileForm.storeBio}
                        onChange={(e) => setProfileForm({ ...profileForm, storeBio: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors resize-none leading-relaxed"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Shown to customers when viewing your product listing cards and merchant badge.
                      </p>
                    </div>

                    {/* Contact & Warehouse Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-muted-foreground font-mono uppercase text-[10px] block mb-1.5 font-bold">
                          Merchant Support Hotline
                        </label>
                        <div className="relative">
                          <Phone className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="+94 77 123 4567"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-muted-foreground font-mono uppercase text-[10px] block mb-1.5 font-bold">
                          Dispatch Origin Warehouse
                        </label>
                        <div className="relative">
                          <MapPin className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Colombo 03 Hub, Sri Lanka"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Merchant Representative Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <div>
                        <label className="text-muted-foreground font-mono uppercase text-[10px] block mb-1.5 font-bold">
                          Primary Representative First Name
                        </label>
                        <input
                          type="text"
                          placeholder="First Name"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-muted-foreground font-mono uppercase text-[10px] block mb-1.5 font-bold">
                          Primary Representative Last Name
                        </label>
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3 border-t border-white/10 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-6 py-2.5 rounded-xl bg-neon-cyan text-black font-display font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_25px_rgba(0,242,254,0.7)] transition-all flex items-center gap-2"
                      >
                        {isSavingProfile ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>Save Storefront Settings</span>
                      </button>
                    </div>
                  </form>

                  {/* Right Preview: Live Customer-Facing Card Preview */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono uppercase text-muted-foreground font-bold flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-neon-purple" />
                      <span>Live Customer-Facing Badge Preview</span>
                    </div>

                    <div className="rounded-2xl bg-white/[0.04] border border-white/15 p-5 space-y-3 relative overflow-hidden backdrop-blur-xl">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan font-bold font-mono">
                          {profileForm.storeName ? profileForm.storeName.slice(0, 2).toUpperCase() : "ST"}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{profileForm.storeName || "Your Store"}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          </div>
                          <div className="text-[10px] text-neon-cyan font-mono">
                            Verified SELLORA Merchant Partner
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed italic border-t border-white/5 pt-2">
                        "{profileForm.storeBio || "High-performance computing authorized merchant."}"
                      </p>

                      <div className="border-t border-white/5 pt-2 space-y-1 text-[11px] text-muted-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-emerald-400" />
                          <span>Hotline: {profileForm.phone || "Verified on file"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-amber-400" />
                          <span>Dispatch: {profileForm.address || "Sri Lanka Hub"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: EARNINGS & PAYOUT LEDGER (S5.1) */}
            {activeTab === "earnings" && (
              <div className="space-y-8 animate-fade-up">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                      <span>Vendor Earnings &amp; Payout Ledger</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gross store sales, marketplace commission deductions, cleared bank payouts, and escrow ledger.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                      Commission Rate: <strong className="text-neon-cyan">{earnings?.platformFeePercent || 5}%</strong>
                    </span>
                  </div>
                </div>

                {/* 4 Financial KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Gross Revenue */}
                  <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent border border-white/10 p-6 relative overflow-hidden">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Gross Catalog Sales</p>
                    <h3 className="text-2xl sm:text-3xl font-display font-black text-white mt-1.5">
                      LKR {(earnings?.grossRevenue || 0).toLocaleString()}
                    </h3>
                    <div className="mt-3 text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                      <span>Customer-paid machine volume</span>
                    </div>
                  </div>

                  {/* Platform Commission */}
                  <div className="rounded-2xl bg-gradient-to-br from-rose-500/10 via-white/[0.02] to-transparent border border-rose-500/30 p-6 relative overflow-hidden">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Platform Fee (5%)</p>
                    <h3 className="text-2xl sm:text-3xl font-display font-black text-rose-300 mt-1.5">
                      - LKR {(earnings?.totalPlatformFee || 0).toLocaleString()}
                    </h3>
                    <div className="mt-3 text-[11px] font-mono text-rose-400 flex items-center gap-1">
                      <PieChart className="h-3 w-3" />
                      <span>SELLORA network fee</span>
                    </div>
                  </div>

                  {/* Escrow Pending Payout */}
                  <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-500/30 p-6 relative overflow-hidden">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">In Escrow / In Transit</p>
                    <h3 className="text-2xl sm:text-3xl font-display font-black text-amber-300 mt-1.5">
                      LKR {(earnings?.pendingPayout || 0).toLocaleString()}
                    </h3>
                    <div className="mt-3 text-[11px] font-mono text-amber-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Releases upon delivery</span>
                    </div>
                  </div>

                  {/* Cleared Net Payout */}
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent border border-emerald-500/40 p-6 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Cleared Net Earnings</p>
                    <h3 className="text-2xl sm:text-3xl font-display font-black text-emerald-300 mt-1.5">
                      LKR {(earnings?.completedPayout || 0).toLocaleString()}
                    </h3>
                    <div className="mt-3 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Ready for withdrawal</span>
                    </div>
                  </div>
                </div>

                {/* Settlement Ledger Table */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl">
                  <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-neon-cyan" /> Itemized Payout Transaction Ledger
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Item-by-item financial breakdown with commission deductions and clearing status.
                      </p>
                    </div>

                    <div className="text-xs font-mono text-muted-foreground">
                      Total Transactions: <strong className="text-white">{earnings?.transactions?.length || 0}</strong>
                    </div>
                  </div>

                  {earnings?.transactions && earnings.transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                            <th className="py-3 px-4">Order Ref</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Laptop Model</th>
                            <th className="py-3 px-4 text-right">Gross Price</th>
                            <th className="py-3 px-4 text-right">Fee (5%)</th>
                            <th className="py-3 px-4 text-right">Net Payout</th>
                            <th className="py-3 px-4 text-center">Settlement Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {earnings.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-neon-cyan">
                                {tx.orderNumber}
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground font-mono">
                                {new Date(tx.date).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-white">
                                {tx.productName} <span className="text-muted-foreground font-mono text-[11px]">(x{tx.quantity})</span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono text-white">
                                LKR {tx.grossAmount.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono text-rose-300">
                                - LKR {tx.platformFee.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                                LKR {tx.netPayout.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase inline-flex items-center gap-1 ${
                                    tx.status === "CLEARED"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  }`}
                                >
                                  {tx.status === "CLEARED" ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3" /> Cleared
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3" /> In Escrow
                                    </>
                                  )}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                      <p className="text-xs text-muted-foreground">
                        No financial settlements recorded yet. Once customers order your laptops, payout lines will generate automatically.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* S3.1 PRINTABLE SELLER PACKING SLIP MODAL */}
      {isPackingSlipOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in print:p-0 print:bg-white print:text-black">
          <div className="bg-[#0D121F] print:bg-white print:text-black border border-white/15 print:border-none rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
            {/* Modal Actions Bar (hidden when printed) */}
            <div className="flex items-center justify-between border-b border-white/10 print:hidden pb-4 mb-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-neon-cyan" />
                <h3 className="text-base font-display font-bold text-white">
                  Seller Dispatch Slip &bull; {selectedOrder.orderNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPackingSlip}
                  className="px-3.5 py-1.5 rounded-xl bg-neon-cyan text-black text-xs font-bold font-mono flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(0,242,254,0.4)] transition-all"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setIsPackingSlipOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Slip Content */}
            <div className="space-y-6 text-xs text-white print:text-black">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/10 print:border-black/20 pb-4">
                <div>
                  <h2 className="text-xl font-display font-black tracking-widest text-neon-cyan print:text-black">
                    SELLORA DISPATCH
                  </h2>
                  <p className="text-[11px] text-muted-foreground print:text-gray-600">
                    Multi-Vendor Hardware Logistics &amp; Fulfillment
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-white print:text-black">
                    {selectedOrder.orderNumber}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground print:text-gray-600">
                    Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Sender & Receiver grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 print:bg-gray-100 border border-white/10 print:border-gray-300">
                <div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground print:text-gray-500 font-bold mb-1">
                    Dispatched By (Vendor):
                  </div>
                  <div className="font-bold text-sm text-white print:text-black">{user.storeName || "Vendor"}</div>
                  <div className="text-muted-foreground print:text-gray-700">{user.email}</div>
                  <div className="text-muted-foreground print:text-gray-700">{user.phone || "hotline: verified"}</div>
                  <div className="text-muted-foreground print:text-gray-700">{user.address || "Warehouse Colombo"}</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground print:text-gray-500 font-bold mb-1">
                    Deliver To (Customer):
                  </div>
                  <div className="font-bold text-sm text-white print:text-black">{selectedOrder.customerName}</div>
                  <div className="text-muted-foreground print:text-gray-700">{selectedOrder.customerEmail}</div>
                  {selectedOrder.customerPhone && (
                    <div className="text-muted-foreground print:text-gray-700">{selectedOrder.customerPhone}</div>
                  )}
                  <div className="text-muted-foreground print:text-gray-700">
                    {selectedOrder.shippingAddress}
                    {selectedOrder.city ? `, ${selectedOrder.city}` : ""}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="text-[10px] font-mono uppercase text-muted-foreground print:text-gray-500 font-bold mb-2">
                  Store Items in Package:
                </div>
                <table className="w-full text-left border-collapse border border-white/10 print:border-gray-300">
                  <thead>
                    <tr className="bg-white/5 print:bg-gray-200 border-b border-white/10 print:border-gray-300 text-[10px] font-mono uppercase">
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 print:divide-gray-300">
                    {selectedOrder.sellerItems.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5">
                          <div className="font-bold">{it.product?.name || "Machine Unit"}</div>
                          <div className="text-[10px] text-muted-foreground print:text-gray-600 font-mono">
                            {it.product?.cpu} &bull; {it.product?.gpu} &bull; {it.product?.ram}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono">LKR {it.price.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          LKR {(it.price * it.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-white/10 print:border-black font-bold">
                      <td colSpan={3} className="p-2.5 text-right uppercase font-mono text-[11px]">
                        Store Total:
                      </td>
                      <td className="p-2.5 text-right font-mono text-neon-cyan print:text-black text-sm">
                        LKR {selectedOrder.sellerSubtotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer SLA */}
              <div className="border-t border-white/10 print:border-gray-300 pt-4 flex justify-between items-center text-[10px] font-mono text-muted-foreground print:text-gray-600">
                <div>SELLORA 24h Express Fulfillment SLA &bull; Verified Security Tamper Seal</div>
                <div>Authorized Courier: PromptX / Domex LK</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* S2.2 ADD / EDIT LAPTOP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D121F] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">
                    {editingProduct ? `Edit ${editingProduct.name}` : "Submit New Laptop Listing"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {editingProduct
                      ? "Update hardware specs, pricing, and display info."
                      : "New listings are submitted as PENDING APPROVAL for administrator review."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications */}
            {modalError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {/* Product Form */}
            <form onSubmit={handleSubmitProduct} className="space-y-5 text-xs">
              {/* Product Model Name */}
              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                  Laptop Model Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ASUS ROG Strix SCAR 18"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-neon-cyan"
                  >
                    <option value="Gaming">Gaming</option>
                    <option value="Ultrabook">Ultrabook</option>
                    <option value="Workstation">Workstation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                    Processor Tier
                  </label>
                  <select
                    value={formData.processor}
                    onChange={(e) => setFormData({ ...formData, processor: e.target.value as any })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-neon-cyan"
                  >
                    <option value="Intel i9">Intel i9</option>
                    <option value="Intel i7">Intel i7</option>
                    <option value="Intel i5">Intel i5</option>
                    <option value="AMD Ryzen 9">AMD Ryzen 9</option>
                    <option value="AMD Ryzen 7">AMD Ryzen 7</option>
                    <option value="AMD Ryzen 5">AMD Ryzen 5</option>
                    <option value="Apple M Max">Apple M Max</option>
                  </select>
                </div>
              </div>

              {/* Price, USD & Stock Units */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                    Unit Price (LKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="e.g. 520000"
                    value={formData.price}
                    onChange={(e) => {
                      const lkr = e.target.value;
                      const usd = lkr ? `$${Math.round(Number(lkr) / 300).toLocaleString()}` : "";
                      setFormData({ ...formData, price: lkr, priceUsd: usd });
                    }}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                    Approx USD Equivalent
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $1,733"
                    value={formData.priceUsd}
                    onChange={(e) => setFormData({ ...formData, priceUsd: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                    Stock (Units Available) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 15"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>
              </div>

              {/* Hardware: CPU, GPU, RAM */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                    CPU Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Core i9-14900HX"
                    value={formData.cpu}
                    onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                    GPU Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RTX 4080 12GB"
                    value={formData.gpu}
                    onChange={(e) => setFormData({ ...formData, gpu: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                    Memory (RAM)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 32GB DDR5 5600MHz"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>
              </div>

              {/* Display & Battery / Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                    Display Specification
                  </label>
                  <input
                    type="text"
                    placeholder='e.g. 16" QHD+ Mini LED 240Hz'
                    value={formData.display}
                    onChange={(e) => setFormData({ ...formData, display: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                    Battery & Weight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 90Wh · 2.45 kg"
                    value={formData.batteryWeight}
                    onChange={(e) => setFormData({ ...formData, batteryWeight: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>
              </div>

              {/* Special Highlight */}
              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                  Marketing Headline / Special Feature
                </label>
                <input
                  type="text"
                  placeholder="e.g. Liquid Metal Cooling + 100% DCI-P3 Color Accuracy"
                  value={formData.specialHighlight}
                  onChange={(e) => setFormData({ ...formData, specialHighlight: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>

              {/* Product Image URL */}
              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5">
                  Product Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.img}
                    onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-muted-foreground focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                  {formData.img && (
                    <img
                      src={formData.img}
                      alt="Preview"
                      className="h-10 w-12 rounded-lg object-cover border border-white/10"
                    />
                  )}
                </div>
              </div>

              {/* Information Alert */}
              <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/20 text-muted-foreground text-[11px] leading-relaxed">
                <span className="text-neon-cyan font-bold">Admin Governance:</span> Once submitted by a seller, this machine will be tagged with <span className="font-mono text-amber-300">PENDING_APPROVAL</span>. Administrators can review the listing in <span className="text-white">Admin &gt; Inventory</span> and click <span className="text-emerald-400 font-semibold">Approve</span> to release it to the public marketplace.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-neon-cyan text-black font-display font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_25px_rgba(0,242,254,0.7)] transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{editingProduct ? "Save Changes" : "Submit Listing"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
