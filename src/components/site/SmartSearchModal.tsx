import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  X,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  ShoppingCart,
  Check,
  Cpu,
  Layers,
  Zap,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useSearch } from "@/context/SearchContext";
import { products, type Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

const TRENDING_SEARCHES = [
  "RTX 4090",
  "MacBook Pro M3 Max",
  "OLED 240Hz",
  "Intel Core Ultra 9",
  "Razer Blade 18",
  "Dual Screen",
  "Under Rs 250,000",
  "Workstation",
];

const FILTER_PILLS = [
  { label: "All", value: "all" },
  { label: "Gaming", value: "Gaming" },
  { label: "Ultrabook", value: "Ultrabook" },
  { label: "Workstation", value: "Workstation" },
  { label: "RTX 4090 / 4080", value: "high-gpu" },
  { label: "Under Rs 2.5L", value: "under-250k" },
];

export function SmartSearchModal() {
  const { isSearchOpen, setIsSearchOpen, searchQuery, setSearchQuery } = useSearch();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sellora_recent_searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 6));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem("sellora_recent_searches", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== item);
    setRecentSearches(updated);
    try {
      localStorage.setItem("sellora_recent_searches", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem("sellora_recent_searches");
    } catch {
      // ignore
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      setSelectedIndex(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [isSearchOpen]);

  // Voice Search setup
  const toggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please type your query.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
          saveRecentSearch(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Smart Filter and Matching Algorithm
  const filteredProducts = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    let list = [...products];

    // Category filter tab
    if (activeCategory === "Gaming" || activeCategory === "Ultrabook" || activeCategory === "Workstation") {
      list = list.filter((p) => p.category === activeCategory);
    } else if (activeCategory === "high-gpu") {
      list = list.filter(
        (p) =>
          p.gpu.toLowerCase().includes("4090") ||
          p.gpu.toLowerCase().includes("4080") ||
          p.gpu.toLowerCase().includes("ada")
      );
    } else if (activeCategory === "under-250k") {
      list = list.filter((p) => p.price <= 250000);
    }

    if (!rawQuery) {
      return list;
    }

    // Check for price constraint patterns like "under 200000", "< 300000", "cheap"
    const priceUnderMatch = rawQuery.match(/(?:under|<|below|less than)\s*([0-9.,]+)\s*(?:k|l|lakh)?/i);
    let parsedPriceLimit: number | null = null;
    if (priceUnderMatch && priceUnderMatch[1]) {
      let num = parseFloat(priceUnderMatch[1].replace(/,/g, ""));
      if (rawQuery.includes("k") && num < 1000) num *= 1000;
      if (rawQuery.includes("l") || rawQuery.includes("lakh")) num *= 100000;
      if (!isNaN(num)) parsedPriceLimit = num;
    }

    const terms = rawQuery
      .replace(/(?:under|<|below|less than)\s*[0-9.,]+(?:\s*(?:k|l|lakh))?/gi, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return list
      .map((p) => {
        let score = 0;
        const nameLower = p.name.toLowerCase();
        const categoryLower = p.category.toLowerCase();
        const procLower = p.processor.toLowerCase();
        const cpuLower = p.cpu.toLowerCase();
        const gpuLower = p.gpu.toLowerCase();
        const ramLower = p.ram.toLowerCase();
        const displayLower = (p.display || "").toLowerCase();
        const highlightLower = (p.specialHighlight || "").toLowerCase();
        const badgeLower = p.badge.toLowerCase();

        // Exact name match
        if (nameLower === rawQuery) score += 100;
        else if (nameLower.includes(rawQuery)) score += 50;

        // Terms matching
        for (const term of terms) {
          if (nameLower.includes(term)) score += 30;
          if (gpuLower.includes(term)) score += 25;
          if (cpuLower.includes(term) || procLower.includes(term)) score += 25;
          if (ramLower.includes(term)) score += 15;
          if (displayLower.includes(term)) score += 15;
          if (categoryLower.includes(term)) score += 20;
          if (highlightLower.includes(term)) score += 15;
          if (badgeLower.includes(term)) score += 10;
        }

        // Apply price constraint if requested
        if (parsedPriceLimit !== null) {
          if (p.price <= parsedPriceLimit) score += 35;
          else score = 0; // Filtered out
        }

        return { product: p, score };
      })
      .filter((item) => (terms.length > 0 || parsedPriceLimit !== null ? item.score > 0 : true))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);
  }, [searchQuery, activeCategory]);

  // Handle keyboard navigation inside results
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, activeCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts.length > 0 && filteredProducts[selectedIndex]) {
        handleSelectProduct(filteredProducts[selectedIndex].id);
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    saveRecentSearch(searchQuery);
    setIsSearchOpen(false);
    navigate({ to: `/product/${productId}` as any });
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.trim().toLowerCase() ? (
            <span key={i} className="text-primary font-semibold bg-primary/15 px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center p-3 sm:p-6 md:p-10 bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsSearchOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="relative p-3.5 sm:p-5 border-b border-border bg-card">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 sm:px-4 py-2.5 sm:py-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <Search className="h-5 w-5 text-primary shrink-0" />
            
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by model, GPU (RTX 4090), processor, OLED, RAM..."
              className="flex-1 bg-transparent text-sm sm:text-base font-sans text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />

            {/* Voice Search Button */}
            <button
              type="button"
              onClick={toggleVoiceSearch}
              title={isListening ? "Listening... click to stop" : "Voice search"}
              className={`rounded-lg p-1.5 transition-all shrink-0 ${
                isListening
                  ? "bg-red-500/20 text-red-400 ring-2 ring-red-400 animate-pulse"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Clear Query */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  inputRef.current?.focus();
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground shrink-0"
                title="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* ESC badge */}
            <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground shrink-0"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Voice Search active banner */}
          {isListening && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs text-primary animate-fade-in">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                Listening... Say a machine name or GPU (e.g. &ldquo;RTX 4090&rdquo; or &ldquo;MacBook Pro&rdquo;)
              </span>
              <button
                type="button"
                onClick={toggleVoiceSearch}
                className="text-[10px] underline uppercase tracking-wider font-semibold"
              >
                Stop
              </button>
            </div>
          )}

          {/* Quick Category / Spec Filter Pills */}
          <div className="mt-3 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {FILTER_PILLS.map((pill) => {
              const active = activeCategory === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setActiveCategory(pill.value)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-mono font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground border border-border"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results / Suggestions Container */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-5 divide-y divide-border space-y-4"
        >
          {/* If no search term typed yet, show Trending and Recent Searches */}
          {!searchQuery && (
            <div className="space-y-5 pb-2">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-[10px] font-mono text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <span
                        key={term}
                        onClick={() => {
                          setSearchQuery(term);
                          inputRef.current?.focus();
                        }}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-foreground cursor-pointer hover:border-primary hover:text-primary transition-all"
                      >
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, term)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Suggestions */}
              <div>
                <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  Popular Suggestions
                </span>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.map((trend) => (
                    <button
                      key={trend}
                      type="button"
                      onClick={() => {
                        setSearchQuery(trend);
                        saveRecentSearch(trend);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-secondary hover:text-foreground transition-all"
                    >
                      <Sparkles className="h-3 w-3 text-primary/70" />
                      <span>{trend}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Recommended Laptops Header */}
              <div className="pt-2">
                <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Featured Hardware Deck ({products.length} Models)
                </span>
              </div>
            </div>
          )}

          {/* Search Result Count */}
          {searchQuery && (
            <div className="flex items-center justify-between pb-2 text-xs font-mono text-muted-foreground">
              <span>
                Found <strong className="text-primary">{filteredProducts.length}</strong> matching machines
                {activeCategory !== "all" ? ` in ${activeCategory}` : ""}
              </span>
              <span className="hidden sm:inline text-[11px] text-muted-foreground/70">
                Use ↑ / ↓ to navigate, ↵ to view
              </span>
            </div>
          )}

          {/* Product Items List */}
          {filteredProducts.length > 0 ? (
            <div className="space-y-2.5 pt-2">
              {filteredProducts.map((p, index) => {
                const isSelected = index === selectedIndex;
                const isAdded = !!addedItemIds[p.id];

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border p-2.5 sm:p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card/60 hover:border-border-hover hover:bg-secondary/30"
                    }`}
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/40 flex items-center justify-center p-1">
                        <img
                          src={p.img}
                          alt={p.name}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        <span
                          className={`absolute top-1 left-1 h-1.5 w-1.5 rounded-full ${
                            p.badgeColor === "cyan"
                              ? "bg-primary"
                              : p.badgeColor === "purple"
                              ? "bg-accent"
                              : "bg-primary"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                            {p.badge}
                          </span>
                          <span className="text-[10px] font-mono text-primary font-medium">
                            {p.category}
                          </span>
                        </div>

                        <h4 className="font-display text-sm sm:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {highlightMatch(p.name, searchQuery)}
                        </h4>

                        {/* Specs Pill Chips */}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded bg-secondary border border-border/50 px-1.5 py-0.5 font-mono">
                            <Cpu className="h-3 w-3 text-primary" />
                            {highlightMatch(p.cpu, searchQuery)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-secondary border border-border/50 px-1.5 py-0.5 font-mono">
                            <Zap className="h-3 w-3 text-accent" />
                            {highlightMatch(p.gpu, searchQuery)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-secondary border border-border/50 px-1.5 py-0.5 font-mono">
                            <Layers className="h-3 w-3 text-primary" />
                            {highlightMatch(p.ram, searchQuery)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pricing & Quick Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                      <div className="text-left sm:text-right">
                        <div className="font-display text-sm sm:text-base font-bold text-foreground">
                          Rs {p.price.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, p)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all flex items-center gap-1 shrink-0 ${
                            isAdded
                              ? "bg-emerald-600 text-white font-bold shadow-sm"
                              : "border border-border bg-secondary/60 hover:border-primary hover:text-primary text-muted-foreground"
                          }`}
                          title="Quick Add to Cart"
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-3 w-3 stroke-[3]" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-3 w-3" />
                              <span className="hidden sm:inline">Add</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProduct(p.id);
                          }}
                          className="rounded-lg bg-primary hover:bg-primary-hover px-2.5 py-1 text-xs font-mono font-medium text-primary-foreground shadow-sm transition-all flex items-center gap-1"
                          title="View Specs"
                        >
                          <span>Specs</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary/30 shadow-inner mb-4">
                <Search className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">
                No matching hardware found
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                We couldn&apos;t find any laptop matching &ldquo;
                <span className="text-primary font-semibold">{searchQuery}</span>
                &rdquo;. Try searching for &ldquo;RTX 4090&rdquo;, &ldquo;MacBook&rdquo;, or &ldquo;i9&rdquo;.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-mono text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  Clear Search
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-all"
                >
                  Reset Category
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="p-3 sm:px-5 border-t border-border bg-card/90 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[9px]">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[9px]">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[9px]">
                ESC
              </kbd>
              Dismiss
            </span>
          </div>

          <span className="hidden sm:inline text-primary font-medium">
            SELLORA Quantum Search Engine
          </span>
        </div>
      </div>
    </div>
  );
}
