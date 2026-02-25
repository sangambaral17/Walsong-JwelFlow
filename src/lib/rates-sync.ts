/**
 * Market Rate Synchronization
 * Stores today's gold/silver rates using upsert so it works even if the
 * rates collection is freshly created (avoids 'document already exists' errors).
 */
import { getDb } from "./db";

export const MARKET_CONSTANTS = {
    HALLMARK_GOLD: 314800, // NPR per Fine Tola (FENEGOSIDA reference rate)
    TEJABI_GOLD: 313200,   // NPR per Tola
    SILVER: 5715,          // NPR per Tola
};

export async function syncMarketRates(): Promise<boolean> {
    try {
        const db = await getDb();
        const today = new Date().toISOString().split('T')[0];

        // upsert avoids 'document already exists' errors on repeat loads
        await db.rates.upsert({
            date: today,
            gold_tola_rate: MARKET_CONSTANTS.HALLMARK_GOLD,
            silver_tola_rate: MARKET_CONSTANTS.SILVER
        });
        console.log(`[RatesSync] Rates hydrated for ${today}`);
        return true;
    } catch (err) {
        console.error("[RatesSync] Sync failed:", err);
        return false;
    }
}

/**
 * Mock FENEGOSIDA scraper — replace with real HTTP fetch in Phase 3.
 */
export async function fetchLiveRatesFromFederation() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        gold: MARKET_CONSTANTS.HALLMARK_GOLD,
        silver: MARKET_CONSTANTS.SILVER,
        timestamp: new Date().toISOString()
    };
}
