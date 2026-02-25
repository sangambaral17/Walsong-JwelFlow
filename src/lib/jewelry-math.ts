// Walsong-JwelFlow Core Jewelry Math Engine
// Using Decimal.js for high-precision financial calculations

import Decimal from 'decimal.js';

// 1 Tola = 11.6638 Grams
// 1 Tola = 10 Masha = 100 Lal
export const GRAMS_PER_TOLA = new Decimal('11.6638');
export const MASHA_PER_TOLA = 10;
export const LAL_PER_TOLA = 100;
export const VAT_RATE = new Decimal('0.13'); // 13%

export interface TolaMashaLal {
    tola: number;
    masha: number;
    lal: number;
}

/**
 * Convert Tola-Masha-Lal to Grams with Decimal precision.
 */
export function toGrams(weight: TolaMashaLal): Decimal {
    const totalTola = new Decimal(weight.tola)
        .plus(new Decimal(weight.masha).div(MASHA_PER_TOLA))
        .plus(new Decimal(weight.lal).div(LAL_PER_TOLA));
    return totalTola.mul(GRAMS_PER_TOLA);
}

/**
 * Convert grams to Tola-Masha-Lal representation.
 */
export function toTolaMashaLal(grams: number | Decimal): TolaMashaLal {
    const g = new Decimal(grams);
    const totalLal = g.div(GRAMS_PER_TOLA).mul(LAL_PER_TOLA);
    const totalLalInt = totalLal.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();

    const tola = Math.floor(totalLalInt / 100);
    const masha = Math.floor((totalLalInt % 100) / 10);
    const lal = totalLalInt % 10;

    return { tola, masha, lal };
}

/**
 * Format TolaMashaLal as a human-readable string.
 */
export function formatTML(weight: TolaMashaLal): string {
    return `${weight.tola}T ${weight.masha}M ${weight.lal}L`;
}

export interface PriceParams {
    ratePerTola: number;
    weightGrams: number | Decimal;
    wastageAmount: number; // Jarti — wastage value (NPR)
    makingCharge: number;  // Jyala — making charge (NPR)
}

/**
 * Calculate final price with IRD-compliant VAT:
 * Total = ((Net Weight × Daily Rate) + Wastage + Making Charge) × 1.13
 */
export function calculateFinalPrice(params: PriceParams): {
    basePrice: Decimal;
    wastage: Decimal;
    making: Decimal;
    subtotal: Decimal;
    vatAmount: Decimal;
    total: Decimal;
} {
    const weightGrams = new Decimal(params.weightGrams);
    const weightTola = weightGrams.div(GRAMS_PER_TOLA);
    const rate = new Decimal(params.ratePerTola);
    const wastage = new Decimal(params.wastageAmount);
    const making = new Decimal(params.makingCharge);

    const basePrice = weightTola.mul(rate);
    const subtotal = basePrice.plus(wastage).plus(making);
    const vatAmount = subtotal.mul(VAT_RATE);
    const total = subtotal.plus(vatAmount);

    return {
        basePrice: basePrice.toDecimalPlaces(2),
        wastage: wastage.toDecimalPlaces(2),
        making: making.toDecimalPlaces(2),
        subtotal: subtotal.toDecimalPlaces(2),
        vatAmount: vatAmount.toDecimalPlaces(2),
        total: total.toDecimalPlaces(2),
    };
}
