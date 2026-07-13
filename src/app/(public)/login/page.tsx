"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      toast.error("Invalid email or password");
    } else {
      toast.success("Welcome back! 🎉");
      router.push("/dashboard");
      router.refresh();
    }
  }

  const quickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword("12345678");
    setLoading(true);
    const result = await signIn("credentials", { email: userEmail, password: "12345678", redirect: false });
    setLoading(false);
    if (!result?.error) { router.push("/dashboard"); router.refresh(); }
    else toast.error("Login failed");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "0.75s" }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/40 mb-4 animate-float">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">SubTrack</h1>
            <p className="text-sm text-muted-foreground mt-1">Academic Tracker for 3 Friends</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@study.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base mt-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Quick login */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center mb-3">Quick login (demo)</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Owais", email: "owaishussain259@gmail.com", gradient: "from-violet-500 to-purple-600" },
                { name: "Nofil", email: "shaikh.nofil.07@gmail.com", gradient: "from-blue-500 to-cyan-500" },
                { name: "Kunal", email: "kunal.j9921@gmail.com", gradient: "from-emerald-500 to-teal-500" },
              ].map((u) => (
                <button
                  key={u.email}
                  onClick={() => quickLogin(u.email)}
                  disabled={loading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 border border-border/30 hover:border-primary/40 hover:bg-secondary transition-all disabled:opacity-60 group"
                >
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${u.gradient} flex items-center justify-center text-sm font-bold text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {u.name.charAt(0)}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{u.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          All 3 users have equal access to everything ✨
        </p>
      </div>
    </div>
  );
}
