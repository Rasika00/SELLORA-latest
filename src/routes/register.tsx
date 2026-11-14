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
  AlertCircle,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { registerUser } from "@/lib/api/client";
import { setCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

export function RegisterPage() {
  const navigate = useNavigate();

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Colombo 03");
  const [postalCode, setPostalCode] = useState("00300");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
        role: "customer",
      });

      if (regResult?.user) {
        setCurrentUser(regResult.user);
        navigate({ to: "/account" });
      } else {
        throw new Error("Registration failed to return user data.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-neon-cyan/30">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-neon-blue/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="relative w-full max-w-xl rounded-3xl glass-strong border border-glass-border p-6 sm:p-10 shadow-elevated backdrop-blur-xl animate-fade-up">
          {/* Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-3">
              <span className="font-display font-black text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
                SELLORA
              </span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-mono font-semibold mb-2">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Customer Account</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
              Create Your Account
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Join SELLORA for seamless laptop ordering, real-time shipment tracking, and verified reviews.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* CUSTOMER REGISTRATION FORM */}
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Mercer"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="alex.mercer@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                  Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                Initial Delivery Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <textarea
                  rows={2}
                  required
                  placeholder="No. 45/A Galle Road, Suite 4B"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors resize-none"
                />
              </div>
            </div>

            {/* City and Postal Code */}
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
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
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
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-muted-foreground font-mono uppercase text-[10px] mb-1 font-bold">
                Account Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-10 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-display font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-black" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Switch to Sign In */}
            <div className="text-center pt-3 text-xs text-muted-foreground space-y-2">
              <p>
                Already registered?{" "}
                <Link to="/login" className="text-neon-cyan font-bold hover:underline">
                  Sign in here
                </Link>
              </p>

              {/* Link to Seller Registration */}
              <div className="pt-2 border-t border-white/10">
                <Link
                  to="/seller-register"
                  className="inline-flex items-center gap-1.5 text-xs text-neon-purple hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-neon-purple/10 border border-neon-purple/20 hover:border-neon-purple/50 font-medium"
                >
                  <Store className="h-3.5 w-3.5" />
                  <span>Looking to sell laptops? Register as a Seller</span>
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
