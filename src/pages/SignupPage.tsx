import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Search, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

export function SignupPage() {
  const { signup } = useAuth();
  const nav = useNavigate();

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setBusy(true);
    try {
      await signup(email.trim(), password, name.trim() || undefined);
      
      // 1. Show success message on this page
      setSuccess("Account created successfully! Redirecting to login...");

      // 2. Wait 2 seconds, then redirect
      setTimeout(() => {
        nav("/login", { 
          replace: true, 
          state: { successMessage: "Welcome! Please log in with your new account." } 
        });
      }, 2000);

    } catch (err: any) {
      setError(err?.message ?? "Signup failed");
      setBusy(false); // Only stop loading if there is an error. On success, keep loading during redirect.
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#FAFAF9] px-6 py-12 font-sans text-[#1C1917] selection:bg-stone-200">
      
      {/* Back Button */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10">
        <Link 
          to="/" 
          className="group flex items-center gap-2 text-sm font-medium text-stone-500 transition-colors hover:text-[#1C1917]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition-all group-hover:border-stone-300 group-hover:-translate-x-1">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span>Back to home</span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-[400px]"
      >
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C1917] text-[#FAFAF9] shadow-lg shadow-stone-900/10">
            <Search className="h-5 w-5" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">Start hunting deals</h1>
          <p className="mt-2 text-sm text-stone-500">
            Create your professional account in seconds.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-200/50">
          
          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Full Name <span className="text-stone-300 font-normal normal-case">(Optional)</span>
              </label>
              <input
                className="w-full rounded-lg border border-stone-200 bg-[#FAFAF9] px-4 py-3 text-sm text-[#1C1917] outline-none transition-all placeholder:text-stone-400 focus:border-[#1C1917] focus:bg-white focus:ring-1 focus:ring-[#1C1917]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                autoComplete="name"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Email Address
              </label>
              <input
                className="w-full rounded-lg border border-stone-200 bg-[#FAFAF9] px-4 py-3 text-sm text-[#1C1917] outline-none transition-all placeholder:text-stone-400 focus:border-[#1C1917] focus:bg-white focus:ring-1 focus:ring-[#1C1917]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
              />
            </div>

            {/* Password Field with Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-stone-200 bg-[#FAFAF9] px-4 py-3 text-sm text-[#1C1917] outline-none transition-all placeholder:text-stone-400 focus:border-[#1C1917] focus:bg-white focus:ring-1 focus:ring-[#1C1917] pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#1C1917] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-stone-400">Must be at least 8 characters.</p>
            </div>

            {/* Confirm Password Field with Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-stone-200 bg-[#FAFAF9] px-4 py-3 text-sm text-[#1C1917] outline-none transition-all placeholder:text-stone-400 focus:border-[#1C1917] focus:bg-white focus:ring-1 focus:ring-[#1C1917] pr-10"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#1C1917] transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              className="group flex w-full items-center justify-center rounded-lg bg-[#1C1917] py-3 text-sm font-semibold text-[#FAFAF9] shadow-md shadow-stone-900/10 transition-all hover:bg-[#292524] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={busy}
              type="submit"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link 
            to="/login" 
            className="font-semibold text-[#1C1917] transition-colors hover:text-stone-600 hover:underline"
          >
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}