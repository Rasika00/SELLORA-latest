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
      <nav className="mx-auto flex w-full max-w-full items-center justify-between rounded-2xl border border-border bg-card/90 px-3 sm:px-6 py-2 sm:py-2.5 gap-2 backdrop-blur-xl shadow-card pointer-events-auto">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={theme === "light" ? "/logo black.png" : "/logo.png"}
            alt="Sellora"
            className="h-8 sm:h-9 w-auto object-contain transition-all duration-300"
          />
          <span className="font-brand text-base sm:text-lg font-black tracking-widest text-foreground">SELLORA</span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden items-center gap-4 lg:gap-6 md:flex">
          {links.map((l) => (
            <li key={l.label}>
              {l.isRouterLink ? (
                <Link
                  to={l.href as any}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/20 shadow-sm"
                >
                  <Scale className="h-3 w-3 shrink-0" />
                  <span>{l.label}</span>
                </Link>
              ) : l.isHighlight ? (
                <a
                  href={l.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-primary transition-all hover:bg-primary/20 shadow-sm"
                >
                  <Gauge className="h-3 w-3" />
                  <span>{l.label}</span>
                </a>
              ) : (
                <a
                  href={l.href}
                  className="text-xs font-semibold text-foreground/85 transition-colors hover:text-foreground tracking-wide"
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
            className="hidden md:flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 hover:border-primary/40 hover:bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground transition-all duration-200 group shadow-sm shrink-0 cursor-pointer"
            title="Smart Search (Ctrl + K or /)"
          >
            <Search className="h-3 w-3 text-primary transition-transform group-hover:scale-110" />
            <span className="font-sans group-hover:text-foreground hidden lg:inline">Search...</span>
            <span className="font-sans group-hover:text-foreground inline lg:hidden">Search</span>
          </button>

          {/* Mobile Quick Search Button */}
          <button
            type="button"
            onClick={() => openSearch()}
            aria-label="Smart Search"
            title="Smart Search (Ctrl + K)"
            className="flex md:hidden items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground shrink-0"
          >
            <Search className="h-4 w-4 text-primary" />
          </button>

          {/* Role-Based Dashboard Quick Access */}
          {currentUser?.role === "admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-primary hover:bg-primary/20 shadow-sm transition-all shrink-0"
              title="Admin Command Console"
            >
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 stroke-[2.5]" />
              <span className="hidden sm:inline">Admin Console</span>
              <span className="inline sm:hidden font-bold">Admin</span>
            </Link>
          )}

          {currentUser?.role === "seller" && (
            <Link
              to="/seller"
              className="flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/30 px-3 py-1 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-accent hover:bg-accent/20 shadow-sm transition-all shrink-0"
              title="Seller Vendor Hub"
            >
              <Store className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="hidden sm:inline">Seller Hub</span>
              <span className="inline sm:hidden font-bold">Seller</span>
            </Link>
          )}

          {/* User Sign In / Profile / Logout */}
          {currentUser ? (
            <div className="flex items-center gap-1 shrink-0">
              <Link
                to="/account"
                className="flex items-center gap-2 rounded-lg py-1 px-1.5 sm:px-2 text-xs font-mono text-foreground hover:bg-secondary transition-colors group"
                title="Customer Command Center & Hub"
              >
                <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[11px] font-bold text-foreground group-hover:border-primary/50 transition-colors">
                  {currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "U")}
                </div>
                <span className="hidden lg:inline text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                  {currentUser.firstName || currentUser.email.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center shrink-0">
              <Link
                to="/login"
                aria-label="Account / Login"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 hover:border-primary/40 hover:bg-secondary px-3 py-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-all duration-200 shrink-0"
                title="Sign In to Account"
              >
                <User className="h-3.5 w-3.5 text-primary" />
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
            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 hover:border-primary/40 px-2.5 py-1 text-xs text-muted-foreground transition-all duration-200 shrink-0 cursor-pointer"
          >
            <Layers className={`h-3.5 w-3.5 ${mode === "hud" ? "text-primary" : "text-accent"} transition-transform hover:scale-110`} />
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider hidden sm:inline">
              {mode === "hud" ? <span className="text-primary">HUD</span> : <span className="text-accent">SIMPLE</span>}
            </span>
          </button>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="relative flex items-center justify-center rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground shrink-0 cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 rotate-0 transition-transform duration-500 hover:rotate-90 hover:scale-110" />
            ) : (
              <Moon className="h-4 w-4 text-primary rotate-0 transition-transform duration-500 hover:-rotate-45 hover:scale-110" />
            )}
          </button>

          <button 
            aria-label="Cart" 
            onClick={() => setIsCartOpen(true)}
            className="relative rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground shrink-0 cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-sm flex items-center justify-center">
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
        <div className="md:hidden mx-auto mt-2 max-w-full rounded-2xl bg-card border border-border p-4 animate-fade-up shadow-elevated pointer-events-auto">
          <ul className="flex flex-col gap-2">
            {links.map((l) => (
              <li key={l.label}>
                {l.isRouterLink ? (
                  <Link
                    to={l.href as any}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-4 py-2 text-xs font-bold text-primary transition-all shadow-sm"
                  >
                    <Scale className="h-4 w-4" />
                    <span>{l.label}</span>
                  </Link>
                ) : l.isHighlight ? (
                  <a
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-4 py-2 text-xs font-bold text-primary transition-all shadow-sm"
                  >
                    <Gauge className="h-4 w-4" />
                    <span>{l.label}</span>
                  </a>
                ) : (
                  <a
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-all"
                  >
                    {l.label}
                  </a>
                )}
              </li>
            ))}

            {/* Mobile Theme Switcher */}
            <li className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                }}
                className="flex w-full items-center justify-between rounded-xl px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-all"
              >
                <span className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-primary" />
                  )}
                  <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {theme.toUpperCase()}
                </span>
              </button>
            </li>

            {/* Mobile HUD / Simple Mode Toggle */}
            <li className="border-t border-border pt-2">
              <button
                type="button"
                onClick={toggleMode}
                id="ui-mode-toggle-mobile"
                className="flex w-full items-center justify-between rounded-xl px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-all"
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>{mode === "hud" ? "Switch to Simple Mode" : "Switch to HUD Mode"}</span>
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  mode === "hud"
                    ? "text-primary bg-primary/10 border-primary/20"
                    : "text-accent bg-accent/10 border-accent/20"
                }`}>
                  {mode === "hud" ? "HUD" : "SIMPLE"}
                </span>
              </button>
            </li>

            <li className="pt-2 mt-1 border-t border-border flex flex-col gap-2">
              {currentUser?.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-primary/10 border border-primary/30 px-4 py-2.5 text-center text-xs font-mono font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                  Launch Admin Console
                </Link>
              )}
              {currentUser?.role === "seller" && (
                <Link
                  to="/seller"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-accent/10 border border-accent/30 px-4 py-2.5 text-center text-xs font-mono font-bold uppercase tracking-wider text-accent hover:bg-accent/20 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Store className="h-4 w-4" />
                  Launch Seller Hub
                </Link>
              )}
              {currentUser && (
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-center text-xs font-mono font-bold uppercase tracking-wider text-foreground hover:border-primary/40 transition-all flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4 text-primary" />
                  Customer Command Center
                </Link>
              )}
              {currentUser ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-center text-xs font-bold text-destructive hover:bg-destructive/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out ({currentUser.firstName || currentUser.email})
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-secondary border border-border hover:border-primary/40 px-4 py-2.5 text-center text-xs font-mono font-medium text-foreground hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4 text-primary" />
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
