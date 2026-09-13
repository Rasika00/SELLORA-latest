import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Gauge,
  Check,
  AlertTriangle,
  Zap,
  Sliders,
  Laptop,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Cpu,
  Tv,
  Gamepad2,
  Terminal,
  Compass,
  Video,
  ExternalLink,
  X,
} from "lucide-react";
import { products, type Product } from "@/data/products";
import {
  SOFTWARE_CATALOG,
  WORKLOAD_PRESETS,
  extractHardwareProfile,
  evaluateWorkload,
  type SoftwareApp,
  type HardwareProfile,
} from "@/lib/estimatorEngine";

interface PerformanceEstimatorProps {
  initialProductId?: string;
  isCompactEmbedded?: boolean;
}

export function PerformanceEstimator({ initialProductId, isCompactEmbedded = false }: PerformanceEstimatorProps) {
  // 1. Software selection state: default to 3 apps (Premiere, Blender, Cyberpunk)
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([
    "premiere-pro",
    "cyberpunk-2077",
    "blender",
  ]);

  // Active category filter tab for the software library
  const [activeCategory, setActiveCategory] = useState<"all" | "creative" | "dev" | "gaming">("all");

  // Hardware evaluation mode: "catalog" (pick a real laptop) vs "custom" (tweak TGP / GPU / RAM)
  const [hardwareMode, setHardwareMode] = useState<"catalog" | "custom">("catalog");

  // Selected laptop from SELLORA catalog (default to Dell XPS 14 with RTX 4050 if available, or initialProductId)
  const defaultLaptop = useMemo(() => {
    if (initialProductId) {
      const found = products.find((p) => p.id === initialProductId);
      if (found) return found;
    }
    // Default to Dell XPS 14 (id: "4", RTX 4050 6GB) as directly referenced in user prompt
    return products.find((p) => p.gpu.includes("4050")) || products[3] || products[0];
  }, [initialProductId]);

  const [selectedLaptopId, setSelectedLaptopId] = useState<string>(defaultLaptop.id);

  // Custom hardware sandbox states
  const [customGpuIndex, setCustomGpuIndex] = useState<number>(1); // default to RTX 4050
  const [customTgpWattage, setCustomTgpWattage] = useState<number>(75); // default 75W
  const [customRamGb, setCustomRamGb] = useState<number>(16); // default 16GB
  const [customCpuTier, setCustomCpuTier] = useState<number>(8); // Core Ultra 9 / i7

  const GPU_SANDBOX_OPTIONS = [
    { name: "Intel Arc / Integrated Graphics", tier: 2.5, vram: 2, defaultTgp: 35, tgpMin: 25, tgpMax: 50 },
    { name: "NVIDIA GeForce RTX 4050 Mobile", tier: 5.0, vram: 6, defaultTgp: 75, tgpMin: 45, tgpMax: 95 },
    { name: "NVIDIA GeForce RTX 4060 Mobile", tier: 6.5, vram: 8, defaultTgp: 105, tgpMin: 60, tgpMax: 115 },
    { name: "NVIDIA GeForce RTX 4070 Mobile", tier: 7.5, vram: 8, defaultTgp: 115, tgpMin: 70, tgpMax: 140 },
    { name: "NVIDIA GeForce RTX 4080 Mobile", tier: 8.5, vram: 12, defaultTgp: 150, tgpMin: 90, tgpMax: 175 },
    { name: "NVIDIA GeForce RTX 4090 Mobile", tier: 10.0, vram: 16, defaultTgp: 175, tgpMin: 125, tgpMax: 175 },
    { name: "Apple M3 Max (40-Core GPU)", tier: 9.5, vram: 36, defaultTgp: 65, tgpMin: 45, tgpMax: 90 },
    { name: "NVIDIA RTX 5000 Ada Generation", tier: 9.8, vram: 16, defaultTgp: 135, tgpMin: 90, tgpMax: 165 },
  ];

  const RAM_OPTIONS = [8, 16, 32, 48, 64, 128];

  const CPU_OPTIONS = [
    { label: "Intel Core i5 / Ryzen 5 (Mainstream 6-Core)", tier: 5.0, name: "Core i5 13500H" },
    { label: "Intel Core i7 / Ryzen 7 (Performance 14-Core)", tier: 7.5, name: "Core i7 13700H" },
    { label: "Intel Core Ultra 9 / Ryzen 9 (High-End AI 16-Core)", tier: 8.5, name: "Core Ultra 9 185H" },
    { label: "Intel Core i9 14900HX (Extreme Desktop Class 24-Core)", tier: 10.0, name: "Core i9 14900HX" },
    { label: "Apple M3 Max 16-Core Silicon", tier: 9.8, name: "Apple M3 Max" },
  ];

  // Derive current HardwareProfile based on mode
  const currentHardware: HardwareProfile = useMemo(() => {
    if (hardwareMode === "catalog") {
      const laptop = products.find((p) => p.id === selectedLaptopId) || defaultLaptop;
      return extractHardwareProfile(laptop);
    } else {
      const selectedGpu = GPU_SANDBOX_OPTIONS[customGpuIndex];
      const selectedCpu = CPU_OPTIONS.find((c) => c.tier === customCpuTier) || CPU_OPTIONS[2];
      return {
        name: `Custom Rig (${selectedGpu.name.split(" ")[0]} @ ${customTgpWattage}W)`,
        gpuName: `${selectedGpu.name} (${selectedGpu.vram}GB VRAM)`,
        gpuTier: selectedGpu.tier,
        vramGb: selectedGpu.vram,
        tgpWattage: customTgpWattage,
        ramGb: customRamGb,
        cpuName: selectedCpu.name,
        cpuTier: selectedCpu.tier,
      };
    }
  }, [
    hardwareMode,
    selectedLaptopId,
    defaultLaptop,
    customGpuIndex,
    customTgpWattage,
    customRamGb,
    customCpuTier,
  ]);

  // Compute evaluation result
  const evaluation = useMemo(() => {
    return evaluateWorkload(currentHardware, selectedAppIds);
  }, [currentHardware, selectedAppIds]);

  // Toggle app selection (allows unrestricted selection & deselection up to 5 apps)
  const toggleApp = (id: string) => {
    if (selectedAppIds.includes(id)) {
      setSelectedAppIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedAppIds.length >= 5) {
        // If max 5 reached, replace the oldest one
        setSelectedAppIds((prev) => [...prev.slice(1), id]);
      } else {
        setSelectedAppIds((prev) => [...prev, id]);
      }
    }
  };

  const removeApp = (id: string) => {
    setSelectedAppIds((prev) => prev.filter((item) => item !== id));
  };

  const clearAllApps = () => {
    setSelectedAppIds([]);
  };

  const resetToDefaultApps = () => {
    setSelectedAppIds(["premiere-pro", "cyberpunk-2077", "blender"]);
  };

  // Apply or toggle preset stack
  const applyPreset = (presetAppIds: string[]) => {
    const isActive =
      presetAppIds.length === selectedAppIds.length &&
      presetAppIds.every((id) => selectedAppIds.includes(id));
    if (isActive) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(presetAppIds);
    }
  };

  // Filtered software catalog for display
  const displayedApps = useMemo(() => {
    if (activeCategory === "all") return SOFTWARE_CATALOG;
    return SOFTWARE_CATALOG.filter((app) => app.category === activeCategory);
  }, [activeCategory]);

  const selectedLaptopProduct = products.find((p) => p.id === selectedLaptopId) || defaultLaptop;

  return (
    <section
      id="estimator"
      className={`relative border-t border-glass-border ${
        isCompactEmbedded ? "py-12 bg-transparent" : "py-24 md:py-32 bg-background/50"
      }`}
    >
      {/* Background Ambience & Grid Accent */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute top-1/4 left-1/3 -z-10 h-96 w-96 rounded-full bg-neon-cyan/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-neon-purple/15 blur-[120px]" />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8">
        {/* Header */}
        {!isCompactEmbedded && (
          <div className="mb-14 text-center max-w-3xl mx-auto">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3.5 py-1 text-[10px] font-mono font-bold tracking-[0.25em] text-neon-cyan uppercase shadow-neon-cyan">
              <Gauge className="h-3 w-3 animate-pulse" /> Workload Simulator & Playability Lab
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
              Software & Game <span className="text-gradient">Performance Estimator</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Wondering if an <strong>RTX 4050 with 75W TGP</strong> can export 4K Premiere timelines or run
              Cyberpunk 2077 at 60 FPS? Select 3–5 tools or games below to calculate instant playability scores,
              diagnose bottlenecks, and see matching machines.
            </p>
          </div>
        )}

        {/* STEP 1: Tool & Game Selector Section */}
        <div className="rounded-3xl border border-glass-border bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-elevated mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-glass-border">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neon-cyan text-background text-xs font-black">
                  1
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-foreground">
                  Pick Your Software Stack & Games
                </h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose <span className="text-neon-cyan font-bold">1 to 5</span> programs you run daily to benchmark
                against hardware.
              </p>
            </div>

            {/* Selection Counter Badge & Quick Actions */}
            <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
              <div
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold border transition-all ${
                  selectedAppIds.length >= 1 && selectedAppIds.length <= 5
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "border-amber-500/50 bg-amber-500/10 text-amber-400"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Selected: {selectedAppIds.length} / 5</span>
                {selectedAppIds.length === 0 && (
                  <span className="text-[10px] font-normal">(Click cards to select)</span>
                )}
              </div>
              {selectedAppIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllApps}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-rose-400 px-3 py-2 rounded-xl border border-glass-border hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors"
                  title="Remove all selected apps"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="mt-6 mb-6">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-2.5">
              ⚡ Quick Curated Stacks:
            </span>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {WORKLOAD_PRESETS.map((preset) => {
                const isActive =
                  preset.appIds.length === selectedAppIds.length &&
                  preset.appIds.every((id) => selectedAppIds.includes(id));
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.appIds)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-gradient-primary text-background font-bold shadow-[0_0_20px_oklch(0.78_0.18_200/0.4)] scale-105"
                        : "glass border border-glass-border text-foreground/80 hover:border-neon-cyan/50 hover:text-neon-cyan"
                    }`}
                  >
                    <span>{preset.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-4 border-b border-glass-border/60 pb-4">
            {[
              { key: "all", label: "All Software & Games" },
              { key: "creative", label: "🎬 3D & Video Production" },
              { key: "dev", label: "💻 Coding, CAD & DevOps" },
              { key: "gaming", label: "🎮 AAA & Esports Games" },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key as any)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === cat.key
                    ? "bg-white/15 text-neon-cyan border border-neon-cyan/50 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Active Selection Stack Bar */}
          {selectedAppIds.length > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white/[0.03] border border-glass-border/70 p-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1.5">
                <Check className="h-3 w-3 text-neon-cyan" /> Selected ({selectedAppIds.length}/5):
              </span>
              {selectedAppIds.map((id) => {
                const app = SOFTWARE_CATALOG.find((a) => a.id === id);
                if (!app) return null;
                return (
                  <span
                    key={id}
                    className="group inline-flex items-center gap-1.5 rounded-xl border border-neon-cyan/40 bg-neon-cyan/15 px-3 py-1 text-xs font-medium text-neon-cyan shadow-sm transition-all hover:bg-neon-cyan/25"
                  >
                    <span>{app.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeApp(id);
                      }}
                      title={`Remove ${app.name}`}
                      aria-label={`Remove ${app.name}`}
                      className="rounded p-0.5 hover:bg-rose-500/30 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3 stroke-[2.5]" />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300 font-mono flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>No software selected. Click any card below to add up to 5 apps or games.</span>
              </div>
              <button
                type="button"
                onClick={resetToDefaultApps}
                className="text-[11px] font-bold underline hover:text-amber-200 shrink-0"
              >
                Restore Default Stack
              </button>
            </div>
          )}

          {/* Apps Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-[380px] overflow-y-auto pr-1">
            {displayedApps.map((app) => {
              const isSelected = selectedAppIds.includes(app.id);
              return (
                <div
                  key={app.id}
                  onClick={() => toggleApp(app.id)}
                  className={`group relative flex flex-col justify-between rounded-2xl p-4 cursor-pointer transition-all border ${
                    isSelected
                      ? "border-neon-cyan bg-neon-cyan/10 shadow-[0_0_25px_oklch(0.78_0.18_200/0.25)]"
                      : "border-glass-border bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                          isSelected
                            ? "bg-neon-cyan text-background border-neon-cyan"
                            : "bg-white/5 border-white/10 text-muted-foreground group-hover:text-neon-cyan"
                        }`}
                      >
                        {app.category === "creative" ? (
                          <Video className="h-4 w-4" />
                        ) : app.category === "dev" ? (
                          <Terminal className="h-4 w-4" />
                        ) : (
                          <Gamepad2 className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold text-foreground group-hover:text-neon-cyan transition-colors">
                          {app.name}
                        </h4>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                          {app.categoryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Checkbox indicator */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                        isSelected
                          ? "bg-neon-cyan border-neon-cyan text-background group-hover:bg-rose-500 group-hover:border-rose-500 group-hover:text-white"
                          : "border-white/20 bg-black/40 group-hover:border-white/40"
                      }`}
                      title={isSelected ? `Click to remove ${app.name}` : `Click to add ${app.name}`}
                    >
                      {isSelected && (
                        <>
                          <Check className="h-3.5 w-3.5 stroke-[3] group-hover:hidden" />
                          <X className="h-3.5 w-3.5 stroke-[3] hidden group-hover:block" />
                        </>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {app.tagline}
                  </p>

                  <div className="mt-3 pt-3 border-t border-glass-border flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-mono font-medium text-neon-cyan border border-neon-cyan/20">
                      {app.badge}
                    </span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                      Min {app.minRamGb}GB RAM
                    </span>
                    {app.minVramGb > 0 && (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                        {app.minVramGb}GB VRAM
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Hardware Selection / Custom Rig Sandbox */}
        <div className="rounded-3xl border border-glass-border bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-elevated mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-glass-border">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neon-purple text-background text-xs font-black">
                2
              </span>
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-foreground">
                  Choose Hardware Specification to Test
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select a live laptop model from SELLORA or adjust custom TGP wattage and memory.
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-black/40 p-1 border border-glass-border shrink-0">
              <button
                onClick={() => setHardwareMode("catalog")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  hardwareMode === "catalog"
                    ? "bg-neon-cyan text-background shadow-neon-cyan"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>SELLORA Catalog Model</span>
              </button>
              <button
                onClick={() => setHardwareMode("custom")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  hardwareMode === "custom"
                    ? "bg-neon-purple text-white shadow-neon-purple"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Custom Spec Sandbox (TGP / RAM)</span>
              </button>
            </div>
          </div>

          {hardwareMode === "catalog" ? (
            /* Mode A: Select from real SELLORA laptops */
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Select Laptop Model:
                </label>
                <select
                  value={selectedLaptopId}
                  onChange={(e) => setSelectedLaptopId(e.target.value)}
                  className="w-full rounded-2xl border border-glass-border bg-black/70 px-4 py-3.5 text-sm font-medium text-foreground focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-neutral-900 text-white py-1">
                      {p.name} — {p.gpu} | {p.cpu} | {p.ram} (Rs {p.price.toLocaleString()})
                    </option>
                  ))}
                </select>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">Popular quick picks:</span>
                  {[
                    { label: "Dell XPS 14 (RTX 4050 75W)", id: "4" },
                    { label: "Razer Blade 18 (RTX 4090 175W)", id: "1" },
                    { label: "MacBook Pro 16 (M3 Max)", id: "2" },
                    { label: "Asus Zephyrus G14 (RTX 4070)", id: "5" },
                    { label: "ThinkPad P16 (RTX 5000 Ada)", id: "3" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedLaptopId(item.id)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-mono border transition-all ${
                        selectedLaptopId === item.id
                          ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan font-bold"
                          : "border-glass-border text-muted-foreground hover:border-white/30"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Spec Card for selected model */}
              <div className="flex items-center gap-4 rounded-2xl glass p-4 border border-glass-border">
                <img
                  src={selectedLaptopProduct.img}
                  alt={selectedLaptopProduct.name}
                  className="h-20 w-20 rounded-xl object-cover border border-white/10 bg-black shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-wider">
                    {selectedLaptopProduct.category}
                  </span>
                  <h4 className="font-display text-sm font-bold text-foreground truncate">
                    {selectedLaptopProduct.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                    GPU: {selectedLaptopProduct.gpu}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    RAM: {selectedLaptopProduct.ram}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-mono text-neon-purple font-bold">
                    <span>Est. TGP: {currentHardware.tgpWattage}W Power Budget</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Mode B: Custom hardware sandbox with interactive TGP slider */
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* GPU Select */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  1. Dedicated GPU:
                </label>
                <select
                  value={customGpuIndex}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setCustomGpuIndex(idx);
                    setCustomTgpWattage(GPU_SANDBOX_OPTIONS[idx].defaultTgp);
                  }}
                  className="w-full rounded-xl border border-glass-border bg-black/70 px-3 py-2.5 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                >
                  {GPU_SANDBOX_OPTIONS.map((g, idx) => (
                    <option key={g.name} value={idx} className="bg-neutral-900 text-white">
                      {g.name} ({g.vram}GB)
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                  VRAM Allocation: {GPU_SANDBOX_OPTIONS[customGpuIndex].vram} GB GDDR6
                </span>
              </div>

              {/* TGP Wattage Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    2. TGP Power Limit:
                  </label>
                  <span className="text-xs font-mono font-bold text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded border border-neon-cyan/30">
                    {customTgpWattage} Watts
                  </span>
                </div>
                <input
                  type="range"
                  min={GPU_SANDBOX_OPTIONS[customGpuIndex].tgpMin}
                  max={GPU_SANDBOX_OPTIONS[customGpuIndex].tgpMax}
                  step={5}
                  value={customTgpWattage}
                  onChange={(e) => setCustomTgpWattage(parseInt(e.target.value, 10))}
                  className="w-full accent-neon-cyan cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
                  <span>Thin & Light ({GPU_SANDBOX_OPTIONS[customGpuIndex].tgpMin}W)</span>
                  <span>Max Wattage ({GPU_SANDBOX_OPTIONS[customGpuIndex].tgpMax}W)</span>
                </div>
              </div>

              {/* RAM Select */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  3. System Memory (RAM):
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {RAM_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setCustomRamGb(r)}
                      className={`rounded-lg py-2 text-xs font-mono font-bold border transition-all ${
                        customRamGb === r
                          ? "bg-neon-purple/20 border-neon-purple text-neon-purple shadow-neon-purple"
                          : "border-glass-border bg-black/40 text-muted-foreground hover:border-white/30"
                      }`}
                    >
                      {r}GB
                    </button>
                  ))}
                </div>
              </div>

              {/* CPU Select */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  4. Processor Class:
                </label>
                <select
                  value={customCpuTier}
                  onChange={(e) => setCustomCpuTier(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-glass-border bg-black/70 px-3 py-2.5 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                >
                  {CPU_OPTIONS.map((c) => (
                    <option key={c.name} value={c.tier} className="bg-neutral-900 text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                  Simulates multi-core render & compile speed
                </span>
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: Real-Time Results & Workload Diagnostics HUD */}
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-glass-border bg-gradient-to-r from-card via-card/90 to-black/80 p-6 sm:p-8 backdrop-blur-2xl shadow-elevated">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Radial / Score Box */}
              <div className="lg:col-span-4 flex items-center gap-6 border-b lg:border-b-0 lg:border-r border-glass-border pb-6 lg:pb-0 lg:pr-8">
                <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl glass-strong border border-neon-cyan/40 shadow-neon-cyan">
                  <div className="text-center">
                    <span className="font-display text-4xl sm:text-5xl font-black text-neon-cyan tracking-tighter">
                      {selectedAppIds.length > 0 ? evaluation.overallScore : "--"}
                    </span>
                    {selectedAppIds.length > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground block">/ 100</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="inline-block rounded-full bg-neon-cyan/15 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-neon-cyan border border-neon-cyan/30 mb-2">
                    {evaluation.overallTier}
                  </span>
                  <h4 className="font-display text-lg sm:text-xl font-bold text-foreground">
                    Workload Readiness Score
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {selectedAppIds.length > 0
                      ? `Evaluated against ${selectedAppIds.length} chosen software target${selectedAppIds.length > 1 ? "s" : ""} on ${currentHardware.gpuName}.`
                      : `Select 1 to 5 software targets above to run benchmark diagnostics on ${currentHardware.gpuName}.`}
                  </p>
                </div>
              </div>

              {/* Summary and Specs pill */}
              <div className="lg:col-span-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neon-purple mb-1.5">
                    <Info className="h-3.5 w-3.5" />
                    <span>Executive Hardware Diagnosis:</span>
                  </div>
                  <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                    {evaluation.overallSummary}
                  </p>
                </div>

                {/* Specs quick HUD chips */}
                <div className="mt-6 flex flex-wrap gap-2.5 text-xs font-mono">
                  <div className="rounded-xl border border-glass-border bg-white/5 px-3 py-1.5 flex items-center gap-2">
                    <span className="text-muted-foreground">GPU:</span>
                    <span className="text-neon-cyan font-bold">{currentHardware.gpuName}</span>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-white/5 px-3 py-1.5 flex items-center gap-2">
                    <span className="text-muted-foreground">Power Budget:</span>
                    <span className="text-neon-purple font-bold">{currentHardware.tgpWattage}W TGP</span>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-white/5 px-3 py-1.5 flex items-center gap-2">
                    <span className="text-muted-foreground">VRAM:</span>
                    <span className="text-foreground font-bold">{currentHardware.vramGb}GB</span>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-white/5 px-3 py-1.5 flex items-center gap-2">
                    <span className="text-muted-foreground">RAM:</span>
                    <span className="text-foreground font-bold">{currentHardware.ramGb}GB</span>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-white/5 px-3 py-1.5 flex items-center gap-2">
                    <span className="text-muted-foreground">CPU:</span>
                    <span className="text-muted-foreground">{currentHardware.cpuName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Individual App Playability Breakdown Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-base sm:text-lg font-bold uppercase tracking-wider text-foreground">
                Per-Application Playability & Workload Breakdown
              </h4>
              <span className="text-xs text-muted-foreground font-mono">
                {evaluation.appEvaluations.length} Benchmarks Calculated
              </span>
            </div>

            {evaluation.appEvaluations.length === 0 ? (
              <div className="rounded-3xl border border-glass-border bg-card/60 p-8 sm:p-12 text-center backdrop-blur-xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-glass-border text-neon-cyan mb-4">
                  <Sliders className="h-6 w-6" />
                </div>
                <h5 className="font-display text-lg font-bold text-foreground mb-1.5">
                  No Applications Selected for Evaluation
                </h5>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                  Choose 1 to 5 creative suites, developer stacks, or AAA games from Step 1 above to generate playability scores, framerates, and bottleneck diagnostics.
                </p>
                <button
                  type="button"
                  onClick={resetToDefaultApps}
                  className="inline-flex items-center gap-2 rounded-xl bg-neon-cyan/15 px-4 py-2.5 text-xs font-bold text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan hover:text-background transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Load Default 3-App Stack</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {evaluation.appEvaluations.map((item) => {
                  const isEmerald = item.statusColor === "emerald";
                  const isCyan = item.statusColor === "cyan";
                  const isAmber = item.statusColor === "amber";

                  const badgeBg = isEmerald
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                    : isCyan
                    ? "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40"
                    : isAmber
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                    : "bg-rose-500/15 text-rose-400 border-rose-500/40";

                  const scoreBarColor = isEmerald
                    ? "bg-emerald-400"
                    : isCyan
                    ? "bg-neon-cyan"
                    : isAmber
                    ? "bg-amber-400"
                    : "bg-rose-400";

                  return (
                    <div
                      key={item.app.id}
                      className="flex flex-col justify-between rounded-3xl border border-glass-border bg-card/60 p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:shadow-elevated"
                    >
                      <div>
                        {/* Top App Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                              {item.app.categoryLabel}
                            </span>
                            <h5 className="font-display text-base font-bold text-foreground">
                              {item.app.name}
                            </h5>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-display text-xl font-bold text-foreground">
                              {item.score}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground block">/100</span>
                          </div>
                        </div>

                        {/* Score Bar */}
                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mb-4">
                          <div
                            className={`h-full ${scoreBarColor} transition-all duration-500`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>

                        {/* Status Badge */}
                        <div className="mb-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-bold border ${badgeBg}`}
                          >
                            {item.status === "flawless" || item.status === "smooth" ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : item.status === "playable" ? (
                              <Info className="h-3.5 w-3.5" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            )}
                            <span>{item.statusBadge}</span>
                          </span>
                        </div>

                        {/* Estimated Metric Highlight */}
                        <div className="rounded-xl bg-black/40 border border-glass-border p-3 mb-3">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">
                            {item.metricLabel}
                          </span>
                          <span className="font-display text-sm font-bold text-neon-cyan">
                            {item.metricValue}
                          </span>
                          <p className="text-xs font-semibold text-foreground/90 mt-1">
                            {item.headline}
                          </p>
                        </div>

                        {/* Detailed Technical Diagnosis */}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.diagnosis}
                        </p>

                        {/* Bottleneck Alerts */}
                        {item.bottlenecks.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {item.bottlenecks.map((bn, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded"
                              >
                                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                <span>{bn}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pro Tip / Advice */}
                      <div className="mt-4 pt-4 border-t border-glass-border">
                        <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic">
                          <strong className="text-foreground/90 not-italic">Pro Tip:</strong> {item.advice}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 4: Recommended Laptops from Store */}
          <div className="rounded-3xl border border-neon-cyan/30 bg-card/80 p-6 sm:p-8 backdrop-blur-2xl mt-12 shadow-[0_0_50px_oklch(0.78_0.18_200/0.1)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-neon-cyan" />
                  <span className="font-mono text-xs uppercase tracking-widest text-neon-cyan font-bold">
                    STORE MATCH RECOMMENDATIONS
                  </span>
                </div>
                <h4 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground mt-1">
                  Top Machines Engineered For Your Selected Stack
                </h4>
              </div>
              <a
                href="/#products"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-neon-cyan hover:underline self-start sm:self-auto"
              >
                <span>Browse All {products.length} Machines</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {evaluation.recommendedLaptops.map((laptop) => (
                <div
                  key={laptop.id}
                  className="group flex flex-col justify-between rounded-2xl border border-glass-border bg-black/40 p-4 transition-all duration-300 hover:border-neon-cyan/50 hover:shadow-neon-cyan"
                >
                  <div>
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-black mb-3">
                      <img
                        src={laptop.img}
                        alt={laptop.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-2 left-2 rounded-md bg-black/80 px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-neon-cyan border border-white/20">
                        {laptop.badge}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-display text-sm font-bold text-foreground truncate">
                        {laptop.name}
                      </h5>
                      <span className="font-display text-xs font-bold text-neon-cyan whitespace-nowrap">
                        Rs {laptop.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-mono text-muted-foreground">
                      <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10">
                        {laptop.gpu}
                      </span>
                      <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10">
                        {laptop.ram}
                      </span>
                      <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10">
                        {laptop.cpu}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-glass-border flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        setHardwareMode("catalog");
                        setSelectedLaptopId(laptop.id);
                        const el = document.getElementById("estimator");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-xs font-mono text-muted-foreground hover:text-neon-cyan transition-colors"
                    >
                      Test in Simulator ↑
                    </button>
                    <Link
                      to="/product/$productId"
                      params={{ productId: laptop.id }}
                      className="inline-flex items-center gap-1 rounded-lg bg-neon-cyan/15 px-3 py-1.5 text-xs font-bold text-neon-cyan hover:bg-neon-cyan hover:text-background transition-all"
                    >
                      <span>View Laptop</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
