import { useState, useEffect, useMemo } from "react";
import {
  MessageSquareHeart,
  Star,
  ShieldCheck,
  Send,
  ThumbsUp,
  Sparkles,
  CheckCircle2,
  Filter,
  User,
  Laptop,
  Briefcase,
  Layers,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { getFeedbacks, submitFeedback, likeFeedback } from "@/lib/api/client";
import { type FeedbackItem } from "@/data/feedbacks";

const categories = ["All", "5 Stars", "Gaming", "Ultrabook", "Workstation"] as const;

export function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [showForm, setShowForm] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rigModel, setRigModel] = useState("");
  const [category, setCategory] = useState<"Gaming" | "Ultrabook" | "Workstation" | "General">("Gaming");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getFeedbacks().then((items) => {
      if (items && items.length > 0) {
        setFeedbacks(items);
      }
    });
  }, []);

  const handleRatingClick = (rate: number) => {
    setRating(rate);
  };

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (likedMap[id]) return;

    setLikedMap((prev) => ({ ...prev, [id]: true }));
    setFeedbacks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, likes: item.likes + 1 } : item))
    );
    await likeFeedback(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your name or callsign.");
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage("Please share a brief review message (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitFeedback({
        name,
        role: role.trim() || "Verified Operator",
        rigModel: rigModel.trim() || "Sellora Machine",
        category,
        rating,
        message,
      });

      // Add to front of list
      setFeedbacks((prev) => [created, ...prev.filter((f) => f.id !== created.id)]);
      setSuccessMessage(true);
      setName("");
      setRole("");
      setRigModel("");
      setMessage("");
      setRating(5);

      setTimeout(() => {
        setSuccessMessage(false);
        setShowForm(false);
      }, 3500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to transmit review. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      if (activeTab === "All") return true;
      if (activeTab === "5 Stars") return item.rating === 5;
      return item.category === activeTab;
    });
  }, [feedbacks, activeTab]);

  const avgRating = useMemo(() => {
    if (feedbacks.length === 0) return "5.0";
    const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  return (
    <section id="feedback" className="relative py-24 md:py-32 border-t border-glass-border">
      {/* Background glow ambiance */}
      <div className="pointer-events-none absolute left-1/4 top-1/3 -z-10 h-96 w-96 rounded-full bg-neon-cyan/15 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 -z-10 h-96 w-96 rounded-full bg-neon-purple/15 blur-3xl" />

      <div className="mx-auto w-full max-w-full px-4 sm:px-8 md:px-12">
        {/* Section Header */}
        <div className="mb-14 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3.5 py-1 text-[10px] font-mono font-bold tracking-[0.25em] text-neon-cyan uppercase">
            <MessageSquareHeart className="h-3.5 w-3.5 animate-pulse" /> Operator Telemetry
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            Community <span className="text-gradient">Feedback & Reviews</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
            Real field benchmarks and honest feedback from esports athletes, VFX artists, and AI engineers running mission-critical workloads on Sellora machines.
          </p>

          {/* Stats Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 rounded-2xl glass p-4 neon-border">
            <div className="flex items-center gap-2.5 px-3">
              <span className="font-display text-2xl font-black text-neon-cyan">{avgRating}</span>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">Overall Score</span>
              </div>
            </div>

            <div className="h-8 w-px bg-glass-border hidden sm:block" />

            <div className="flex items-center gap-2 px-3">
              <ShieldCheck className="h-5 w-5 text-neon-cyan" />
              <div className="text-left">
                <p className="text-xs font-bold text-foreground">100% Verified Rig Owners</p>
                <p className="text-[10px] text-muted-foreground font-mono">Real Benchmarks</p>
              </div>
            </div>

            <div className="h-8 w-px bg-glass-border hidden sm:block" />

            <div className="px-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple px-4 py-2 font-display text-xs font-black uppercase tracking-wider text-black shadow-neon-cyan transition-all hover:scale-105"
              >
                <Sparkles className="h-3.5 w-3.5 text-black" />
                <span>{showForm ? "Close Form" : "+ Transmit Feedback"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Feedback Submission Form Modal/Panel */}
        {showForm && (
          <div className="mb-14 mx-auto max-w-2xl animate-fade-up">
            <div className="rounded-3xl glass-strong p-6 sm:p-8 neon-border shadow-elevated">
              <div className="mb-6 flex items-center justify-between border-b border-glass-border pb-4">
                <div>
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
                    Transmit Operator Review
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your feedback will appear immediately in the community review feed below.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-glass-border p-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  ✕
                </button>
              </div>

              {successMessage ? (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-3 animate-fade-up">
                  <div className="rounded-full bg-neon-cyan/20 border border-neon-cyan/50 p-4 text-neon-cyan">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="font-display text-xl font-bold text-foreground">Transmission Confirmed!</h4>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Thank you! Your feedback has been deployed live to the Sellora Community Deck.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                        Your Name / Callsign *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Alex Mercer"
                          className="w-full rounded-xl border border-glass-border bg-black/40 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                        Your Role / Profession
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          placeholder="e.g. Lead 3D Artist, Pro Gamer"
                          className="w-full rounded-xl border border-glass-border bg-black/40 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                        Your Laptop Model / Rig
                      </label>
                      <div className="relative">
                        <Laptop className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={rigModel}
                          onChange={(e) => setRigModel(e.target.value)}
                          placeholder="e.g. Razer Blade 18, MacBook Pro 16"
                          className="w-full rounded-xl border border-glass-border bg-black/40 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                        Primary Workflow Category
                      </label>
                      <select
                        value={category}
                        onChange={(e: any) => setCategory(e.target.value)}
                        className="w-full rounded-xl border border-glass-border bg-black/40 px-3 py-2.5 text-sm text-foreground focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                      >
                        <option value="Gaming" className="bg-card text-foreground">Gaming</option>
                        <option value="Ultrabook" className="bg-card text-foreground">Ultrabook / Creative</option>
                        <option value="Workstation" className="bg-card text-foreground">Workstation / CAD</option>
                        <option value="General" className="bg-card text-foreground">General Computing</option>
                      </select>
                    </div>
                  </div>

                  {/* Star Rating Select */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                      Hardware Rating ({rating} Stars)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = (hoverRating || rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingClick(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                            title={`${star} Stars`}
                          >
                            <Star
                              className={`h-6 w-6 transition-colors ${
                                isFilled
                                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                                  : "text-muted-foreground/40 hover:text-amber-400"
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="ml-2 font-display text-xs text-neon-cyan font-bold">
                        {rating === 5 && "Flawless Performance"}
                        {rating === 4 && "Great Experience"}
                        {rating === 3 && "Good Machine"}
                        {rating === 2 && "Fair"}
                        {rating === 1 && "Needs Work"}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                      Your Field Review & Impressions *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe thermals, screen quality, battery, gaming benchmarks, or build impressions..."
                      className="w-full rounded-xl border border-glass-border bg-black/40 p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-xl border border-glass-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple px-6 py-2.5 font-display text-xs font-black uppercase tracking-wider text-black shadow-neon-cyan hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Transmitting...</span>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 text-black" />
                          <span>Publish Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Filter Navigation Tabs */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-glass-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((tab) => {
              const isActive = activeTab === tab;
              const count = feedbacks.filter((f) => {
                if (tab === "All") return true;
                if (tab === "5 Stars") return f.rating === 5;
                return f.category === tab;
              }).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "border border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan shadow-[0_0_15px_oklch(0.78_0.18_200/0.3)] font-bold"
                      : "border border-glass-border bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <span>{tab}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? "bg-neon-cyan/30 text-white" : "bg-white/10 text-muted-foreground"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs font-mono text-muted-foreground">
            Showing <span className="text-neon-cyan font-bold">{filteredFeedbacks.length}</span> verified telemetry logs
          </p>
        </div>

        {/* Feedbacks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeedbacks.map((item) => {
            const isLiked = likedMap[item.id];
            const initials = item.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-glass-border bg-card/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-neon-cyan/50 hover:shadow-elevated"
              >
                <div>
                  {/* Top Meta: Avatar + Name + Rating */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border border-neon-cyan/40 font-display text-xs font-black text-neon-cyan shadow-[0_0_12px_rgba(0,242,254,0.3)]">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-display text-sm font-bold text-foreground leading-snug">
                            {item.name}
                          </h4>
                          {item.verifiedPurchase && (
                            <span title="Verified Rig Owner">
                              <ShieldCheck className="h-3.5 w-3.5 text-neon-cyan shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">{item.role}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {item.date}
                    </span>
                  </div>

                  {/* Stars + Rig model badge */}
                  <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < item.rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-white/10 text-white/20"
                          }`}
                        />
                      ))}
                    </div>

                    {item.rigModel && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-glass-border bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-mono text-neon-cyan">
                        <Laptop className="h-3 w-3" />
                        <span>{item.rigModel}</span>
                      </span>
                    )}
                  </div>

                  {/* Feedback Message */}
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    "{item.message}"
                  </p>
                </div>

                {/* Footer of Card: Category tag + Helpful like button */}
                <div className="mt-6 flex items-center justify-between border-t border-glass-border pt-4 text-[11px]">
                  <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
                    {item.category}
                  </span>

                  <button
                    onClick={(e) => handleLike(item.id, e)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono transition-all ${
                      isLiked
                        ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50"
                        : "bg-white/[0.02] text-muted-foreground border border-glass-border hover:bg-white/5 hover:text-foreground"
                    }`}
                    title="Mark review as helpful"
                  >
                    <ThumbsUp className={`h-3 w-3 ${isLiked ? "fill-neon-cyan" : ""}`} />
                    <span>Helpful ({item.likes})</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredFeedbacks.length === 0 && (
            <div className="col-span-full rounded-2xl glass p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <MessageSquareHeart className="h-8 w-8 text-neon-cyan/60" />
              <p className="font-display text-base font-bold text-foreground">No reviews found in this category yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-neon-cyan/20 border border-neon-cyan/50 px-4 py-2 text-xs font-bold text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all"
              >
                <span>Be the first to transmit feedback</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
