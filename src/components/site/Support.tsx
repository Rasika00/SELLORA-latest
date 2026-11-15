import { ShieldCheck, Download, Globe, ArrowRight, LifeBuoy, MessageSquare } from "lucide-react";
import { useUIMode } from "@/context/UIModeContext";

export function Support() {
  const { isSimple } = useUIMode();

  const supportCards = [
    {
      icon: MessageSquare,
      title: isSimple ? "Chat with us anytime" : "Direct Engineer Access",
      tag: isSimple ? "24/7 Support" : "24/7 Concierge",
      desc: isSimple
        ? "Got a question? Our team is available 24/7 to help you choose the right laptop or fix any issues."
        : "Connect via live video or encrypted terminal directly with the orbital engineering team who calibrated your silicon.",
      accent: "cyan" as const,
      link: "https://google.com",
    },
    {
      icon: ShieldCheck,
      title: isSimple ? "3 Year Warranty included" : "3 Year Orbital Warranty",
      tag: isSimple ? "Free" : "Zero Cost",
      desc: isSimple
        ? "Every Sellora laptop comes with a 3 year warranty. If something breaks, we'll fix or replace it at no cost to you."
        : "Comprehensive global coverage with express air courier pickup and clean room thermal repasting.",
      accent: "purple" as const,
      link: "https://google.com",
    },
    {
      icon: Download,
      title: isSimple ? "Easy software updates" : "Driver & BIOS Vault",
      tag: isSimple ? "Always updated" : "Studio Verified",
      desc: isSimple
        ? "Download the latest drivers and updates in one click. We make sure your laptop always runs at its best."
        : "Download ISV certified GPU studio drivers, custom fan curves, and unlocked overclocking BIOS profiles.",
      accent: "blue" as const,
      link: "https://google.com",
    },
    {
      icon: Globe,
      title: isSimple ? "Help wherever you are" : "Global Service Hubs",
      tag: "45 Countries",
      desc: isSimple
        ? "Find a service center near you or request a home visit. We have support teams in 45+ countries."
        : "Locate certified orbital service centers or request next day on site replacement at your studio.",
      accent: "cyan" as const,
      link: "https://google.com",
    },
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

  return (
    <section id="support" className="relative py-24 md:py-32 border-t border-border">
      <div className="absolute inset-0 -z-10 bg-grid-sm opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <div className="mx-auto w-full max-w-full px-4 sm:px-8 md:px-12">
        
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          {!isSimple && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur-md px-3.5 py-1 text-[10px] font-mono font-semibold tracking-[0.2em] text-primary uppercase">
            <LifeBuoy className="h-3 w-3" /> Orbital ProCare
          </div>
          )}
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            {isSimple ? "We're here to " : "We Stand Behind "}<span className="text-gradient">{isSimple ? "help you" : "Every Rig"}</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            {isSimple
              ? "Got questions? Need help? Our team is here to support you before, during, and after your purchase."
              : "Uncompromising global concierge support. Access studio drivers, check your 3 year warranty status, or connect directly with our engineering team."}
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
                className={`group relative cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-all duration-200 hover:-translate-y-1 ${glow[card.accent]}`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`rounded-xl p-3 ${iconBg[card.accent]} transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-secondary border border-border px-2.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    {card.tag}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{card.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                <div className="mt-6 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
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
