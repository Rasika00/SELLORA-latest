import { useState, useEffect } from "react";
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  User,
  Clock,
  ThumbsUp,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { getCurrentUser, type UserSession } from "@/lib/auth";
import {
  getProductReviews,
  checkReviewEligibility,
  submitProductReview,
  type ProductReview,
  type ProductReviewsResponse,
} from "@/lib/api/client";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
}

export function ProductReviewsSection({ productId, productName }: ProductReviewsSectionProps) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [reviewData, setReviewData] = useState<ProductReviewsResponse>({
    productId,
    totalCount: 0,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    alreadyReviewed?: boolean;
    orderId?: string;
    orderNumber?: string;
    orderStatus?: string;
    message?: string;
  }>({ eligible: false });

  // Submission Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    loadReviews();
    if (currentUser?.email || currentUser?.id) {
      checkEligibility(currentUser);
    } else {
      setIsLoading(false);
    }
  }, [productId]);

  const loadReviews = async () => {
    try {
      const data = await getProductReviews(productId);
      setReviewData(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEligibility = async (currentUser: UserSession) => {
    try {
      const res = await checkReviewEligibility(productId, {
        email: currentUser.email,
        userId: currentUser.id,
      });
      setEligibility(res);
    } catch (err) {
      console.error("Failed to check eligibility:", err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!comment.trim() || comment.trim().length < 8) {
      setSubmitError("Please write at least 8 characters describing your experience with this machine.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await submitProductReview(productId, {
        rating,
        comment: comment.trim(),
        userId: user.id,
        email: user.email,
        orderId: eligibility.orderId,
      });

      if (res.success) {
        setSubmitSuccess(true);
        setComment("");
        // Refresh reviews and eligibility
        await loadReviews();
        await checkEligibility(user);
      } else {
        setSubmitError(res.error || "Failed to submit review.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-16 border-b border-glass-border">
      <div className="mx-auto w-full max-w-full px-4 sm:px-8 md:px-12">
        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-glass-border pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-mono mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Customer Reviews</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
              Real Operator Benchmarks &amp; Feedback
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Field reports and thermal appraisals directly from verified owners of {productName}.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-display font-black text-foreground flex items-center justify-end gap-2">
                <span>{reviewData.averageRating > 0 ? reviewData.averageRating.toFixed(1) : "New"}</span>
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-0.5">
                {reviewData.totalCount} {reviewData.totalCount === 1 ? "Verified Review" : "Verified Reviews"}
              </div>
            </div>
          </div>
        </div>

        {/* Rating Breakdown & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Average Rating Card */}
          <div className="rounded-2xl bg-card p-6 border border-border shadow-card flex flex-col items-center justify-center text-center">
            <div className="text-5xl font-display font-black text-foreground mb-2">
              {reviewData.averageRating > 0 ? reviewData.averageRating.toFixed(1) : "—"}
            </div>
            <div className="flex items-center gap-1 mb-2 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${
                    s <= Math.round(reviewData.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              Based on {reviewData.totalCount} customer ratings
            </div>
            <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[11px] font-mono flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>100% Verified Delivery Receipts</span>
            </div>
          </div>

          {/* Star Distribution Bars */}
          <div className="lg:col-span-2 rounded-2xl bg-card p-6 border border-border shadow-card space-y-2.5 flex flex-col justify-center">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviewData.distribution[stars] || 0;
              const percent = reviewData.totalCount > 0 ? (count / reviewData.totalCount) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-12 text-muted-foreground flex items-center gap-1">
                    <span>{stars}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verified Review Submission Form (Only shown to buyers who ordered this laptop) */}
        {user ? (
          eligibility.eligible ? (
            <div className="mb-12 rounded-3xl bg-card p-6 sm:p-8 border border-primary/30 shadow-card relative overflow-hidden animate-fade-in">
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-[90px]" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-primary font-mono text-xs font-semibold">
                  <PackageCheck className="h-4 w-4" />
                  <span>Verified Purchase Detected &bull; Order {eligibility.orderNumber}</span>
                </div>
                <h4 className="text-xl font-display font-bold text-foreground mb-2">
                  Share Your Verified Review for {productName}
                </h4>
                <p className="text-xs text-muted-foreground mb-6">
                  Your feedback helps fellow architects, competitive players, and creators configure the perfect rig.
                </p>

                {submitError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccess && (
                  <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>Thank you! Your verified hardware review is now published.</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                  {/* Interactive Star Rating */}
                  <div>
                    <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-2 font-bold">
                      Your Machine Rating *
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono text-amber-500 font-bold ml-2">
                        {rating} out of 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Review Textarea */}
                  <div>
                    <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1.5 font-bold">
                      Your Written Hardware Feedback *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describe thermal performance, screen accuracy, build quality, gaming FPS, or battery longevity under real load..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isSubmitting ? "Publishing Review..." : "Publish Verified Review"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : eligibility.alreadyReviewed ? (
            <div className="mb-12 p-4 rounded-2xl bg-secondary/50 border border-border text-xs text-foreground flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>You have already submitted a verified review for this machine on your completed order.</span>
            </div>
          ) : null
        ) : (
          <div className="mb-12 p-5 rounded-2xl bg-secondary/50 border border-border text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <span className="text-foreground">Ordered this laptop? Sign in with your customer account to publish a verified field review.</span>
            </div>
            <a
              href="/login"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-mono text-xs font-bold transition-all text-center shrink-0 hover:bg-primary/90"
            >
              Sign In to Review
            </a>
          </div>
        )}

        {/* Reviews Feed */}
        {reviewData.reviews.length > 0 ? (
          <div className="space-y-4">
            {reviewData.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-2xl bg-card border border-border shadow-card hover:border-primary/30 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary font-mono">
                      {(rev.user?.firstName?.[0] || rev.user?.email?.[0] || "U").toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span>
                          {rev.user?.firstName
                            ? `${rev.user.firstName} ${rev.user.lastName || ""}`.trim()
                            : rev.user?.email?.split("@")[0] || "Verified Operator"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[10px] font-mono flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Verified Purchase</span>
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {rev.user?.firstName
                          ? `${rev.user.firstName} ${rev.user.lastName || ""}`.trim()
                          : rev.user?.email
                          ? rev.user.email.split("@")[0]
                          : "Verified Customer"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= rev.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed font-sans pt-1">
                  "{rev.comment}"
                </p>

                <div className="pt-2 flex justify-between items-center text-[11px] font-mono text-muted-foreground border-t border-border">
                  <span>Hardware verified on SELLORA Network</span>
                  <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-card border border-dashed border-border text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h4 className="font-display font-bold text-foreground text-base">No Customer Reviews Yet</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Be the first verified operator to order this machine and publish a field benchmark report.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

