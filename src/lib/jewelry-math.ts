// Walsong-JwelFlow Core Jewelry Math

// 1 Tola = 11.6638 Grams
// 1 Tola = 10 Masha = 100 Lal
export const GRAMS_PER_TOLA = 11.6638;

export interface TolaMashaLal {
    tola: number;
    masha: number;
    lal: number;
}

export function toGrams(weight: TolaMashaLal): number {
    const totalTola = weight.tola + (weight.masha / 10) + (weight.lal / 100);
    return totalTola * GRAMS_PER_TOLA;
}

export function toTolaMashaLal(grams: number): TolaMashaLal {
    let totalTola = grams / GRAMS_PER_TOLA;
    const tola = Math.floor(totalTola);
    totalTola = (totalTola - tola) * 10;
    const masha = Math.floor(totalTola);
    const lal = Math.round((totalTola - masha) * 10);

    return { tola, masha, lal };
}

export interface PriceParams {
    ratePerTola: number;
    weightGrams: number;
    jartiAmount: number; // Wastage value added to cost
    jyalaAmount: number; // Making charge value
}

// Final Price = ((Rate × Net Weight) + Jarti) + Jyala + VAT (13%)
// Jarti and Jyala provided here as absolute currency values, not percentage, per request format if assumed so.
// Let's assume Jarti might be given in % or amount. We will assume amount.
export function calculateFinalPrice({ ratePerTola, weightGrams, jartiAmount, jyalaAmount }: PriceParams): number {
    const weightTola = weightGrams / GRAMS_PER_TOLA;
    const baseCost = ratePerTola * weightTola;
    const costWithJartiAndJyala = baseCost + jartiAmount + jyalaAmount;
    const finalPrice = costWithJartiAndJyala * 1.13; // VAT 13%

    return finalPrice;
}
