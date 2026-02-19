import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      nav("/app", { replace: true }); // ✅ always redirect to dashboard
    } catch (err: any) {
      setError(err?.message ?? "Invalid credentials");
    } finally {
      setBusy(false);
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
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">Welcome back</h1>
          <p className="mt-2 text-sm text-stone-500">
            Enter your credentials to access your dashboard.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-200/50">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={onSubmit}>
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

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Password
                </label>
                <Link
                  to="#"
                  className="text-xs font-medium text-stone-500 hover:text-[#1C1917] hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <input
                className="w-full rounded-lg border border-stone-200 bg-[#FAFAF9] px-4 py-3 text-sm text-[#1C1917] outline-none transition-all placeholder:text-stone-400 focus:border-[#1C1917] focus:bg-white focus:ring-1 focus:ring-[#1C1917]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              className="group flex w-full items-center justify-center rounded-lg bg-[#1C1917] py-3 text-sm font-semibold text-[#FAFAF9] shadow-md shadow-stone-900/10 transition-all hover:bg-[#292524] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={busy}
              type="submit"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-stone-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-[#1C1917] transition-colors hover:text-stone-600 hover:underline"
          >
            Start free trial
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
