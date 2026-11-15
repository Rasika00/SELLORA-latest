import { 
  Monitor, 
  Cpu, 
  Snowflake, 
  Keyboard, 
  MemoryStick, 
  HardDrive, 
  Shield, 
  Zap, 
  CheckCircle2, 
  type LucideIcon 
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  spec: string;
  desc: string;
  accent: "cyan" | "purple" | "blue";
};

const features: Feature[] = [
  {
    icon: Monitor,
    title: "Display Panel",
    spec: "OLED · 4K · 240Hz",
    desc: "Pixel-perfect HDR with 1ms response and 100% DCI-P3 color calibration.",
    accent: "cyan",
  },
  {
    icon: Cpu,
    title: "Graphics & AI Engine",
    spec: "RTX 5090 · 24GB",
    desc: "Desktop class ray tracing with on chip neural processing acceleration.",
    accent: "purple",
  },
  {
    icon: Snowflake,
    title: "Thermal System",
    spec: "Vapor Chamber · 3-Fan",
    desc: "Liquid vapor chamber keeps silicon at peak sustained clock — silently.",
    accent: "blue",
  },
  {
    icon: MemoryStick,
    title: "Workstation RAM",
    spec: "Up to 128GB DDR5",
    desc: "Dual channel 6000MHz low latency architecture for heavy CAD & 3D timelines.",
    accent: "cyan",
  },
  {
    icon: HardDrive,
    title: "Studio Storage",
    spec: "4TB PCIe 5.0 SSD",
    desc: "12,000 MB/s direct read speeds for instant 8K RAW video & scratch disks.",
    accent: "purple",
  },
  {
    icon: Shield,
    title: "Aerospace Chassis",
    spec: "CNC Aluminum · 1.1kg",
    desc: "Milled from a single alloy block for maximum structural rigidity and cooling.",
    accent: "blue",
  },
  {
    icon: Keyboard,
    title: "Tactile Keyboard",
    spec: "Per-Key RGB · 1.7mm",
    desc: "Optical mechanical switches with N-key rollover for zero-latency precision.",
    accent: "cyan",
  },
  {
    icon: Zap,
    title: "Power & Ports",
    spec: "99.9Wh · Wi Fi 7",
    desc: "Max capacity flight battery with dual Thunderbolt 4 and 40Gbps bandwidth.",
    accent: "purple",
  },
];

const standards = [
  { label: "Zero Bloatware OS", desc: "Pure creator installation" },
  { label: "Orbital Clean Room", desc: "Dust free thermal assembly" },
  { label: "3 Year Global Warranty", desc: "24/7 priority replacement" },
  { label: "ISV Workstation Certified", desc: "Autodesk, Adobe & Epic Games" },
];

const glow = {
  cyan: "shadow-[0_0_40px_oklch(0.78_0.18_200/0.35)] border-neon-cyan/60",
  purple: "shadow-[0_0_40px_oklch(0.62_0.24_295/0.35)] border-neon-purple/60",
  blue: "shadow-[0_0_40px_oklch(0.7_0.22_260/0.35)] border-neon-blue/60",
};

const iconBg = {
  cyan: "bg-neon-cyan/15 text-neon-cyan",
  purple: "bg-neon-purple/15 text-neon-purple",
  blue: "bg-neon-blue/15 text-neon-blue",
};

export function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32 border-t border-glass-border">
      <div className="absolute inset-0 -z-10 bg-grid-sm opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

      <div className="mx-auto w-full max-w-full px-4 sm:px-8 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs tracking-[0.3em] text-neon-cyan">
            TECH &amp; WORKSTATION ARCHITECTURE
          </p>
          <h2 className="font-display mt-3 text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
            Built from the <span className="text-gradient">silicon up</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground">
            Every component re-engineered. Simple, uncompromising specifications designed for heavy workstation workloads and professional creators.
          </p>
        </div>

        {/* 8-Card Simple Specs Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group relative cursor-pointer rounded-2xl glass p-6 neon-border-hover ${glow[f.accent]} transition-all hover:scale-[1.02]`}
              >
                <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ${iconBg[f.accent]} transition-transform duration-500 group-hover:scale-110`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-[11px] tracking-[0.2em] text-muted-foreground">
                  {f.title.toUpperCase()}
                </h3>
                <p className="mt-1.5 font-display text-xl font-bold leading-tight text-foreground">
                  {f.spec}
                </p>
                <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            );
          })}
        </div>

        {/* Simple Workstation Standards Bar */}
        <div className="mt-16 rounded-2xl border border-glass-border bg-black/40 p-6 sm:p-8 backdrop-blur-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {standards.map((s) => (
              <div key={s.label} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-neon-cyan shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display text-xs font-bold text-foreground">{s.label}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
