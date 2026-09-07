import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { products } from "@/data/products";
import { getProducts } from "@/lib/api/client";
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
  CheckCircle2
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [inventory, setInventory] = useState<any[]>(() =>
    products.map((p) => ({ ...p, stock: 12 }))
  );

  useEffect(() => {
    getProducts().then((items) => {
      if (items && items.length > 0) {
        setInventory(items.map((p) => ({ ...p, stock: 12 })));
      }
    });
  }, []);

  // Define tab navigation
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col font-sans selection:bg-neon-cyan/30">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-md">
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Sellora" className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] transition-transform group-hover:scale-105" />
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
          <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-neon-purple animate-pulse" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-neon-cyan to-neon-purple p-[2px] shadow-[0_0_10px_rgba(0,242,254,0.5)]">
            <div className="h-full w-full bg-[#0B0F19] rounded-full flex items-center justify-center text-xs font-bold font-mono text-white">
              RA
            </div>
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
            {activeTab === "dashboard" && <TabDashboard inventory={inventory} />}
            {activeTab === "inventory" && <TabInventory inventory={inventory} setInventory={setInventory} />}
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
// TAB: DASHBOARD
// ==============================================================================
function TabDashboard({ inventory }: { inventory: any[] }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">System Overview</h2>
        <span className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan text-xs font-mono rounded-full border border-neon-cyan/30">
          All Systems Nominal
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-lg hover:shadow-[0_10px_30px_rgba(0,242,254,0.15)] hover:border-neon-cyan/40">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500 text-neon-cyan">
            <TrendingUp className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground font-medium mb-1">Total Revenue</p>
            <h3 className="text-4xl font-display font-bold">Rs 0</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-neon-cyan bg-neon-cyan/10 w-fit px-2 py-1 rounded-full group-hover:bg-neon-cyan group-hover:text-black transition-colors">
              Awaiting transactions
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-lg hover:shadow-[0_10px_30px_rgba(123,44,191,0.15)] hover:border-neon-purple/40">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500 text-neon-purple">
            <Package className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground font-medium mb-1">Total Products</p>
            <h3 className="text-4xl font-display font-bold">{inventory.length}</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-neon-purple bg-neon-purple/10 w-fit px-2 py-1 rounded-full group-hover:bg-neon-purple group-hover:text-white transition-colors">
              Inventory tracking active
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-lg hover:shadow-[0_10px_30px_rgba(0,255,204,0.15)] hover:border-[#00ffcc]/40">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500 text-[#00ffcc]">
            <Users className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground font-medium mb-1">Live Users</p>
            <h3 className="text-4xl font-display font-bold">1</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#00ffcc] bg-[#00ffcc]/10 w-fit px-2 py-1 rounded-full group-hover:bg-[#00ffcc] group-hover:text-black transition-colors">
               You are online
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Server className="h-5 w-5 text-neon-purple" /> System Nodes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-neon-cyan animate-pulse"></div>
                <span className="font-medium text-sm">Database Cluster (us east)</span>
              </div>
              <span className="text-xs font-mono text-neon-cyan">99.9% Uptime</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-neon-cyan animate-pulse"></div>
                <span className="font-medium text-sm">Auth Services (global)</span>
              </div>
              <span className="text-xs font-mono text-neon-cyan">Operational</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-400" /> Recent Alerts</h3>
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <CheckCircle2 className="h-8 w-8 mb-2 opacity-50 text-neon-cyan" />
            <p>No critical system alerts.</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ==============================================================================
// TAB: INVENTORY
// ==============================================================================
function TabInventory({ inventory, setInventory }: { inventory: any[], setInventory: (inv: any[]) => void }) {
  const [filter, setFilter] = useState("All");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const handleExpand = (item: any) => {
    if (expandedRow === item.id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(item.id);
      setEditForm({ ...item });
    }
  };

  const handleSave = (id: string) => {
    setInventory(inventory.map(item => item.id === id ? { ...editForm } : item));
    setExpandedRow(null);
  };

  const handleDelete = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
    setExpandedRow(null);
  };

  const handleAddProduct = () => {
    const newId = 'SKU-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const newProduct = {
      id: newId,
      name: 'New Product',
      category: 'Gaming',
      price: 0,
      stock: 0,
      img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=150&q=80',
    };
    setInventory([newProduct, ...inventory]);
    setExpandedRow(newId);
    setEditForm(newProduct);
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === "All") return true;
    if (filter === "Low Stock") return item.stock < 5;
    return item.category === filter;
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-display font-bold">Product Inventory</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/10">
            {["All", "Gaming", "Ultrabook", "Workstation", "Low Stock"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filter === f 
                    ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,242,254,0.4)]' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button 
            onClick={handleAddProduct}
            className="px-4 py-2 bg-neon-purple text-white text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(123,44,191,0.5)] hover:bg-white hover:text-black hover:shadow-[0_0_20px_white] transition-all"
          >
            + Add Product
          </button>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {filteredInventory.map((item) => (
          <div key={item.id} className="group">
            {/* Main Row */}
            <div 
              onClick={() => handleExpand(item)}
              className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                expandedRow === item.id 
                  ? 'bg-white/[0.03] border-l-2 border-neon-cyan' 
                  : 'hover:bg-white/[0.02] border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <img src={item.img} alt={item.name} className="h-12 w-16 object-cover rounded-lg border border-white/10 group-hover:border-neon-cyan/50 transition-all group-hover:scale-105" />
                <div>
                  <div className="font-medium text-white group-hover:text-neon-cyan transition-colors">{item.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">{item.id} &bull; {item.category}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 sm:gap-10">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-white">Rs {item.price.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Price</div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-bold ${item.stock < 5 ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>
                    {item.stock} Units
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Stock</div>
                </div>

                <div className={`p-2 rounded-full transition-transform duration-300 ${expandedRow === item.id ? 'rotate-180 bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-muted-foreground group-hover:bg-neon-cyan/20 group-hover:text-neon-cyan'}`}>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Expandable Edit Panel */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedRow === item.id ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 bg-gradient-to-b from-white/[0.03] to-transparent border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase">Product Name</label>
                    <input 
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase">Image URL</label>
                    <input 
                      type="text"
                      value={editForm.img || ''}
                      onChange={(e) => setEditForm({...editForm, img: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase">Price (Rs)</label>
                    <input 
                      type="number"
                      value={editForm.price || 0}
                      onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase">Stock Level</label>
                    <input 
                      type="number"
                      value={editForm.stock || 0}
                      onChange={(e) => setEditForm({...editForm, stock: Number(e.target.value)})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase">Category</label>
                    <select 
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    >
                      <option value="Gaming">Gaming</option>
                      <option value="Ultrabook">Ultrabook</option>
                      <option value="Workstation">Workstation</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                  >
                    Delete Product
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setExpandedRow(null)}
                      className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSave(item.id)}
                      className="px-4 py-2 rounded-lg bg-neon-cyan text-black text-sm font-bold shadow-[0_0_15px_rgba(0,242,254,0.4)] hover:shadow-[0_0_25px_rgba(0,242,254,0.8)] transition-all flex items-center gap-2 hover:-translate-y-0.5"
                    >
                      <Save className="h-4 w-4" /> Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredInventory.length === 0 && (
          <div className="p-16 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Box className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-white mb-2">No Products Yet</h3>
            <p className="text-sm max-w-sm mb-6">Your inventory is completely empty. Start adding custom products to manage your hardware lineup.</p>
            <button 
              onClick={handleAddProduct}
              className="px-6 py-2.5 bg-white/10 hover:bg-neon-cyan hover:text-black rounded-lg text-sm font-bold transition-all"
            >
              Add First Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==============================================================================
// TAB: SALES
// ==============================================================================
function TabSales() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="h-24 w-24 rounded-full bg-neon-purple/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(123,44,191,0.2)]">
        <Activity className="h-10 w-10 text-neon-purple" />
      </div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">Sales Analytics Engine</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        No sales data has been recorded yet. The analytics engine requires at least 1 processed transaction to build the visualization models.
      </p>
      <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-muted-foreground flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
        Listening for incoming transactions...
      </div>
    </div>
  );
}

// ==============================================================================
// TAB: USERS
// ==============================================================================
function TabUsers() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-bold">User Management</h2>
        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors border border-white/10">
          Invite User
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-mono text-muted-foreground uppercase bg-white/5">
              <th className="py-4 pl-6 font-medium">User Profile</th>
              <th className="py-4 font-medium">Role Level</th>
              <th className="py-4 font-medium">Status</th>
              <th className="py-4 font-medium text-right pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr className="hover:bg-white/[0.02] transition-colors">
              <td className="py-4 pl-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-neon-cyan to-neon-purple p-[2px]">
                    <div className="h-full w-full bg-[#0B0F19] rounded-full flex items-center justify-center text-sm font-bold text-white">RA</div>
                  </div>
                  <div>
                    <div className="font-medium text-white">Rasika</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">admin@sellora.dev</div>
                  </div>
                </div>
              </td>
              <td className="py-4">
                <span className="px-2.5 py-1 bg-neon-purple/20 text-neon-purple text-[10px] font-bold tracking-widest uppercase rounded-md border border-neon-purple/30">
                  Super Admin
                </span>
              </td>
              <td className="py-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-neon-cyan" />
                  <span className="text-xs text-white">Online</span>
                </div>
              </td>
              <td className="py-4 text-right pr-6">
                <button className="text-xs text-muted-foreground hover:text-white transition-colors underline underline-offset-2">Manage</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==============================================================================
// TAB: SETTINGS
// ==============================================================================
function TabSettings() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-display font-bold mb-8">Platform Settings</h2>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Globe className="h-5 w-5 text-muted-foreground" /> Store Identity</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase">Store Name</label>
              <input type="text" defaultValue="SELLORA" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-neon-cyan focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase">Contact Email</label>
              <input type="email" defaultValue="support@sellora.dev" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-neon-cyan focus:outline-none transition-colors" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Shield className="h-5 w-5 text-muted-foreground" /> Security & Access</h3>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <div className="font-medium text-sm text-white">Require Two Factor Authentication (2FA)</div>
              <div className="text-xs text-muted-foreground mt-1">Force all admin users to authenticate with a second factor.</div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-neon-cyan shadow-[0_0_10px_rgba(0,242,254,0.5)]">
              <span className="inline-block h-4 w-4 transform rounded-full bg-black translate-x-6 transition-transform" />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mt-4">
            <div>
              <div className="font-medium text-sm text-white">Maintenance Mode</div>
              <div className="text-xs text-muted-foreground mt-1">Disable public storefront access while making changes.</div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
