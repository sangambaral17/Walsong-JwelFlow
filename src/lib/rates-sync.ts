/**
 * Market Rate Synchronization — LIVE from FENEGOSIDA
 * 
 * Fetching strategy (waterfall):
 *   1. Tauri invoke (desktop app — no CORS)
 *   2. Browser fetch via CORS proxy (dev/browser — works everywhere)
 *   3. Cached DB rate (last 7 days)
 *   4. Hardcoded fallback constants
 * 
 * Flow: App opens → syncMarketRates() → tries Tauri → tries browser fetch → cache → constants → saves to DB
 */
import { getDb } from "./db";

// Fallback constants — used when ALL fetch methods fail
export const MARKET_CONSTANTS = {
    HALLMARK_GOLD: 314900, // NPR per Fine Tola (FENEGOSIDA Feb 27, 2026)
    TEJABI_GOLD: 314900,   // NPR per Tola (TEJABI shows 0 on site, fallback to hallmark)
    SILVER: 5740,          // NPR per Tola
};

interface LiveRates {
    hallmark_gold: number;
    tejabi_gold: number;
    silver: number;
    source: string;
    timestamp: string;
}

/** Timestamp of last successful sync for UI display */
let lastSyncTimestamp: string | null = null;
let lastSyncSource: string | null = null;

export function getLastSyncInfo() {
    return { timestamp: lastSyncTimestamp, source: lastSyncSource };
}

/**
 * Promise.race-based timeout wrapper.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        )
    ]);
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse FENEGOSIDA HTML to extract rates.
 * Used by both Tauri (Rust) and browser (JS) paths.
 */
function parseRatesFromHTML(html: string): LiveRates | null {
    try {
        // FENEGOSIDA lists rates TWICE: per 10 grm, then per 1 tola.
        // We must match each rate in the per-1-tola section specifically.
        // Format:
        //   FINE GOLD (9999)per 1 tolaरु 314900
        //   TEJABI GOLDper 1 tolaरु 0
        //   SILVERper 1 tolaरु 5740

        // Strategy: match "LABEL...per 1 tola...NUMBER" but only capture
        // the number immediately after "per 1 tola" (within ~50 chars)
        // to avoid crossing into the next rate entry.

        const goldMatch = html.match(/FINE\s*GOLD[^]*?per\s*1\s*tola[^\d]{0,20}(\d[\d,]+)/i);
        const tejabiMatch = html.match(/TEJABI\s*GOLD[^]*?per\s*1\s*tola[^\d]{0,20}(\d[\d,]+)/i);

        // For SILVER: anchor to "SILVERper 1 tola" specifically.
        // Use a tight pattern: SILVER followed by non-GOLD chars up to "per 1 tola"
        // This prevents crossing from the per-10-grm SILVER past GOLD entries.
        const silverMatch = html.match(/SILVER\s*per\s*1\s*tola[^\d]{0,20}(\d[\d,]+)/i);

        const parseNum = (m: RegExpMatchArray | null) =>
            m ? parseFloat(m[1].replace(/,/g, '')) : 0;

        const hallmark = parseNum(goldMatch);
        const tejabi = parseNum(tejabiMatch);
        const silver = parseNum(silverMatch);

        if (hallmark === 0 && silver === 0) return null;

        return {
            hallmark_gold: hallmark,
            tejabi_gold: tejabi > 0 ? tejabi : hallmark,
            silver,
            source: "FENEGOSIDA",
            timestamp: new Date().toISOString()
        };
    } catch {
        return null;
    }
}

/**
 * Try to fetch live rates from FENEGOSIDA via Tauri backend.
 */
