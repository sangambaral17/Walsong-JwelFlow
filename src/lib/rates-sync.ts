/**
 * Market Rate Synchronization — LIVE from FENEGOSIDA
 * 
 * In the Tauri desktop app, rates are fetched directly from fenegosida.org
 * via a Rust backend command (no CORS issues).
 * In the browser (dev mode), falls back to hardcoded constants.
 * 
 * Flow: App opens → syncMarketRates() → tries Tauri invoke → falls back to constants → saves to DB
 */
import { getDb } from "./db";

// Fallback constants — used when offline or in browser dev mode
export const MARKET_CONSTANTS = {
    HALLMARK_GOLD: 315400, // NPR per Fine Tola (FENEGOSIDA Feb 26, 2026)
    TEJABI_GOLD: 314700,   // NPR per Tola
    SILVER: 5725,          // NPR per Tola
};

interface LiveRates {
    hallmark_gold: number;
    tejabi_gold: number;
    silver: number;
    source: string;
    timestamp: string;
}

/**
 * Try to fetch live rates from FENEGOSIDA via Tauri backend.
 * Returns null if not running in Tauri or if fetch fails.
 */
async function fetchFromTauri(): Promise<LiveRates | null> {
    try {
        // @ts-ignore — Tauri's invoke is only available in the desktop app
        const { invoke } = await import("@tauri-apps/api/core");
        const rates: LiveRates = await invoke("fetch_live_rates");
        console.log("[RatesSync] ✅ Live rates from FENEGOSIDA:", rates);
        return rates;
    } catch (err) {
        console.warn("[RatesSync] Tauri invoke unavailable or failed, using fallback:", err);
        return null;
    }
}

export async function syncMarketRates(): Promise<boolean> {
    try {
        const db = await getDb();
        const today = new Date().toISOString().split('T')[0];

        // Try live rates first (only works in Tauri desktop app)
        const live = await fetchFromTauri();

        const goldRate = live?.hallmark_gold || MARKET_CONSTANTS.HALLMARK_GOLD;
        const silverRate = live?.silver || MARKET_CONSTANTS.SILVER;

        // upsert avoids 'document already exists' errors on repeat loads
        await db.rates.upsert({
            date: today,
            gold_tola_rate: goldRate,
            silver_tola_rate: silverRate
        });

        const source = live ? "FENEGOSIDA (Live)" : "Fallback Constants";
        console.log(`[RatesSync] Rates hydrated for ${today} — Source: ${source} | Gold: ${goldRate} | Silver: ${silverRate}`);
        return true;
    } catch (err) {
        console.error("[RatesSync] Sync failed:", err);
        return false;
    }
}

/**
 * Fetch live rates — used by rate widget for display
 */
export async function fetchLiveRatesFromFederation() {
    const live = await fetchFromTauri();
    return {
        gold: live?.hallmark_gold || MARKET_CONSTANTS.HALLMARK_GOLD,
        tejabi: live?.tejabi_gold || MARKET_CONSTANTS.TEJABI_GOLD,
        silver: live?.silver || MARKET_CONSTANTS.SILVER,
        source: live ? "FENEGOSIDA (Live)" : "Offline",
        timestamp: live?.timestamp || new Date().toISOString()
    };
}
