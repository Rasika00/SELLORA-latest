import { ShieldCheck, Download, Globe, ArrowRight, LifeBuoy, MessageSquare } from "lucide-react";

export function Support() {
  const supportCards = [
    {
      icon: MessageSquare,
      title: "Direct Engineer Access",
      tag: "24/7 Concierge",
      desc: "Connect via live video or encrypted terminal directly with the orbital engineering team who calibrated your silicon.",
      accent: "cyan" as const,
      link: "https://google.com",
    },
    {
      icon: ShieldCheck,
      title: "3 Year Orbital Warranty",
      tag: "Zero Cost",
      desc: "Comprehensive global coverage with express air courier pickup and clean room thermal repasting.",
      accent: "purple" as const,
      link: "https://google.com",
    },
    {
      icon: Download,
      title: "Driver & BIOS Vault",
      tag: "Studio Verified",
      desc: "Download ISV certified GPU studio drivers, custom fan curves, and unlocked overclocking BIOS profiles.",
      accent: "blue" as const,
      link: "https://google.com",
    },
    {
      icon: Globe,
      title: "Global Service Hubs",
      tag: "45 Countries",
      desc: "Locate certified orbital service centers or request next day on site replacement at your studio.",
      accent: "cyan" as const,
      link: "https://google.com",
    },
  ];

  const glow = {
    cyan: "border-neon-cyan/40 bg-neon-cyan/5 text-neon-cyan shadow-[0_0_25px_oklch(0.78_0.18_200/0.15)]",
    purple: "border-neon-purple/40 bg-neon-purple/5 text-neon-purple shadow-[0_0_25px_oklch(0.62_0.24_295/0.15)]",
    blue: "border-neon-blue/40 bg-neon-blue/5 text-neon-blue shadow-[0_0_25px_oklch(0.7_0.22_260/0.15)]",
  };

  const iconBg = {
    cyan: "bg-neon-cyan/15 text-neon-cyan",
    purple: "bg-neon-purple/15 text-neon-purple",
    blue: "bg-neon-blue/15 text-neon-blue",
  };

  return (
    <section id="support" className="relative py-24 md:py-32 border-t border-glass-border">
      <div className="absolute inset-0 -z-10 bg-grid-sm opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <div className="mx-auto w-full max-w-full px-4 sm:px-8 md:px-12">
        
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3.5 py-1 text-[10px] font-mono font-bold tracking-[0.25em] text-neon-cyan uppercase">
            <LifeBuoy className="h-3 w-3 animate-pulse" /> Orbital ProCare
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            We Stand Behind <span className="text-gradient">Every Rig</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Uncompromising global concierge support. Access studio drivers, check your 3 year warranty status, or connect directly with our engineering team.
          </p>
        </div>

        {/* 4 Support Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() => window.open(card.link, "_blank")}
                className={`group relative cursor-pointer rounded-3xl border p-6 backdrop-blur-xl transition-all hover:scale-[1.02] ${glow[card.accent]}`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`rounded-2xl p-3.5 ${iconBg[card.accent]} transition-transform duration-500 group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-foreground">
                    {card.tag}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{card.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                <div className="mt-6 flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-neon-cyan transition-colors">
                  <span>Launch Portal</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
