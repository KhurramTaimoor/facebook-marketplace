import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Car,
  Check,
  ChevronRight,
  Clock,
  Filter,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
  Circle,
  Loader2,
  Package,
  Bike,
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  Ruler,
  Send,
  Droplet 
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Category = string;

type SearchConfig = {
  id: string;
  name: string;
  category: Category;
  keywords: string;
  location: string;
  radiusKm: number;
  minPrice?: number;
  maxPrice?: number;
  isActive: boolean;
};

type Listing = {
  id: string;
  title: string;
  price: number;
  currencyCode?: string; 
  location: string;
  postedAt: string;
  profitMargin?: string;
  url: string;
  make?: string;
  model?: string;
  fuelType?: string;
  mileageKm?: number;
  mileageRaw?: number;
  mileageRawUnit?: "km" | "mi";
};

type Match = {
  id: string;
  searchId: string;
  category?: Category;
  listing: Listing;
  matchedAt: string;
  status: "new" | "seen" | "contacted" | "sold";
  saved?: boolean;
};

type Reminder = {
  id: string;
  listingId?: string;
  listingTitle: string;
  type: "call" | "message" | "visit" | "task";
  date: string; 
  time: string; 
  note: string;
  completed: boolean;
};

/* -------------------------------------------------------------------------- */
/* PRIMITIVES                                                                 */
/* -------------------------------------------------------------------------- */

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1600px] px-4 md:px-6 ${className}`}>{children}</div>;
}

function Card({
  title,
  right,
  children,
  className = "",
  noPadding = false,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:border-stone-300 hover:shadow-md ${className}`}
    >
      {title && (
        <div className="flex min-h-[48px] shrink-0 items-center justify-between border-b border-stone-100 bg-stone-50/50 px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
            {title}
          </div>
          {right}
        </div>
      )}
      <div className={noPadding ? "" : "p-4"}>{children}</div>
    </div>
  );
}

function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  size = "md",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "xs" | "sm" | "md";
  onClick?: (e: React.MouseEvent) => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-1";

  const sizes = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  const styles = {
    primary: "bg-[#1C1917] text-[#FAFAF9] hover:bg-[#292524] shadow-sm",
    secondary: "bg-white text-stone-700 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 shadow-sm",
    outline: "bg-transparent border border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900",
    ghost: "bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function formatReminderTitle(r: Reminder) {
  const verb = r.type === "call" ? "Call" : r.type === "message" ? "Message" : r.type === "visit" ? "Visit" : "Task";
  return `${verb}: ${r.listingTitle}`;
}

const getCategoryIcon = (cat: Category) => {
  const c = (cat || "").toLowerCase();
  if (c.includes("car")) return <Car className="h-4 w-4" />;
  if (c.includes("bike") || c.includes("motor")) return <Bike className="h-4 w-4" />;
  if (c.includes("part") || c.includes("tool")) return <Wrench className="h-4 w-4" />;
  if (c.includes("other") || c.includes("box")) return <Package className="h-4 w-4" />;
  return <Circle className="h-4 w-4" />;
};

