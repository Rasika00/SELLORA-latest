import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { products } from "@/data/products";
import { getCurrentUser, logout, type UserSession } from "@/lib/auth";
import {
  getProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getOrders,
  updateOrderStatus,
  deleteOrder,
  getAdminStats,
  getUsers,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  type UserRecord,
  getAdminSellers,
  updateSellerVerification,
  type SellerRecord,
  getPlatformSettings,
  updatePlatformSettings,
  type PlatformSettings,
  getSalesAnalytics,
  type SalesAnalyticsResponse,
} from "@/lib/api/client";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  Box,
  ChevronDown,
  LayoutDashboard,
  Search,
  Users,
  Settings,
  Bell,
  TrendingUp,
  Package,
  Save,
  Server,
  Zap,
  Globe,
  Mail,
  Shield,
  CheckCircle2,
  Check,
  X,
  Plus,
  RefreshCw,
  AlertTriangle,
  Clock,
  LogOut,
  Lock,
  ArrowRight,
  Home,
  ShoppingBag,
  Printer,
  FileText,
  Truck,
  Eye,
  Trash2,
  Info,
  Cpu,
  Store,
  User,
  Edit2,
  UserCheck,
  UserX,
  Phone,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

export function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [inventory, setInventory] = useState<any[]>(() =>
    products.map((p) => ({ ...p, stock: 12, status: p.status || "APPROVED" }))
  );
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentUser(getCurrentUser());
  }, []);

  const refreshProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const items = await getProducts({ all: true });
      if (items && items.length > 0) {
        setInventory(items.map((p: any) => ({ ...p, stock: p.stock ?? 12, status: p.status || "APPROVED" })));
      }
    } catch (e) {
      console.error("Failed to load products for admin", e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const refreshOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const items = await getOrders();
      setOrders(items);
    } catch (e) {
      console.error("Failed to load orders for admin", e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      refreshProducts();
      refreshOrders();
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    navigate({ to: "/login" });
  };

  // Wait until mounted on client
  if (!isMounted) return null;

  // ROUTE GUARD: Only role === "admin" allowed
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-between selection:bg-neon-cyan/30">
        <header className="border-b border-white/10 bg-[#0B0F19]/90 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Sellora" className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]" />
            <span className="font-display font-black tracking-widest text-lg">SELLORA</span>
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors">
            <Home className="h-4 w-4" /> Storefront
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-black/60 border border-white/15 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl text-center relative overflow-hidden animate-scale-in">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-rose-500/10 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-neon-cyan/10 blur-[80px]" />

            <div className="relative z-10">
              <div className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                <Lock className="h-10 w-10 animate-pulse" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono mb-4">
                <Shield className="h-3.5 w-3.5" />
                <span>Restricted System Area</span>
              </div>

              <h2 className="text-2xl font-display font-bold text-white mb-2">
                Administrator Access Required
              </h2>

              <p className="text-xs text-muted-foreground leading-relaxed mb-8">
                The SELLORA Administrative Console requires superuser credentials. Please sign in with an authorized administrator account to continue.
              </p>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-display text-xs font-bold uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,242,254,0.4)] hover:shadow-[0_0_30px_rgba(0,242,254,0.7)] transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Sign In as Admin</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/"
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-muted-foreground hover:text-white transition-colors block text-center"
                >
                  Return to Storefront
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 text-[11px] text-muted-foreground font-mono">
                Sample Admin: <span className="text-neon-cyan font-bold">admin@sellora.dev</span> &bull; Password: <span className="text-neon-cyan font-bold">admin</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-4 border-t border-white/5 text-center text-xs text-muted-foreground font-mono">
          SELLORA Core Operating Engine &bull; Security Level: High
        </footer>
      </div>
    );
  }

  // Define tab navigation
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'sellers', label: 'Sellers', icon: Store },
    { id: 'sales', label: 'Sales', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminInitials = currentUser?.firstName
    ? `${currentUser.firstName[0]}${currentUser.lastName?.[0] || ""}`.toUpperCase()
    : "AD";

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col font-sans selection:bg-neon-cyan/30">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-md">
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Sellora" className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] transition-transform group-hover:scale-105" />
          <span className="font-display font-black tracking-widest text-base hidden sm:inline">SELLORA ADMIN</span>
        </Link>

        <div className="flex-1 max-w-lg mx-6 relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-neon-cyan transition-colors" />
          <input
            type="text"
            placeholder="Search products, users, or orders..."
            className="w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          >
            <Home className="h-3.5 w-3.5" /> Storefront
          </Link>

          <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-neon-purple animate-pulse" />
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-neon-cyan to-neon-purple p-[2px] shadow-[0_0_10px_rgba(0,242,254,0.5)]">
              <div className="h-full w-full bg-[#0B0F19] rounded-full flex items-center justify-center text-xs font-bold font-mono text-white">
                {adminInitials}
              </div>
            </div>

            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">
                {currentUser?.firstName || "Admin"}
              </div>
              <div className="text-[10px] text-neon-cyan font-mono leading-tight">
                {currentUser?.email}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Log Out of Admin Console"
              className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Static Sidebar */}
        <aside className="w-56 border-r border-white/10 bg-[#0B0F19] flex flex-col shrink-0 py-4 z-40 relative shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
          <nav className="flex flex-col gap-1.5 px-3">
            {tabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 shadow-[inset_3px_0_0_rgba(0,242,254,1)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'animate-pulse' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Dashboard Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative scroll-smooth">
          <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-up">
            {activeTab === "dashboard" && (
              <TabDashboard
                inventory={inventory}
                orders={orders}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === "inventory" && (
              <TabInventory
                inventory={inventory}
                setInventory={setInventory}
                refreshProducts={refreshProducts}
                isLoadingProducts={isLoadingProducts}
              />
            )}
            {activeTab === "orders" && (
              <TabOrders
                orders={orders}
                setOrders={setOrders}
                refreshOrders={refreshOrders}
                isLoadingOrders={isLoadingOrders}
              />
            )}
            {activeTab === "sellers" && <TabSellers />}
            {activeTab === "sales" && <TabSales />}
            {activeTab === "users" && <TabUsers />}
            {activeTab === "settings" && <TabSettings />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ==============================================================================
// TAB: DASHBOARD (A1.1 Live KPI Overview from PostgreSQL)
// ==============================================================================
function TabDashboard({
  inventory,
  orders,
  setActiveTab,
}: {
  inventory: any[];
  orders: any[];
  setActiveTab: (tab: string) => void;
}) {
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const liveStats = await getAdminStats();
      if (liveStats) {
        setStats(liveStats);
      }
    } catch (e) {
      console.error("Failed to fetch live admin stats", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Compute live revenue fallback
  const totalRevenue = stats?.totalRevenue ?? orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const totalProductsCount = stats?.totalProducts ?? inventory.length;
  const approvedProductsCount = stats?.approvedProducts ?? inventory.filter((i) => (i.status || "APPROVED") === "APPROVED").length;
  const pendingProductsCount = stats?.pendingProducts ?? inventory.filter((i) => i.status === "PENDING_APPROVAL").length;

  const totalOrdersCount = stats?.totalOrders ?? orders.length;
  const pendingOrdersCount = stats?.pendingOrders ?? orders.filter((o) => o.status === "PENDING" || o.status === "PROCESSING").length;
  const deliveredOrdersCount = stats?.deliveredOrders ?? orders.filter((o) => o.status === "DELIVERED").length;

  const totalUsersCount = stats?.totalUsers ?? 4;
  const totalCustomersCount = stats?.totalCustomers ?? 2;
  const totalSellersCount = stats?.totalSellers ?? 0;
  const pendingSellersCount = stats?.pendingSellers ?? 0;

  const recentOrders = stats?.recentOrders ?? orders.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Top Header & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <span>Executive Command Center</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time platform metrics, revenue tracking, and hardware fleet telemetry.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-muted-foreground hover:text-white flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-neon-cyan" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Main KPI Cards (A1.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue Card */}
        <div className="rounded-2xl bg-gradient-to-br from-neon-cyan/10 via-white/[0.02] to-transparent border border-neon-cyan/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(0,242,254,0.1)]">
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-neon-cyan">
            <TrendingUp className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Gross Platform Revenue</p>
            <h3 className="text-3xl font-display font-black text-white mt-1.5">
              Rs {Number(totalRevenue).toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-neon-cyan bg-neon-cyan/15 w-fit px-2.5 py-1 rounded-full border border-neon-cyan/30">
              <Check className="h-3 w-3" /> {totalOrdersCount} Verified Orders
            </div>
          </div>
        </div>

        {/* Total Products Card */}
        <div
          onClick={() => setActiveTab("inventory")}
          className="rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/[0.02] to-transparent border border-neon-purple/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(123,44,191,0.1)] cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-neon-purple">
            <Package className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Active Catalog Fleet</p>
            <h3 className="text-3xl font-display font-black text-white mt-1.5">
              {totalProductsCount} Laptops
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-neon-purple bg-neon-purple/15 w-fit px-2.5 py-1 rounded-full border border-neon-purple/30 group-hover:bg-neon-purple group-hover:text-white transition-colors">
              <span>{approvedProductsCount} Approved</span>
              {pendingProductsCount > 0 && <span>&bull; {pendingProductsCount} In Review</span>}
            </div>
          </div>
        </div>

        {/* Registered Users & Sellers Card */}
        <div
          onClick={() => setActiveTab("users")}
          className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent border border-emerald-500/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.1)] cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-emerald-400">
            <Users className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Registered Accounts</p>
            <h3 className="text-3xl font-display font-black text-white mt-1.5">
              {totalUsersCount} Users
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-emerald-300 bg-emerald-500/15 w-fit px-2.5 py-1 rounded-full border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
              <span>{totalCustomersCount} Buyers</span>
              <span>&bull;</span>
              <span>{totalSellersCount} Sellers {pendingSellersCount > 0 ? `(${pendingSellersCount} pend)` : ""}</span>
            </div>
          </div>
        </div>

        {/* Order Fulfillment Pipeline Card */}
        <div
          onClick={() => setActiveTab("orders")}
          className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-500/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.1)] cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-amber-400">
            <ShoppingBag className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Fulfillment Status</p>
            <h3 className="text-3xl font-display font-black text-amber-400 mt-1.5">
              {pendingOrdersCount} Pending
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-amber-300 bg-amber-500/15 w-fit px-2.5 py-1 rounded-full border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-black transition-colors">
              <span>{deliveredOrdersCount} Delivered</span>
              <span>&bull;</span>
              <span>{totalOrdersCount} Total Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Recent Transactions Feed */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-display font-bold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Recent Transactions</span>
          </h3>
          <button
            onClick={() => setActiveTab("orders")}
            className="text-xs text-neon-cyan hover:underline flex items-center gap-1 font-mono cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

          <div className="divide-y divide-white/5">
            {recentOrders.map((order: any) => (
              <div
                key={order.id}
                onClick={() => setActiveTab("orders")}
                className="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-2">
                    <span>{order.orderNumber}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">by {order.customerName}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {order.items?.map((it: any) => it.product?.name || "Sellora Machine").join(", ") || "Laptop Purchase"}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">
                    Rs {Number(order.totalAmount).toLocaleString()}
                  </div>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      order.status === "DELIVERED"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : order.status === "SHIPPED"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}

            {recentOrders.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground font-mono">
                No recent transactions recorded yet.
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

// ==============================================================================
// TAB: INVENTORY (A2.1 Global Directory & A2.2 Approval Workflow)
// ==============================================================================
function TabInventory({
  inventory,
  setInventory,
  refreshProducts,
  isLoadingProducts,
}: {
  inventory: any[];
  setInventory: (inv: any[]) => void;
  refreshProducts: () => Promise<void>;
  isLoadingProducts: boolean;
}) {
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // New Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [sellersList, setSellersList] = useState<SellerRecord[]>([]);

  useEffect(() => {
    getAdminSellers().then((data) => {
      if (data) setSellersList(data);
    });
  }, []);

  const [newProductForm, setNewProductForm] = useState({
    name: "",
    category: "Gaming" as "Gaming" | "Ultrabook" | "Workstation",
    processor: "Intel i9" as "Intel i9" | "Intel i7" | "Intel i5" | "AMD Ryzen 9" | "AMD Ryzen 7" | "AMD Ryzen 5" | "Apple M Max",
    price: 250000,
    priceUsd: "$2,500",
    cpu: "Intel Core i9 14900HX",
    ram: "32GB DDR5",
    gpu: "NVIDIA RTX 4080 12GB",
    display: '16" QHD+ 240Hz OLED',
    img: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
    badge: "NEW LAUNCH",
    badgeColor: "cyan" as "cyan" | "purple" | "blue",
    status: "APPROVED",
    sellerId: "",
  });

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleExpand = (item: any) => {
    if (expandedRow === item.id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(item.id);
      setEditForm({ ...item, sellerId: item.sellerId || item.seller?.id || "" });
    }
  };

  // Live save to PostgreSQL database
  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const updated = await updateProduct(id, editForm);
      setInventory(inventory.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      setExpandedRow(null);
      showNotification(`Saved changes for "${editForm.name || id}" successfully.`);
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to save: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Live approval status toggle (A2.2)
  const handleQuickStatusChange = async (id: string, newStatus: "APPROVED" | "PENDING_APPROVAL" | "REJECTED", e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateProductStatus(id, newStatus);
      setInventory(inventory.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
      showNotification(`Product status updated to ${newStatus}.`);
    } catch (err: any) {
      console.error(err);
      showNotification(`Could not update status: ${err.message}`, "error");
    }
  };

  // Live delete from PostgreSQL
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this laptop from the database?")) {
      return;
    }
    setIsSaving(true);
    try {
      await deleteProduct(id);
      setInventory(inventory.filter((item) => item.id !== id));
      setExpandedRow(null);
      showNotification("Product deleted from PostgreSQL database.");
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to delete: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Create new product in PostgreSQL
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.price) {
      showNotification("Please fill in required fields (Name & Price)", "error");
      return;
    }

    setIsSaving(true);
    try {
      const created = await createProduct(newProductForm);
      setInventory([created, ...inventory]);
      setShowAddModal(false);
      showNotification(`"${created.name}" created and published to PostgreSQL!`);
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to create product: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(term);
      const matchId = item.id?.toLowerCase().includes(term);
      const matchCpu = item.cpu?.toLowerCase().includes(term);
      const matchGpu = item.gpu?.toLowerCase().includes(term);
      if (!matchName && !matchId && !matchCpu && !matchGpu) return false;
    }

    // Category / Status Filter
    if (filter === "All") return true;
    if (filter === "Approved") return (item.status || "APPROVED") === "APPROVED";
    if (filter === "Pending Approval") return item.status === "PENDING_APPROVAL";
    if (filter === "Rejected") return item.status === "REJECTED";
    if (filter === "Low Stock") return (item.stock ?? 12) < 5;
    return item.category === filter;
  });

  const pendingCount = inventory.filter((i) => i.status === "PENDING_APPROVAL").length;

  return (
    <div className="space-y-4">
      {/* Alert / Notification banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border shadow-lg animate-fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-rose-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-6 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-display font-bold">Global Product Directory</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono">
                {inventory.length} Laptops Live
              </span>
              {pendingCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono animate-pulse flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {pendingCount} Pending Review
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Manage product listings, hardware specifications, and verify seller-submitted laptops before public release.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search SKU, name, GPU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-muted-foreground focus:border-neon-cyan focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={refreshProducts}
              disabled={isLoadingProducts}
              title="Refresh from PostgreSQL"
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingProducts ? "animate-spin text-neon-cyan" : ""}`} />
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_25px_rgba(0,242,254,0.6)] transition-all flex items-center gap-1.5 hover:scale-105"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Add New Laptop
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex flex-wrap items-center gap-2">
          {[
            { id: "All", label: "All Items" },
            { id: "Approved", label: "Approved (Active)" },
            { id: "Pending Approval", label: `Pending Approval (${pendingCount})` },
            { id: "Rejected", label: "Rejected" },
            { id: "Gaming", label: "Gaming" },
            { id: "Ultrabook", label: "Ultrabook" },
            { id: "Workstation", label: "Workstation" },
            { id: "Low Stock", label: "Low Stock" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                filter === f.id
                  ? "bg-neon-cyan text-black font-semibold shadow-[0_0_12px_rgba(0,242,254,0.4)]"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Product Items Table */}
        <div className="divide-y divide-white/5">
          {filteredInventory.map((item) => {
            const currentStatus = item.status || "APPROVED";
            return (
              <div key={item.id} className="group">
                {/* Main Row */}
                <div
                  onClick={() => handleExpand(item)}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors ${
                    expandedRow === item.id
                      ? "bg-white/[0.04] border-l-4 border-neon-cyan"
                      : "hover:bg-white/[0.02] border-l-4 border-transparent"
                  }`}
                >
                  {/* Left: Image & Details */}
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="h-14 w-20 object-cover rounded-lg border border-white/10 group-hover:border-neon-cyan/50 transition-all group-hover:scale-105 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-white group-hover:text-neon-cyan transition-colors">
                          {item.name}
                        </span>
                        {/* Approval Status Badge */}
                        {currentStatus === "APPROVED" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="h-3 w-3" /> APPROVED
                          </span>
                        )}
                        {currentStatus === "PENDING_APPROVAL" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                            <Clock className="h-3 w-3" /> PENDING APPROVAL
                          </span>
                        )}
                        {currentStatus === "REJECTED" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <X className="h-3 w-3" /> REJECTED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1 flex flex-wrap items-center gap-2">
                        <span>SKU: {item.id}</span>
                        <span>&bull;</span>
                        <span className="text-white/80">{item.category}</span>
                        <span>&bull;</span>
                        <span>{item.processor}</span>
                        <span>&bull;</span>
                        <span className="text-neon-cyan/80">{item.gpu}</span>
                        {item.seller?.storeName && (
                          <>
                            <span>&bull;</span>
                            <span className="text-neon-cyan flex items-center gap-1 font-semibold">
                              <Store className="h-3 w-3" />
                              {item.seller.storeName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Quick Actions & Price */}
                  <div className="flex items-center justify-between md:justify-end gap-6">
                    {/* Quick Approval Action Buttons (A2.2) */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {currentStatus !== "APPROVED" && (
                        <button
                          onClick={(e) => handleQuickStatusChange(item.id, "APPROVED", e)}
                          title="Approve Listing"
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                      )}
                      {currentStatus !== "REJECTED" && (
                        <button
                          onClick={(e) => handleQuickStatusChange(item.id, "REJECTED", e)}
                          title="Reject Listing"
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/60 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                        >
                          <X className="h-3 w-3" /> Reject
                        </button>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-white">Rs {Number(item.price).toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.priceUsd || "LKR"}</div>
                    </div>

                    <div
                      className={`p-1.5 rounded-full transition-transform duration-300 ${
                        expandedRow === item.id
                          ? "rotate-180 bg-neon-cyan/20 text-neon-cyan"
                          : "bg-white/5 text-muted-foreground group-hover:text-neon-cyan"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Expandable Edit Panel */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedRow === item.id ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-6 bg-gradient-to-b from-white/[0.04] to-transparent border-t border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-display font-bold uppercase tracking-wider text-neon-cyan">
                        Edit Laptop Specifications & Approvals
                      </h4>
                      <span className="text-xs text-muted-foreground font-mono">ID: {item.id}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">Model Name</label>
                        <input
                          type="text"
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">Category</label>
                        <select
                          value={editForm.category || "Gaming"}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors"
                        >
                          <option value="Gaming">Gaming</option>
                          <option value="Ultrabook">Ultrabook</option>
                          <option value="Workstation">Workstation</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">Approval Status (A2.2)</label>
                        <select
                          value={editForm.status || "APPROVED"}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors"
                        >
                          <option value="APPROVED">APPROVED (Visible to Public)</option>
                          <option value="PENDING_APPROVAL">PENDING_APPROVAL (Under Review)</option>
                          <option value="REJECTED">REJECTED (Hidden from Public)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">Merchant / Seller</label>
                        <select
                          value={editForm.sellerId || "usr-admin-1"}
                          onChange={(e) => setEditForm({ ...editForm, sellerId: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors font-mono"
                        >
                          <option value="usr-admin-1">SELLORA Central Direct</option>
                          {sellersList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.storeName || `${s.firstName || "Seller"} (${s.email})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">Price (Rs)</label>
                        <input
                          type="number"
                          value={editForm.price || 0}
                          onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">CPU Spec</label>
                        <input
                          type="text"
                          value={editForm.cpu || ""}
                          onChange={(e) => setEditForm({ ...editForm, cpu: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">RAM</label>
                        <input
                          type="text"
                          value={editForm.ram || ""}
                          onChange={(e) => setEditForm({ ...editForm, ram: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">GPU Spec</label>
                        <input
                          type="text"
                          value={editForm.gpu || ""}
                          onChange={(e) => setEditForm({ ...editForm, gpu: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">Display Specs</label>
                        <input
                          type="text"
                          value={editForm.display || ""}
                          onChange={(e) => setEditForm({ ...editForm, display: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">Image Cloudinary URL</label>
                        <input
                          type="text"
                          value={editForm.img || ""}
                          onChange={(e) => setEditForm({ ...editForm, img: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        Delete Permanently
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedRow(null)}
                          className="px-4 py-2 rounded-lg border border-white/10 text-xs text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSave(item.id)}
                          disabled={isSaving}
                          className="px-5 py-2 rounded-lg bg-neon-cyan text-black text-xs font-bold shadow-[0_0_15px_rgba(0,242,254,0.4)] hover:shadow-[0_0_25px_rgba(0,242,254,0.8)] transition-all flex items-center gap-2"
                        >
                          <Save className="h-3.5 w-3.5" /> {isSaving ? "Saving to DB..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredInventory.length === 0 && (
            <div className="p-16 flex flex-col items-center justify-center text-center text-muted-foreground">
              <Box className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-white mb-2">No Matching Laptops Found</h3>
              <p className="text-sm max-w-sm mb-6">No products match your current search or filter criteria.</p>
              <button
                onClick={() => {
                  setFilter("All");
                  setSearchTerm("");
                }}
                className="px-4 py-2 bg-white/10 hover:bg-neon-cyan hover:text-black rounded-lg text-xs font-bold transition-all"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add New Laptop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-white">Add New Laptop to PostgreSQL</h3>
                <p className="text-xs text-muted-foreground">Create a new product listing in the marketplace catalog.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asus ROG Zephyrus G16"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Category *</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value as any })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                  >
                    <option value="Gaming">Gaming</option>
                    <option value="Ultrabook">Ultrabook</option>
                    <option value="Workstation">Workstation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Price (Rs) *</label>
                  <input
                    type="number"
                    required
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Processor Family</label>
                  <select
                    value={newProductForm.processor}
                    onChange={(e) => setNewProductForm({ ...newProductForm, processor: e.target.value as any })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                  >
                    <option value="Intel i9">Intel i9</option>
                    <option value="Intel i7">Intel i7</option>
                    <option value="Intel i5">Intel i5</option>
                    <option value="AMD Ryzen 9">AMD Ryzen 9</option>
                    <option value="AMD Ryzen 7">AMD Ryzen 7</option>
                    <option value="Apple M Max">Apple M Max</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Initial Status (A2.2)</label>
                  <select
                    value={newProductForm.status}
                    onChange={(e) => setNewProductForm({ ...newProductForm, status: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                  >
                    <option value="APPROVED">APPROVED (Publish Live)</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL (Draft)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">CPU Details</label>
                  <input
                    type="text"
                    value={newProductForm.cpu}
                    onChange={(e) => setNewProductForm({ ...newProductForm, cpu: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">RAM</label>
                  <input
                    type="text"
                    value={newProductForm.ram}
                    onChange={(e) => setNewProductForm({ ...newProductForm, ram: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">GPU Details</label>
                  <input
                    type="text"
                    value={newProductForm.gpu}
                    onChange={(e) => setNewProductForm({ ...newProductForm, gpu: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1">Display Specs</label>
                <input
                  type="text"
                  value={newProductForm.display}
                  onChange={(e) => setNewProductForm({ ...newProductForm, display: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1">Product Image URL</label>
                <input
                  type="text"
                  value={newProductForm.img}
                  onChange={(e) => setNewProductForm({ ...newProductForm, img: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1 uppercase">Assign Vendor / Seller</label>
                <select
                  value={newProductForm.sellerId || "usr-admin-1"}
                  onChange={(e) => setNewProductForm({ ...newProductForm, sellerId: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none font-mono"
                >
                  <option value="usr-admin-1">SELLORA Central Direct (Official)</option>
                  {sellersList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.storeName || `${s.firstName || "Seller"} (${s.email})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs text-muted-foreground hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-black text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(0,242,254,0.4)] hover:shadow-[0_0_25px_rgba(0,242,254,0.8)] transition-all"
                >
                  {isSaving ? "Saving to PostgreSQL..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// TAB: ORDERS (A4.1 Master Order Tracker & A4.2 Invoice Generator)
// ==============================================================================
function TabOrders({
  orders,
  setOrders,
  refreshOrders,
  isLoadingOrders,
}: {
  orders: any[];
  setOrders: (orders: any[]) => void;
  refreshOrders: () => Promise<void>;
  isLoadingOrders: boolean;
}) {
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<any | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
      showNotification(`Order status updated to ${newStatus}.`);
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to update status: ${err.message}`, "error");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderNumber}?`)) return;
    try {
      await deleteOrder(orderId);
      setOrders(orders.filter((o) => o.id !== orderId));
      showNotification(`Order ${orderNumber} deleted.`);
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to delete order: ${err.message}`, "error");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchNum = order.orderNumber?.toLowerCase().includes(term);
      const matchName = order.customerName?.toLowerCase().includes(term);
      const matchEmail = order.customerEmail?.toLowerCase().includes(term);
      const matchCity = order.city?.toLowerCase().includes(term);
      if (!matchNum && !matchName && !matchEmail && !matchCity) return false;
    }

    if (filter === "All") return true;
    return order.status === filter;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const processingCount = orders.filter((o) => o.status === "PROCESSING").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <div className="space-y-6">
      {/* Top Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border shadow-lg animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-rose-400" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 relative overflow-hidden">
          <p className="text-xs font-mono text-muted-foreground uppercase">Total Orders</p>
          <h3 className="text-3xl font-display font-bold text-white mt-1">{orders.length}</h3>
          <p className="text-[11px] text-neon-cyan mt-1 font-mono">Recorded in PostgreSQL</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 relative overflow-hidden">
          <p className="text-xs font-mono text-muted-foreground uppercase">Order Volume (LKR)</p>
          <h3 className="text-2xl font-display font-bold text-white mt-1">
            Rs {totalRevenue.toLocaleString()}
          </h3>
          <p className="text-[11px] text-neon-purple mt-1 font-mono">Gross Sales</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 relative overflow-hidden">
          <p className="text-xs font-mono text-muted-foreground uppercase">Pending Fulfillment</p>
          <h3 className="text-3xl font-display font-bold text-amber-400 mt-1">{pendingCount + processingCount}</h3>
          <p className="text-[11px] text-amber-400/80 mt-1 font-mono">{pendingCount} Pending &bull; {processingCount} Processing</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 relative overflow-hidden">
          <p className="text-xs font-mono text-muted-foreground uppercase">Delivered Orders</p>
          <h3 className="text-3xl font-display font-bold text-emerald-400 mt-1">{deliveredCount}</h3>
          <p className="text-[11px] text-emerald-400/80 mt-1 font-mono">Completed Handover</p>
        </div>
      </div>

      {/* Orders Directory Table Card */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header & Search */}
        <div className="p-6 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-display font-bold">Master Order Tracker</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono">
                {orders.length} Active Orders
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Live customer orders. Update dispatch statuses and issue tax invoices.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Order #, Name, City..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-muted-foreground focus:border-neon-cyan focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={refreshOrders}
              disabled={isLoadingOrders}
              title="Refresh Orders"
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingOrders ? "animate-spin text-neon-cyan" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex flex-wrap items-center gap-2">
          {[
            { id: "All", label: `All (${orders.length})` },
            { id: "PENDING", label: `Pending (${pendingCount})` },
            { id: "PROCESSING", label: `Processing (${processingCount})` },
            { id: "SHIPPED", label: "Shipped" },
            { id: "DELIVERED", label: `Delivered (${deliveredCount})` },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                filter === f.id
                  ? "bg-neon-cyan text-black font-semibold shadow-[0_0_12px_rgba(0,242,254,0.4)]"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-mono text-muted-foreground uppercase bg-white/5">
                <th className="py-3.5 pl-6 font-medium">Order Number & Date</th>
                <th className="py-3.5 font-medium">Customer Details</th>
                <th className="py-3.5 font-medium">Destination</th>
                <th className="py-3.5 font-medium">Items Ordered</th>
                <th className="py-3.5 font-medium">Total (Rs)</th>
                <th className="py-3.5 font-medium">Pipeline Status</th>
                <th className="py-3.5 font-medium text-right pr-6">Invoice & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredOrders.map((order) => {
                const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent";
                const totalUnits = order.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 1;

                return (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Order # & Date */}
                    <td className="py-4 pl-6 font-mono">
                      <div className="font-bold text-white group-hover:text-neon-cyan transition-colors">
                        {order.orderNumber}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {dateStr}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-4">
                      <div className="font-semibold text-white">{order.customerName}</div>
                      <div className="text-muted-foreground text-[11px]">{order.customerEmail}</div>
                      {order.customerPhone && (
                        <div className="text-muted-foreground text-[10px] font-mono">{order.customerPhone}</div>
                      )}
                    </td>

                    {/* Shipping Address */}
                    <td className="py-4 max-w-[200px]">
                      <div className="text-white truncate">{order.shippingAddress}</div>
                      <div className="text-muted-foreground text-[11px] font-mono">
                        {order.city || "Colombo"} {order.zipCode ? `(${order.zipCode})` : ""}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-4">
                      <div className="text-white font-medium">
                        {totalUnits} {totalUnits === 1 ? "unit" : "units"}
                      </div>
                      <div className="text-[11px] text-neon-cyan truncate max-w-[180px]">
                        {order.items?.map((it: any) => it.product?.name || "Sellora Machine").join(", ") || "Laptop Rig"}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-4">
                      <div className="font-bold text-white text-sm">
                        Rs {Number(order.totalAmount).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">Paid / Verified</span>
                    </td>

                    {/* Pipeline Status Selector (A4.1) */}
                    <td className="py-4">
                      <select
                        value={order.status}
                        disabled={isUpdating === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border focus:outline-none transition-all cursor-pointer ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : order.status === "SHIPPED"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                            : order.status === "PROCESSING"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                            : order.status === "CANCELLED"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        <option value="PENDING" className="bg-[#0B0F19] text-amber-300">PENDING</option>
                        <option value="PROCESSING" className="bg-[#0B0F19] text-blue-300">PROCESSING</option>
                        <option value="SHIPPED" className="bg-[#0B0F19] text-purple-300">SHIPPED</option>
                        <option value="DELIVERED" className="bg-[#0B0F19] text-emerald-300">DELIVERED</option>
                        <option value="CANCELLED" className="bg-[#0B0F19] text-rose-300">CANCELLED</option>
                      </select>
                    </td>

                    {/* Actions: Info, View Invoice & Delete */}
                    <td className="py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedDetailOrder(order);
                            setShowRawJson(false);
                          }}
                          className="px-2.5 py-1.5 bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 hover:border-neon-purple/60 text-neon-purple rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(123,44,191,0.2)]"
                          title="View Complete Order, Item & Seller Data"
                        >
                          <Info className="h-3.5 w-3.5" />
                          <span>Info</span>
                        </button>
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-neon-cyan/20 border border-white/10 hover:border-neon-cyan/40 text-neon-cyan rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                          title="View & Print Official Tax Invoice (A4.2)"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Invoice</span>
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                          className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Order Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30 text-neon-cyan" />
                    <p className="font-semibold text-white">No Matching Orders Found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your status filter or search keywords.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* INVOICE & RECEIPT MODAL (A4.2)                                                */}
      {/* ============================================================================== */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-8 shadow-2xl text-white space-y-6 animate-scale-in">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-neon-cyan" />
                <span className="font-display font-bold text-sm">Official Commercial Invoice</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-neon-cyan text-black text-xs font-bold rounded-xl flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(0,242,254,0.5)] transition-all"
                >
                  <Printer className="h-4 w-4" /> Print Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="text-muted-foreground hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-6 rounded-2xl bg-white text-black space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-6">
                <div>
                  <h1 className="text-2xl font-black tracking-widest text-black font-display">SELLORA</h1>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">High-Performance Computing Platforms</p>
                  <p className="text-xs text-gray-500 mt-1">
                    No. 45 Galle Road, Colombo 03, Sri Lanka<br />
                    billing@sellora.dev &bull; +94 11 234 5678
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-gray-900">{selectedInvoiceOrder.orderNumber}</div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">
                    Date: {new Date(selectedInvoiceOrder.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                  <div className="mt-2 inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider font-mono bg-gray-100 border border-gray-300">
                    Status: {selectedInvoiceOrder.status}
                  </div>
                </div>
              </div>

              {/* Bill To & Ship To */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <h4 className="font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">Billed & Shipped To:</h4>
                  <div className="font-bold text-sm text-gray-900">{selectedInvoiceOrder.customerName}</div>
                  <div className="text-gray-600 mt-0.5">{selectedInvoiceOrder.customerEmail}</div>
                  <div className="text-gray-600 font-mono">{selectedInvoiceOrder.customerPhone || "—"}</div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">Delivery Destination:</h4>
                  <div className="text-gray-900">{selectedInvoiceOrder.shippingAddress}</div>
                  <div className="text-gray-600 font-mono">
                    {selectedInvoiceOrder.city || "Colombo"}, {selectedInvoiceOrder.zipCode || "00300"}
                  </div>
                  <div className="text-gray-600">Standard Express Courier</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b text-gray-600 font-mono uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoiceOrder.items?.map((it: any) => (
                      <tr key={it.id || Math.random()}>
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{it.product?.name || "High-Performance Rig"}</div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            {it.product?.cpu} &bull; {it.product?.gpu}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          Rs {Number(it.price || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{it.quantity || 1}</td>
                        <td className="py-3 px-3 text-right font-bold font-mono">
                          Rs {(Number(it.price || 0) * (it.quantity || 1)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-2 border-t pt-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rs {Number(selectedInvoiceOrder.totalAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Express Insured Shipping:</span>
                    <span className="text-emerald-600 font-bold font-mono">FREE</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxes / VAT (Included):</span>
                    <span className="font-mono">Rs 0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-gray-900 border-t pt-2">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base">Rs {Number(selectedInvoiceOrder.totalAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-4 border-t text-[11px] text-gray-500 text-center font-mono">
                Thank you for choosing SELLORA. All laptops carry a 2-Year Official Manufacturer Warranty.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* COMPREHENSIVE ORDER & SELLER AUDIT MODAL (Info Button)                         */}
      {/* ============================================================================== */}
      {selectedDetailOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-white/15 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl text-white space-y-6 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                      <span>Order Intelligence Audit</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-neon-cyan border border-white/10">
                        {selectedDetailOrder.orderNumber}
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      DB UUID: {selectedDetailOrder.id} &bull; Placed: {new Date(selectedDetailOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                    selectedDetailOrder.status === "DELIVERED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : selectedDetailOrder.status === "SHIPPED"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : selectedDetailOrder.status === "PROCESSING"
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      : selectedDetailOrder.status === "CANCELLED"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}
                >
                  {selectedDetailOrder.status}
                </span>
                <button
                  onClick={() => setSelectedDetailOrder(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Section 1: Customer / Buyer Profile */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neon-cyan flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Buyer & Destination Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground font-mono block">Customer Name:</span>
                  <span className="font-semibold text-white text-sm">{selectedDetailOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-mono block">Contact Email:</span>
                  <span className="text-white font-mono">{selectedDetailOrder.customerEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-mono block">Phone Number:</span>
                  <span className="text-white font-mono">{selectedDetailOrder.customerPhone || "Not provided"}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground font-mono block">Shipping Address:</span>
                  <span className="text-white">{selectedDetailOrder.shippingAddress}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-mono block">City & Zip Code:</span>
                  <span className="text-white font-mono">
                    {selectedDetailOrder.city || "Colombo"}, {selectedDetailOrder.zipCode || "N/A"}
                  </span>
                </div>
                {selectedDetailOrder.user && (
                  <div className="sm:col-span-3 pt-2 border-t border-white/5 flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
                    <span>User Account ID: <span className="text-white">{selectedDetailOrder.user.id}</span></span>
                    <span>Role: <span className="text-neon-cyan uppercase">{selectedDetailOrder.user.role}</span></span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Items Ordered & Detailed Specs */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neon-purple flex items-center gap-2">
                <Package className="h-3.5 w-3.5" /> Ordered Products & Hardware Specs
              </h4>

              <div className="space-y-4">
                {selectedDetailOrder.items?.map((it: any, index: number) => {
                  const product = it.product;
                  const seller = product?.seller;

                  return (
                    <div
                      key={it.id || index}
                      className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-4 hover:border-white/20 transition-all"
                    >
                      {/* Product Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {product?.img && (
                            <img
                              src={product.img}
                              alt={product.name}
                              className="h-14 w-20 object-cover rounded-lg border border-white/10 shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{product?.name || "Sellora Machine"}</span>
                              {product?.badge && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-neon-cyan/20 text-neon-cyan">
                                  {product.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">
                              Product ID: {product?.id} &bull; Category: {product?.category}
                            </div>
                          </div>
                        </div>

                        <div className="text-right sm:text-right">
                          <div className="text-sm font-bold text-white font-mono">
                            Rs {Number(it.price || product?.price || 0).toLocaleString()} &times; {it.quantity || 1}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-mono">
                            Total: Rs {((Number(it.price || product?.price || 0)) * (it.quantity || 1)).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Hardware Specifications Grid */}
                      {product && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">CPU</span>
                            <span className="text-white truncate block">{product.cpu}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">GPU</span>
                            <span className="text-neon-cyan truncate block">{product.gpu}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">RAM</span>
                            <span className="text-white truncate block">{product.ram}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">DISPLAY</span>
                            <span className="text-white truncate block">{product.display || "Standard"}</span>
                          </div>
                        </div>
                      )}

                      {/* Detailed JSON specs if available */}
                      {product?.detailedSpecs && (
                        <div className="text-[11px] text-muted-foreground font-mono bg-white/[0.02] p-2.5 rounded-lg border border-white/5 flex flex-wrap gap-x-4 gap-y-1">
                          {product.detailedSpecs.benchmarkScore && (
                            <span>Benchmark Score: <strong className="text-neon-purple">{product.detailedSpecs.benchmarkScore}</strong></span>
                          )}
                          {product.detailedSpecs.cooling && (
                            <span>Cooling: <strong className="text-white">{product.detailedSpecs.cooling}</strong></span>
                          )}
                          {product.detailedSpecs.ports && (
                            <span>I/O: <strong className="text-white">{product.detailedSpecs.ports}</strong></span>
                          )}
                        </div>
                      )}

                      {/* SECTION 3: RELATED SELLER DATA (Crucial) */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-neon-purple/10 to-transparent border border-neon-purple/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-neon-purple flex items-center gap-1.5 uppercase">
                            <Store className="h-3.5 w-3.5" /> Seller & Merchant Intelligence
                          </span>
                          {seller ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              seller.sellerStatus === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}>
                              {seller.sellerStatus || "VERIFIED VENDOR"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
                              SELLORA OFFICIAL DIRECT
                            </span>
                          )}
                        </div>

                        {seller ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                            <div>
                              <span className="text-muted-foreground text-[10px] font-mono block">Store Name:</span>
                              <span className="font-bold text-white">{seller.storeName || "Vendor Store"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] font-mono block">Merchant Contact:</span>
                              <span className="text-white font-mono">{seller.email}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] font-mono block">Owner / Phone:</span>
                              <span className="text-white">{seller.firstName ? `${seller.firstName} ${seller.lastName || ""}` : "Verified Seller"} {seller.phone ? `(${seller.phone})` : ""}</span>
                            </div>
                            {seller.storeBio && (
                              <div className="sm:col-span-3 text-[11px] text-muted-foreground italic">
                                "{seller.storeBio}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                            <span>Fulfilled directly by <strong>SELLORA Central Tech Warehouse</strong></span>
                            <span className="text-[11px] font-mono text-neon-cyan">Warehouse SKU &bull; Direct Warranty</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Raw Database JSON Viewer */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-xs font-mono text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>{showRawJson ? "[-] Hide Raw PostgreSQL JSON" : "[+] Inspect Raw PostgreSQL Database Record"}</span>
              </button>

              {showRawJson && (
                <div className="mt-3 p-4 rounded-xl bg-black/80 border border-white/10 overflow-x-auto max-h-64 font-mono text-[11px] text-emerald-400">
                  <pre>{JSON.stringify(selectedDetailOrder, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-xs font-mono text-muted-foreground">
                Grand Total: <strong className="text-white text-sm">Rs {Number(selectedDetailOrder.totalAmount).toLocaleString()}</strong>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoiceOrder(selectedDetailOrder);
                    setSelectedDetailOrder(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-neon-cyan/20 border border-white/10 hover:border-neon-cyan/40 text-neon-cyan rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <FileText className="h-3.5 w-3.5" /> View Commercial Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDetailOrder(null)}
                  className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// TAB: SELLERS (A3.1 Applications & Verification, A3.2 Store Sanctions)
// ==============================================================================
function TabSellers() {
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedSeller, setSelectedSeller] = useState<SellerRecord | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminSellers();
      setSellers(data);
    } catch (err) {
      console.error("Failed to load sellers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Verification & Sanction Action Handler (A3.1 & A3.2)
  const handleUpdateStatus = async (
    sellerId: string,
    nextStatus: "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING",
    sellerName: string
  ) => {
    if (nextStatus === "SUSPENDED") {
      if (
        !window.confirm(
          `Are you sure you want to apply an administrative SANCTION on "${sellerName}"? This will suspend their store and halt product listings.`
        )
      ) {
        return;
      }
    }

    setIsProcessingId(sellerId);
    try {
      const res = await updateSellerVerification(sellerId, nextStatus);
      if (res.success && res.seller) {
        setSellers((prev) =>
          prev.map((s) => (s.id === sellerId ? { ...s, ...res.seller! } : s))
        );
        if (selectedSeller?.id === sellerId) {
          setSelectedSeller((prev) => (prev ? { ...prev, ...res.seller! } : null));
        }

        const actionWord =
          nextStatus === "APPROVED"
            ? "approved as a verified partner"
            : nextStatus === "SUSPENDED"
            ? "placed under administrative sanction"
            : nextStatus === "REJECTED"
            ? "declined"
            : "moved to pending";

        showNotification(`Vendor "${sellerName}" ${actionWord}.`);
      } else {
        showNotification(res.error || "Failed to update seller status", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to update seller", "error");
    } finally {
      setIsProcessingId(null);
    }
  };

  // Filtered sellers list
  const filteredSellers = sellers.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      (s.storeName && s.storeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.storeBio && s.storeBio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || s.sellerStatus.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  // KPI Metrics
  const totalCount = sellers.length;
  const pendingCount = sellers.filter((s) => s.sellerStatus === "PENDING").length;
  const approvedCount = sellers.filter((s) => s.sellerStatus === "APPROVED").length;
  const suspendedCount = sellers.filter((s) => s.sellerStatus === "SUSPENDED").length;
  const rejectedCount = sellers.filter((s) => s.sellerStatus === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2.5">
            <Store className="h-6 w-6 text-neon-cyan" />
            <span>Seller Applications &amp; Sanctions</span>
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Review vendor onboarding applications, verify partner credentials &amp; manage store sanctions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSellers}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-neon-cyan ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between animate-fade-down ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-muted-foreground">Total Applicants</span>
          <span className="text-2xl font-bold font-mono text-white mt-1">{totalCount}</span>
        </div>
        <div
          onClick={() => setStatusFilter("PENDING")}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between cursor-pointer hover:border-amber-500/60 transition-colors"
        >
          <span className="text-[11px] font-mono uppercase text-amber-400 flex items-center justify-between">
            <span>Pending Review</span>
            {pendingCount > 0 && <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />}
          </span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1">{pendingCount}</span>
        </div>
        <div
          onClick={() => setStatusFilter("APPROVED")}
          className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <span className="text-[11px] font-mono uppercase text-emerald-400">Verified Vendors</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1">{approvedCount}</span>
        </div>
        <div
          onClick={() => setStatusFilter("SUSPENDED")}
          className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between cursor-pointer hover:border-rose-500/50 transition-colors"
        >
          <span className="text-[11px] font-mono uppercase text-rose-400">Sanctioned</span>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1">{suspendedCount}</span>
        </div>
        <div
          onClick={() => setStatusFilter("REJECTED")}
          className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between cursor-pointer hover:border-white/20 transition-colors"
        >
          <span className="text-[11px] font-mono uppercase text-muted-foreground">Declined</span>
          <span className="text-2xl font-bold font-mono text-muted-foreground mt-1">{rejectedCount}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sellers by store, owner name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-neon-cyan/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          {[
            { id: "ALL", label: "All Vendors" },
            { id: "PENDING", label: `Applications (${pendingCount})` },
            { id: "APPROVED", label: "Verified" },
            { id: "SUSPENDED", label: "Sanctioned" },
            { id: "REJECTED", label: "Declined" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase transition-all ${
                statusFilter.toUpperCase() === tab.id
                  ? tab.id === "PENDING"
                    ? "bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    : tab.id === "SUSPENDED"
                    ? "bg-rose-500 text-white font-bold shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                    : "bg-neon-cyan text-black font-bold shadow-[0_0_12px_rgba(0,242,254,0.5)]"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sellers Directory Table */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground font-mono text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 text-neon-cyan animate-spin" />
            Loading seller onboarding applications from PostgreSQL...
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-mono text-xs">
            No seller accounts or applications found for "{statusFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-mono text-muted-foreground uppercase bg-white/5">
                  <th className="py-4 pl-6 font-medium">Merchant &amp; Storefront</th>
                  <th className="py-4 font-medium">Operator / Contact</th>
                  <th className="py-4 font-medium">Verification Status</th>
                  <th className="py-4 font-medium">Catalog Stock</th>
                  <th className="py-4 font-medium">Applied Date</th>
                  <th className="py-4 font-medium text-right pr-6">Administrative Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSellers.map((seller) => {
                  const isPending = seller.sellerStatus === "PENDING";
                  const isApproved = seller.sellerStatus === "APPROVED";
                  const isSuspended = seller.sellerStatus === "SUSPENDED";
                  const isRejected = seller.sellerStatus === "REJECTED";
                  const isBusy = isProcessingId === seller.id;

                  const ownerName = seller.firstName || seller.lastName
                    ? `${seller.firstName || ""} ${seller.lastName || ""}`.trim()
                    : "Vendor Operator";

                  return (
                    <tr key={seller.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Column 1: Storefront Profile */}
                      <td className="py-4 pl-6">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan shrink-0 mt-0.5">
                            <Store className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{seller.storeName || "Unregistered Store"}</span>
                              {seller.role === "admin" && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                                  OFFICIAL DIRECT
                                </span>
                              )}
                            </div>
                            {seller.storeBio ? (
                              <p className="text-muted-foreground text-[11px] line-clamp-1 max-w-sm mt-0.5 italic">
                                "{seller.storeBio}"
                              </p>
                            ) : (
                              <span className="text-muted-foreground/60 text-[10px] font-mono mt-0.5 block">
                                No store bio provided
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Operator / Contact */}
                      <td className="py-4">
                        <div className="space-y-0.5">
                          <div className="font-medium text-white">{ownerName}</div>
                          <div className="text-muted-foreground font-mono text-[11px] flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-neon-cyan" />
                            <span>{seller.email}</span>
                          </div>
                          {seller.phone && (
                            <div className="text-muted-foreground font-mono text-[10px] flex items-center gap-1.5">
                              <Phone className="h-2.5 w-2.5 text-muted-foreground" />
                              <span>{seller.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Verification Status Badge */}
                      <td className="py-4">
                        <div>
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/40">
                              <Clock className="h-3 w-3 animate-pulse text-amber-400" />
                              <span>PENDING AUDIT</span>
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>VERIFIED PARTNER</span>
                            </span>
                          ) : isSuspended ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/40">
                              <AlertTriangle className="h-3 w-3 text-rose-400" />
                              <span>SANCTIONED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-white/10 text-muted-foreground border border-white/15">
                              <X className="h-3 w-3" />
                              <span>DECLINED</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Catalog Stock */}
                      <td className="py-4">
                        <div className="font-mono text-xs">
                          <span className="text-white font-bold">{seller.products?.length || seller._count?.products || 0}</span>
                          <span className="text-muted-foreground text-[10px] ml-1">laptops</span>
                        </div>
                      </td>

                      {/* Column 5: Applied Date */}
                      <td className="py-4 font-mono text-[11px] text-muted-foreground">
                        {new Date(seller.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Column 6: Administrative Actions (A3.1 & A3.2) */}
                      <td className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {/* A3.1: Application Approval Buttons */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleUpdateStatus(seller.id, "APPROVED", seller.storeName || ownerName)}
                                className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/40 rounded-xl font-mono text-[11px] font-bold uppercase transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)] disabled:opacity-50"
                                title="Approve seller application"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleUpdateStatus(seller.id, "REJECTED", seller.storeName || ownerName)}
                                className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl font-mono text-[11px] font-bold uppercase transition-all flex items-center gap-1 disabled:opacity-50"
                                title="Reject seller application"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* A3.2: Store Sanction Toggle */}
                          {isApproved && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(seller.id, "SUSPENDED", seller.storeName || ownerName)}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl font-mono text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 disabled:opacity-50"
                              title="Suspend store privileges"
                            >
                              <AlertTriangle className="h-3 w-3 text-rose-400" />
                              <span>Suspend Store</span>
                            </button>
                          )}

                          {isSuspended && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(seller.id, "APPROVED", seller.storeName || ownerName)}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl font-mono text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 disabled:opacity-50"
                              title="Lift sanction and restore store"
                            >
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>Lift Sanction</span>
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(seller.id, "APPROVED", seller.storeName || ownerName)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-mono text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 disabled:opacity-50"
                              title="Reconsider and approve"
                            >
                              <span>Re-approve</span>
                            </button>
                          )}

                          {/* Inspect Modal Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedSeller(seller)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-neon-cyan/20 text-muted-foreground hover:text-neon-cyan border border-white/10 hover:border-neon-cyan/30 transition-all"
                            title="Inspect full merchant profile and listed inventory"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* SELLER AUDIT & INVENTORY INSPECTION MODAL                                      */}
      {/* ============================================================================== */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl text-white space-y-6 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                    <span>{selectedSeller.storeName || "Vendor Storefront"}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-neon-cyan border border-white/10">
                      {selectedSeller.sellerStatus}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Vendor ID: {selectedSeller.id} &bull; Joined: {new Date(selectedSeller.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSeller(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Merchant Details Grid */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-4 text-xs">
              <h4 className="font-mono text-neon-cyan uppercase tracking-wider text-[11px] font-bold">
                Operator Information &amp; Distribution Profile
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground font-mono block">Owner / Contact Name:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedSeller.firstName || selectedSeller.lastName
                      ? `${selectedSeller.firstName || ""} ${selectedSeller.lastName || ""}`.trim()
                      : "Operator Account"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-mono block">Contact Email:</span>
                  <span className="text-white font-mono">{selectedSeller.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-mono block">Contact Phone:</span>
                  <span className="text-white font-mono">{selectedSeller.phone || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-mono block">Platform Role:</span>
                  <span className="text-neon-purple font-mono uppercase font-bold">{selectedSeller.role}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground font-mono block">Business &amp; Fulfillment Address:</span>
                  <span className="text-white">{selectedSeller.address || "No address on file"}</span>
                </div>
                {selectedSeller.storeBio && (
                  <div className="sm:col-span-2 p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-muted-foreground font-mono block text-[10px] uppercase mb-1">
                      Store Biography / Hardware Focus:
                    </span>
                    <span className="text-white italic">"{selectedSeller.storeBio}"</span>
                  </div>
                )}
              </div>
            </div>

            {/* Listed Products by this Merchant */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-neon-cyan uppercase tracking-wider text-[11px] font-bold flex items-center gap-2">
                  <Package className="h-3.5 w-3.5" />
                  <span>Hardware Catalog ({selectedSeller.products?.length || 0} Listed)</span>
                </h4>
              </div>

              {!selectedSeller.products || selectedSeller.products.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs font-mono text-muted-foreground">
                  This vendor has not published any laptop hardware to the catalog yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedSeller.products.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {prod.img ? (
                          <img
                            src={prod.img}
                            alt={prod.name}
                            className="h-10 w-12 rounded-lg object-contain bg-black/40 border border-white/10"
                          />
                        ) : (
                          <div className="h-10 w-12 rounded-lg bg-white/5 flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{prod.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {prod.category} &bull; {prod.id}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-white">
                          Rs {Number(prod.price).toLocaleString()}
                        </div>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                            prod.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : prod.status === "REJECTED"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {prod.status || "APPROVED"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Status Override Selector */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">Vendor Verification Level</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Current: <strong>{selectedSeller.sellerStatus}</strong>
                </span>
              </div>

              <select
                value={selectedSeller.sellerStatus}
                onChange={(e) =>
                  handleUpdateStatus(
                    selectedSeller.id,
                    e.target.value as any,
                    selectedSeller.storeName || selectedSeller.email
                  )
                }
                className="bg-black border border-white/20 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-neon-cyan"
              >
                <option value="APPROVED">APPROVED (Verified Vendor)</option>
                <option value="PENDING">PENDING (In Review)</option>
                <option value="SUSPENDED">SUSPENDED (Under Sanction)</option>
                <option value="REJECTED">REJECTED (Declined)</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedSeller(null)}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// TAB: SALES (Marketplace Revenue, Trajectory & Analytics Engine)
// ==============================================================================
function TabSales() {
  const [analytics, setAnalytics] = useState<SalesAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getSalesAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load sales analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <RefreshCw className="h-8 w-8 text-neon-cyan animate-spin" />
        <p className="text-xs font-mono text-muted-foreground">Aggregating Sales &amp; Revenue Telemetry...</p>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    Gaming: "#00F2FE", // cyan
    Ultrabook: "#7B2CBF", // purple
    Workstation: "#3B82F6", // blue
    Other: "#10B981", // emerald
  };

  const pieData =
    analytics?.categoryData?.map((cat) => ({
      name: cat.name,
      value: cat.revenue,
      units: cat.units,
      color: categoryColors[cat.name] || "#00F2FE",
    })) || [];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-neon-cyan" />
            <span>Sales Analytics &amp; Revenue Velocity</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time marketplace revenue performance, commission earnings, category distribution, and top hardware models.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-muted-foreground hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-neon-cyan" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Revenue */}
        <div className="rounded-2xl bg-gradient-to-br from-neon-cyan/10 via-white/[0.02] to-transparent border border-neon-cyan/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(0,242,254,0.1)]">
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-neon-cyan">
            <TrendingUp className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Gross Sales Revenue</p>
            <h3 className="text-3xl font-display font-black text-white mt-1">
              Rs {(analytics?.totalRevenue || 0).toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/15 w-fit px-2.5 py-1 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" />
              <span>Rs {(analytics?.completedRevenue || 0).toLocaleString()} Cleared</span>
            </div>
          </div>
        </div>

        {/* Platform Commission */}
        <div className="rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/[0.02] to-transparent border border-neon-purple/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(123,44,191,0.1)]">
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-neon-purple">
            <Shield className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Platform Take (5%)</p>
            <h3 className="text-3xl font-display font-black text-white mt-1">
              Rs {(analytics?.platformCommission || 0).toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-neon-purple bg-neon-purple/15 w-fit px-2.5 py-1 rounded-full border border-neon-purple/30">
              <span>Marketplace Take</span>
            </div>
          </div>
        </div>

        {/* Total Hardware Units */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 via-white/[0.02] to-transparent border border-blue-500/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.1)]">
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-blue-400">
            <Package className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Hardware Units Sold</p>
            <h3 className="text-3xl font-display font-black text-white mt-1">
              {analytics?.totalUnits || 0} Units
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-blue-300 bg-blue-500/15 w-fit px-2.5 py-1 rounded-full border border-blue-500/30">
              <span>{analytics?.totalOrders || 0} Total Orders</span>
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-500/30 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.1)]">
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500 text-amber-400">
            <Zap className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Avg Order Value (AOV)</p>
            <h3 className="text-3xl font-display font-black text-white mt-1">
              Rs {(analytics?.avgOrderValue || 0).toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-amber-300 bg-amber-500/15 w-fit px-2.5 py-1 rounded-full border border-amber-500/30">
              <span>Per Transaction</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts: Timeline Velocity & Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Timeline Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-neon-cyan" />
                <span>Revenue &amp; Order Velocity Timeline</span>
              </h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                Daily sales gross volume trajectory
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
              Daily Sales Trend
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            {analytics?.timeline && analytics.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00F2FE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="displayDate" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `Rs ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a0f",
                      borderColor: "#ffffff20",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [`Rs ${Number(value).toLocaleString()}`, "Gross Revenue"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#00F2FE"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
                No chronological sales entries available
              </div>
            )}
          </div>
        </div>

        {/* Category Share Donut / Distribution */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Box className="h-4 w-4 text-neon-purple" />
              <span>Category Share</span>
            </h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              Revenue distribution by laptop class
            </p>
          </div>

          <div className="h-52 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a0f",
                      borderColor: "#ffffff20",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`Rs ${Number(val).toLocaleString()}`, "Sales"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
                No category data
              </div>
            )}
          </div>

          {/* Legend Items */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            {pieData.map((cat) => {
              const total = analytics?.totalRevenue || 1;
              const pct = Math.round((cat.value / total) * 100);
              return (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-white font-medium">{cat.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">({cat.units} units)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-white font-bold">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Performing Hardware Models (Best-Sellers) */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Top Performing Laptop Models (Best Sellers)</span>
            </h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              Ranked by total revenue generated across verified client orders
            </p>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
            {analytics?.topProducts?.length || 0} Models
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Rank &amp; Machine Model</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Gross Sales Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {analytics?.topProducts?.map((prod, idx) => (
                <tr key={prod.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-neon-cyan text-xs">
                        #{idx + 1}
                      </span>
                      <img
                        src={prod.img}
                        alt={prod.name}
                        className="h-10 w-12 rounded-lg object-cover border border-white/10 bg-black/50"
                      />
                      <div>
                        <div className="font-display font-bold text-white">{prod.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">ID: {prod.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/5 border border-white/10 text-white">
                      {prod.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-white text-sm">
                    {prod.units}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono font-bold text-neon-cyan text-sm">
                      Rs {prod.revenue.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
              {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground font-mono text-xs">
                    No product sales registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-Time Sales Ledger Feed */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-400" />
              <span>Verified Sales Ledger</span>
            </h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              Live transaction records and order fulfillment progress
            </p>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
            {analytics?.recentSales?.length || 0} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Order Reference</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Hardware Unit(s)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-right">Platform Fee (5%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {analytics?.recentSales?.map((sale: any) => {
                const commission = Math.round(Number(sale.totalAmount) * 0.05);
                return (
                  <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-neon-cyan">{sale.orderNumber}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{sale.customerName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{sale.city || sale.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        {sale.items?.map((it: any, i: number) => (
                          <div key={i} className="text-white text-xs truncate">
                            {it.product?.name || "Machine Unit"}{" "}
                            <span className="text-[10px] text-muted-foreground font-mono">x{it.quantity || 1}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          sale.status === "DELIVERED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : sale.status === "SHIPPED"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : sale.status === "PROCESSING"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : sale.status === "CANCELLED"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      Rs {Number(sale.totalAmount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neon-purple font-semibold">
                      Rs {commission.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {(!analytics?.recentSales || analytics.recentSales.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground font-mono text-xs">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// TAB: USERS (A5.1 User Role Control & Profile Management)
// ==============================================================================
function TabUsers() {
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    role: "customer",
    storeName: "",
    storeBio: "",
    sellerStatus: "NONE",
    isActive: true,
  });

  const fetchUserAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsersList(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAccounts();
  }, []);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Quick Role Change
  const handleQuickRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        showNotification(`Role updated to ${newRole.toUpperCase()} successfully.`);
      } else {
        showNotification(res.error || "Failed to update role", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to update role", "error");
    }
  };

  // Quick Status Toggle (Active / Suspended)
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const res = await updateUserStatus(userId, nextStatus);
      if (res.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: nextStatus } : u))
        );
        showNotification(
          `User account ${nextStatus ? "activated" : "suspended"} successfully.`
        );
      } else {
        showNotification(res.error || "Failed to update status", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to update status", "error");
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete user account "${userName}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await deleteUser(userId);
      if (res.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        showNotification(`User account removed successfully.`);
      } else {
        showNotification(res.error || "Failed to delete user", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to delete user", "error");
    }
  };

  // Open Edit Modal
  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role || "customer",
      storeName: user.storeName || "",
      storeBio: user.storeBio || "",
      sellerStatus: user.sellerStatus || "NONE",
      isActive: user.isActive !== false,
    });
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editForm.email) {
      alert("Email address is required.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateUser(editingUser.id, editForm);
      if (res.success && res.user) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === editingUser.id ? res.user! : u))
        );
        showNotification("User profile details updated successfully!");
        setEditingUser(null);
      } else {
        showNotification(res.error || "Failed to update user", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to save user info", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.storeName && u.storeName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === "ALL" || u.role.toLowerCase() === roleFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "SUSPENDED" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPI counts
  const totalCount = usersList.length;
  const adminCount = usersList.filter((u) => u.role.toLowerCase() === "admin").length;
  const sellerCount = usersList.filter((u) => u.role.toLowerCase() === "seller").length;
  const customerCount = usersList.filter((u) => u.role.toLowerCase() === "customer").length;
  const suspendedCount = usersList.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header & Notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-neon-purple" />
            <span>User & Access Control</span>
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Manage registered accounts, grant administrator privileges, configure seller roles & update profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchUserAccounts}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-neon-cyan ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between animate-fade-down ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-muted-foreground">Total Accounts</span>
          <span className="text-2xl font-bold font-mono text-white mt-1">{totalCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-neon-purple/5 border border-neon-purple/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-neon-purple">Admins</span>
          <span className="text-2xl font-bold font-mono text-neon-purple mt-1">{adminCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-neon-cyan">Sellers</span>
          <span className="text-2xl font-bold font-mono text-neon-cyan mt-1">{sellerCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-blue-400">Customers</span>
          <span className="text-2xl font-bold font-mono text-blue-400 mt-1">{customerCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-rose-400">Suspended</span>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1">{suspendedCount}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name, email, phone, store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-neon-cyan/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter Pills */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {["ALL", "admin", "seller", "customer"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] uppercase transition-all ${
                  roleFilter.toLowerCase() === r.toLowerCase()
                    ? "bg-neon-purple text-white font-bold shadow-[0_0_12px_rgba(123,44,191,0.5)]"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {r === "ALL" ? "All Roles" : r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {["ALL", "ACTIVE", "SUSPENDED"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] uppercase transition-all ${
                  statusFilter === s
                    ? "bg-neon-cyan text-black font-bold shadow-[0_0_12px_rgba(0,242,254,0.5)]"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground font-mono text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 text-neon-cyan animate-spin" />
            Loading registered user accounts from PostgreSQL cluster...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-mono text-xs">
            No registered users found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-mono text-muted-foreground uppercase bg-white/5">
                  <th className="py-4 pl-6 font-medium">User Identity</th>
                  <th className="py-4 font-medium">Role & Privileges</th>
                  <th className="py-4 font-medium">Store & Affiliation</th>
                  <th className="py-4 font-medium">Account Health</th>
                  <th className="py-4 font-medium">Joined Date</th>
                  <th className="py-4 font-medium text-right pr-6">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => {
                  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || user.email[0]}`.toUpperCase();
                  const isAdmin = user.role.toLowerCase() === "admin";
                  const isSeller = user.role.toLowerCase() === "seller";

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Column 1: User Identity */}
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full p-[2px] ${
                              isAdmin
                                ? "bg-gradient-to-tr from-neon-purple to-pink-500"
                                : isSeller
                                ? "bg-gradient-to-tr from-neon-cyan to-blue-500"
                                : "bg-gradient-to-tr from-white/20 to-white/5"
                            }`}
                          >
                            <div className="h-full w-full bg-[#0B0F19] rounded-full flex items-center justify-center font-bold text-white font-mono text-xs">
                              {initials}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm flex items-center gap-2">
                              <span>
                                {user.firstName || user.lastName
                                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                  : "Unnamed Account"}
                              </span>
                              {user._count?.orders ? (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-muted-foreground">
                                  {user._count.orders} ord
                                </span>
                              ) : null}
                            </div>
                            <div className="text-muted-foreground font-mono text-[11px] mt-0.5 flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-neon-cyan" />
                              <span>{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="text-muted-foreground font-mono text-[10px] mt-0.5 flex items-center gap-1.5">
                                <Phone className="h-2.5 w-2.5 text-muted-foreground" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Role Level & Inline Role Changer */}
                      <td className="py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md border font-mono ${
                                isAdmin
                                  ? "bg-neon-purple/20 text-neon-purple border-neon-purple/30 shadow-[0_0_10px_rgba(123,44,191,0.2)]"
                                  : isSeller
                                  ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30"
                                  : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>

                          {/* Inline Role Selector Dropdown */}
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-muted-foreground font-mono">Role:</span>
                            <select
                              value={user.role.toLowerCase()}
                              onChange={(e) => handleQuickRoleChange(user.id, e.target.value)}
                              className="bg-black/80 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-neon-cyan transition-colors cursor-pointer"
                            >
                              <option value="customer">Customer</option>
                              <option value="seller">Seller (Vendor)</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Store & Affiliation */}
                      <td className="py-4">
                        {isSeller ? (
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <Store className="h-3.5 w-3.5 text-neon-cyan" />
                              <span>{user.storeName || "Vendor Storefront"}</span>
                            </div>
                            <span
                              className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                user.sellerStatus === "APPROVED"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : user.sellerStatus === "PENDING"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-white/10 text-muted-foreground"
                              }`}
                            >
                              Status: {user.sellerStatus || "NONE"}
                            </span>
                          </div>
                        ) : isAdmin ? (
                          <div className="text-muted-foreground text-xs font-mono flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-neon-purple" />
                            <span>System Authority</span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-xs font-mono">
                            Individual Buyer
                          </div>
                        )}
                      </td>

                      {/* Column 4: Account Health Toggle */}
                      <td className="py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border transition-all flex items-center gap-1.5 ${
                            user.isActive
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                          }`}
                          title="Click to toggle account access"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.isActive ? "bg-emerald-400" : "bg-rose-400"
                            }`}
                          />
                          <span>{user.isActive ? "ACTIVE" : "SUSPENDED"}</span>
                        </button>
                      </td>

                      {/* Column 5: Joined Date */}
                      <td className="py-4 font-mono text-[11px] text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Column 6: Management Action Buttons */}
                      <td className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-neon-cyan/20 text-muted-foreground hover:text-neon-cyan border border-white/10 hover:border-neon-cyan/30 transition-all"
                            title="Edit user info & profile"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteUser(
                                user.id,
                                `${user.firstName || ""} ${user.lastName || user.email}`.trim()
                              )
                            }
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all"
                            title="Permanently remove user"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* USER PROFILE & INFORMATION UPDATE MODAL                                        */}
      {/* ============================================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-white/15 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl text-white space-y-6 animate-scale-in">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-neon-cyan" />
                  <span>Update User Profile & Privileges</span>
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Modifying user ID: {editingUser.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
                    placeholder="e.g. Alex"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
                    placeholder="e.g. Mercer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
                    placeholder="+94 77 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                    Platform Role Level
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
                  >
                    <option value="customer">Customer (Standard Buyer)</option>
                    <option value="seller">Seller (Hardware Vendor)</option>
                    <option value="admin">Administrator (Super Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                  Delivery / Billing Address
                </label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan resize-none"
                  placeholder="Street address, City, Postal Code"
                />
              </div>

              {/* Seller-specific fields */}
              {editForm.role === "seller" && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-neon-cyan/20 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-neon-cyan flex items-center gap-1.5 uppercase">
                    <Store className="h-3.5 w-3.5" /> Seller Store Settings
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground mb-1">
                        Store Name
                      </label>
                      <input
                        type="text"
                        value={editForm.storeName}
                        onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                        placeholder="Apex Hardware Ltd"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground mb-1">
                        Seller Verification Status
                      </label>
                      <select
                        value={editForm.sellerStatus}
                        onChange={(e) => setEditForm({ ...editForm, sellerStatus: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
                      >
                        <option value="APPROVED">APPROVED (Verified)</option>
                        <option value="PENDING">PENDING (In Review)</option>
                        <option value="SUSPENDED">SUSPENDED (Restricted)</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-muted-foreground mb-1">
                      Store Biography
                    </label>
                    <input
                      type="text"
                      value={editForm.storeBio}
                      onChange={(e) => setEditForm({ ...editForm, storeBio: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                      placeholder="Specialist in customized creator rigs..."
                    />
                  </div>
                </div>
              )}

              {/* Account Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <span className="text-xs font-semibold text-white block">Account Access</span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {editForm.isActive ? "User can sign in and operate on the platform" : "Account suspended from signing in"}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-neon-cyan to-blue-500 hover:from-neon-cyan/90 hover:to-blue-600 text-black font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save User Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// TAB: SETTINGS (A5.4 Platform Settings & Governance)
// ==============================================================================
function TabSettings() {
  const [settings, setSettings] = useState<PlatformSettings>({
    storeName: "SELLORA",
    tagline: "Next-Gen Computing. Unleashed.",
    supportEmail: "support@sellora.dev",
    supportPhone: "+94 11 234 5678",
    address: "No. 45 Galle Road, Colombo 03, Sri Lanka",
    currency: "LKR",
    freeShippingThreshold: 500000,
    taxRatePercent: 0,
    maintenanceMode: false,
    maintenanceMessage:
      "SELLORA is currently undergoing scheduled infrastructure upgrades. Storefront access will resume shortly.",
    autoApproveProducts: false,
    autoApproveSellers: false,
    requireEmailVerification: true,
    orderNotifications: true,
    security2FA: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getPlatformSettings();
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to load platform settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updatePlatformSettings(settings);
      if (res.success && res.settings) {
        setSettings(res.settings);
        showNotification("Platform configuration updated and saved successfully!");
      } else {
        showNotification(res.error || "Failed to save settings", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-neon-cyan" />
            <span>Platform Settings &amp; Governance</span>
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Configure global store identity, multi-vendor policies, maintenance gates &amp; security parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-neon-cyan ${isLoading ? "animate-spin" : ""}`} />
            Reload
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between animate-fade-down ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Maintenance Mode Alert Banner if active */}
      {settings.maintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5 font-mono">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block">Maintenance Mode is Live</span>
              <span className="text-[11px] text-amber-200/80">Public storefront visitors are gated with your custom announcement.</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-500 text-black font-bold font-mono text-[10px] uppercase">
            Active Barrier
          </span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Storefront & Brand Identity */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <Globe className="h-4 w-4 text-neon-cyan" />
            <span>Store Identity &amp; Customer Touchpoints</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase">
                Brand / Store Name
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
                placeholder="SELLORA"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase">
                Brand Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
                placeholder="Next-Gen Computing. Unleashed."
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase">
                Support &amp; Inquiries Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
                placeholder="support@sellora.dev"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase">
                Hotline / Support Phone
              </label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
                placeholder="+94 11 234 5678"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase">
                Central Warehouse &amp; Fulfillment Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
                placeholder="No. 45 Galle Road, Colombo 03, Sri Lanka"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Commerce & Pricing Defaults */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <Package className="h-4 w-4 text-neon-purple" />
            <span>Commerce, Currency &amp; Fulfillment Thresholds</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase">
                Primary Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
              >
                <option value="LKR">LKR (Sri Lankan Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase">
                Free Express Shipping (Rs.)
              </label>
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) || 0 })
                }
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase">
                VAT / Applicable Tax Rate (%)
              </label>
              <input
                type="number"
                value={settings.taxRatePercent}
                onChange={(e) =>
                  setSettings({ ...settings, taxRatePercent: Number(e.target.value) || 0 })
                }
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section: Security Controls & Storefront Access Barrier */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <Shield className="h-4 w-4 text-neon-purple" />
            <span>Security Controls &amp; Storefront Access Barrier</span>
          </h3>

          <div className="space-y-4">
            {/* Maintenance Mode Toggle */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                settings.maintenanceMode
                  ? "bg-amber-500/10 border-amber-500/40"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Maintenance Mode Barrier</span>
                    {settings.maintenanceMode && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500 text-black font-bold uppercase">
                        Enabled
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    When active, public visitors are shown an upgrade maintenance page while administrators retain access.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>

              {settings.maintenanceMode && (
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <label className="block text-[10px] font-mono uppercase text-amber-300 mb-1">
                    Public Maintenance Announcement
                  </label>
                  <textarea
                    rows={2}
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-end pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-purple hover:from-neon-cyan/90 hover:to-neon-purple/90 text-black font-bold rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(0,242,254,0.4)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Platform Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
