import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Store,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  PackageCheck,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { registerUser } from "@/lib/api/client";
import { setCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/seller-register")({
  component: SellerRegisterPage,
});

export function SellerRegisterPage() {
  const navigate = useNavigate();

  // Store Fields
  const [storeName, setStoreName] = useState("");
  const [storeBio, setStoreBio] = useState("");

  // Representative Details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Business Address
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Colombo 03");
  const [postalCode, setPostalCode] = useState("00300");

  // Password
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!storeName.trim()) {
      setError("Store / Brand name is required.");
      return;
    }

    if (!email || !password || !firstName || !lastName || !phone || !address) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const regResult = await registerUser({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        role: "seller",
        storeName: storeName.trim(),
        storeBio: storeBio.trim(),
      });

      if (regResult?.user) {
        setCurrentUser(regResult.user);
        navigate({ to: "/seller" });
      } else {
        throw new Error("Registration failed to return vendor data.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Vendor registration failed. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-neon-purple/30">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-purple/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative w-full max-w-2xl rounded-3xl glass-strong border border-neon-purple/30 p-6 sm:p-10 shadow-elevated backdrop-blur-xl animate-fade-up">
          {/* Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-3">
              <span className="font-display font-black text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-purple">
                SELLORA
              </span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-purple/15 border border-neon-purple/40 text-neon-purple text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Store className="h-3.5 w-3.5" />
              <span>Vendor Onboarding Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Sell Laptops on SELLORA
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Join our verified vendor network. List cutting-edge machines, process customer orders, and enjoy low platform fees with rapid payouts.
            </p>
          </div>

          {/* Vendor Advantage Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
              <div className="mx-auto w-7 h-7 rounded-lg bg-neon-purple/20 flex items-center justify-center text-neon-purple mb-1.5">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <p className="text-[11px] font-bold text-white">5% Flat Fee</p>
              <p className="text-[10px] text-muted-foreground">Keep 95% of profits</p>
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
              <div className="mx-auto w-7 h-7 rounded-lg bg-neon-cyan/20 flex items-center justify-center text-neon-cyan mb-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <p className="text-[11px] font-bold text-white">Escrow Secured</p>
              <p className="text-[10px] text-muted-foreground">Guaranteed payouts</p>
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
              <div className="mx-auto w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1.5">
                <PackageCheck className="h-3.5 w-3.5" />
              </div>
              <p className="text-[11px] font-bold text-white">Packing Slips</p>
              <p className="text-[10px] text-muted-foreground">Printable dispatch</p>
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
              <div className="mx-auto w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <p className="text-[11px] font-bold text-white">Live Analytics</p>
              <p className="text-[10px] text-muted-foreground">Real-time stats</p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SELLER REGISTRATION FORM */}
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            {/* Store Branding Section */}
            <div className="p-4 rounded-2xl bg-black/40 border border-neon-purple/40 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                <Store className="h-4 w-4 text-neon-purple" />
                <span className="font-mono uppercase text-[11px] font-bold text-neon-purple tracking-wider">
                  Store / Brand Identity
                </span>
              </div>

              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                  Store / Company Name *
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neon-purple" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Hardware Store"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-neon-purple transition-colors text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                  Store Description & Specialization
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Authorized distributor of RTX 40-series gaming rigs, MacBook Pros, and AI creator laptops..."
                  value={storeBio}
                  onChange={(e) => setStoreBio(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-neon-purple transition-colors resize-none text-xs"
                />
              </div>
            </div>

            {/* Representative Details */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                <User className="h-4 w-4 text-neon-cyan" />
                <span className="font-mono uppercase text-[11px] font-bold text-neon-cyan tracking-wider">
                  Authorized Representative
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mercer"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                    Business Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      placeholder="sales@apexhardware.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                    Business Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="tel"
                      required
                      placeholder="+94 77 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                <MapPin className="h-4 w-4 text-amber-400" />
                <span className="font-mono uppercase text-[11px] font-bold text-amber-400 tracking-wider">
                  Dispatch / Headquarters Address
                </span>
              </div>

              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                  Street Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. No. 120 Galle Road, Commercial Hub"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-neon-purple transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Colombo 03"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-neon-purple transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="00300"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-neon-purple transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <label className="block text-muted-foreground font-mono uppercase text-[10px] font-bold">
                Seller Account Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-white focus:outline-none focus:border-neon-purple transition-colors text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-purple text-black font-display font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(123,44,191,0.5)] hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-black" />
                  <span>Onboarding Vendor...</span>
                </>
              ) : (
                <>
                  <span>Complete Vendor Onboarding</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Switch to Sign In / Customer */}
            <div className="text-center pt-3 text-xs text-muted-foreground space-y-2">
              <p>
                Already registered as a vendor?{" "}
                <Link to="/seller" className="text-neon-purple font-bold hover:underline">
                  Sign in to Seller Hub
                </Link>
              </p>

              <div className="pt-2 border-t border-white/10">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-xs text-neon-cyan hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 hover:border-neon-cyan/50 font-medium"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Looking to buy laptops? Customer Registration</span>
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
