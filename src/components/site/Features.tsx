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
import { useUIMode } from "@/context/UIModeContext";

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
  cyan: "border-border hover:border-primary/50",
  purple: "border-border hover:border-accent/50",
  blue: "border-border hover:border-blue-500/50",
};

const iconBg = {
  cyan: "bg-primary/10 text-primary border border-primary/20",
  purple: "bg-accent/10 text-accent border border-accent/20",
  blue: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
};

export function Features() {
  const { isSimple } = useUIMode();

  // Simple Mode friendly versions of spec and desc
  const simpleFeatures = [
    { icon: Monitor, title: "Brilliant Display", spec: "Crystal clear OLED screen", desc: "Sharp, vivid colors that look amazing for work, movies, and gaming.", accent: "cyan" as const },
    { icon: Cpu, title: "Powerful Graphics", spec: "Top-end GPU", desc: "Handles games, video editing, and design without slowing down.", accent: "purple" as const },
    { icon: Snowflake, title: "Stays Cool", spec: "Advanced cooling", desc: "Keeps the laptop from overheating even during heavy tasks.", accent: "blue" as const },
    { icon: MemoryStick, title: "Lots of RAM", spec: "Up to 128GB memory", desc: "Run many apps at once without your laptop feeling slow.", accent: "cyan" as const },
    { icon: HardDrive, title: "Super-fast Storage", spec: "Up to 4TB SSD", desc: "Files, apps, and games load instantly. No waiting around.", accent: "purple" as const },
    { icon: Shield, title: "Solid Build", spec: "Aluminum body", desc: "Lightweight yet tough — built to last wherever you take it.", accent: "blue" as const },
    { icon: Keyboard, title: "Great Keyboard", spec: "RGB backlit keys", desc: "Comfortable to type on with colored backlighting for night use.", accent: "cyan" as const },
    { icon: Zap, title: "All-day Power", spec: "Large battery", desc: "Long-lasting battery and fast Wi-Fi keep you connected all day.", accent: "purple" as const },
  ];

  const simpleStandards = [
    { label: "Clean software, no bloatware", desc: "Ready to use right out of the box" },
    { label: "3 Year Warranty", desc: "Full support, no extra cost" },
    { label: "Dust-free assembly", desc: "Built in a controlled environment" },
    { label: "Certified for professionals", desc: "Verified for Adobe, Autodesk & more" },
  ];

  const displayFeatures = isSimple ? simpleFeatures : features;
  const displayStandards = isSimple ? simpleStandards : standards;

  return (
    <section id="features" className="relative py-24 md:py-32 border-t border-border">
      <div className="absolute inset-0 -z-10 bg-grid-sm opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

      <div className="mx-auto w-full max-w-full px-4 sm:px-8 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs tracking-[0.25em] text-primary uppercase font-semibold">
            {isSimple ? "WHAT'S INSIDE" : "TECH & WORKSTATION ARCHITECTURE"}
          </p>
          <h2 className="font-display mt-3 text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            Built from the <span className="text-gradient">silicon up</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground">
            {isSimple
              ? "Every laptop is built with quality components. Here's what makes them great."
              : "Every component re-engineered. Simple, uncompromising specifications designed for heavy workstation workloads and professional creators."}
          </p>
        </div>

        {/* 8-Card Specs Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {displayFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group relative cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-all duration-200 hover:-translate-y-1 ${glow[f.accent]}`}
              >
                <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ${iconBg[f.accent]} transition-transform duration-300 group-hover:scale-105`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">
                  {f.title.toUpperCase()}
                </h3>
                <p className="mt-1.5 font-display text-xl font-bold leading-tight text-foreground">
                  {f.spec}
                </p>
                <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            );
          })}
        </div>

        {/* Standards Bar */}
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayStandards.map((s) => (
              <div key={s.label} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
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
