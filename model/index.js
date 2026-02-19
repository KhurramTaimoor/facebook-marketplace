import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import TelegramBot from "node-telegram-bot-api";
import http from "http";

dotenv.config();

// =============================================================================
// 0) LOGGING
// =============================================================================
function ts() {
  return new Date().toISOString();
}
function log(level, msg, extra) {
  const prefix =
    level === "INFO" ? "ℹ️  [INFO]" :
    level === "WARN" ? "⚠️  [WARN]" :
    level === "ERR"  ? "❌ [ERR ]" :
    "🧾 [LOG ]";
  if (extra !== undefined) console.log(`${prefix} ${ts()} ${msg}`, extra);
  else console.log(`${prefix} ${ts()} ${msg}`);
}
const info = (m, e) => log("INFO", m, e);
const warn = (m, e) => log("WARN", m, e);
const err  = (m, e) => log("ERR",  m, e);

// =============================================================================
// 1) HEALTH CHECK SERVER (Railway / Cloud)
// =============================================================================
const PORT = process.env.PORT || 3000;
const IS_CLOUD =
  process.env.PORT !== undefined || process.env.RAILWAY_ENVIRONMENT !== undefined;

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("MarketScout Bot is running!\n");
  })
  .listen(PORT, () => {
    info(`🌐 Health Server listening on port ${PORT}`);
  });

