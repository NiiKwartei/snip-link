// ─────────────────────────────────────────────────
//  snip.link — Register Page
// ─────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name || undefined);
      toast.success("Account created!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6 relative z-10">
      <div className="grain-overlay" />
      <div className="glow-cyan" />

      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-mono text-xl font-medium tracking-tight">snip.link</span>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold mb-1">Create your account</h2>
          <p className="text-sm text-zinc-500 mb-6">Start shortening and tracking links</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Name (optional)</label>
              <input
                type="text"
                className="input-styled w-full"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                className="input-styled w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="input-styled w-full pr-10"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-500 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
