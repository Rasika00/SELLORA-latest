import { useMemo, useState, useEffect } from "react";
import {
  Cpu,
  MemoryStick,
  Zap,
  Plus,
  Filter,
  Scale,
  Check,
  Trophy,
  ArrowRight,
  X,
  ShoppingCart,
  Layers,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { products as initialProducts, type Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { getProducts } from "@/lib/api/client";

const badgeStyles = {
  cyan: "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40 shadow-[0_0_20px_oklch(0.78_0.18_200/0.4)]",
  purple: "bg-neon-purple/15 text-neon-purple border-neon-purple/40 shadow-[0_0_20px_oklch(0.62_0.24_295/0.4)]",
  blue: "bg-neon-blue/15 text-neon-blue border-neon-blue/40 shadow-[0_0_20px_oklch(0.7_0.22_260/0.4)]",
};

const categories = ["Gaming", "Ultrabook", "Workstation"] as const;
const processors = [
  "Intel i9",
  "Intel i7",
  "Intel i5",
  "AMD Ryzen 9",
  "AMD Ryzen 7",
  "AMD Ryzen 5",
  "Apple M Max",
] as const;
const ramOptions = ["8GB", "16GB", "32GB", "48GB", "64GB", "128GB"] as const;
const gpuOptions = [
  "RTX 4090",
  "RTX 4080",
  "RTX 4070",
  "RTX 4060",
  "RTX 4050",
  "RTX Ada",
  "Apple GPU",
  "RTX 3050 / 2050",
  "Integrated / Arc",
] as const;

export function ProductGrid() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [cats, setCats] = useState<string[]>([]);
  const [procs, setProcs] = useState<string[]>([]);
  const [rams, setRams] = useState<string[]>([]);
  const [gpus, setGpus] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(600000);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getProducts().then((items) => {
      if (mounted && items && items.length > 0) {
        setProductList(items);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return productList.filter((p) => {
      // Category filter
      if (cats.length && !cats.includes(p.category)) return false;

      // Processor filter
      if (procs.length) {
        const matchesProc = procs.some((proc) => {
          if (p.processor === proc) return true;
          // Flexible match for CPU string naming
          if (proc === "Intel i9" && (p.cpu.includes("i9") || p.cpu.includes("Ultra 9"))) return true;
          if (proc === "Intel i7" && (p.cpu.includes("i7") || p.cpu.includes("Ultra 7"))) return true;
          if (proc === "Intel i5" && p.cpu.includes("i5")) return true;
          if (proc === "AMD Ryzen 9" && p.cpu.includes("Ryzen 9")) return true;
          if (proc === "AMD Ryzen 7" && p.cpu.includes("Ryzen 7")) return true;
          if (proc === "AMD Ryzen 5" && p.cpu.includes("Ryzen 5")) return true;
          if (proc === "Apple M Max" && (p.cpu.toLowerCase().includes("m3") || p.cpu.toLowerCase().includes("apple"))) return true;
          return false;
        });
        if (!matchesProc) return false;
      }

      // RAM filter
      if (rams.length) {
        const matchesRam = rams.some((r) => {
          const regex = new RegExp(`(^|\\D)${r}(\\D|$)`, "i");
          return regex.test(p.ram);
        });
        if (!matchesRam) return false;
      }

      // Graphic Card (GPU) filter
      if (gpus.length) {
        const lowerGpu = p.gpu.toLowerCase();
        const matchesGpu = gpus.some((g) => {
          if (g === "RTX 4090") return lowerGpu.includes("4090");
          if (g === "RTX 4080") return lowerGpu.includes("4080");
          if (g === "RTX 4070") return lowerGpu.includes("4070");
          if (g === "RTX 4060") return lowerGpu.includes("4060");
          if (g === "RTX 4050") return lowerGpu.includes("4050");
          if (g === "RTX Ada") return lowerGpu.includes("ada");
          if (g === "Apple GPU") return lowerGpu.includes("apple");
          if (g === "RTX 3050 / 2050") return lowerGpu.includes("3050") || lowerGpu.includes("2050");
          if (g === "Integrated / Arc") return lowerGpu.includes("arc") || lowerGpu.includes("radeon") || lowerGpu.includes("integrated");
          return lowerGpu.includes(g.toLowerCase());
        });
        if (!matchesGpu) return false;
      }

      // Max price filter
      if (p.price > maxPrice) return false;
      return true;
    });
  }, [productList, cats, procs, rams, gpus, maxPrice]);

  useEffect(() => {
    setVisibleCount(8);
  }, [cats, procs, rams, gpus, maxPrice]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const resetFilters = () => {
    setCats([]);
    setProcs([]);
    setRams([]);
    setGpus([]);
    setMaxPrice(600000);
  };

  const activeFilterCount =
    cats.length + procs.length + rams.length + gpus.length + (maxPrice < 600000 ? 1 : 0);

  const toggleCompare = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((item) => item !== id));
    } else {
      if (compareIds.length >= 3) {
        // replace the oldest with the new one
        setCompareIds([...compareIds.slice(1), id]);
      } else {
        setCompareIds([...compareIds, id]);
      }
    }
  };

  const launchCompare = () => {
    if (compareIds.length === 0) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    const s1 = compareIds[0] || "1";
    const s2 = compareIds[1] || "2";
    const s3 = compareIds[2] || "3";
    navigate({ to: `/compare` as any, search: { s1, s2, s3 } as any });
  };

  return (
    <section id="products" className="relative py-24 md:py-32">
      <div id="workstation" className="absolute -top-24" />
      <div className="pointer-events-none absolute right-0 top-1/3 -z-10 h-96 w-96 rounded-full bg-neon-purple/20 blur-3xl" />
      <div className="pointer-events-none absolute left-0 bottom-1/4 -z-10 h-96 w-96 rounded-full bg-neon-cyan/20 blur-3xl" />

      <div className="mx-auto w-full max-w-full px-4 sm:px-8 md:px-12">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-xs tracking-[0.3em] text-neon-cyan">THE LAPTOP DECK</p>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                {filtered.length} MACHINES
              </span>
            </div>
            <h2 className="font-display mt-3 text-4xl font-black uppercase tracking-tight md:text-5xl">
              Choose your <span className="text-gradient">weapon</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <p className="max-w-xs text-xs sm:text-sm text-muted-foreground">
              Engineered, benchmarked, and shipped from orbit. Select up to 3 models for the Showdown Arena.
            </p>

            <div className="flex flex-col items-end gap-1.5">
              <button
                onClick={launchCompare}
                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple p-0.5 shadow-neon-cyan transition-transform hover:scale-105 shrink-0"
              >
                <div className="flex items-center gap-2 rounded-[14px] bg-background px-4 py-2.5 transition-colors group-hover:bg-transparent">
                  <Scale className="h-4 w-4 text-neon-cyan group-hover:text-background transition-colors" />
                  <span className="font-display text-xs font-bold tracking-widest text-foreground group-hover:text-background transition-colors">
                    LAUNCH 3 WAY SHOWDOWN
                  </span>
                </div>
              </button>
              {showError && (
                <span className="text-xs font-bold text-red-500 animate-fade-up">Select at least one laptop to compare.</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[270px_1fr]">
          {/* Sticky sidebar */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl glass p-5 sm:p-6 neon-border flex flex-col justify-between lg:min-h-[1040px] xl:min-h-[1050px]">
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-neon-cyan" />
                    <h3 className="font-display text-sm tracking-[0.2em]">FILTERS</h3>
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-neon-cyan/20 px-2 py-0.5 text-[10px] font-mono font-bold text-neon-cyan border border-neon-cyan/40">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-neon-cyan transition-colors"
                      title="Clear all filters"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <FilterGroup label="CATEGORY" icon={Layers} activeCount={cats.length}>
                  {categories.map((c) => (
                    <Chip key={c} active={cats.includes(c)} onClick={() => toggle(cats, setCats, c)}>
                      {c}
                    </Chip>
                  ))}
                </FilterGroup>

                {/* Processor Filter */}
                <FilterGroup label="PROCESSOR" icon={Cpu} activeCount={procs.length}>
                  {processors.map((p) => (
                    <Chip key={p} active={procs.includes(p)} onClick={() => toggle(procs, setProcs, p)}>
                      {p}
                    </Chip>
                  ))}
                </FilterGroup>

                {/* RAM Filter */}
                <FilterGroup label="MEMORY (RAM)" icon={MemoryStick} activeCount={rams.length}>
                  {ramOptions.map((r) => (
                    <Chip key={r} active={rams.includes(r)} onClick={() => toggle(rams, setRams, r)}>
                      {r}
                    </Chip>
                  ))}
                </FilterGroup>

                {/* Graphic Card (GPU) Filter */}
                <FilterGroup label="GRAPHIC CARD" icon={Zap} activeCount={gpus.length}>
                  {gpuOptions.map((g) => (
                    <Chip key={g} active={gpus.includes(g)} onClick={() => toggle(gpus, setGpus, g)}>
                      {g}
                    </Chip>
                  ))}
                </FilterGroup>

                {/* Price Filter */}
                <FilterGroup
                  label="MAX PRICE"
                  icon={SlidersHorizontal}
                  activeCount={maxPrice < 600000 ? 1 : 0}
                >
                  <div className="w-full px-1">
                    <input
                      type="range"
                      min={40000}
                      max={600000}
                      step={5000}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-[oklch(0.78_0.18_200)] cursor-pointer"
                    />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>Rs 40K</span>
                      <span className="font-display text-neon-cyan font-bold">Rs {maxPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </FilterGroup>
              </div>

              {/* Bottom Deck Stats & Reset Action */}
              <div className="mt-auto pt-6 border-t border-glass-border">
                <div className="mb-3 rounded-xl bg-white/[0.02] border border-glass-border p-3 text-center">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Catalog Deck</p>
                  <p className="font-display text-base font-bold text-foreground mt-0.5">
                    <span className="text-neon-cyan">{filtered.length}</span> of {productList.length} <span className="text-xs text-muted-foreground font-normal">Active Models</span>
                  </p>
                </div>
                <button
                  onClick={resetFilters}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-glass-border bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-neon-cyan/10 hover:border-neon-cyan/40 hover:text-neon-cyan"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset all filters</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex flex-col">
            {/* Active Filter Badges Bar */}
            {activeFilterCount > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl glass p-3 text-xs neon-border">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
                  Active Filters:
                </span>
                {cats.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-2.5 py-0.5 text-[11px] font-medium text-neon-cyan"
                  >
                    {c}
                    <button
                      onClick={() => toggle(cats, setCats, c)}
                      className="hover:text-white ml-0.5"
                      title={`Remove ${c}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {procs.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-2.5 py-0.5 text-[11px] font-medium text-neon-cyan"
                  >
                    {p}
                    <button
                      onClick={() => toggle(procs, setProcs, p)}
                      className="hover:text-white ml-0.5"
                      title={`Remove ${p}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {rams.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-2.5 py-0.5 text-[11px] font-medium text-neon-cyan"
                  >
                    {r} RAM
                    <button
                      onClick={() => toggle(rams, setRams, r)}
                      className="hover:text-white ml-0.5"
                      title={`Remove ${r}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {gpus.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-2.5 py-0.5 text-[11px] font-medium text-neon-cyan"
                  >
                    {g}
                    <button
                      onClick={() => toggle(gpus, setGpus, g)}
                      className="hover:text-white ml-0.5"
                      title={`Remove ${g}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {maxPrice < 600000 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-2.5 py-0.5 text-[11px] font-medium text-neon-cyan">
                    ≤ Rs {maxPrice.toLocaleString()}
                    <button
                      onClick={() => setMaxPrice(600000)}
                      className="hover:text-white ml-0.5"
                      title="Clear max price filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={resetFilters}
                  className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-neon-cyan transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
            {/* Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filtered.slice(0, visibleCount).map((p) => {
              const isCompared = compareIds.includes(p.id);

              return (
                <Link
                  key={p.id}
                  to="/product/$productId"
                  params={{ productId: p.id }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl glass neon-border-hover"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-purple/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <img
                      src={p.img}
                      alt={`${p.name} laptop product render`}
                      loading="lazy"
                      width={1024}
                      height={768}
                      className="h-full w-full object-cover object-left transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Compare Button right on top right of the card image */}
                    <button
                      onClick={(e) => toggleCompare(e, p.id)}
                      className={`absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-[10px] font-bold tracking-wider transition-all z-20 ${
                        isCompared
                          ? "bg-neon-cyan text-background shadow-neon-cyan scale-105"
                          : "bg-black/60 backdrop-blur-md border border-white/20 text-muted-foreground hover:text-white hover:border-neon-cyan"
                      }`}
                      title={isCompared ? "Remove from Showdown comparison" : "Add to Showdown comparison"}
                    >
                      {isCompared ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      <span>{isCompared ? "COMPARING" : "COMPARE"}</span>
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-bold tracking-wide truncate">{p.name}</h3>

                    </div>

                    <div className="mt-4 flex flex-col gap-1.5">
                      <SpecPill icon={Cpu} label={p.cpu} />
                      <SpecPill icon={MemoryStick} label={p.ram} />
                      <SpecPill icon={Zap} label={p.gpu} />
                    </div>

                    <div className="mt-auto pt-6 flex flex-col gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">FROM</p>
                        <p className="font-display text-lg sm:text-xl font-bold text-foreground mt-0.5">
                          Rs {p.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(p);
                          }}
                          className="group/btn inline-flex items-center justify-center h-9 px-2.5 rounded-xl bg-neon-cyan/20 border border-neon-cyan/60 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all shadow-[0_0_15px_oklch(0.78_0.18_200/0.15)] hover:shadow-neon-cyan text-xs font-semibold"
                          title="Add to Cart"
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={(e) => {
                            toggleCompare(e, p.id);
                          }}
                          className={`group/btn inline-flex items-center justify-center h-9 px-2.5 rounded-xl text-xs font-semibold transition-all ${
                            isCompared
                              ? "bg-neon-purple/20 border border-neon-purple/60 text-neon-purple"
                              : "bg-gradient-primary text-primary-foreground hover:scale-[1.02] hover:shadow-neon-cyan"
                          }`}
                          title="Compare in Showdown"
                        >
                          {isCompared ? <Check className="h-3.5 w-3.5 mr-1.5 shrink-0" /> : <Scale className="h-3.5 w-3.5 mr-1.5 shrink-0" />}
                          <span>{isCompared ? "Added" : "Compare"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl glass p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
                <div className="rounded-full bg-neon-cyan/10 border border-neon-cyan/30 p-3 text-neon-cyan">
                  <Filter className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-base font-bold text-foreground">No matching machines found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try clearing or widening your filters to view more laptops.
                  </p>
                </div>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 rounded-xl bg-neon-cyan/20 border border-neon-cyan/50 px-4 py-2 text-xs font-bold text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all shadow-[0_0_15px_oklch(0.78_0.18_200/0.2)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>

          {/* Load More Button */}
          {visibleCount < filtered.length && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 8)}
                className="group relative inline-flex items-center gap-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-8 py-3.5 font-display text-sm font-bold uppercase tracking-widest text-neon-cyan transition-all hover:bg-neon-cyan hover:text-background hover:shadow-neon-cyan"
              >
                <span>View More Laptops</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Arena Showdown Tray Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-8 z-40 max-w-xl animate-fade-up">
          <div className="rounded-2xl glass-strong p-4 sm:p-5 border border-neon-cyan/50 shadow-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3 overflow-hidden">
                {compareIds.map((id) => {
                  const prod = productList.find((p) => p.id === id);
                  if (!prod) return null;
                  return (
                    <img
                      key={id}
                      src={prod.img}
                      alt={prod.name}
                      className="inline-block h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-neon-cyan bg-black object-cover"
                      title={prod.name}
                    />
                  );
                })}
              </div>
              <div>
                <p className="font-display text-[10px] uppercase tracking-widest text-neon-cyan font-bold">
                  SHOWDOWN DECK ({compareIds.length}/3)
                </p>
                <p className="text-xs text-foreground font-medium truncate max-w-[180px] sm:max-w-[220px]">
                  {compareIds.map((id) => productList.find((p) => p.id === id)?.name).filter(Boolean).join(", ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={launchCompare}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple px-5 py-2.5 font-display text-xs font-black uppercase tracking-widest text-background shadow-neon-cyan hover:scale-105 transition-all"
              >
                <span>SHOWDOWN ({compareIds.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setCompareIds([])}
                className="rounded-xl border border-glass-border bg-white/5 p-2.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all"
                title="Clear comparison deck"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function FilterGroup({
  icon: Icon,
  label,
  children,
  activeCount = 0,
}: {
  icon?: React.ElementType;
  label: string;
  children: React.ReactNode;
  activeCount?: number;
}) {
  return (
    <div className="mb-5 border-t border-glass-border pt-4 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-display text-[10px] tracking-[0.25em] text-muted-foreground">
          {Icon && <Icon className="h-3.5 w-3.5 text-neon-cyan/80" />}
          <span>{label}</span>
        </div>
        {activeCount > 0 && (
          <span className="rounded-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 px-1.5 py-0.2 text-[9px] font-mono font-bold">
            {activeCount}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
        active
          ? "border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan shadow-[0_0_15px_oklch(0.78_0.18_200/0.35)]"
          : "border-glass-border bg-white/[0.02] text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SpecPill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex w-full items-center gap-2.5 rounded-lg border border-glass-border bg-white/[0.02] px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-neon-cyan" />
      <span className="text-[11px] font-medium text-muted-foreground leading-snug">{label}</span>
    </div>
  );
}