// =============================================================================
// 2) SUPABASE SETUP
// =============================================================================
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  err("Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================================================
// 3) TELEGRAM LISTENER + SENDER (NO PROXY)
// =============================================================================
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

const telegramListener = telegramToken
  ? new TelegramBot(telegramToken, { polling: true })
  : null;

if (!telegramToken) {
  warn("No TELEGRAM_BOT_TOKEN found. Telegram listener disabled.");
} else {
  info("✅ Telegram Listener is awake and ready.");
}

if (telegramListener) {
  telegramListener.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const telegramChatId = msg.chat.id.toString();
    const supabaseUserId = match?.[1];

    if (!supabaseUserId) {
      await telegramListener.sendMessage(
        telegramChatId,
        "⚠️ Please go to your web dashboard and click 'Connect Telegram'."
      );
      return;
    }

    info(`🔗 Linking Telegram ID ${telegramChatId} to User ${supabaseUserId}`);

    const { error } = await supabase
      .from("profiles")
      .update({ telegram_chat_id: telegramChatId })
      .eq("id", supabaseUserId);

    if (error) {
      err("Link Error:", error);
      await telegramListener.sendMessage(
        telegramChatId,
        "❌ Failed to link account. Please make sure you are logged in on the website."
      );
    } else {
      await telegramListener.sendMessage(
        telegramChatId,
        "✅ Account successfully linked! You will now receive MarketScout alerts right here."
      );
    }
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function sendTelegramNotification(searchName, newItems, targetChatId) {
  if (!telegramToken || !telegramListener || !targetChatId) {
    warn(`[TELEGRAM] Skipped. Missing token, listener, or chatId.`);
    return;
  }
  if (!newItems?.length) return;

  let messageText = `🚨 <b>${newItems.length} New Matches for: ${escapeHtml(searchName)}</b>\n\n`;

  for (const item of newItems) {
    const displayTitle =
      (item.make || item.model)
        ? `${item.make || ""} ${item.model || ""}`.trim()
        : (item.title || "Marketplace item");

    messageText += `🚗 <b>${escapeHtml(displayTitle)}</b>\n`;
    messageText += `💰 PKR ${Number(item.price || 0).toLocaleString()}\n`;
    messageText += `📍 ${escapeHtml(item.location || "")}\n`;
    messageText += `<a href="${item.url}">View on Facebook</a>\n`;
    messageText += `〰️〰️〰️〰️〰️〰️〰️〰️〰️\n`;
  }

  try {
    info(`[TELEGRAM] Sending ${newItems.length} items to chat_id=${targetChatId} ...`);
    const res = await telegramListener.sendMessage(targetChatId, messageText, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    info(`[TELEGRAM] Sent OK. message_id=${res?.message_id}`);
  } catch (e) {
    err(`[TELEGRAM] Send failed: ${e?.response?.body?.description || e?.message || e}`);
  }
}

// =============================================================================
// 4) CONFIG & HELPERS
// =============================================================================
const CHECK_INTERVAL_MINUTES = 10;
let isRunning = false;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCategorySlug(category) {
  const cat = category ? category.toLowerCase() : "car";
  if (cat.includes("bike")) return "motorcycles";
  if (cat.includes("part")) return "autoparts";
  if (cat.includes("car")) return "vehicles";
  if (cat.includes("property") || cat.includes("rent")) return "property";
  return "marketplace";
}

function getLocationSlug(location) {
  if (!location) return "";
  return location
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function safeFile(name) {
  return String(name || "search")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function extractItemId(url) {
  const parts = url.split("/marketplace/item/");
  if (parts.length < 2) return null;
  const rest = parts[1];
  const id = rest.split("/")[0];
  return id || null;
}

function parseMakeModel(title) {
  let make = "";
  let model = "";
  const titleParts = String(title || "").trim().split(/\s+/);

  if (titleParts.length >= 2) {
    const year = parseInt(titleParts[0], 10);
    if (!Number.isNaN(year) && year > 1900) {
      make = titleParts[1] || "";
      model = titleParts.slice(2).join(" ");
    } else {
      make = titleParts[0] || "";
      model = titleParts.slice(1).join(" ");
    }
  }
  return { make, model };
}

// =============================================================================
// 5) SCRAPE LISTINGS: DIRECT LINK TARGETING & FIXED TITLE EXTRACTION
// =============================================================================
async function collectListingCards(page, maxScrolls = 6) {
  const linkSel = 'a[href*="/marketplace/item/"]';

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000); 

  for (let i = 0; i < maxScrolls; i++) {
    const count = await page.locator(linkSel).count();
    if (count > 25) break;
    await page.mouse.wheel(0, 1600);
    await page.waitForTimeout(1500);
  }

  return await page.$$(linkSel);
}

async function cardToCandidate(linkHandle) {
  if (!linkHandle) return null;

  const raw = await linkHandle.getAttribute("href");
  if (!raw) return null;

  const cleanUrl = "https://www.facebook.com" + raw.split("?")[0];
  const itemId = extractItemId(cleanUrl);
  if (!itemId) return null;

  const text = (await linkHandle.innerText().catch(() => ""))?.trim() || "";
  return { cleanUrl, itemId, text };
}

function parseTile(text) {
  const lines = String(text || "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  let price = 0;
  let priceIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("PKR") || /[0-9]/.test(lines[i])) {
      price = Number(lines[i].replace(/[^0-9]/g, ""));
      if (price > 0) {
        priceIdx = i;
        break;
      }
    }
  }

  if (priceIdx === -1) return null;

  const after = lines.slice(priceIdx + 1);
  const location = after.find(l => l.includes(",")) || "";
  
  const titleCandidate = after.find(l => l !== location && l.length > 3) || "";

  return { price, titleCandidate, location, rawLines: lines };
}

function computeFinalTitle({ titleCandidate, location, price }, keyword) {
  if (titleCandidate) return titleCandidate;
  if (keyword) return keyword;
  if (location) return location;
  return `Marketplace item (PKR ${price})`;
}

// =============================================================================
// 6) MAIN BOT ENGINE
// =============================================================================
async function runBatch() {
  if (isRunning) {
    warn("Bot already running. Skipping trigger.");
    return;
  }

  isRunning = true;
  info("🚀 Starting Search Batch...");

  let browser;
  try {
    const { data: searches, error } = await supabase
      .from("searches")
      .select("*")
      .eq("is_active", true);

    if (error) {
      err("Failed to fetch searches:", error);
      return;
    }

    if (!searches || searches.length === 0) {
      info("💤 No active agents found.");
      return;
    }

    const { data: accounts, error: accErr } = await supabase
      .from("bot_accounts")
      .select("*")
      .eq("status", "active")
      .order("last_used", { ascending: true, nullsFirst: true })
      .limit(1);

    if (accErr) {
      err("Failed to fetch bot accounts:", accErr);
      return;
    }

    if (!accounts || accounts.length === 0) {
      err("No active bot account.");
      return;
    }

    const account = accounts[0];
    info("-----------------------------------------");
    info(`USING ACCOUNT: ${account.email}`);

    await supabase
      .from("bot_accounts")
      .update({ last_used: new Date().toISOString() })
      .eq("id", account.id);

    browser = await chromium.launch({ headless: IS_CLOUD });

    const context = await browser.newContext({
      userAgent: account.user_agent || undefined,
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
    });

    if (Array.isArray(account.cookies) && account.cookies.length) {
      try {
        await context.addCookies(account.cookies);
        info("🍪 Loaded saved cookies.");
      } catch (e) {
        warn("Failed to add cookies (continuing):", e?.message || e);
      }
    }

    const page = await context.newPage();

    for (const search of searches) {
      const stats = {
        cards: 0, candidates: 0, skipped_existing: 0, skipped_empty: 0,
        skipped_parse: 0, skipped_min: 0, skipped_max: 0, insert_ok: 0, insert_fail: 0,
      };

      info(`🔎 Processing: "${search.name}"`);

      const categorySlug = getCategorySlug(search.category);
      const locationSlug = getLocationSlug(search.location);
      const queryText = search.location ? `${search.keywords} in ${search.location}` : search.keywords;
      const query = encodeURIComponent(String(queryText || "").trim());
      
      let searchUrl = locationSlug 
        ? `https://www.facebook.com/marketplace/${locationSlug}/search?query=${query}`
        : (categorySlug === "marketplace" 
            ? `https://www.facebook.com/marketplace/search?query=${query}` 
            : `https://www.facebook.com/marketplace/${categorySlug}/search?query=${query}`);

      info(`🌍 URL: ${searchUrl}`);

      try {
        await page.goto(searchUrl, { timeout: 60000, waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000); 

        const loginWall =
          (await page.isVisible("input[name='email']").catch(() => false)) ||
          (await page.isVisible("input[name='pass']").catch(() => false)) ||
          (await page.isVisible('div[aria-label*="login"]').catch(() => false)) ||
          (await page.isVisible('a[href*="login"]').catch(() => false));

        if (loginWall) {
          warn("LOGIN WALL DETECTED!");
          const shot = `login_wall_${safeFile(search.name)}.png`;
          await page.screenshot({ path: shot });
          warn(`Saved screenshot: ${shot}`);
          warn("Log in once, cookies will be saved, then rerun.");
          break;
        }

        const cards = await collectListingCards(page, 7);
        stats.cards = cards.length;
        info(`👀 Found ${cards.length} listing links.`);

        if (cards.length === 0) {
          const shot = `debug_no_cards_${safeFile(search.name)}.png`;
          await page.screenshot({ path: shot });
          warn(`No cards found. Screenshot: ${shot}`);
          continue;
        }

        const seen = new Set();
        const candidates = [];

        for (const card of cards) {
          const c = await cardToCandidate(card);
          if (!c) continue;

          const key = `${search.id}:${c.itemId}`;
          if (seen.has(key)) continue;
          seen.add(key);

          candidates.push(c);
          if (candidates.length >= 60) break;
        }

        stats.candidates = candidates.length;
        info(`✅ Candidates after de-dupe: ${candidates.length}`);

        if (!candidates.length) {
          continue;
        }

        const newlyFoundItems = [];

        for (let i = 0; i < Math.min(candidates.length, 18); i++) {
          const cand = candidates[i];

          const { data: existing, error: exErr } = await supabase
            .from("found_items")
            .select("id")
            .eq("id", cand.itemId)
            .eq("search_id", search.id)
            .maybeSingle();

          if (existing) {
            stats.skipped_existing++;
            continue;
          }

          const parsed = parseTile(cand.text);

          if (!parsed) {
            stats.skipped_empty++;
            continue;
          }

          const keyword = (search.keywords || search.name || "").trim();
          const title = computeFinalTitle(parsed, keyword);
          const location = parsed.location || search.location || "Marketplace";
          const priceClean = Number(parsed.price || 0);

          if (!title && !location && !priceClean) {
            stats.skipped_parse++;
            continue;
          }

          if (search.min_price && priceClean < search.min_price) {
            stats.skipped_min++;
            continue;
          }
          if (search.max_price && priceClean > search.max_price) {
            stats.skipped_max++;
            continue;
          }

          const { make, model } = parseMakeModel(title);

          const { error: insErr } = await supabase.from("found_items").insert({
            id: cand.itemId,
            search_id: search.id,
            user_id: search.user_id,
            title,
            price: priceClean,
            location,
            url: cand.cleanUrl,
            status: "new",
            make,
            model,
            matched_at: new Date().toISOString(),
          });

          if (insErr) {
            stats.insert_fail++;
            err(`[DB] Insert failed for itemId=${cand.itemId}`, insErr);
            continue;
          }

          stats.insert_ok++;
          info(`[DB] Insert OK itemId=${cand.itemId} title="${title}"`);

          newlyFoundItems.push({
            title, make, model, price: priceClean, location, url: cand.cleanUrl,
          });

          if (stats.insert_ok >= 8) break;
        }

        info(`✅ Saved to DB for "${search.name}": ${stats.insert_ok}`);
        
        if (stats.skipped_empty >= 10 && stats.insert_ok === 0) {
          const shot = `debug_many_empty_${safeFile(search.name)}.png`;
          await page.screenshot({ path: shot });
          warn(`Many skipped/empty tiles. Screenshot: ${shot}`);
        }

        if (newlyFoundItems.length > 0) {
          const { data: userProfile, error: profErr } = await supabase
            .from("profiles")
            .select("telegram_chat_id")
            .eq("id", search.user_id)
            .maybeSingle();

          if (userProfile?.telegram_chat_id) {
            await sendTelegramNotification(search.name, newlyFoundItems, userProfile.telegram_chat_id);
          }
        }

        await page.waitForTimeout(getRandomInt(3000, 6000));
      } catch (e) {
        err(`Error while processing "${search.name}":`, e?.message || e);
      }
    }

    const cookies = await context.cookies();
    await supabase.from("bot_accounts").update({ cookies }).eq("id", account.id);
  } catch (e) {
    err("Critical Error:", e?.message || e);
  } finally {
    isRunning = false;
    if (browser) await browser.close().catch(() => {});
    info("🏁 Batch finished.");
  }
}

// =============================================================================
// 7) SERVER LOOP
// =============================================================================
(async () => {
  info("🚀 MarketScout Realtime Engine Started.");

  await runBatch();

  supabase
    .channel("searches-listener")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "searches" }, () => runBatch())
    .subscribe();

  setInterval(() => {
    if (!isRunning) runBatch();
  }, CHECK_INTERVAL_MINUTES * 60 * 1000);
})();