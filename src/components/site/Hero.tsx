import { Play, ArrowRight, Plus, Search, Sparkles } from "lucide-react";
import heroLaptop from "@/assets/hero-laptop-editorial.png";
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
    <section className="relative isolate overflow-hidden pt-28 md:pt-32">
      {/* Backdrops */}
      <div className="absolute inset-0 -z-20 bg-gradient-hero" />
      <div className="absolute inset-0 -z-20 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute left-[8%] top-1/3 -z-10 h-80 w-80 rounded-full bg-neon-cyan/25 blur-3xl animate-glow-pulse" />
      <div className="pointer-events-none absolute right-[8%] top-1/4 -z-10 h-[28rem] w-[28rem] rounded-full bg-neon-purple/30 blur-3xl animate-glow-pulse [animation-delay:1.5s]" />

      {/* Editorial stage */}
      <div className="relative mx-auto w-full max-w-full px-4 sm:px-8 md:px-12">
        {/* Eyebrow tag */}
        <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full glass px-4 py-1.5 animate-fade-up">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan shadow-neon-cyan" />
          <span className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">
            INTRODUCING · SELLORA SERIES 09
          </span>
        </div>

        {/* Stage with overlapping type + 3D subject */}
        <div className="relative">
          {/* Massive overlapping headline behind subject */}
          <h1
            aria-label="Global hub for performance computing in 3D"
            className="font-display pointer-events-none select-none flex flex-col items-center justify-center w-full mx-auto text-center font-black uppercase leading-[0.82] tracking-[-0.02em] animate-fade-up [animation-delay:0.1s]"
          >
            <span className="block text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-[7.5rem] text-foreground/95">
              GLOBAL HUB
            </span>
            <span className="block text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-[7.5rem] text-foreground/90">
              FOR <span className="text-gradient">PERFORMANCE</span>
            </span>
            <span className="block text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-[7.5rem] text-foreground/85">
              COMPUTING
            </span>
          </h1>

          {/* Floating 3D laptop centered over headline */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Light flare */}
            <div className="absolute h-[80%] w-[60%] rounded-full bg-gradient-glow blur-3xl" />
            <div className="absolute top-[58%] h-32 w-[55%] rounded-[100%] bg-neon-purple/40 blur-3xl animate-glow-pulse" />

            <div className="relative animate-float">
              <img
                src={heroLaptop}
                alt="SELLORA flagship laptop floating with cinematic purple and cyan rim light"
                width={1080}
                height={1920}
                className="h-[55vh] sm:h-[65vh] md:h-[88vh] w-auto max-h-[900px] drop-shadow-[0_65px_85px_oklch(0_0_0/0.7)] scale-[1.15] sm:scale-[1.35] md:scale-[1.7]"
              />
            </div>
          </div>

          {/* Bottom wordmark plate */}
          <div className="relative mt-2 md:mt-[-3rem] pb-8 flex flex-col items-center justify-center w-full mx-auto text-center overflow-visible animate-fade-up [animation-delay:0.3s]">
            <div className="w-full flex justify-center items-center mx-auto text-center font-display text-5xl sm:text-[6rem] md:text-[8rem] lg:text-[11rem] xl:text-[13rem] 2xl:text-[14.5rem] font-black leading-none tracking-tight text-foreground select-none overflow-visible">
              <span className="inline-block whitespace-nowrap">SELLORA</span>
            </div>
            <p className="mt-4 font-display text-xs tracking-[0.4em] text-muted-foreground md:text-sm">
              FROM SILICON TO SHIPPED
            </p>
          </div>
        </div>

        {/* Sub copy + CTAs */}
        <div className="mx-auto mt-8 flex flex-col md:flex-row w-full max-w-full justify-between gap-6 md:gap-8 md:items-end">
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            A new platform for high performance laptops  engineered, rendered,
            and shipped in 3D. Cinematic OLED, desktop class silicon, aerospace grade chassis.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <a
              href="#products"
              className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-neon-cyan transition-transform duration-300 hover:scale-105 w-full sm:w-auto"
            >
              Explore Series
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="https://res.cloudinary.com/ybzqvcg1/video/upload/v1790518577/Sellora.mp4"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full glass-strong px-7 py-3.5 text-sm font-semibold text-foreground neon-border-hover w-full sm:w-auto transition-transform duration-300 hover:scale-105"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary">
                <Play className="h-3 w-3 fill-primary-foreground text-primary-foreground" />
              </span>
              Watch the Film
            </a>
          </div>
        </div>

        {/* Hero Smart Search Bar */}
        <div className="mx-auto mt-10 max-w-2xl w-full animate-fade-up [animation-delay:0.35s]">
          <div
            onClick={() => openSearch()}
            className="group relative flex items-center justify-between gap-3 rounded-2xl border border-neon-cyan/40 bg-card/85 p-2 sm:p-2.5 backdrop-blur-xl shadow-[0_0_30px_oklch(0.78_0.18_200/0.15)] transition-all duration-300 hover:border-neon-cyan hover:shadow-[0_0_40px_oklch(0.78_0.18_200/0.3)] hover:scale-[1.01] cursor-pointer"
          >
            <div className="flex items-center gap-3 pl-2 sm:pl-3 flex-1 min-w-0">
              <Search className="h-5 w-5 text-neon-cyan shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
              <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground/90 truncate">
                Search by GPU, processor, or model (e.g. &ldquo;RTX 4090&rdquo;, &ldquo;MacBook M3 Max&rdquo;)...
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue px-3.5 sm:px-4 py-2 text-xs font-mono font-bold text-black shadow-neon-cyan transition-transform group-hover:scale-105 flex items-center gap-1.5"
              >
                <span>Search</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Trending spec pills */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono text-[11px] text-neon-cyan/90 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Trending:
            </span>
            {["RTX 4090", "MacBook Pro M3", "OLED 240Hz", "Intel Core Ultra 9", "Dual Screen", "Workstation"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => openSearch(tag)}
                className="rounded-full border border-glass-border bg-foreground/5 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/10 hover:text-neon-cyan hover:scale-105 cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Scrolling metrics ticker */}
        <div className="relative mt-14 overflow-hidden border-y border-glass-border py-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-12">
            {[...metrics, ...metrics].map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="h-1 w-1 rounded-full bg-neon-cyan shadow-neon-cyan" />
                <span className="font-display text-xs tracking-[0.3em] text-muted-foreground">
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

function Annotation({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`pointer-events-none absolute flex items-center gap-1 font-display text-[10px] tracking-[0.25em] text-neon-cyan/80 ${className}`}
    >
      {children}
    </div>
  );
}
