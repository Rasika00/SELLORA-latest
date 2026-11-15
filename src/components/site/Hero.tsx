import { Link } from "@tanstack/react-router";
import { 
  Laptop, 
  Scale, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Headphones, 
  Search, 
  Sparkles,
  Play
} from "lucide-react";
import heroLaptop from "@/assets/hero-laptop.png";
import { useSearch } from "@/context/SearchContext";

const metrics = [
  "RTX 5090 READY",
  "OLED 240Hz",
  "LIQUID COOLING",
  "INTEL CORE ULTRA 9",
  "64GB DDR5X",
  "THUNDERBOLT 5",
  "MINI LED 4K",
  "AI NPU 80 TOPS",
  "VAPOR CHAMBER",
  "WIFI 7",
];

export function Hero() {
  const { openSearch } = useSearch();

  return (
    <section className="relative isolate overflow-hidden pt-24 sm:pt-28 pb-8">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 -z-20 bg-gradient-hero" />
      <div className="pointer-events-none absolute left-[15%] top-1/4 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[15%] top-1/3 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

      <div className="mx-auto w-full max-w-full px-3 sm:px-6 md:px-10 lg:px-12">
        {/* Main Hero Showcase Banner */}
        <div className="relative rounded-3xl border border-border/80 bg-gradient-to-r from-[#050B16] via-[#071224] to-[#100922] p-6 sm:p-10 md:p-12 lg:p-14 text-white shadow-elevated overflow-hidden">
          {/* Subtle background tech grid */}
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-15 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />

          {/* Angled cyber rays behind the laptop */}
          <div className="pointer-events-none absolute -right-20 top-0 h-full w-2/3 bg-gradient-to-bl from-accent/20 via-primary/15 to-transparent blur-2xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col items-start justify-center">
              {/* Eyebrow with cyan underline indicator */}
              <div className="flex flex-col items-start gap-1.5 mb-5 animate-fade-up">
                <span className="font-mono text-[11px] sm:text-xs font-bold tracking-[0.25em] text-slate-300 uppercase">
                  FIND YOUR PERFECT LAPTOP
                </span>
                <span className="h-0.5 w-11 bg-primary rounded-full shadow-[0_0_8px_oklch(0.74_0.14_205/0.8)]" />
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.75rem] font-black tracking-tight text-white leading-[1.08] animate-fade-up [animation-delay:0.08s]">
                The right laptop for <br />
                the way <span className="text-primary font-black">you work.</span>
              </h1>

              {/* Subtitle */}
              <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-300/90 max-w-xl leading-relaxed animate-fade-up [animation-delay:0.15s]">
                Explore laptops, compare specifications, and choose with confidence.
              </p>

              {/* Action Buttons */}
              <div className="mt-7 flex flex-wrap items-center gap-3 sm:gap-4 animate-fade-up [animation-delay:0.2s]">
                {/* Primary Button */}
                <a
                  href="#products"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-display text-sm font-bold px-6 py-3.5 shadow-sm hover:shadow-neon-cyan transition-all duration-200 hover:scale-[1.02]"
                >
                  <Laptop className="h-4 w-4 shrink-0" />
                  <span>Browse Laptops</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>

                {/* Secondary Button */}
                <Link
                  to="/compare"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/12 text-white font-display text-sm font-semibold px-6 py-3.5 backdrop-blur-md transition-all duration-200 hover:border-white/40 hover:scale-[1.02]"
                >
                  <Scale className="h-4 w-4 shrink-0 text-primary" />
                  <span>Compare Laptops</span>
                </Link>

                {/* Watch film modal link */}
                <a
                  href="https://res.cloudinary.com/ybzqvcg1/video/upload/v1790518577/Sellora.mp4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-mono font-medium text-slate-400 hover:text-white transition-colors px-2 py-2"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Play className="h-2.5 w-2.5 fill-primary text-primary" />
                  </span>
                  <span>Film</span>
                </a>
              </div>

              {/* Value Props / Trust Indicators */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-300 animate-fade-up [animation-delay:0.25s]">
                <div className="flex items-center gap-2 font-medium">
                  <Zap className="h-4 w-4 text-primary shrink-0" />
                  <span>Transparent Benchmark</span>
                </div>

                <span className="text-white/20 hidden sm:inline select-none">|</span>

                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>Verified Specifications</span>
                </div>

                <span className="text-white/20 hidden sm:inline select-none">|</span>

                <div className="flex items-center gap-2 font-medium">
                  <Headphones className="h-4 w-4 text-primary shrink-0" />
                  <span>Expert Guidance</span>
                </div>
              </div>
            </div>

            {/* Right Laptop Image Column */}
            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end animate-fade-up [animation-delay:0.18s]">
              {/* Backlight glow */}
              <div className="pointer-events-none absolute -left-8 top-1/4 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
              <div className="pointer-events-none absolute -right-6 top-1/3 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />

              <div className="relative w-full max-w-[580px] lg:max-w-none">
                <img
                  src={heroLaptop}
                  alt="SELLORA Performance Laptop"
                  width={1108}
                  height={474}
                  className="w-full h-auto object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.65)] transition-transform duration-500 hover:scale-[1.02]"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Smart Search Bar */}
        <div className="mx-auto mt-6 max-w-md w-full animate-fade-up [animation-delay:0.3s]">
          <div
            onClick={() => openSearch()}
            className="group relative flex items-center justify-between gap-2 rounded-full border border-border hover:border-primary/40 bg-card/90 p-1 pl-3 backdrop-blur-xl shadow-card transition-all duration-200 hover:shadow-elevated hover:scale-[1.01] cursor-pointer"
          >
            <div className="flex items-center gap-2 pl-0.5 flex-1 min-w-0">
              <Search className="h-3.5 w-3.5 text-primary shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[11px] text-foreground/75 group-hover:text-foreground truncate">
                Search GPU, CPU, or model (e.g. RTX 4090)...
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-mono font-bold text-primary-foreground shadow-sm transition-transform group-hover:scale-105 flex items-center gap-1"
              >
                <span>Search</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          {/* Quick Trending spec pills */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <span className="font-mono text-[9.5px] text-primary font-bold flex items-center gap-0.5">
              <Sparkles className="h-2 w-2" />
              Trending:
            </span>
            {["RTX 4090", "MacBook Pro M3", "OLED 240Hz", "Intel Core Ultra 9", "Dual Screen", "Workstation"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => openSearch(tag)}
                className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[9.5px] font-mono text-foreground/80 transition-all hover:border-primary/40 hover:bg-secondary hover:text-foreground cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Scrolling metrics ticker */}
        <div className="relative mt-8 overflow-hidden border-y border-border py-3 bg-card/30 backdrop-blur-sm [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-12">
            {[...metrics, ...metrics].map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="h-1 w-1 rounded-full bg-primary" />
                <span className="font-mono text-xs tracking-[0.25em] text-muted-foreground">
                  {m}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
