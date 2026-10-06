import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import emailjs from "@emailjs/browser";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, Phone, MapPin } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { loginUser, registerUser } from "@/lib/api/client";
import { useUIMode } from "@/context/UIModeContext";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

interface RegisteredUser {
  id?: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  gender?: string;
  role?: string;
  createdAt?: string;
}

const REGISTERED_USERS_KEY = "sellora_registered_users";

function getRegisteredUsers(): RegisteredUser[] {
  let list: RegisteredUser[] = [];
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
  } catch (e) {
    console.error("Error reading registered users", e);
  }

  // Include existing user from sellora_user if any
  try {
    const prevSingle = localStorage.getItem("sellora_user");
    if (prevSingle) {
      const parsed = JSON.parse(prevSingle);
      if (parsed?.email && !list.some((u) => u.email.toLowerCase() === parsed.email.toLowerCase())) {
        list.push(parsed);
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {
    // ignore
  }

  // Ensure default admin account is registered
  if (!list.some((u) => u.email.toLowerCase() === "admin@sellora.dev")) {
    list.push({
      id: "usr-admin",
      email: "admin@sellora.dev",
      password: "admin",
      firstName: "Rasika",
      lastName: "Admin",
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
  }

  return list;
}

function saveRegisteredUser(user: RegisteredUser) {
  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push(user);
  }
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

function LoginPage() {
  const navigate = useNavigate();
  const { isSimple } = useUIMode();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (isSignUp) {
      // Validate registration fields
      if (!firstName.trim() || !lastName.trim()) {
        setError("Please enter your first and last name.");
        setIsLoading(false);
        return;
      }
      if (!email.trim() || !password) {
        setError("Please enter your email and password.");
        setIsLoading(false);
        return;
      }
      if (password.length < 4) {
        setError("Password must be at least 4 characters long.");
        setIsLoading(false);
        return;
      }

      // Check if user is already registered
      const cleanEmail = email.trim().toLowerCase();
      const users = getRegisteredUsers();
      const existingUser = users.find(
        (u) => u.email.toLowerCase().trim() === cleanEmail
      );
      if (existingUser) {
        setError("An account with this email is already registered. Please sign in instead.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      // Start Registration Verification
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setIsVerifying(true);

      // Try to send real email via EmailJS
      emailjs
        .send(
          'service_mnefcui',
          'template_kuzk4cr',
          {
            to_name: `${firstName} ${lastName}`.trim() || 'User',
            to_email: cleanEmail,
            otp_code: code,
          },
          'g_SXC8czs8comYen0'
        )
        .then(() => {
          console.log("Email sent successfully!");
        })
        .catch((error) => {
          console.error("EmailJS error:", error);
        });
    } else {
      // Sign In Flow - STRICT CHECK: ONLY REGISTERED USERS CAN LOG IN
      if (!email.trim() || !password) {
        setError("Please enter both email and password.");
        setIsLoading(false);
        return;
      }

      const cleanEmail = email.trim().toLowerCase();

      // 1. Try backend database login first
      try {
        const result = await loginUser({ email: cleanEmail, password });
        setIsLoading(false);
        if (result?.user) {
          saveRegisteredUser(result.user);
          localStorage.setItem("sellora_user", JSON.stringify(result.user));
          if (result.user.role === "admin" || cleanEmail.includes("admin")) {
            navigate({ to: "/admin" });
          } else {
            navigate({ to: "/" });
          }
          return;
        }
      } catch (backendError: any) {
        console.warn("Backend auth failed or offline, verifying against registered users registry:", backendError?.message);
      }

      // 2. Verify against registered users registry
      const users = getRegisteredUsers();
      const registeredUser = users.find(
        (u) => u.email.toLowerCase().trim() === cleanEmail
      );

      setIsLoading(false);

      // Enforce: User MUST be registered
      if (!registeredUser) {
        setError("This email is not registered. Only registered users can log in. Please click 'Sign up' below to create your account.");
        return;
      }

      // Enforce: Password MUST match
      if (registeredUser.password !== password) {
        setError("Incorrect password. Please verify your credentials and try again.");
        return;
      }

      // Valid registered user login!
      const userSession = {
        id: registeredUser.id || `usr-${Date.now()}`,
        email: registeredUser.email,
        firstName: registeredUser.firstName,
        lastName: registeredUser.lastName,
        phone: registeredUser.phone,
        address: registeredUser.address,
        role: registeredUser.role || (cleanEmail.includes("admin") ? "admin" : "customer"),
      };

      localStorage.setItem("sellora_user", JSON.stringify(userSession));

      if (userSession.role === "admin" || cleanEmail === "admin@sellora.dev") {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/" });
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (otp === generatedOtp) {
      // Complete Registration
      const cleanEmail = email.trim().toLowerCase();
      const newUser: RegisteredUser = {
        id: `usr-${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: cleanEmail,
        address: address.trim(),
        gender,
        password,
        role: cleanEmail.includes("admin") ? "admin" : "customer",
        createdAt: new Date().toISOString(),
      };

      try {
        await registerUser({
          email: cleanEmail,
          password,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone,
          address: newUser.address,
        });
      } catch (err: any) {
        console.warn("Could not register user to PostgreSQL backend, saved in registered users registry:", err);
      }

      // Save into registered users list
      saveRegisteredUser(newUser);

      setIsLoading(false);
      alert("Registration successful! You are now registered. Please sign in with your credentials.");
      setIsVerifying(false);
      setIsSignUp(false);
      setPassword("");
      setOtp("");
    } else {
      setIsLoading(false);
      setError("Invalid verification code. Please check the code and try again.");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between relative isolate overflow-x-hidden">
      <Navbar />

      {/* Subtle ambient background glow */}
      {!isSimple && <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/10 blur-[120px]" />}

      <div className="mx-auto max-w-md w-full px-4 pt-32 pb-20 flex-1 flex items-center justify-center">
        <div className="w-full rounded-3xl border border-glass-border bg-card/70 p-8 shadow-elevated backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isSignUp ? "Enter your details to get started" : "Sign in to access your account"}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-center text-xs font-medium text-red-500 animate-fade-up">
              {error}
            </div>
          )}

          {/* Form */}
          {isVerifying ? (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="text-center">
                <div className="mx-auto bg-neon-cyan/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-neon-cyan" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  We've sent a 6 digit verification code to <br />
                  <span className="text-foreground font-medium">{email}</span>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl rounded-xl border border-glass-border bg-background/60 py-3 text-foreground placeholder:text-muted-foreground/30 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 font-display text-xs font-bold uppercase tracking-wider text-background shadow-neon-cyan transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-background border-t-transparent animate-spin" />
                ) : (
                  <span>Verify Email</span>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsVerifying(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel registration
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input type="text" required placeholder="Alex" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-xl border border-glass-border bg-background/60 pl-10 pr-4 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input type="text" required placeholder="Mercer" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-xl border border-glass-border bg-background/60 pl-10 pr-4 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input type="tel" required placeholder="+1 234 567 89" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-glass-border bg-background/60 pl-10 pr-4 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Gender</label>
                      <select required value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-glass-border bg-background/60 px-4 py-2.5 text-base sm:text-sm text-foreground focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all appearance-none [&>option]:bg-card">
                        <option value="" disabled>Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <textarea required placeholder="123 Main St, City, Country" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border border-glass-border bg-background/60 pl-10 pr-4 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all min-h-[80px]" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
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
                    className="w-full rounded-xl border border-glass-border bg-background/60 pl-10 pr-4 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  {!isSignUp && (
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Password reset link sent to email."); }} className="text-xs text-neon-cyan hover:underline">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-glass-border bg-background/60 pl-10 pr-10 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 font-display text-xs font-bold uppercase tracking-wider text-background shadow-neon-cyan transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-background border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}



          {/* Footer Switch */}
          {!isVerifying && (
            <div className="mt-6 text-center text-xs text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                className="font-medium text-neon-cyan hover:underline ml-1"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </main>
  );
}