async function fetchFromTauri(): Promise<LiveRates | null> {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 10_000;
    const RETRY_DELAY_MS = 3_000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // @ts-ignore — Tauri's invoke is only available in the desktop app
            const { invoke } = await import("@tauri-apps/api/core");
            const rates: LiveRates = await withTimeout(
                invoke("fetch_live_rates"),
                TIMEOUT_MS,
                `Tauri fetch_live_rates (attempt ${attempt})`
            );
            console.log(`[RatesSync] ✅ Live rates via Tauri (attempt ${attempt}):`, rates);
            return rates;
        } catch (err: any) {
            const isTimeout = err?.message?.includes("timed out");
            const isLastAttempt = attempt === MAX_RETRIES;
            console.warn(
                `[RatesSync] Tauri attempt ${attempt}/${MAX_RETRIES} failed${isTimeout ? ' (TIMEOUT)' : ''}:`,
                err?.message || err
            );
            if (!isLastAttempt) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }
    return null;
}

/**
 * Browser-side fetch via our own Next.js API route (/api/rates).
 * The API route runs server-side so it has no CORS issues.
 * Works in dev mode (npm run dev). In static export/Tauri, Tauri handles it.
 */
async function fetchFromBrowser(): Promise<LiveRates | null> {
    try {
        console.log("[RatesSync] Trying browser fetch via /api/rates...");
        const response = await withTimeout(
            fetch("/api/rates"),
            10_000,
            "Browser /api/rates fetch"
        );

        if (!response.ok) {
            console.warn(`[RatesSync] /api/rates returned ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.error) {
            console.warn("[RatesSync] /api/rates error:", data.error);
            return null;
        }

        if (data.hallmark_gold > 0) {
            console.log("[RatesSync] ✅ Live rates via /api/rates:", data);
            return data as LiveRates;
        }

        return null;
    } catch (err: any) {
        console.warn("[RatesSync] /api/rates fetch failed:", err?.message || err);
        return null;
    }
}

/**
 * Try to get the most recent cached rate from the DB.
 * Includes sanity check: silver should be WAY less than gold (typically ~50x smaller).
 * If silver >= gold * 0.5, the cache is clearly corrupt (old bug wrote gold value as silver).
 */
async function getCachedRate(): Promise<{ gold: number; silver: number } | null> {
    try {
        const db = await getDb();
        for (let daysBack = 0; daysBack <= 7; daysBack++) {
            const d = new Date();
            d.setDate(d.getDate() - daysBack);
            const dateStr = d.toISOString().split('T')[0];
            const cached = await db.rates.findOne(dateStr).exec();
            if (cached && cached.gold_tola_rate > 0) {
                let silver = cached.silver_tola_rate;
                // SANITY CHECK: Silver should be ~50-60x smaller than gold.
                // If silver >= 50% of gold, the cached value is corrupt.
                if (silver >= cached.gold_tola_rate * 0.5) {
                    console.warn(`[RatesSync] ⚠️ Corrupt cache detected for ${dateStr}: Silver(${silver}) ≈ Gold(${cached.gold_tola_rate}). Using constant.`);
                    silver = MARKET_CONSTANTS.SILVER;
                }
                console.log(`[RatesSync] Found cached rate from ${dateStr}: Gold=${cached.gold_tola_rate}, Silver=${silver}`);
                return { gold: cached.gold_tola_rate, silver };
            }
        }
    } catch (err) {
        console.warn("[RatesSync] Cache lookup failed:", err);
    }
    return null;
}

export async function syncMarketRates(): Promise<boolean> {
    try {
        const db = await getDb();
        const today = new Date().toISOString().split('T')[0];

        // 1. Try Tauri invoke first (desktop app)
        let live = await fetchFromTauri();

        // 2. If Tauri failed, try browser fetch via CORS proxy
        if (!live || live.hallmark_gold <= 0) {
            live = await fetchFromBrowser();
        }

        let goldRate: number;
        let silverRate: number;
        let source: string;

        if (live && live.hallmark_gold > 0) {
            goldRate = live.hallmark_gold;
            silverRate = live.silver || MARKET_CONSTANTS.SILVER;
            source = live.source || "FENEGOSIDA (Live)";
        } else {
            // Fallback: try cached DB rates, then hardcoded constants
            const cached = await getCachedRate();
            if (cached) {
                goldRate = cached.gold;
                silverRate = cached.silver;
                source = "Cached (DB)";
            } else {
                goldRate = MARKET_CONSTANTS.HALLMARK_GOLD;
                silverRate = MARKET_CONSTANTS.SILVER;
                source = "Fallback Constants";
            }
        }

        // FINAL SANITY CHECK: Silver should never be anywhere close to gold
        // Gold is ~300,000 NPR, Silver is ~5,700 NPR (roughly 50x difference)
        if (silverRate >= goldRate * 0.1) {
            console.warn(`[RatesSync] ⚠️ Silver(${silverRate}) suspiciously high vs Gold(${goldRate}). Overriding with constant.`);
            silverRate = MARKET_CONSTANTS.SILVER;
        }

        // upsert avoids 'document already exists' errors on repeat loads
        await db.rates.upsert({
            date: today,
            gold_tola_rate: goldRate,
            silver_tola_rate: silverRate
        });

        lastSyncTimestamp = new Date().toISOString();
        lastSyncSource = source;

        console.log(`[RatesSync] Rates hydrated for ${today} — Source: ${source} | Gold: ${goldRate} | Silver: ${silverRate}`);

        // Automatically reprice all inventory items against the fresh rate
        if (source.includes("FENEGOSIDA") || source.includes("Cached")) {
            await updateStockPricesFromRate(goldRate, silverRate);
        }

        return source.includes("FENEGOSIDA");
    } catch (err) {
        console.error("[RatesSync] Sync failed:", err);
        lastSyncTimestamp = new Date().toISOString();
        lastSyncSource = "Error";
        return false;
    }
}

/**
 * Fetch live rates — used by rate widget for display
 */
export async function fetchLiveRatesFromFederation() {
    let live = await fetchFromTauri();
    if (!live) live = await fetchFromBrowser();

    return {
        gold: live?.hallmark_gold || MARKET_CONSTANTS.HALLMARK_GOLD,
        tejabi: live?.tejabi_gold || MARKET_CONSTANTS.TEJABI_GOLD,
        silver: live?.silver || MARKET_CONSTANTS.SILVER,
        source: live ? live.source : "Offline",
        timestamp: live?.timestamp || new Date().toISOString()
    };
}

/**
 * Dynamically reprice all inventory items based on the current gold rate.
 *
 * Formula: SalePrice = (net_weight_grams / GRAMS_PER_TOLA × goldRatePerTola) + jyala
 *
 * Note: Only updates items with net_weight_grams > 0.
 * Silver categories use the silver rate instead.
 */
export async function updateStockPricesFromRate(
    goldRatePerTola: number,
    silverRatePerTola: number
): Promise<{ updated: number; skipped: number }> {
    const GRAMS_PER_TOLA = 11.6638;
    try {
        const db = await getDb();
        const allItems = await db.inventory.find().exec();

        let updated = 0;
        let skipped = 0;

        for (const doc of allItems) {
            const item = doc.toJSON();
            const grams = item.net_weight_grams ?? 0;
            if (grams <= 0) { skipped++; continue; }

            const isSilver = (item.category ?? '').toLowerCase() === 'silver';
            const ratePerTola = isSilver ? silverRatePerTola : goldRatePerTola;
            const jyala = item.jyala ?? 0;

            // SalePrice = (net_weight_grams / GRAMS_PER_TOLA × rate) + jyala
            const salePrice = parseFloat(
                ((grams / GRAMS_PER_TOLA) * ratePerTola + jyala).toFixed(2)
            );

            await doc.patch({ sale_price: salePrice });
            updated++;
        }

        console.log(`[RatesSync] Stock repriced: ${updated} updated, ${skipped} skipped (no weight).`);
        return { updated, skipped };
    } catch (err) {
        console.error('[RatesSync] updateStockPricesFromRate failed:', err);
        return { updated: 0, skipped: 0 };
    }
}
