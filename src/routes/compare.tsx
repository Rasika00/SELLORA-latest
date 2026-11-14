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
  Star,
} from "lucide-react";
import { products as initialProducts, type Product } from "@/data/products";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getProducts } from "@/lib/api/client";
import { useUIMode } from "@/context/UIModeContext";

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
  const { isSimple } = useUIMode();

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

  const [slot1Id, setSlot1Id] = useState<string>(() => searchParams.s1 || "1");
  const [slot2Id, setSlot2Id] = useState<string>(() => searchParams.s2 || "2");
  const [slot3Id, setSlot3Id] = useState<string>(() => searchParams.s3 || "3");

  useEffect(() => {
    if (searchParams.s1) setSlot1Id(searchParams.s1);
    if (searchParams.s2) setSlot2Id(searchParams.s2);
    if (searchParams.s3) setSlot3Id(searchParams.s3);
  }, [searchParams.s1, searchParams.s2, searchParams.s3]);

  // Track active swap dropdown open states (null | 1 | 2 | 3)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Celebration state when "PICK WINNER ->" is clicked
  const [winnerCelebrated, setWinnerCelebrated] = useState<boolean>(false);

  const slot1 =
    productList.find((p) => p.id === slot1Id) ||
    initialProducts.find((p) => p.id === slot1Id) ||
    productList[0] ||
    initialProducts[0];
  const slot2 =
    productList.find((p) => p.id === slot2Id) ||
    initialProducts.find((p) => p.id === slot2Id) ||
    productList[1] ||
    initialProducts[1];
  const slot3 =
    productList.find((p) => p.id === slot3Id) ||
    initialProducts.find((p) => p.id === slot3Id) ||
    productList[2] ||
    initialProducts[2];

  const selectedSlots = [
    { slotNum: 1, product: slot1, id: slot1Id, setId: setSlot1Id },
    { slotNum: 2, product: slot2, id: slot2Id, setId: setSlot2Id },
    { slotNum: 3, product: slot3, id: slot3Id, setId: setSlot3Id },
  ];

  // Determine top showdown winner strictly within the selected 3 laptops
  const showdownWinner = useMemo(() => {
    const candidates = [
      { slotNum: 1, product: slot1 },
      { slotNum: 2, product: slot2 },
      { slotNum: 3, product: slot3 },
    ];

    let winnerCandidate = candidates[0];
    let highestScore = -Infinity;

    candidates.forEach((c) => {
      const score = c.product.detailedSpecs?.benchmarkScore || 0;
      if (score > highestScore) {
        highestScore = score;
        winnerCandidate = c;
      } else if (score === highestScore) {
        // Break tie by price-to-performance (lower price)
        if (c.product.price < winnerCandidate.product.price) {
          winnerCandidate = c;
        }
      }
    });

    const winner = winnerCandidate.product;
    const rivals = candidates.filter((c) => c.slotNum !== winnerCandidate.slotNum);
    
    // Sort rivals by benchmark score descending to find runner-up
    const sortedRivals = [...rivals].sort(
      (a, b) => (b.product.detailedSpecs?.benchmarkScore || 0) - (a.product.detailedSpecs?.benchmarkScore || 0)
    );
    const runnerUp = sortedRivals[0];
    const runnerUpScore = runnerUp?.product.detailedSpecs?.benchmarkScore || 0;
    const scoreDiff = highestScore - runnerUpScore;
    const pctDiff = runnerUpScore > 0 ? Math.round((scoreDiff / runnerUpScore) * 100) : 0;

    let explanation = "";
    if (scoreDiff > 0) {
      explanation = `Selected from your 3 chosen laptops: ${winner.name} (Slot #${winnerCandidate.slotNum}) wins this showdown! It outperforms ${runnerUp.product.name} (Slot #${runnerUp.slotNum}) by +${scoreDiff.toLocaleString()} pts (+${pctDiff}%) in synthetic compute and gaming performance, backed by ${winner.cpu} and ${winner.gpu}.`;
    } else {
      explanation = `Selected from your 3 chosen laptops: ${winner.name} (Slot #${winnerCandidate.slotNum}) takes the crown with unmatched performance-per-rupee balance, powered by ${winner.cpu} and ${winner.gpu}.`;
    }

    if (winner.specialHighlight) {
      explanation += ` Key advantage: ${winner.specialHighlight}.`;
    }

    return {
      product: winner,
      slotNum: winnerCandidate.slotNum,
      benchmarkScore: highestScore,
      scoreDiff,
      pctDiff,
      explanation,
      runnerUpProduct: runnerUp?.product,
      runnerUpSlotNum: runnerUp?.slotNum,
      candidates,
    };
  }, [slot1, slot2, slot3]);

  const handlePickWinner = () => {
    setWinnerCelebrated(true);
    // Scroll smoothly to the winner card
    setTimeout(() => {
      const winnerElement = document.getElementById(`slot-card-${showdownWinner.product.id}`);
      winnerElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleSwapSlot = (slotNum: number, newId: string) => {
    const nextS1 = slotNum === 1 ? newId : slot1Id;
    const nextS2 = slotNum === 2 ? newId : slot2Id;
    const nextS3 = slotNum === 3 ? newId : slot3Id;
    if (slotNum === 1) setSlot1Id(newId);
    if (slotNum === 2) setSlot2Id(newId);
    if (slotNum === 3) setSlot3Id(newId);
    setActiveDropdown(null);
    navigate({
      to: "/compare",
      search: { s1: nextS1, s2: nextS2, s3: nextS3 },
      replace: true,
    });
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

  // Simple Mode: compute star ratings (1-5) per category for each laptop
  const getSimpleRatings = (p: Product) => {
    const benchScore = p.detailedSpecs?.benchmarkScore || 0;
    const maxScore = Math.max(
      slot1?.detailedSpecs?.benchmarkScore || 0,
      slot2?.detailedSpecs?.benchmarkScore || 0,
      slot3?.detailedSpecs?.benchmarkScore || 0,
      1
    );
    const gpuLower = (p.gpu || "").toLowerCase();
    const gameStars = gpuLower.includes("4090") ? 5 : gpuLower.includes("4080") ? 4 : gpuLower.includes("4070") ? 4 : gpuLower.includes("4060") ? 3 : gpuLower.includes("4050") ? 3 : gpuLower.includes("ada") ? 5 : gpuLower.includes("apple") ? 4 : 2;
    const batteryRaw = p.batteryWeight || "";
    const batteryNum = parseInt(batteryRaw.match(/(\d+)Wh/)?.[1] || "60");
    const batteryStars = batteryNum >= 99 ? 5 : batteryNum >= 80 ? 4 : batteryNum >= 70 ? 3 : batteryNum >= 60 ? 2 : 1;
    const perfStars = Math.round((benchScore / maxScore) * 4) + 1;
    const portableRaw = batteryRaw.match(/([\d.]+)kg/)?.[1];
    const weight = portableRaw ? parseFloat(portableRaw) : 2.5;
    const portableStars = weight <= 1.2 ? 5 : weight <= 1.8 ? 4 : weight <= 2.2 ? 3 : weight <= 2.8 ? 2 : 1;
    return {
      gaming: Math.min(5, Math.max(1, gameStars)),
      battery: Math.min(5, Math.max(1, batteryStars)),
      performance: Math.min(5, Math.max(1, perfStars)),
      portable: Math.min(5, Math.max(1, portableStars)),
    };
  };

  const getSimpleWinnerExplanation = () => {
    const w = showdownWinner.product;
    const gpuLower = w.gpu.toLowerCase();
    if (gpuLower.includes("4090") || gpuLower.includes("4080")) {
      return `This one gives you the best performance for gaming and heavy work at this price.`;
    }
    if (gpuLower.includes("4070") || gpuLower.includes("4060")) {
      return `This one gives you the best value for gaming and everyday tasks at this price.`;
    }
    if (gpuLower.includes("ada")) {
      return `This is the top pick for creative professionals who need serious power.`;
    }
    if (w.category === "Ultrabook") {
      return `This is the best option if you want something light, fast, and great for everyday use.`;
    }
    return `This one offers the best overall value for money among your three selections.`;
  };

  // ──────────────────────────────────────────────────────────
  // SIMPLE MODE RENDER
  // ──────────────────────────────────────────────────────────
  if (isSimple) {
    return (
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden pt-20 sm:pt-24 pb-24">
        <Navbar />
        <div className="mx-auto w-full max-w-full px-3 sm:px-6 md:px-8">
          <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to laptops
          </Link>

          {/* Simple header */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">Compare Laptops</h1>
            <p className="mt-2 text-sm text-muted-foreground">See how these laptops compare side by side in plain language.</p>
          </div>

          {/* Winner Banner */}
          {winnerCelebrated && (
            <div className="mb-8 rounded-2xl border-2 border-neon-cyan bg-neon-cyan/10 p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-neon-cyan" />
                <span className="font-bold text-lg text-foreground">Top Pick: {showdownWinner.product.name}</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{getSimpleWinnerExplanation()}</p>
              <Link
                to="/product/$productId"
                params={{ productId: showdownWinner.product.id }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-neon-cyan px-6 py-2.5 text-sm font-bold text-background hover:scale-105 transition-all shadow-neon-cyan"
              >
                Buy Now — Rs {showdownWinner.product.price.toLocaleString()}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {!winnerCelebrated && (
            <div className="mb-8 text-center">
              <button
                onClick={handlePickWinner}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple px-6 py-3 font-bold text-sm text-background shadow-neon-cyan hover:scale-105 transition-all"
              >
                <Trophy className="h-4 w-4" />
                Which one should I pick?
              </button>
            </div>
          )}

          {/* Simple comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedSlots.map(({ slotNum, product }) => {
              const isBestPick = winnerCelebrated && product.id === showdownWinner.product.id;
              const ratings = getSimpleRatings(product);
              return (
                <div
                  key={`slot-${slotNum}`}
                  className={`rounded-2xl border p-5 transition-all ${
                    isBestPick
                      ? "border-2 border-neon-cyan bg-neon-cyan/5 shadow-[0_0_30px_oklch(0.78_0.18_200/0.2)]"
                      : "border-glass-border bg-card"
                  }`}
                >
                  {isBestPick && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Trophy className="h-4 w-4 text-neon-cyan" />
                      <span className="text-xs font-bold text-neon-cyan uppercase tracking-wider">Top Pick</span>
                    </div>
                  )}

                  <img src={product.img} alt={product.name} className="w-full aspect-[4/3] object-cover object-left rounded-xl mb-4 bg-black" />
                  <h3 className="font-bold text-lg text-foreground">{product.name}</h3>
                  <p className="text-sm font-bold text-neon-cyan mt-1">Rs {product.price.toLocaleString()}</p>

                  {/* Star ratings */}
                  <div className="mt-4 flex flex-col gap-2">
                    {([
                      { label: "Gaming", stars: ratings.gaming },
                      { label: "Battery Life", stars: ratings.battery },
                      { label: "Performance", stars: ratings.performance },
                      { label: "Portability", stars: ratings.portable },
                    ] as const).map(({ label, stars }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= stars ? "fill-neon-cyan text-neon-cyan" : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <Link
                    to="/product/$productId"
                    params={{ productId: product.id }}
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                      isBestPick
                        ? "bg-neon-cyan text-background hover:scale-[1.02] shadow-neon-cyan"
                        : "border border-glass-border text-muted-foreground hover:border-neon-cyan/50 hover:text-foreground"
                    }`}
                  >
                    {isBestPick ? "Buy Now" : "View Details"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  {/* Swap */}
                  <div className="mt-3 relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === slotNum ? null : slotNum)}
                      className="w-full rounded-lg border border-glass-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all flex items-center justify-center gap-1"
                    >
                      <span>Swap laptop</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeDropdown === slotNum ? "rotate-180" : ""}`} />
                    </button>
                    {activeDropdown === slotNum && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-glass-border bg-card p-2 shadow-elevated">
                        <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                          {productList.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => handleSwapSlot(slotNum, m.id)}
                              className="rounded-lg px-3 py-2 text-left text-xs text-foreground hover:bg-foreground/10 truncate"
                            >
                              {m.name} — Rs {m.price.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
              ? "border-neon-cyan bg-gradient-to-r from-neon-cyan/20 via-neon-purple/15 to-neon-blue/15 shadow-[0_0_60px_oklch(0.78_0.18_200/0.45)] scale-[1.01]"
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
                    Showdown Arena: 3-Way Battle
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    Review your 3 chosen laptops side-by-side or calculate the ultimate winner strictly within your selection based on synthetic compute benchmarks, thermals, and specs.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border bg-neon-cyan text-background border-neon-cyan shadow-[0_0_35px_oklch(0.78_0.18_200)] animate-bounce">
                  <Trophy className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>

                <div>
                  <p className="font-display text-[10px] sm:text-xs font-bold tracking-[0.25em] text-neon-cyan uppercase flex flex-wrap items-center gap-2">
                    <span>SHOWDOWN CHAMPION · SLOT #{showdownWinner.slotNum}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-neon-cyan px-2.5 py-0.5 text-[9px] font-black text-background">
                      <CheckCircle2 className="h-3 w-3" /> BEST OF YOUR 3 SELECTED LAPTOPS
                    </span>
                  </p>
                  <h2 className="font-display mt-1 text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
                    {showdownWinner.product.name}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    {showdownWinner.explanation}
                  </p>
                </div>
              </div>
            )}

            {!winnerCelebrated ? (
              <button
                onClick={handlePickWinner}
                className="group/win shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple px-6 py-3.5 font-display text-xs sm:text-sm font-extrabold uppercase tracking-widest text-background shadow-neon-cyan hover:scale-105 transition-all"
              >
                <span>PICK WINNER WITHIN SELECTION</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover/win:translate-x-1" />
              </button>
            ) : (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setWinnerCelebrated(false)}
                  className="rounded-full border border-glass-border bg-white/5 px-4 py-2 text-xs font-display uppercase tracking-widest text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all"
                >
                  Reset Winner
                </button>
                <div className="rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-2 text-center">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neon-cyan font-bold">Top Score</div>
                  <div className="font-display text-lg font-black text-foreground">{showdownWinner.benchmarkScore.toLocaleString()} pts</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3-Way Showdown Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 relative">
          {selectedSlots.map(({ slotNum, product, id }) => {
            const isBestPick = winnerCelebrated && product.id === showdownWinner.product.id;
            const isRunnerUp = winnerCelebrated && !isBestPick;
            const isDropdownOpen = activeDropdown === slotNum;
            const benchScore = product.detailedSpecs?.benchmarkScore || 0;
            const scoreDelta = benchScore - showdownWinner.benchmarkScore;

            return (
              <div
                key={`slot-${slotNum}`}
                id={`slot-card-${product.id}`}
                className={`relative flex flex-col justify-between rounded-3xl glass p-5 sm:p-6 transition-all duration-500 animate-fade-up ${
                  isBestPick
                    ? "border-2 border-neon-cyan bg-gradient-to-b from-neon-cyan/15 via-white/[0.04] to-transparent shadow-[0_0_50px_oklch(0.78_0.18_200/0.35)] ring-2 ring-neon-cyan/50 lg:-translate-y-2"
                    : isRunnerUp
                    ? "border border-glass-border opacity-90 hover:opacity-100"
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

                    {isBestPick ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/80 bg-neon-cyan/25 px-3 py-1 font-display text-[10px] font-extrabold tracking-widest text-neon-cyan shadow-[0_0_25px_oklch(0.78_0.18_200/0.6)] animate-pulse">
                        <Trophy className="h-3 w-3" />
                        SHOWDOWN WINNER
                      </span>
                    ) : isRunnerUp ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-display text-[9px] font-semibold tracking-wider text-muted-foreground">
                        CONTENDER ({scoreDelta === 0 ? "TIED" : `${scoreDelta.toLocaleString()} pts`})
                      </span>
                    ) : null}
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
                                onClick={() => handleSwapSlot(slotNum, m.id)}
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
                  <div className="mt-6 flex flex-col gap-2.5 border-t border-glass-border pt-5">
                    {/* Benchmark Score spec row */}
                    <SpecRow
                      icon={Sparkles}
                      label="Benchmark Score"
                      value={
                        product.detailedSpecs?.benchmarkScore
                          ? `${product.detailedSpecs.benchmarkScore.toLocaleString()} pts`
                          : "N/A"
                      }
                      highlight={isBestPick}
                    />
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
                        ? "bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple text-background shadow-[0_0_25px_oklch(0.78_0.18_200/0.6)] hover:scale-[1.02] font-black"
                        : "border border-glass-border bg-white/[0.03] text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    }`}
                  >
                    <span>{isBestPick ? "WINNER · CONFIGURE & BUY" : "CONFIGURE & BUY"}</span>
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
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  highlight?: boolean;
}) {
  const displayVal = value || " ";
  return (
    <div
      className={`flex items-center justify-between gap-3 text-xs sm:text-sm py-1 px-1.5 rounded-lg transition-colors ${
        highlight ? "bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan" : ""
      }`}
    >
      <div className="flex items-center gap-2.5 text-muted-foreground shrink-0">
        <Icon className={`h-4 w-4 shrink-0 ${highlight ? "text-neon-cyan font-bold" : "text-neon-cyan"}`} />
        <span className={highlight ? "font-bold text-foreground" : "font-medium"}>{label}</span>
      </div>
      <span
        className={`text-right truncate max-w-[55%] ${
          highlight ? "font-black text-neon-cyan font-mono" : "font-bold text-foreground"
        }`}
        title={displayVal}
      >
        {displayVal}
      </span>
    </div>
  );
}
