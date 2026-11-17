import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Store,
  UserPlus,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { loginUser } from "@/lib/api/client";
import { setCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await loginUser({ email: email.trim().toLowerCase(), password });
      if (result?.user) {
        setCurrentUser(result.user);

        // Smart Role-Based Redirection
        if (result.user.role === "admin") {
          navigate({ to: "/admin" });
        } else if (result.user.role === "seller") {
          navigate({ to: "/seller" });
        } else {
          navigate({ to: "/" });
        }
      } else {
        throw new Error("Login failed to return user data.");
      }
    } catch (backendError: any) {
      setError(backendError?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between relative isolate overflow-x-hidden">
      <Navbar />

      {/* Ambient background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[450px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[130px]" />

      <div className="mx-auto max-w-md w-full px-4 pt-32 pb-20 flex-1 flex items-center justify-center">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-card">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Welcome Back
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in to your SELLORA account to manage orders and access your dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-xs font-medium text-destructive animate-fade-in flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-5 py-3 font-display text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Account Creation Links */}
            <div className="pt-4 border-t border-border space-y-2.5 text-center">
              <p className="text-xs text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary font-semibold hover:underline">
                  Create Customer Account
                </Link>
              </p>

              <div className="pt-1">
                <Link
                  to="/seller-register"
                  className="inline-flex items-center gap-1.5 text-xs text-foreground/80 hover:text-foreground transition-colors py-1.5 px-3 rounded-lg bg-secondary border border-border hover:border-border-hover"
                >
                  <Store className="h-3 w-3" />
                  <span>Want to sell laptops? Register as a Seller</span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  );
}
