import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Search, ShoppingCart, User, ShieldCheck, Scale } from "lucide-react";
import { useCart } from "@/context/CartContext";
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, setIsCartOpen } = useCart();

  const links: { label: string; href: string; isRouterLink?: boolean }[] = [
    { label: "Laptop", href: "/#products" },
    { label: "Creator", href: "/#creator" },
    { label: "Workstation", href: "/#workstation" },
    { label: "Tech", href: "/#features" },
    { label: "Support", href: "/#support" },
    { label: "Feedback", href: "/#feedback" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 md:px-8 pt-3 sm:pt-4 pointer-events-none">
      <nav className="mx-auto flex w-full max-w-full items-center justify-between rounded-2xl border border-glass-border bg-card px-3 sm:px-6 py-2 sm:py-3.5 gap-2 md:glass-strong pointer-events-auto">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="Sellora" className="h-8 sm:h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
          <span className="font-display text-base sm:text-lg font-black tracking-widest">SELLORA</span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden items-center gap-6 lg:gap-8 md:flex">
          {links.map((l) => (
            <li key={l.label}>
              {l.isRouterLink ? (
                <Link
                  to={l.href as any}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/50 bg-neon-cyan/15 px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-neon-cyan transition-all hover:bg-neon-cyan hover:text-background shadow-[0_0_15px_oklch(0.78_0.18_200/0.25)]"
                >
                  <Scale className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                  <span>{l.label}</span>
                </Link>
              ) : (
                <a
                  href={l.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-neon-cyan"
                >
                  {l.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Always Accessible Admin Command Button */}
          <Link
            to="/admin"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple px-3 py-1 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider text-black shadow-neon-cyan transition-all hover:scale-105 hover:shadow-[0_0_25px_oklch(0.78_0.18_200/0.6)] shrink-0"
            title="Admin Command Center"
          >
            <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-black stroke-[2.5]" />
            <span className="hidden sm:inline">Admin Command</span>
            <span className="inline sm:hidden font-black">Admin</span>
          </Link>

          <Link
            to="/login"
            aria-label="Account / Login"
            className="hidden sm:inline-flex rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-neon-cyan items-center gap-1.5 shrink-0"
            title="Terminal Login"
          >
            <User className="h-4 w-4" />
            <span className="text-sm font-medium hidden lg:inline">Sign In</span>
          </Link>

          <button 
            aria-label="Cart" 
            onClick={() => setIsCartOpen(true)}
            className="relative rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground shrink-0"
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-neon-cyan shadow-neon-cyan text-[9px] font-bold text-background flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground md:hidden shrink-0"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-neon-cyan" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mx-auto mt-2 max-w-full rounded-2xl glass-strong p-4 animate-fade-up border border-glass-border shadow-elevated pointer-events-auto">
          <ul className="flex flex-col gap-2.5">
            {links.map((l) => (
              <li key={l.label}>
                {l.isRouterLink ? (
                  <Link
                    to={l.href as any}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl bg-neon-cyan/15 border border-neon-cyan/40 px-4 py-2.5 text-sm font-bold text-neon-cyan transition-all shadow-[0_0_15px_oklch(0.78_0.18_200/0.25)]"
                  >
                    <Scale className="h-4 w-4" />
                    <span>{l.label}</span>
                  </Link>
                ) : (
                  <a
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/10 hover:text-neon-cyan transition-all"
                  >
                    {l.label}
                  </a>
                )}
              </li>
            ))}
            <li className="pt-2 mt-1 border-t border-white/10 flex flex-col gap-2">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full rounded-xl bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple px-4 py-3 text-center text-xs font-mono font-black uppercase tracking-wider text-black shadow-neon-cyan hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-black stroke-[2.5]" />
                Launch Admin Command Center
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all flex items-center justify-center gap-2"
              >
                <User className="h-4 w-4" />
                Sign In
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