function safeLocalSavedSetLoad() {
  try {
    const raw = localStorage.getItem("saved_listing_ids");
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set<string>();
  }
}
function safeLocalSavedSetSave(set: Set<string>) {
  try {
    localStorage.setItem("saved_listing_ids", JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

function toISODate(d: string) {
  if (!d) return "";
  return d.slice(0, 10);
}
function toHHMM(t: string) {
  if (!t) return "00:00";
  return t.slice(0, 5);
}
function dueTs(r: Pick<Reminder, "date" | "time">) {
  const d = toISODate(r.date);
  const t = toHHMM(r.time);
  const ts = new Date(`${d}T${t}:00`);
  return isNaN(ts.getTime()) ? new Date("2999-12-31T23:59:00") : ts;
}

function todayISO() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function kmToMi(km: number) { return km / 1.60934; }
function miToKm(mi: number) { return mi * 1.60934; }

function formatMileageFromKm(km?: number, displayUnit: "km" | "mi" = "km") {
  if (!km || !isFinite(km) || km <= 0) return "—";
  const val = displayUnit === "mi" ? kmToMi(km) : km;
  const unit = displayUnit === "mi" ? "mi" : "km";
  return `${Math.round(val).toLocaleString()} ${unit}`;
}

function mapMileageFromRow(row: any): { mileageKm?: number; mileageRaw?: number; mileageRawUnit?: "km" | "mi" } {
  const unitRaw = String(row?.mileage_unit || row?.mileageUnit || "").toLowerCase();

  const rawCandidates: Array<{ v: any; unit?: "km" | "mi" }> = [
    { v: row?.mileage_value, unit: unitRaw === "mi" ? "mi" : unitRaw === "km" ? "km" : undefined },
    { v: row?.km_driven, unit: "km" },
    { v: row?.total_km, unit: "km" },
    { v: row?.odometer_km, unit: "km" },
    { v: row?.miles, unit: "mi" },
    { v: row?.odometer_mi, unit: "mi" },
    { v: row?.mileage, unit: undefined },
  ];

  let rawValue: number | undefined;
  let rawUnit: "km" | "mi" | undefined;

  for (const c of rawCandidates) {
    const n = Number(c.v);
    if (isFinite(n) && n > 0) {
      rawValue = n;
      rawUnit = c.unit || (unitRaw === "mi" ? "mi" : "km");
      break;
    }
  }

  if (!rawValue || !rawUnit) return {};
  const km = rawUnit === "mi" ? miToKm(rawValue) : rawValue;
  return { mileageKm: km, mileageRaw: rawValue, mileageRawUnit: rawUnit };
}

function normalizeCurrencyCode(raw: any): string {
  const s = String(raw || "").trim().toUpperCase();
  if (!s) return "PKR";

  if (s === "₨" || s === "RS" || s === "RUPEE" || s === "RUPEES") return "PKR";
  if (s === "$") return "USD";
  if (s === "€") return "EUR";
  if (s === "£") return "GBP";
  if (s.length === 3) return s;

  return "PKR";
}

function mapCurrencyFromRow(row: any): string {
  const candidates = [
    row?.currency_code,
    row?.currencyCode,
    row?.currency,
    row?.price_currency,
    row?.currency_symbol, 
  ];
  for (const c of candidates) {
    const code = normalizeCurrencyCode(c);
    if (code) return code;
  }
  return "PKR";
}

function formatMoney(amount: number, currencyCode: string) {
  const code = normalizeCurrencyCode(currencyCode);
  const n = Number(amount);
  if (!isFinite(n)) return `${code} —`;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${code} ${Math.round(n).toLocaleString()}`;
  }
}

/* -------------------------------------------------------------------------- */
/* MAIN DASHBOARD COMPONENT                                                   */
/* -------------------------------------------------------------------------- */

export function AppHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); // Redirect to home page
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/"; // Fallback redirect
    }
  };

  const [searches, setSearches] = useState<SearchConfig[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [activeListingForReminder, setActiveListingForReminder] = useState<Listing | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeMatchForDelete, setActiveMatchForDelete] = useState<Match | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Match["status"]>("all");
  const [unseenOnly, setUnseenOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [mileageUnit, setMileageUnit] = useState<"km" | "mi">("km");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const savedLocalIdsRef = useRef<Set<string>>(safeLocalSavedSetLoad());

  const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "fb_scout_rawalpindi_bot";
  const magicLink = `https://t.me/${telegramBotUsername}?start=${user?.id}`;

  /* ------------------------------------------------------------------------ */
  /* SECURE DATA FETCHING WITH JWT VALIDATION                                 */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!user) return;

    async function verifySessionAndFetch() {
      setIsLoading(true);
      try {
        // 🔒 SECURE SESSION CHECK: Manually verify the JWT token is still active
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) {
          console.error("🔒 Security Alert: Missing or expired JWT session.");
          handleLogout(); 
          return;
        }

        // --- Fetch Searches ---
        const { data: searchData, error: searchError } = await supabase
          .from("searches")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (searchError) throw searchError;

        const mappedSearches: SearchConfig[] = (searchData || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          category: s.category || "car",
          keywords: s.keywords,
          location: s.location,
          radiusKm: Number(s.radius_km) || 0,
          minPrice: s.min_price,
          maxPrice: s.max_price,
          isActive: s.is_active,
        }));
        setSearches(mappedSearches);

        const categoryBySearchId = new Map<string, Category>(
          mappedSearches.map((s) => [s.id, s.category || "car"] as const)
        );

        // --- Fetch Listings ---
        const searchIds = (searchData || []).map((s: any) => s.id);

        let listingsQuery = supabase.from("found_items").select("*").order("matched_at", { ascending: false });
        if (searchIds.length > 0) {
          listingsQuery = listingsQuery.in("search_id", searchIds);
        }

        const { data: listingData, error: listingError } = await listingsQuery;
        if (listingError) throw listingError;

        setMatches(
          (listingData || []).map((l: any) => {
            const savedFromDb = typeof l.saved === "boolean" ? l.saved : undefined;
            const savedFromLocal = savedLocalIdsRef.current.has(l.id);
            const mileage = mapMileageFromRow(l);
            const currencyCode = mapCurrencyFromRow(l);

            return {
              id: l.id,
              searchId: l.search_id,
              category: categoryBySearchId.get(l.search_id),
              status: (l.status || "new") as any,
              matchedAt: l.matched_at
                ? new Date(l.matched_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Just now",
              saved: savedFromDb ?? savedFromLocal,
              listing: {
                id: l.id,
                title: l.title || "Unknown Item",
                price: Number(l.price) || 0,
                currencyCode,
                location: l.location || "Marketplace",
                postedAt: l.posted_at || "Recently",
                profitMargin: l.profit_margin || "0",
                url: l.url || "#",
                make: l.make || "",
                model: l.model || "",
                fuelType: l.fuel_type || "",
                mileageKm: mileage.mileageKm,
                mileageRaw: mileage.mileageRaw,
                mileageRawUnit: mileage.mileageRawUnit,
              },
            } as Match;
          })
        );

        // --- Fetch Reminders ---
        const { data: reminderData, error: reminderError } = await supabase
          .from("reminders")
          .select("*")
          .eq("user_id", user.id)
          .order("due_date", { ascending: true });

        if (reminderError) throw reminderError;

        setReminders(
          (reminderData || []).map((r: any) => ({
            id: r.id,
            listingId: r.listing_id,
            listingTitle: r.listing_title,
            type: r.type as any,
            date: toISODate(r.due_date),
            time: toHHMM(r.due_time),
            note: r.note || "",
            completed: !!r.completed,
          }))
        );
      } catch (err: any) {
        console.error("Fetch error:", err?.message || err);
      } finally {
        setIsLoading(false);
      }
    }

    verifySessionAndFetch();
  }, [user, navigate, logout]); // handleLogout isn't a dependency because it causes re-renders

  /* ------------------------------------------------------------------------ */
  /* HANDLERS                                                                 */
  /* ------------------------------------------------------------------------ */

  const handleCreateSearch = async (s: SearchConfig) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("searches")
      .insert([
        {
          user_id: user.id,
          name: s.name,
          category: s.category,
          keywords: s.keywords,
          location: s.location,
          radius_km: s.radiusKm,
          max_price: s.maxPrice,
          min_price: s.minPrice,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (!error) {
      setSearches((prev) => [{ ...s, id: data.id }, ...prev]);
      setSearchModalOpen(false);
    } else {
      console.error("Create search failed:", error.message);
    }
  };

  const handleDeleteSearch = async (id: string) => {
    const { error } = await supabase.from("searches").delete().eq("id", id);
    if (!error) setSearches((prev) => prev.filter((s) => s.id !== id));
    else console.error("Delete search failed:", error.message);
  };

  const handleAddReminder = async (r: Reminder) => {
    if (!user) return;

    const payload = {
      user_id: user.id,
      listing_id: r.listingId || null,
      listing_title: r.listingTitle,
      type: r.type,
      due_date: toISODate(r.date),
      due_time: toHHMM(r.time),
      note: r.note || "",
      completed: false,
    };

    const { data, error } = await supabase.from("reminders").insert([payload]).select().single();
    if (error) {
      console.error("Add reminder failed:", error.message);
      return;
    }

    setReminders((prev) => [
      {
        id: data.id,
        listingId: payload.listing_id || undefined,
        listingTitle: payload.listing_title,
        type: payload.type as any,
        date: payload.due_date,
        time: payload.due_time,
        note: payload.note,
        completed: false,
      },
      ...prev,
    ]);

    setReminderModalOpen(false);
    setActiveListingForReminder(null);
  };

  const toggleReminderComplete = async (reminderId: string, next: boolean) => {
    setReminders((prev) => prev.map((r) => (r.id === reminderId ? { ...r, completed: next } : r)));
    const { error } = await supabase.from("reminders").update({ completed: next }).eq("id", reminderId);
    if (error) console.error("toggleReminderComplete failed:", error.message);
  };

  const markSeen = async (matchId: string) => {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: "seen" } : m)));
    const { error } = await supabase.from("found_items").update({ status: "seen" }).eq("id", matchId);
    if (error) console.error("markSeen failed:", error.message);
  };

  const toggleSaved = async (matchId: string) => {
    const current = matches.find((m) => m.id === matchId)?.saved ?? false;
    const next = !current;

    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, saved: next } : m)));

    const { error } = await supabase.from("found_items").update({ saved: next }).eq("id", matchId);

    if (error) {
      if (next) savedLocalIdsRef.current.add(matchId);
      else savedLocalIdsRef.current.delete(matchId);
      safeLocalSavedSetSave(savedLocalIdsRef.current);
      console.warn("found_items.saved column not available, using localStorage fallback.");
    }
  };

  const deleteListing = async (matchId: string): Promise<boolean> => {
    if (!user) return false;

    const prevMatches = matches;
    const prevReminders = reminders;

    setMatches((p) => p.filter((m) => m.id !== matchId));
    setReminders((p) => p.filter((r) => r.listingId !== matchId));

    savedLocalIdsRef.current.delete(matchId);
    safeLocalSavedSetSave(savedLocalIdsRef.current);

    const { error } = await supabase.from("found_items").delete().eq("id", matchId);

    if (error) {
      console.error("deleteListing failed:", error.message);
      setMatches(prevMatches);
      setReminders(prevReminders);
      return false;
    }

    await supabase.from("reminders").delete().eq("user_id", user.id).eq("listing_id", matchId);
    return true;
  };

  /* ------------------------------------------------------------------------ */
  /* FILTERING & PAGINATION                                                   */
  /* ------------------------------------------------------------------------ */

  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => set.add(normalizeCurrencyCode(m.listing.currencyCode)));
    const arr = Array.from(set).sort();
    return arr.length ? arr : ["PKR"];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const matchQ = q.trim().toLowerCase();
      const code = normalizeCurrencyCode(m.listing.currencyCode);

      if (unseenOnly && m.status !== "new") return false;
      if (status !== "all" && m.status !== status) return false;
      if (currencyFilter !== "all" && code !== currencyFilter) return false;
      if (minPrice && m.listing.price < Number(minPrice)) return false;
      if (maxPrice && m.listing.price > Number(maxPrice)) return false;
      
      if (matchQ) {
        const fullString = `${m.listing.make || ""} ${m.listing.model || ""} ${m.listing.title}`.toLowerCase();
        if (!fullString.includes(matchQ)) return false;
      }
      return true;
    });
  }, [matches, q, status, unseenOnly, minPrice, maxPrice, currencyFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredMatches.length / itemsPerPage)),
    [filteredMatches.length]
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMatches.slice(start, start + itemsPerPage);
  }, [filteredMatches, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, status, unseenOnly, minPrice, maxPrice, currencyFilter]);

  const upcomingReminders = useMemo(() => {
    return reminders
      .filter((r) => !r.completed)
      .slice()
      .sort((a, b) => dueTs(a).getTime() - dueTs(b).getTime())
      .slice(0, 12);
  }, [reminders]);

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] font-sans selection:bg-stone-200">
      <header className="sticky top-0 z-30 h-16 border-b border-stone-200 bg-[#FAFAF9]/90 backdrop-blur-md">
        <Container className="h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1C1917] text-[#FAFAF9] shadow-lg shadow-stone-900/10">
              <Search className="h-5 w-5" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-bold leading-none tracking-tight">MarketScout</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Pro Console</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-1.5 shadow-sm">
              <div
                className={`h-2 w-2 rounded-full ${
                  matches.some((m) => m.status === "new") ? "bg-emerald-500 animate-pulse" : "bg-stone-300"
                }`}
              />
              <span className="text-xs font-bold text-stone-600">
                {matches.filter((m) => m.status === "new").length} Live Matches
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </Container>
      </header>

      <main className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: TABLE */}
            <div className="lg:col-span-9 flex flex-col gap-4">
              <div className="flex h-8 items-center justify-between px-1">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">Inventory</h2>

                <Button size="xs" variant="outline" onClick={() => setMileageUnit((u) => (u === "km" ? "mi" : "km"))}>
                  <Ruler className="h-3.5 w-3.5" />
                  {mileageUnit === "km" ? "Show mi" : "Show km"}
                </Button>
              </div>

              <Card
                title={
                  <>
                    <Filter className="h-3.5 w-3.5" /> Filters
                  </>
                }
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="md:col-span-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      className="w-full rounded-lg border border-stone-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-stone-800"
                      placeholder="Search Make/Model..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <select
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none bg-white"
                      value={currencyFilter}
                      onChange={(e) => setCurrencyFilter(e.target.value)}
                      title="Currency"
                    >
                      <option value="all">All Currencies</option>
                      {availableCurrencies.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <input
                      type="number"
                      placeholder="Min Price"
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <input
                      type="number"
                      placeholder="Max Price"
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <select
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none bg-white"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="all">All</option>
                      <option value="new">New</option>
                      <option value="seen">Seen</option>
                      <option value="contacted">Contacted</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>

                  <div className="md:col-span-12 flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={unseenOnly}
                        onChange={(e) => setUnseenOnly(e.target.checked)}
                        className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                      />
                      Unseen Only
                    </label>

                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setQ("");
                        setStatus("all");
                        setUnseenOnly(false);
                        setMinPrice("");
                        setMaxPrice("");
                        setCurrencyFilter("all");
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title="Results" noPadding>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-stone-50/70 text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-100">
                      <tr>
                        <th className="px-6 py-4">Make & Model</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">KM Driven</th>
                        <th className="px-6 py-4">Fuel</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-stone-100">
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-sm text-stone-400">
                            No listings found for current filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((m) => {
                          const code = normalizeCurrencyCode(m.listing.currencyCode);
                          
                          const vehicleDisplay = 
                            m.listing.make || m.listing.model 
                            ? `${m.listing.make || ""} ${m.listing.model || ""}`.trim()
                            : m.listing.title;

                          return (
                            <tr key={m.id} className="hover:bg-stone-50/60 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-stone-100 rounded flex items-center justify-center text-stone-400 group-hover:bg-white transition-colors">
                                    {getCategoryIcon(m.category || "car")}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate font-bold text-sm text-stone-900 max-w-[200px]" title={vehicleDisplay}>
                                      {vehicleDisplay}
                                    </div>
                                    <div className="text-[10px] text-stone-400 font-mono">
                                      ID: {m.listing.id.slice(0, 8)} • Matched: {m.matchedAt}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 text-xs text-stone-500">
                                <MapPin className="inline h-3 w-3 mr-1" />
                                {m.listing.location}
                              </td>

                              <td className="px-6 py-4 font-mono font-bold text-sm">
                                {formatMoney(m.listing.price, code)}
                                <span className="ml-2 inline-flex items-center rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-bold text-stone-500">
                                  {code}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-xs font-mono text-stone-600">
                                {formatMileageFromKm(m.listing.mileageKm, mileageUnit)}
                              </td>

                              <td className="px-6 py-4 text-xs font-mono text-stone-600 capitalize">
                                {m.listing.fuelType ? (
                                  <span className="flex items-center gap-1">
                                    <Droplet className="h-3 w-3 text-stone-400" />
                                    {m.listing.fuelType}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    m.status === "new"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-stone-100 text-stone-500"
                                  }`}
                                >
                                  {m.status}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="xs"
                                    variant="secondary"
                                    onClick={() => {
                                      setActiveListingForReminder(m.listing);
                                      setReminderModalOpen(true);
                                    }}
                                  >
                                    <CalendarIcon className="h-3.5 w-3.5 text-stone-500" />
                                    Schedule
                                  </Button>

                                  <Button size="xs" variant="outline" onClick={() => toggleSaved(m.id)}>
                                    {m.saved ? (
                                      <BookmarkCheck className="h-3.5 w-3.5" />
                                    ) : (
                                      <Bookmark className="h-3.5 w-3.5" />
                                    )}
                                  </Button>

                                  {m.status === "new" ? (
                                    <Button size="xs" variant="outline" onClick={() => markSeen(m.id)}>
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button size="xs" variant="outline" disabled>
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  )}

                                  <Button
                                    size="xs"
                                    variant="danger"
                                    onClick={() => {
                                      setActiveMatchForDelete(m);
                                      setDeleteModalOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>

                                  <a
                                    href={m.listing.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 border rounded hover:bg-stone-100 text-stone-500"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-stone-100 flex items-center justify-between bg-stone-50/30">
                  <span className="text-xs text-stone-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`h-7 w-7 text-xs font-bold rounded-md transition-all ${
                          currentPage === i + 1
                            ? "bg-stone-900 text-white shadow-md"
                            : "text-stone-400 hover:bg-stone-100"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <Button
                      size="xs"
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT: SIDEBAR */}
            <div className="lg:col-span-3 space-y-6">
              
              <Card
                title={
                  <>
                    <Send className="h-3.5 w-3.5" /> Telegram Alerts
                  </>
                }
                noPadding
              >
                <div className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="h-12 w-12 bg-[#0088cc]/10 text-[#0088cc] rounded-full flex items-center justify-center">
                    <Send className="h-6 w-6 relative -left-0.5" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-900">Push Notifications</h3>
                  <p className="text-xs text-stone-500 mb-2 leading-relaxed">
                    Connect your Telegram account to instantly receive alerts on your phone whenever the bot finds new listings.
                  </p>
                  
                  <a 
                    href={magicLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0088cc] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#0077b5] hover:shadow-md"
                  >
                    Connect Telegram
                  </a>
                </div>
              </Card>

              <Card
                title={
                  <>
                    <LayoutDashboard className="h-3.5 w-3.5" /> Active Agents
                  </>
                }
                noPadding
              >
                <div className="max-h-[300px] overflow-y-auto divide-y divide-stone-100">
                  {searches.map((s) => (
                    <div
                      key={s.id}
                      className="group flex items-center justify-between p-3 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-stone-100 rounded flex items-center justify-center text-stone-500">
                          {getCategoryIcon(s.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-stone-900 max-w-[160px]">{s.name}</div>
                          <div className="text-[10px] text-stone-400 font-mono truncate max-w-[180px]">
                            {s.location} • {Math.round(s.radiusKm)} km
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSearch(s.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {searches.length === 0 && (
                    <div className="p-4 text-xs text-stone-400 text-center">No active agents.</div>
                  )}
                </div>
                <div className="p-3 border-t border-stone-100">
                  <Button variant="secondary" size="sm" className="w-full font-bold" onClick={() => setSearchModalOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> New Agent
                  </Button>
                </div>
              </Card>

              <Card
                title={
                  <>
                    <Clock className="h-3.5 w-3.5" /> Reminders
                  </>
                }
                right={
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setActiveListingForReminder(null);
                      setReminderModalOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                }
                noPadding
              >
                {upcomingReminders.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="mx-auto h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="text-xs text-stone-500">No upcoming reminders</div>
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-stone-100">
                    {upcomingReminders.map((r) => (
                      <div key={r.id} className="flex gap-3 items-start p-3 hover:bg-stone-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-stone-900 truncate">{formatReminderTitle(r)}</div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-500">
                            <span className="font-mono bg-stone-100 px-1 rounded">{toHHMM(r.time)}</span>
                            <span className="font-mono bg-stone-100 px-1 rounded">{toISODate(r.date)}</span>
                          </div>
                          {r.note ? <div className="mt-1 text-[10px] text-stone-400 truncate">{r.note}</div> : null}
                        </div>

                        <button
                          onClick={() => toggleReminderComplete(r.id, true)}
                          className="text-stone-400 hover:text-emerald-600 transition-colors"
                          title="Mark done"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </main>

      {/* MODALS */}
      <Modal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} title="New Agent">
        <CreateSearchForm onSubmit={handleCreateSearch} onCancel={() => setSearchModalOpen(false)} />
      </Modal>

      <Modal open={reminderModalOpen} onClose={() => setReminderModalOpen(false)} title="Schedule Action">
        <CreateReminderForm
          listing={activeListingForReminder}
          onSubmit={handleAddReminder}
          onCancel={() => {
            setReminderModalOpen(false);
            setActiveListingForReminder(null);
          }}
        />
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => {
          if (isDeleting) return;
          setDeleteModalOpen(false);
          setActiveMatchForDelete(null);
        }}
        title="Delete Listing"
      >
        <ConfirmDeleteListing
          match={activeMatchForDelete}
          isDeleting={isDeleting}
          onCancel={() => {
            if (isDeleting) return;
            setDeleteModalOpen(false);
            setActiveMatchForDelete(null);
          }}
          onConfirm={async () => {
            if (!activeMatchForDelete || isDeleting) return;
            setIsDeleting(true);
            const ok = await deleteListing(activeMatchForDelete.id);
            setIsDeleting(false);
            if (ok) {
              setDeleteModalOpen(false);
              setActiveMatchForDelete(null);
            }
          }}
        />
      </Modal>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FORMS & COMPONENTS                                                         */
/* -------------------------------------------------------------------------- */

function CreateSearchForm({ onSubmit, onCancel }: any) {
  const [form, setForm] = useState({
    name: "",
    category: "car",
    keywords: "",
    location: "",
    radiusValue: 25,
    radiusUnit: "km" as "km" | "mi",
    maxPrice: "",
    minPrice: "",
  });

  const radiusKm = useMemo(() => {
    const v = Number(form.radiusValue) || 0;
    return form.radiusUnit === "mi" ? miToKm(v) : v;
  }, [form.radiusValue, form.radiusUnit]);

  return (
    <div className="space-y-4">
      <input
        placeholder="Agent Name"
        className="w-full border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-stone-500"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Category"
        className="w-full border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-stone-500"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />
      <input
        placeholder="Keywords"
        className="w-full border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-stone-500"
        value={form.keywords}
        onChange={(e) => setForm({ ...form, keywords: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          placeholder="Location"
          className="w-full border p-2 rounded text-sm outline-none"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Radius"
            className="w-full border p-2 rounded text-sm outline-none"
            value={form.radiusValue}
            onChange={(e) => setForm({ ...form, radiusValue: Number(e.target.value) })}
          />
          <select
            className="border p-2 rounded text-sm bg-white"
            value={form.radiusUnit}
            onChange={(e) => setForm({ ...form, radiusUnit: e.target.value as any })}
          >
            <option value="km">km</option>
            <option value="mi">mi</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="Min Price"
          className="w-full border p-2 rounded text-sm outline-none"
          value={form.minPrice}
          onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
        />
        <input
          type="number"
          placeholder="Max Price"
          className="w-full border p-2 rounded text-sm outline-none"
          value={form.maxPrice}
          onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              id: "temp",
              isActive: true,
              name: form.name,
              category: form.category,
              keywords: form.keywords,
              location: form.location,
              radiusKm,
              minPrice: form.minPrice ? Number(form.minPrice) : undefined,
              maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
            })
          }
        >
          Activate Bot
        </Button>
      </div>
    </div>
  );
}

function CreateReminderForm({ listing, onSubmit, onCancel }: any) {
  const [form, setForm] = useState({
    date: todayISO(),
    time: "09:00",
    type: "call" as Reminder["type"],
    note: "",
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          id: "temp",
          listingId: listing?.id,
          listingTitle: listing?.title || "General Task",
          type: form.type,
          date: form.date,
          time: form.time,
          note: form.note,
          completed: false,
        } as Reminder);
      }}
    >
      <div className="bg-stone-50 p-3 rounded-lg text-xs text-stone-600">
        Creating reminder for: <strong>{listing?.title || "General Reminder"}</strong>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="border p-2 rounded w-full text-sm"
        />
        <input
          type="time"
          required
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
          className="border p-2 rounded w-full text-sm"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {["call", "message", "visit", "task"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setForm({ ...form, type: t as any })}
            className={`p-2 rounded border text-xs capitalize ${
              form.type === t ? "bg-stone-800 text-white border-stone-800" : "bg-white border-stone-200 text-stone-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <textarea
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
        className="w-full border p-2 rounded text-sm"
        placeholder="Note..."
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

function ConfirmDeleteListing({
  match,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  match: Match | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const title = match?.listing?.title || "this listing";
  const idShort = match?.listing?.id ? match.listing.id.slice(0, 8) : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
          <Trash2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-stone-900 truncate">Delete this listing?</div>
          <div className="text-xs text-stone-500 mt-1">
            This will remove the listing from your inventory.
            <span className="block mt-1 text-[11px] text-stone-400">
              Any reminders linked to this listing will also be removed.
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3">
        <div className="text-xs font-bold text-stone-900 truncate">{title}</div>
        <div className="mt-1 text-[10px] text-stone-500 font-mono">ID: {idShort}</div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" /> Delete
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }: any) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200"
          >
            <div className="p-4 border-b flex justify-between items-center bg-stone-50/50 backdrop-blur-sm">
              <span className="text-xs font-bold uppercase text-stone-500 tracking-widest">{title}</span>
              <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}