import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Trophy,
  ChevronDown,
  Monitor,
  Cpu,
  Zap,
  MemoryStick,
  Battery,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { products as initialProducts, type Product } from "@/data/products";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getProducts } from "@/lib/api/client";

interface CompareSearchParams {
  s1?: string;
  s2?: string;
  s3?: string;
}

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>): CompareSearchParams => {
    return {
      s1: typeof search.s1 === "string" ? search.s1 : undefined,
      s2: typeof search.s2 === "string" ? search.s2 : undefined,
      s3: typeof search.s3 === "string" ? search.s3 : undefined,
    };
  },
  component: CompareShowdown,
});

function CompareShowdown() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/compare" });

  const [productList, setProductList] = useState<Product[]>(initialProducts);

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

  const [slot1Id, setSlot1Id] = useState<string>(() =>
    searchParams.s1 && initialProducts.some((p) => p.id === searchParams.s1) ? searchParams.s1 : "1"
  );
  const [slot2Id, setSlot2Id] = useState<string>(() =>
    searchParams.s2 && initialProducts.some((p) => p.id === searchParams.s2) ? searchParams.s2 : "2"
  );
  const [slot3Id, setSlot3Id] = useState<string>(() =>
    searchParams.s3 && initialProducts.some((p) => p.id === searchParams.s3) ? searchParams.s3 : "3"
  );

  useEffect(() => {
    if (searchParams.s1 && productList.some((p) => p.id === searchParams.s1)) setSlot1Id(searchParams.s1);
    if (searchParams.s2 && productList.some((p) => p.id === searchParams.s2)) setSlot2Id(searchParams.s2);
    if (searchParams.s3 && productList.some((p) => p.id === searchParams.s3)) setSlot3Id(searchParams.s3);
  }, [searchParams.s1, searchParams.s2, searchParams.s3, productList]);

  // Track active swap dropdown open states (null | 1 | 2 | 3)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Celebration state when "PICK WINNER ->" is clicked
  const [winnerCelebrated, setWinnerCelebrated] = useState<boolean>(false);

  const slot1 = productList.find((p) => p.id === slot1Id) || productList[0] || initialProducts[0];
  const slot2 = productList.find((p) => p.id === slot2Id) || productList[1] || initialProducts[1];
  const slot3 = productList.find((p) => p.id === slot3Id) || productList[2] || initialProducts[2];

  const selectedSlots = [
    { slotNum: 1, product: slot1, id: slot1Id, setId: setSlot1Id },
    { slotNum: 2, product: slot2, id: slot2Id, setId: setSlot2Id },
    { slotNum: 3, product: slot3, id: slot3Id, setId: setSlot3Id },
  ];

  // Determine top recommended pick across all machines
  const topPick = useMemo(() => {
    // 1. Calculate price bounds based on selected slots
    const selectedPrices = selectedSlots.map(s => s.product.price);
    const maxSelectedPrice = Math.max(...selectedPrices);
    const minSelectedPrice = Math.min(...selectedPrices);
    // Suggest within a similar price range (from 25% cheaper than min up to 25% more than max)
    const maxBudget = maxSelectedPrice * 1.25;
    const minBudget = minSelectedPrice * 0.75;

    // 2. Filter available products
    const validProducts = productList.filter((p) => {
      // Exclude MacBooks completely
      if (p.name.toLowerCase().includes("macbook")) return false;
      if (p.processor === "Apple M Max") return false;
      
      // Keep within similar price bounds
      if (p.price > maxBudget || p.price < minBudget) return false;

      return true;
    });

    // Fallback to all non-MacBooks if no products fit the price range perfectly
    const pool =
      validProducts.length > 0
        ? validProducts
        : productList.filter(
            (p) => !p.name.toLowerCase().includes("macbook") && p.processor !== "Apple M Max"
          );

    let highest = pool[0] || productList[0] || initialProducts[0];
    pool.forEach((p) => {
      const pScore = p.detailedSpecs?.benchmarkScore || 0;
      const hScore = highest.detailedSpecs?.benchmarkScore || 0;
      if (pScore > hScore) {
        highest = p;
      } else if (pScore === hScore && p.price > highest.price) {
        highest = p;
      }
    });
    
    return highest || productList[0] || initialProducts[0];
  }, [slot1Id, slot2Id, slot3Id, productList]);

  const handlePickWinner = () => {
    setWinnerCelebrated(true);
    // Scroll smoothly to the winner card if needed or trigger glow
    setTimeout(() => {
      const winnerElement = document.getElementById(`slot-card-${topPick.id}`);
      winnerElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case "cyan":
        return "border-neon-cyan/60 bg-neon-cyan/20 text-neon-cyan shadow-[0_0_15px_oklch(0.78_0.18_200/0.4)]";
      case "purple":
        return "border-neon-purple/60 bg-neon-purple/20 text-neon-purple shadow-[0_0_15px_oklch(0.62_0.24_295/0.4)]";
      case "blue":
      default:
        return "border-neon-blue/60 bg-neon-blue/20 text-neon-blue shadow-[0_0_15px_oklch(0.7_0.22_260/0.4)]";
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-neon-cyan/30 pt-20 sm:pt-24 pb-24">
      <Navbar />

      {/* Cyber Background Glows */}
      <div className="pointer-events-none fixed top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-neon-cyan/15 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-1/3 right-1/4 -z-10 h-96 w-96 rounded-full bg-neon-purple/15 blur-[120px]" />

      <div className="mx-auto w-full max-w-full px-3 sm:px-6 md:px-8">
        <Link
          to="/"
          className="group mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Home
        </Link>

        {/* Top Recommended Pick Banner */}
        <div
          className={`mb-10 relative overflow-hidden rounded-2xl glass p-6 md:p-8 border transition-all duration-500 animate-fade-up [animation-delay:0.1s] ${
            winnerCelebrated
              ? "border-neon-cyan bg-gradient-to-r from-neon-cyan/15 via-neon-purple/15 to-neon-blue/15 shadow-[0_0_60px_oklch(0.78_0.18_200/0.4)] scale-[1.01]"
              : "border-neon-cyan/40 bg-gradient-to-r from-neon-cyan/10 via-transparent to-neon-purple/10 shadow-[0_0_35px_oklch(0.78_0.18_200/0.2)]"
          }`}
        >
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 -z-10 bg-grid-sm opacity-20 pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {!winnerCelebrated ? (
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan shadow-neon-cyan">
                  <Trophy className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
                    Find the Ultimate Machine
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    Compare your deck and let our algorithm select the best balance of compute, thermal headroom, and value.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border bg-neon-cyan text-background border-neon-cyan shadow-[0_0_30px_oklch(0.78_0.18_200)] animate-bounce">
                  <Trophy className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>

                <div>
                  <p className="font-display text-[10px] sm:text-xs font-bold tracking-[0.25em] text-neon-cyan uppercase flex items-center gap-2">
                    <span>TOP RECOMMENDED PICK ACROSS ALL MACHINES</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-neon-cyan px-2 py-0.5 text-[9px] font-black text-background">
                      <CheckCircle2 className="h-3 w-3" /> WINNER LOCKED
                    </span>
                  </p>
                  <h2 className="font-display mt-1 text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
                    {topPick.name}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    {topPick.id === "2"
                      ? "Standout balance across compute (Apple M Max), memory (96GB Unified), and display fidelity."
                      : topPick.id === "1"
                      ? "Peak gaming benchmark leadership, extreme RTX 5090 graphics, and 240Hz Mini LED responsiveness."
                      : topPick.id === "3"
                      ? "Maximum ECC RAM capacity and workstation Ada generation GPU for mission critical AI/3D workflows."
                      : `Standout compute efficiency with ${topPick.processor} and ${topPick.gpu} processing power.`}
                  </p>
                </div>
              </div>
            )}

            {!winnerCelebrated && (
              <button
                onClick={handlePickWinner}
                className="group/win shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple px-6 py-3.5 font-display text-xs sm:text-sm font-extrabold uppercase tracking-widest text-background shadow-neon-cyan hover:scale-105 transition-all"
              >
                <span>PICK WINNER</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover/win:translate-x-1" />
              </button>
            )}
          </div>
        </div>

        {/* 3-Way Showdown Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 relative">
          {selectedSlots.map(({ slotNum, product, id, setId }) => {
            const isBestPick = winnerCelebrated && product.id === topPick.id;
            const isDropdownOpen = activeDropdown === slotNum;

            return (
              <div
                key={`slot-${slotNum}`}
                id={`slot-card-${product.id}`}
                className={`relative flex flex-col justify-between rounded-3xl glass p-5 sm:p-6 transition-all duration-500 animate-fade-up ${
                  isBestPick
                    ? "border border-neon-cyan/60 bg-gradient-to-b from-white/[0.08] via-glass to-transparent shadow-[0_0_45px_oklch(0.78_0.18_200/0.25)] lg:-translate-y-2"
                    : "border border-glass-border hover:border-white/30"
                }`}
                style={{ animationDelay: `${0.15 + slotNum * 0.1}s` }}
              >
                {/* Slot Top Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-muted-foreground tracking-widest">
                      SLOT #{slotNum}
                    </span>

                    {isBestPick && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/70 bg-neon-cyan/20 px-3 py-1 font-display text-[10px] font-extrabold tracking-widest text-neon-cyan shadow-[0_0_20px_oklch(0.78_0.18_200/0.5)]">
                        <Trophy className="h-3 w-3" />
                        BEST PICK
                      </span>
                    )}
                  </div>

                  {/* Laptop Image Container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-black/70 border border-white/5 group my-3">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <img
                      src={product.img}
                      alt={`${product.name} render`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                    />
                    <span
                      className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 font-display text-[9px] uppercase tracking-widest ${getBadgeStyle(
                        product.badgeColor
                      )}`}
                    >
                      {product.badge}
                    </span>
                  </div>

                  {/* Title and Swap Dropdown Row */}
                  <div className="flex items-center justify-between gap-2 mt-4 relative z-20">
                    <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground truncate">
                      {product.name}
                    </h3>

                    {/* Swap Dropdown Trigger */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            isDropdownOpen ? null : slotNum
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-glass-border bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/15 hover:text-foreground transition-all"
                      >
                        <span>Swap</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            isDropdownOpen ? "rotate-180 text-neon-cyan" : ""
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl glass-strong p-2 shadow-elevated border border-white/20 z-50 animate-fade-up">
                          <p className="px-3 py-1.5 font-display text-[10px] tracking-widest text-muted-foreground uppercase border-b border-white/10 mb-1">
                            Select Model for Slot #{slotNum}
                          </p>
                          <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
                            {productList.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setId(m.id);
                                  setActiveDropdown(null);
                                }}
                                className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                                  m.id === id
                                    ? "bg-neon-cyan/20 text-neon-cyan font-bold border border-neon-cyan/40"
                                    : "text-foreground hover:bg-white/10"
                                }`}
                              >
                                <span className="font-display uppercase tracking-wider truncate">
                                  {m.name}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
                                  Rs {m.price.toLocaleString()}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-2xl sm:text-3xl font-black text-neon-cyan">
                      Rs {product.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Specs List with Icons */}
                  <div className="mt-6 flex flex-col gap-3.5 border-t border-glass-border pt-5">
                    <SpecRow
                      icon={Monitor}
                      label="Display"
                      value={product.display}
                    />
                    <SpecRow
                      icon={Cpu}
                      label="Processor"
                      value={product.cpu}
                    />
                    <SpecRow
                      icon={Zap}
                      label="Graphics"
                      value={product.gpu}
                    />
                    <SpecRow
                      icon={MemoryStick}
                      label="Memory"
                      value={product.ram}
                    />
                    <SpecRow
                      icon={Battery}
                      label="Battery & Weight"
                      value={product.batteryWeight}
                    />
                  </div>
                </div>

                {/* Special Highlight Box & CTA Button */}
                <div className="mt-6">
                  <div className="rounded-xl border border-glass-border bg-white/[0.03] p-3.5 mb-5 group hover:border-neon-cyan/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono uppercase tracking-widest">
                      <Sparkles className="h-3.5 w-3.5 text-neon-cyan shrink-0" />
                      <span>SPECIAL HIGHLIGHT</span>
                    </div>
                    <p className="mt-1 font-sans text-xs sm:text-sm font-bold text-foreground leading-snug">
                      {product.specialHighlight}
                    </p>
                  </div>

                  {/* Action Button */}
                  <Link
                    to="/product/$productId"
                    params={{ productId: product.id }}
                    className={`group/btn flex items-center justify-center gap-2 w-full rounded-xl py-3.5 font-display text-xs font-bold uppercase tracking-widest transition-all ${
                      isBestPick
                        ? "bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple text-background shadow-[0_0_25px_oklch(0.78_0.18_200/0.6)] hover:scale-[1.02]"
                        : "border border-glass-border bg-white/[0.03] text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    }`}
                  >
                    <span>CONFIGURE & BUY</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </main>
  );
}

function SpecRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) {
  const displayVal = value || " ";
  return (
    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
      <div className="flex items-center gap-2.5 text-muted-foreground shrink-0">
        <Icon className="h-4 w-4 text-neon-cyan shrink-0" />
        <span className="font-medium">{label}</span>
      </div>
      <span className="font-bold text-foreground text-right truncate max-w-[55%]" title={displayVal}>
        {displayVal}
      </span>
    </div>
  );
}
