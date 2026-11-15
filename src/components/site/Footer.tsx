import { Link } from "@tanstack/react-router";
import { useTheme } from "@/context/ThemeContext";

export function Footer() {
  const { theme } = useTheme();
  const cols = [
    {
      title: "Series",
      links: [
        { label: "Phantom Workstations", href: "/#catalog" },
        { label: "Atelier Pro Rigs", href: "/#catalog" },
        { label: "Forge Battlegrounds", href: "/#catalog" },
        { label: "Edge Ultraportables", href: "/#catalog" },
      ],
    },
    {
      title: "Customer Hub",
      links: [
        { label: "Sign In", href: "/login" },
        { label: "Create Account", href: "/register" },
        { label: "Track My Orders", href: "/account" },
        { label: "Rate My Machine", href: "/account" },
      ],
    },
    {
      title: "Vendors & Partners",
      links: [
        { label: "Sell on SELLORA", href: "/seller-register" },
        { label: "Vendor Hub Console", href: "/seller" },
        { label: "Escrow & Payout Policy", href: "/#warranty" },
      ],
    },
  ];
  return (
    <footer className="relative border-t border-glass-border py-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent" />
      <div className="mx-auto grid w-full max-w-full gap-10 px-4 sm:px-8 md:px-12 md:grid-cols-[2fr_3fr]">
        <div>
          <div className="flex items-center gap-2">
            <img
              src={theme === "light" ? "/logo black.png" : "/logo.png"}
              alt="Sellora Logo"
              className="h-10 sm:h-12 w-auto object-contain transition-all duration-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.2)]"
            />
            <span className="font-display text-lg font-black tracking-widest text-foreground">SELLORA</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            High performance computing, engineered without compromise. Shipping globally from orbit.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="font-display text-[10px] tracking-[0.25em] text-neon-cyan">{c.title.toUpperCase()}</p>
              <ul className="mt-4 space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.href as any} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-12 w-full max-w-full px-4 sm:px-8 md:px-12 text-xs text-muted-foreground">
        © {new Date().getFullYear()} SELLORA Systems. All rights reserved.
      </div>
    </footer>
  );
}
