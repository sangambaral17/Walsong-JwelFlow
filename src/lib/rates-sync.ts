import { getDb } from "./db";

export const MARKET_CONSTANTS = {
    HALLMARK_GOLD: 314800, // NPR per Fine Tola
    TEJABI_GOLD: 313200,   // NPR per Tola (Approx)
    SILVER: 5715,          // NPR per Tola
};

export async function syncMarketRates() {
    try {
        const db = await getDb();
        const today = new Date().toISOString().split('T')[0];

        let currentRate = await db.rates.findOne(today).exec();

        // If today's rate doesn't exist, initialize with constants
        // In the future, this is where the FENEGOSIDA scraper would update the database
        if (!currentRate) {
            await db.rates.insert({
                date: today,
                gold_tola_rate: MARKET_CONSTANTS.HALLMARK_GOLD,
                silver_tola_rate: MARKET_CONSTANTS.SILVER
            });
            console.log(`[RatesSync] Initialized rates for ${today}`);
        } else {
            console.log(`[RatesSync] Rates for ${today} already synchronized.`);
        }

        return true;
    } catch (err) {
        console.error("[RatesSync] Sync failed:", err);
        return false;
    }
}

/**
 * Mock function for FENEGOSIDA scraper
 * This would be replaced by a real scraper in the production environment
 */
export async function fetchLiveRatesFromFederation() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
        gold: MARKET_CONSTANTS.HALLMARK_GOLD,
        silver: MARKET_CONSTANTS.SILVER,
        timestamp: new Date().toISOString()
    };
}
