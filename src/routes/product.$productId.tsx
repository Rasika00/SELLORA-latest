import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Cpu,
  MemoryStick,
  Zap,
  Fingerprint,
  Shield,
  Battery,
  Expand,
  ShoppingCart,
  Gauge,
  Check,
  Store,
  CheckCircle2,
  Truck,
  MapPin,
  Sparkles,
} from "lucide-react";
import { products, type Product } from "@/data/products";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PerformanceEstimator } from "@/components/site/PerformanceEstimator";
import { ProductReviewsSection } from "@/components/site/ProductReviewsSection";
import { useCart } from "@/context/CartContext";
import { getProductById } from "@/lib/api/client";
import { useUIMode } from "@/context/UIModeContext";
import { calculateBenchmark } from "@/lib/benchmarkEngine";

export const Route = createFileRoute("/product/$productId")({
  component: ProductDetails,
});

function ProductDetails() {
  const { productId } = Route.useParams();
  const [product, setProduct] = useState<Product | undefined>(() =>
    products.find((p) => p.id === productId)
  );
  const { addToCart } = useCart();
  const { isSimple } = useUIMode();

  const benchmark = useMemo(() => {
    if (!product) return null;
    return calculateBenchmark(product);
  }, [product]);

  useEffect(() => {
    let mounted = true;
    getProductById(productId).then((found) => {
      if (mounted && found) {
        setProduct(found);
      }
    });
    return () => {
      mounted = false;
    };
  }, [productId]);

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Laptop not found</h1>
          <Link to="/" className="mt-4 inline-block text-neon-cyan hover:underline">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  const stockCount = typeof (product as any).stock === "number" ? (product as any).stock : 12;

  // Determine glow color class based on badgeColor
  const glowColor =
    product.badgeColor === "cyan" ? "bg-neon-cyan/20" :
      product.badgeColor === "purple" ? "bg-neon-purple/20" :
        "bg-neon-blue/20";

  const textColor =
    product.badgeColor === "cyan" ? "text-neon-cyan" :
      product.badgeColor === "purple" ? "text-neon-purple" :
        "text-neon-blue";

  const borderColor =
    product.badgeColor === "cyan" ? "border-neon-cyan/40" :
      product.badgeColor === "purple" ? "border-neon-purple/40" :
        "border-neon-blue/40";

  // Simple Mode plain highlights
  const getSimpleHighlights = (p: Product): string[] => {
    const h: string[] = [];
    const gpu = p.gpu.toLowerCase();
    const cpu = p.cpu.toLowerCase();
    const ram = parseInt(p.ram);
    if (gpu.includes("4080") || gpu.includes("4090") || gpu.includes("4070")) h.push("Great for gaming & creative work");
    else if (gpu.includes("4060") || gpu.includes("4050")) h.push("Good for gaming");
    else if (gpu.includes("ada")) h.push("Professional workstation GPU");
    else h.push("Good for everyday tasks");
    if (ram >= 32) h.push("Handles heavy multitasking easily");
    else if (ram >= 16) h.push("Smooth multitasking");
    if (p.category === "Ultrabook" || cpu.includes("apple") || cpu.includes("m3")) h.push("Lightweight & portable");
    if (p.category === "Workstation") h.push("Built for professional workloads");
    const bat = p.batteryWeight || "";
    const wh = parseInt(bat.match(/(\d+)Wh/)?.[1] || "0");
    if (wh >= 80) h.push("Long battery life");
    return h.slice(0, 4);
  };

  // ──────────────────────────────────────────────────────────
  // SIMPLE MODE RENDER
  // ──────────────────────────────────────────────────────────
  if (isSimple) {
    const highlights = getSimpleHighlights(product);
    const suggestions = [...products]
      .filter((p) => p.id !== product.id)
      .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
      .slice(0, 3);

    return (
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <Navbar />
        <div className="pt-24 pb-32 mx-auto w-full max-w-full px-4 sm:px-8 md:px-12">
          <Link to="/" className="group mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to laptops
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Image */}
            <div className="rounded-2xl overflow-hidden border border-border bg-secondary/40">
              <img src={product.img} alt={product.name} className="w-full aspect-[4/3] object-cover object-left" />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-mono font-medium text-primary uppercase tracking-wider">{product.badge}</p>
                  {stockCount > 0 ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 font-bold">
                      {stockCount} in stock
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/25 font-bold">
                      Sold out
                    </span>
                  )}
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">{product.name}</h1>
                <p className="text-2xl font-bold text-foreground mt-2">Rs {product.price.toLocaleString()}</p>
              </div>

              {/* Plain highlights */}
              <div className="flex flex-col gap-2">
                {highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{h}</span>
                  </div>
                ))}
              </div>

              {/* Buy actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={() => addToCart(product)}
                  disabled={stockCount <= 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-card border border-border py-3.5 text-sm font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {stockCount > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
                {stockCount > 0 ? (
                  <Link
                    to={`/checkout/${product.id}`}
                    className="flex-1 flex items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                  >
                    Buy Now
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center rounded-xl bg-secondary py-3.5 text-sm font-bold text-muted-foreground cursor-not-allowed border border-border"
                  >
                    Unavailable
                  </button>
                )}
              </div>

              {/* Specs (simple) */}
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2.5 mt-2 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Specs</p>
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">{product.cpu}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MemoryStick className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">{product.ram} RAM</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">{product.gpu}</span>
                </div>
                {product.batteryWeight && (
                  <div className="flex items-center gap-2 text-sm">
                    <Battery className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-foreground">{product.batteryWeight}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Simple Mode Benchmark Card */}
          {benchmark && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-5 flex items-center justify-between shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Benchmark Score</h3>
                  <p className="text-xs text-muted-foreground">Comprehensive compute capability</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-primary">
                  {benchmark.totalScore.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground ml-1">pts</span>
              </div>
            </div>
          )}

          {/* Performance Check in Simple Mode */}
          <div className="mt-16">
            <h2 className="font-display text-xl font-bold mb-6">Will it handle your tasks?</h2>
            <PerformanceEstimator initialProductId={product.id} isCompactEmbedded={true} />
          </div>

          {/* Customer Reviews & Verified Buyer Feedback Section */}
          <div className="mt-16">
            <ProductReviewsSection productId={product.id} productName={product.name} />
          </div>

          {/* Similar laptops - simplified */}
          {suggestions.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-xl font-bold mb-6">Similar laptops</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {suggestions.map((s) => (
                  <Link key={s.id} to="/product/$productId" params={{ productId: s.id }} className="flex flex-col rounded-xl border border-glass-border bg-card overflow-hidden hover:border-neon-cyan/40 transition-all">
                    <img src={s.img} alt={s.name} className="aspect-[4/3] object-cover object-left bg-black" />
                    <div className="p-3">
                      <p className="font-semibold text-sm text-foreground truncate">{s.name}</p>
                      <p className="text-sm font-bold text-neon-cyan mt-0.5">Rs {s.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-glass-border bg-background/90 backdrop-blur-xl px-4 py-3">
          <div className="mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <p className="font-bold text-lg text-foreground">Rs {product.price.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addToCart(product)}
                disabled={stockCount <= 0}
                className="rounded-full border border-glass-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-neon-cyan/50 hover:text-neon-cyan transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {stockCount > 0 ? "Add to Cart" : "Out of Stock"}
              </button>
              {stockCount > 0 ? (
                <Link to={`/checkout/${product.id}`} className="rounded-full bg-neon-cyan px-6 py-2.5 text-sm font-bold text-background hover:scale-105 transition-all shadow-neon-cyan">
                  Buy Now
                </Link>
              ) : (
                <button disabled className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-bold text-muted-foreground cursor-not-allowed">
                  Unavailable
                </button>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <Navbar />

      {/* Immersive Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center pt-24 pb-32 isolate">
        <div className="absolute inset-0 -z-20 bg-grid opacity-20 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" />

        {/* Massive overlapping text */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden pointer-events-none">
          <h1 className="font-display text-[14vw] font-black uppercase text-foreground/[0.03] whitespace-nowrap select-none tracking-tighter">
            {product.category}
          </h1>
        </div>

        {/* Ambient Glows */}
        <div className={`pointer-events-none absolute left-1/4 top-1/2 -z-10 h-[50vh] w-[50vw] -translate-x-1/2 -translate-y-1/2 rounded-full ${glowColor} blur-[120px] opacity-40 animate-glow-pulse`} />

        <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 md:px-8">
          <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-mono text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to grid
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left side: Image */}
            <div className="relative animate-fade-up [animation-delay:0.1s] lg:col-span-7">
              <div className="group relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-card aspect-[4/3] sm:aspect-[16/9] lg:aspect-[4/3]">
                <img
                  src={product.img}
                  alt={`${product.name} High Resolution Render`}
                  className="h-full w-full object-cover object-left transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

                {/* Decorative HUD Elements */}
                <div className="absolute top-6 left-6 hidden md:flex flex-col gap-1 rounded-lg bg-background/85 border border-border px-3 py-2 text-[10px] text-muted-foreground tracking-[0.2em] font-mono backdrop-blur-md">
                  <span className="text-primary font-bold">SYS.STATUS: OPTIMAL</span>
                  <span>TEMP: 32°C</span>
                  <span>VOLTAGE: 1.2V</span>
                </div>
                <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-2 rounded-full bg-background/85 border border-border px-4 py-2 text-[10px] text-primary tracking-[0.2em] font-mono backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  LINK ACTIVE
                </div>
              </div>
            </div>

            {/* Right side: Details & Algo */}
            <div className="flex flex-col items-start max-w-full lg:col-span-5">
              <span className={`mb-6 inline-block rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] ${borderColor} ${textColor} bg-primary/10 backdrop-blur-md animate-fade-up max-w-full truncate font-semibold`}>
                {product.badge}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase animate-fade-up break-words max-w-full [animation-delay:0.1s] text-foreground">
                {product.name}
              </h2>
              <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground animate-fade-up break-words [animation-delay:0.2s]">
                Engineered with {product.processor}. Built for unprecedented performance.
              </p>

              {/* Live Inventory Stock Badge */}
              <div className="mt-4 flex items-center gap-2 animate-fade-up [animation-delay:0.22s]">
                {stockCount > 5 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>In Stock: {stockCount} units ready for express dispatch</span>
                  </span>
                ) : stockCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-500">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Low Stock: Only {stockCount} units remaining in inventory!</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-destructive/10 border border-destructive/25 text-destructive">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <span>Out of Stock (Currently replenishing)</span>
                  </span>
                )}
              </div>

              {/* Benchmark Quick Badge */}
              {benchmark && (
                <div className="mt-3 flex items-center gap-2.5 flex-wrap animate-fade-up [animation-delay:0.23s]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-mono text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Benchmark Score: <strong className="text-foreground font-bold">{benchmark.totalScore.toLocaleString()} pts</strong></span>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2.5 animate-fade-up [animation-delay:0.25s]">
                <a
                  href="#product-estimator"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary hover:text-primary-foreground shadow-sm"
                >
                  <Gauge className="h-3.5 w-3.5" />
                  <span>Test My Apps on This Machine ↓</span>
                </a>
              </div>

              {/* Multi-Seller Merchant & Fulfillment Intelligence Card */}
              <div className="mt-6 w-full rounded-2xl border border-border bg-card p-5 shadow-card relative overflow-hidden animate-fade-up [animation-delay:0.28s]">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary shrink-0">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground block">
                        Sold &amp; Dispatched by
                      </span>
                      <h4 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <span>{product.seller?.storeName || "SELLORA Central Direct"}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/25 px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-primary">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                        </span>
                      </h4>
                    </div>
                  </div>

                  <span className="rounded-lg bg-secondary border border-border px-2 py-1 text-[10px] font-mono text-muted-foreground shrink-0">
                    Direct Partner
                  </span>
                </div>

                {product.seller?.storeBio ? (
                  <p className="text-xs text-muted-foreground leading-relaxed italic mb-4">
                    "{product.seller.storeBio}"
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Authorized hardware distributor with official regional warranty coverage and certified diagnostics.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-[11px] font-mono text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Dispatches in 24h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{product.seller?.address || "Global Hub"}</span>
                  </div>
                </div>
              </div>

              {/* Auto Suggestion Comparison Algorithm */}
              <div className="mt-10 w-full animate-fade-up [animation-delay:0.3s]">
                <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <h3 className="font-mono text-xs tracking-[0.2em] uppercase font-semibold text-muted-foreground">SIMILAR SUGGESTIONS</h3>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  {(() => {
                    const suggestedLaptops = [...products]
                      .filter(p => p.id !== product.id)
                      .sort((a, b) => {
                        const scoreA = Math.abs(a.price - product.price) + (a.category === product.category ? 0 : product.price * 0.2);
                        const scoreB = Math.abs(b.price - product.price) + (b.category === product.category ? 0 : product.price * 0.2);
                        return scoreA - scoreB;
                      })
                      .slice(0, 2);

                    return (
                      <>
                        {suggestedLaptops.map(match => (
                          <div key={match.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl p-3 border border-border hover:border-primary/40 transition-colors bg-card shadow-sm gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={match.img} alt={match.name} className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-secondary/40 object-cover shrink-0 border border-border" />
                              <div className="min-w-0 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-display text-sm font-bold text-foreground truncate">{match.name}</p>
                                  <span className="text-[9px] uppercase tracking-widest text-primary font-mono">{match.processor}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">{match.ram}</span>
                                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">{match.gpu}</span>
                                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">{match.cpu}</span>
                                  {match.display && <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">{match.display.split(' ')[0]}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {suggestedLaptops.length > 0 && (
                          <Link
                            to="/compare"
                            search={{
                              s1: product.id,
                              s2: suggestedLaptops[0]?.id || "2",
                              s3: suggestedLaptops[1]?.id || "3"
                            } as any}
                            className="mt-3 flex items-center justify-center rounded-xl bg-primary/10 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-primary border border-primary/25 hover:bg-primary hover:text-primary-foreground transition-colors w-full shadow-sm"
                          >
                            Compare All Machines
                          </Link>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications HUD Section */}
      <section className="relative py-24 bg-card/40 border-y border-border">
        <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 md:px-8">
          <div className="mb-16 flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-mono text-xs tracking-[0.25em] uppercase font-semibold text-muted-foreground">TECHNICAL SPECIFICATIONS</h3>
            <Expand className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <HUDCard icon={Sparkles} label="Benchmark Score" value={`${benchmark ? benchmark.totalScore.toLocaleString() : product.detailedSpecs?.benchmarkScore?.toLocaleString() || "9,750"} pts`} desc="Synthetic Compute Index" color="cyan" />
            <HUDCard icon={Cpu} label="Compute Core" value={product.cpu} desc="Next gen architecture" color="purple" />
            <HUDCard icon={Zap} label="Visual Engine" value={product.gpu} desc="Ray tracing enabled" color="blue" />
            <HUDCard icon={MemoryStick} label="Memory Bus" value={product.ram} desc="High throughput" color="cyan" />
            <HUDCard icon={Expand} label="Display" value={product.display || "16 inch OLED"} desc="High refresh display" color="purple" />
            <HUDCard icon={Battery} label="Power" value={product.batteryWeight || "99.9Wh"} desc="All day battery life" color="blue" />
          </div>
        </div>
      </section>

      {/* Interactive Workload & Game Estimator Section */}
      <section id="product-estimator" className="relative py-20 border-b border-border scroll-mt-20 bg-background">
        <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 md:px-8">
          <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
            <div>
              <span className="font-mono text-[10px] tracking-[0.25em] text-primary uppercase font-bold">
                REAL-TIME HARDWARE ESTIMATOR
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground mt-1">
                Will {product.name} Run Your Daily Workload?
              </h3>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-mono text-primary">
              <Gauge className="h-3.5 w-3.5" />
              <span>{product.gpu} Evaluated</span>
            </div>
          </div>

          <PerformanceEstimator initialProductId={product.id} isCompactEmbedded={true} />
        </div>
      </section>

      {/* Customer Reviews & Verified Buyer Feedback Section */}
      <ProductReviewsSection productId={product.id} productName={product.name} />

      {/* Sticky Command Center / Footer Spacer */}
      <div className="h-32" />

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl px-4 sm:px-8 md:px-12 py-3 sm:py-3.5 animate-fade-up">
        <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Configure from</span>
              {stockCount > 0 ? (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 font-bold">
                  {stockCount} in stock
                </span>
              ) : (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/25 font-bold">
                  Sold out
                </span>
              )}
            </div>
            <span className="font-display text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">
              Rs {product.price.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto gap-2.5 sm:gap-3">
            <button
              onClick={() => addToCart(product)}
              disabled={stockCount <= 0}
              className="flex-1 sm:flex-none rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-all text-center whitespace-normal sm:whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-primary" />
              {stockCount > 0 ? "Add to Cart" : "Out of Stock"}
            </button>
            {stockCount > 0 ? (
              <Link
                to={`/checkout/${product.id}`}
                className="flex-1 sm:flex-none rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition-transform hover:scale-[1.02] text-center whitespace-normal sm:whitespace-nowrap flex items-center justify-center"
              >
                Configure & Buy
              </Link>
            ) : (
              <button
                disabled
                className="flex-1 sm:flex-none rounded-xl bg-secondary px-6 sm:px-8 py-2.5 text-xs sm:text-sm font-bold text-muted-foreground cursor-not-allowed border border-border"
              >
                Unavailable
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function HUDCard({ icon: Icon, label, value, desc, color }: { icon: React.ElementType, label: string, value: string, desc: string, color: string }) {
  const glow =
    color === "cyan" ? "hover:border-primary/50" :
      color === "purple" ? "hover:border-accent/50" :
        "hover:border-blue-500/50";

  const iconColor =
    color === "cyan" ? "text-primary" :
      color === "purple" ? "text-accent" :
        "text-blue-500";

  return (
    <div className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card hover:shadow-elevated transition-all duration-200 hover:-translate-y-1 ${glow}`}>
      <div className="flex items-center justify-between">
        <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${iconColor}`} />
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">VERIFIED</span>
      </div>
      <div className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-lg sm:text-xl font-bold text-foreground truncate">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
