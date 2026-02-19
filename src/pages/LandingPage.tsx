import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Zap,
  Filter,
  TrendingDown,
  Clock,
  CheckCircle2,
  Search,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

// --- Components ---

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 md:px-8 ${className}`}>{children}</div>;
}

function Button({
  to,
  variant = "primary",
  children,
}: {
  to: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-all duration-200";
  
  const styles = {
    // Primary: Dark Charcoal on Cream
    primary: "bg-[#1C1917] text-[#FAFAF9] hover:bg-[#292524] hover:-translate-y-0.5 shadow-md shadow-stone-900/5",
    // Secondary: White on Stone Border
    secondary: "bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:text-stone-900 hover:bg-stone-50 hover:-translate-y-0.5 shadow-sm",
  };

  return (
    <Link to={to} className={`${base} ${styles[variant]}`}>
      {children}
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500 shadow-sm">
      {children}
    </span>
  );
}

// --- Mock Data ---

const MOCK_DEALS = [
  { id: 1, car: "2018 Honda Civic X", price: "2,650,000", profit: "+150k margin", time: "2m ago", status: "New" },
  { id: 2, car: "2020 Toyota Yaris", price: "3,100,000", profit: "Fair Deal", time: "12m ago", status: "Seen" },
  { id: 3, car: "2015 Suzuki Swift", price: "1,800,000", profit: "+85k margin", time: "45m ago", status: "Saved" },
];

export function LandingPage() {
  const { user } = useAuth();
  const ctaTo = user ? "/app" : "/signup";

  return (
    // Global Theme: Warm Light Stone / Cream
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-stone-900 selection:bg-stone-200 selection:text-stone-900">
      
      {/* --- Navbar --- */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/50 bg-[#FAFAF9]/90 backdrop-blur-md">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C1917] text-[#FAFAF9] transition-transform group-hover:scale-105">
                <Search className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-[#1C1917]">MarketScout</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {!user && (
                <Link to="/login" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
                  Log in
                </Link>
              )}
              <Button to={ctaTo} variant="primary">
                {user ? "Dashboard" : "Start Hunting"}
              </Button>
            </div>
          </div>
        </Container>
      </nav>

      <main className="pt-32">
        
        {/* --- Hero Section --- */}
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            
            {/* Hero Copy */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-xl"
            >
              <Badge>
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Feed Active
              </Badge>
              
              <h1 className="mt-8 text-5xl font-bold tracking-tight text-[#1C1917] sm:text-6xl leading-[1.1]">
                Don't just search.<br />
                <span className="text-stone-400">Hunt deals.</span>
              </h1>
              
              <p className="mt-6 text-lg leading-relaxed text-stone-600">
                The professional tool for car flippers and dealerships. We monitor the marketplace 24/7 so you can snipe under-priced listings instantly.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button to={ctaTo}>Start Free Trial</Button>
                <Button to="#features" variant="secondary">How it works</Button>
              </div>

              <div className="mt-12 flex items-center gap-8 border-t border-stone-200 pt-8">
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-stone-900">0.8s</span>
                    <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">Latency</span>
                 </div>
                 <div className="w-px h-8 bg-stone-200"></div>
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-stone-900">10k+</span>
                    <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">Tracked</span>
                 </div>
                 <div className="w-px h-8 bg-stone-200"></div>
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-stone-900">24/7</span>
                    <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">Uptime</span>
                 </div>
              </div>
            </motion.div>

            {/* Hero Visual (Light/Paper Theme) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="relative"
            >
              {/* Soft Ambient Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-stone-200 to-orange-50 blur-[100px] opacity-60 rounded-full pointer-events-none" />
              
              {/* Main Card */}
              <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl shadow-stone-200/60 ring-1 ring-stone-900/5">
                
                {/* Header */}
                <div className="border-b border-stone-100 bg-stone-50/50 px-5 py-4 flex justify-between items-center backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Incoming Stream</div>
                  </div>
                </div>
                
                {/* List Items */}
                <div className="p-3 space-y-3">
                  {MOCK_DEALS.map((deal) => (
                    <div key={deal.id} className="group relative flex items-center justify-between rounded-lg border border-stone-100 bg-white p-4 transition-all hover:border-stone-300 hover:shadow-md hover:shadow-stone-200/50">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-500 group-hover:bg-[#1C1917] group-hover:text-white transition-colors">
                          <Bell className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-stone-900">{deal.car}</div>
                          <div className="text-xs text-stone-500 mt-0.5 font-medium">{deal.price} • {deal.time}</div>
                        </div>
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        deal.profit.includes("margin") 
                          ? "border-emerald-200 bg-emerald-50/50 text-emerald-700" 
                          : "border-stone-200 bg-stone-50 text-stone-500"
                      }`}>
                        {deal.profit}
                      </div>
                    </div>
                  ))}
                  
                  {/* Skeleton Item */}
                  <div className="flex items-center gap-4 rounded-lg border border-dashed border-stone-200 p-4 opacity-40">
                     <div className="h-10 w-10 rounded-full bg-stone-100" />
                     <div className="space-y-2">
                        <div className="h-3 w-24 rounded bg-stone-100" />
                        <div className="h-2 w-16 rounded bg-stone-100" />
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>

        {/* --- Features Section (Clean Grid) --- */}
        <section id="features" className="mt-32 border-t border-stone-200 bg-white py-32">
          <Container>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight text-[#1C1917]">The unfair advantage.</h2>
                <p className="mt-4 text-stone-500 text-lg leading-relaxed">
                  Most buyers waste hours refreshing. MarketScout automates the hunt so you only engage when the numbers work.
                </p>
              </div>
              <Button to={ctaTo} variant="secondary">View all features</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { 
                  icon: <Filter />, 
                  title: "Surgical Filters", 
                  desc: "Filter by make, model, year range, radius, and price. Exclude keywords to remove spam." 
                },
                { 
                  icon: <Zap />, 
                  title: "Instant Latency", 
                  desc: "Our servers ping the API continuously. You get alerted seconds after the post goes live." 
                },
                { 
                  icon: <TrendingDown />, 
                  title: "Market Analysis", 
                  desc: "We analyze the price against market averages to highlight deals with instant equity." 
                }
              ].map((item, i) => (
                <div key={i} className="group p-8 rounded-2xl border border-stone-100 bg-[#FAFAF9] hover:bg-white hover:border-stone-200 hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-300">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-stone-200 text-stone-900 shadow-sm group-hover:bg-[#1C1917] group-hover:text-white group-hover:border-transparent transition-colors">
                    {React.cloneElement(item.icon as React.ReactElement, { className: "h-5 w-5" })}
                  </div>
                  <h3 className="text-lg font-bold text-[#1C1917]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* --- Minimal CTA (Replaces Inventory Block) --- */}
        <section className="py-24 bg-[#FAFAF9] border-t border-stone-200">
          <Container>
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#1C1917]">
                Start hunting today.
              </h2>
              <p className="mt-4 text-stone-500 max-w-lg">
                Join thousands of professional resellers who trust MarketScout. <br className="hidden md:block" />
                No credit card required for the trial.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Button to={ctaTo} variant="primary">
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link to="/login" className="text-sm font-medium text-stone-500 hover:text-stone-900 px-4 py-2">
                  Existing user? Log in
                </Link>
              </div>
            </div>
          </Container>
        </section>

      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-stone-200 bg-white py-12">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-stone-500">
            <div className="flex items-center gap-2 opacity-80">
                <div className="h-5 w-5 rounded bg-[#1C1917]"></div>
                <div className="font-bold text-[#1C1917]">MarketScout</div>
            </div>
            
            <div className="flex gap-8">
              <Link to="#" className="hover:text-stone-900 transition-colors">Privacy</Link>
              <Link to="#" className="hover:text-stone-900 transition-colors">Terms</Link>
              <Link to="#" className="hover:text-stone-900 transition-colors">Twitter</Link>
            </div>
            
            <div className="text-stone-400">
                © {new Date().getFullYear()}
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}