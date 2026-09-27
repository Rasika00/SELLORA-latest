import { useTheme } from "@/context/ThemeContext";

export function Footer() {
  const { theme } = useTheme();
  const cols = [
    { title: "Series", links: ["Phantom", "Atelier", "Forge", "Edge", "Strike"] },
    { title: "Support", links: ["Warranty", "Drivers", "Repair", "Community"] },
    { title: "Company", links: ["About", "Press", "Careers", "Sustainability"] },
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
                  <li key={l}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l}
                    </a>
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
