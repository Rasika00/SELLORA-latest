import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, Search, ShoppingCart, User, ShieldCheck, Gauge, Sun, Moon, Scale, Store, LogOut, Layers } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { useSearch } from "@/context/SearchContext";
import { useUIMode } from "@/context/UIModeContext";
import { getCurrentUser, logout, type UserSession } from "@/lib/auth";

export function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, setIsCartOpen } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { openSearch } = useSearch();
  const { mode, toggleMode } = useUIMode();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());

    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener("sellora-auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("sellora-auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const handleSignOut = () => {
    logout();
    setCurrentUser(null);
    navigate({ to: "/login" });
  };

  const links: { label: string; href: string; isRouterLink?: boolean; isHighlight?: boolean }[] = [
    { label: "Laptop", href: "/#products" },
    { label: "Creator", href: "/#creator" },
    { label: "Workstation", href: "/#workstation" },
    { label: "Tech", href: "/#features" },
    { label: "Support", href: "/#support" },
    { label: "Estimator", href: "/#estimator" },
    { label: "Feedback", href: "/#feedback" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 md:px-8 pt-3 sm:pt-4 pointer-events-none">
      <nav className="mx-auto flex w-full max-w-full items-center justify-between rounded-2xl border border-glass-border bg-card px-3 sm:px-6 py-2 sm:py-3.5 gap-2 md:glass-strong pointer-events-auto">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={theme === "light" ? "/logo black.png" : "/logo.png"}
            alt="Sellora"
            className="h-8 sm:h-10 w-auto object-contain transition-all duration-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.3)]"
          />
          <span className="font-display text-base sm:text-lg font-black tracking-widest text-foreground">SELLORA</span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden items-center gap-5 lg:gap-7 md:flex">
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
              ) : l.isHighlight ? (
                <a
                  href={l.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1 text-xs font-mono font-bold text-neon-cyan transition-all hover:bg-neon-cyan hover:text-background shadow-[0_0_15px_oklch(0.78_0.18_200/0.2)]"
                >
                  <Gauge className="h-3 w-3 animate-pulse" />
                  <span>{l.label}</span>
                </a>
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
          {/* Desktop Smart Search Bar Button */}
          <button
            type="button"
            onClick={() => openSearch()}
            className="hidden md:flex items-center gap-2 rounded-full border border-glass-border bg-foreground/5 hover:border-neon-cyan/50 hover:bg-neon-cyan/10 px-3.5 py-1.5 text-xs text-muted-foreground transition-all duration-300 group shadow-inner shrink-0 cursor-pointer"
            title="Smart Search (Ctrl + K or /)"
          >
            <Search className="h-3.5 w-3.5 text-neon-cyan transition-transform group-hover:scale-110" />
            <span className="font-sans group-hover:text-foreground hidden lg:inline">Search laptops...</span>
            <span className="font-sans group-hover:text-foreground inline lg:hidden">Search</span>
          </button>

          {/* Mobile Quick Search Button */}
          <button
            type="button"
            onClick={() => openSearch()}
            aria-label="Smart Search"
            title="Smart Search (Ctrl + K)"
            className="flex md:hidden items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-foreground/5 hover:text-neon-cyan shrink-0"
          >
            <Search className="h-4 w-4 text-neon-cyan" />
          </button>

          {/* Role-Based Dashboard Quick Access */}
          {currentUser?.role === "admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple px-3 py-1 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider text-black shadow-neon-cyan transition-all hover:scale-105 hover:shadow-[0_0_25px_oklch(0.78_0.18_200/0.6)] shrink-0"
              title="Admin Command Console"
            >
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-black stroke-[2.5]" />
              <span className="hidden sm:inline">Admin Console</span>
              <span className="inline sm:hidden font-black">Admin</span>
            </Link>
          )}

          {currentUser?.role === "seller" && (
            <Link
              to="/seller"
              className="flex items-center gap-1.5 rounded-full bg-neon-purple/20 border border-neon-purple/40 px-3 py-1 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-white transition-all hover:bg-neon-purple hover:text-white shrink-0"
              title="Seller Vendor Hub"
            >
              <Store className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-neon-purple group-hover:text-white" />
              <span className="hidden sm:inline">Seller Hub</span>
              <span className="inline sm:hidden">Seller</span>
            </Link>
          )}

          {/* User Sign In / Profile / Logout */}
          {currentUser ? (
            <div className="flex items-center gap-1 shrink-0">
              <Link
                to="/account"
                className="flex items-center gap-2 rounded-lg py-1 px-1.5 sm:px-2 text-xs font-mono text-foreground hover:bg-foreground/5 hover:text-neon-cyan transition-colors group"
                title="Customer Command Center & Hub"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-neon-cyan via-neon-blue to-neon-purple flex items-center justify-center text-[11px] font-black text-black ring-1 ring-neon-cyan/50 shadow-[0_0_10px_oklch(0.78_0.18_200/0.3)] group-hover:scale-105 transition-transform">
                  {currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "U")}
                </div>
                <span className="hidden lg:inline text-xs font-medium text-foreground group-hover:text-neon-cyan transition-colors">
                  {currentUser.firstName || currentUser.email.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center shrink-0">
              <Link
                to="/login"
                aria-label="Account / Login"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-foreground/5 hover:border-neon-cyan/50 hover:bg-neon-cyan/10 px-3 py-1 text-xs font-mono text-muted-foreground hover:text-neon-cyan transition-all duration-300 shrink-0"
                title="Sign In to Account"
              >
                <User className="h-3.5 w-3.5 text-neon-cyan" />
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* UI Mode Toggle (HUD vs Simple) */}
          <button
            type="button"
            onClick={toggleMode}
            id="ui-mode-toggle"
            aria-label={`Switch to ${mode === "hud" ? "simple" : "HUD"} mode`}
            title={`Current: ${mode.toUpperCase()} mode. Click to switch.`}
            className="flex items-center gap-1.5 rounded-full border border-glass-border bg-foreground/5 hover:border-neon-cyan/50 px-2.5 py-1 text-xs text-muted-foreground transition-all duration-300 shrink-0 cursor-pointer"
          >
            <Layers className={`h-3.5 w-3.5 ${mode === "hud" ? "text-neon-cyan" : "text-neon-purple"} transition-transform hover:scale-110`} />
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider hidden sm:inline">
              {mode === "hud" ? <span className="text-neon-cyan">HUD</span> : <span className="text-neon-purple">SIMPLE</span>}
            </span>
          </button>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="relative flex items-center justify-center rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-all duration-300 hover:bg-foreground/5 hover:text-neon-cyan shrink-0"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 rotate-0 transition-transform duration-500 hover:rotate-90 hover:scale-110" />
            ) : (
              <Moon className="h-4 w-4 text-neon-cyan rotate-0 transition-transform duration-500 hover:-rotate-45 hover:scale-110" />
            )}
          </button>

          <button 
            aria-label="Cart" 
            onClick={() => setIsCartOpen(true)}
            className="relative rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground shrink-0"
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
            className="rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground md:hidden shrink-0"
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
                ) : l.isHighlight ? (
                  <a
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl bg-neon-cyan/15 border border-neon-cyan/40 px-4 py-2.5 text-sm font-bold text-neon-cyan transition-all shadow-[0_0_15px_oklch(0.78_0.18_200/0.25)]"
                  >
                    <Gauge className="h-4 w-4 animate-pulse" />
                    <span>{l.label}</span>
                  </a>
                ) : (
                  <a
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/5 hover:text-neon-cyan transition-all"
                  >
                    {l.label}
                  </a>
                )}
              </li>
            ))}

            {/* Mobile Theme Switcher */}
            <li className="pt-2 border-t border-glass-border">
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                }}
                className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/5 transition-all"
              >
                <span className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-neon-cyan" />
                  )}
                  <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-full border border-neon-cyan/20">
                  {theme.toUpperCase()}
                </span>
              </button>
            </li>

            {/* Mobile HUD / Simple Mode Toggle */}
            <li className="border-t border-glass-border pt-2">
              <button
                type="button"
                onClick={toggleMode}
                id="ui-mode-toggle-mobile"
                className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/5 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-neon-cyan" />
                  <span>{mode === "hud" ? "Switch to Simple Mode" : "Switch to HUD Mode"}</span>
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  mode === "hud"
                    ? "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20"
                    : "text-neon-purple bg-neon-purple/10 border-neon-purple/20"
                }`}>
                  {mode === "hud" ? "HUD" : "SIMPLE"}
                </span>
              </button>
            </li>

            <li className="pt-2 mt-1 border-t border-glass-border flex flex-col gap-2">
              {currentUser?.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple px-4 py-3 text-center text-xs font-mono font-black uppercase tracking-wider text-black shadow-neon-cyan hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4 text-black stroke-[2.5]" />
                  Launch Admin Console
                </Link>
              )}
              {currentUser?.role === "seller" && (
                <Link
                  to="/seller"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-neon-purple/20 border border-neon-purple/40 px-4 py-2.5 text-center text-xs font-mono font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2"
                >
                  <Store className="h-4 w-4 text-neon-purple" />
                  Launch Seller Hub
                </Link>
              )}
              {currentUser && (
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 px-4 py-2.5 text-center text-xs font-mono font-bold uppercase tracking-wider text-neon-cyan hover:bg-neon-cyan/20 transition-all flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4 text-neon-cyan" />
                  Customer Command Center
                </Link>
              )}
              {currentUser ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-center text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out ({currentUser.firstName || currentUser.email})
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-card border border-glass-border hover:border-neon-cyan/50 px-4 py-2.5 text-center text-sm font-mono font-medium text-muted-foreground hover:bg-neon-cyan/10 hover:text-neon-cyan transition-all flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4 text-neon-cyan" />
                  Sign In
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
