/**
 * Gold Chit Scheme Engine — Walsong JwelFlow
 *
 * Implements a monthly gold savings scheme ("chit") where:
 *   • Each installment payment is converted to gold weight at the live rate of that day.
 *   • Total accumulated gold is tracked with Decimal.js precision.
 *   • Maturity is reached when installments paid == total_months.
 *
 * Key formula:
 *   GoldWeightGrams = (Amount_NPR / GoldRate_per_Tola) × GRAMS_PER_TOLA
 */

import Decimal from 'decimal.js';
import { getDb } from './db';
import { safeUUID } from './utils/safe-uuid';
import { GRAMS_PER_TOLA } from './jewelry-math';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChitScheme {
    id: string;
    customer_name: string;
    customer_phone: string;
    monthly_amount_npr: number;
    total_months: number;
    start_date: string;
    status: 'active' | 'matured' | 'cancelled';
    notes: string;
}

export interface ChitInstallment {
    id: string;
    scheme_id: string;
    installment_number: number;
    payment_date: string;
    amount_npr: number;
    gold_rate_on_day: number;   // NPR per tola at time of payment
    gold_weight_grams: number;  // equivalent gold accumulated
    notes: string;
}

export interface ChitSummary {
    scheme: ChitScheme;
    installments: ChitInstallment[];
    paid_installments: number;
    remaining_installments: number;
    total_gold_grams: Decimal;
    total_gold_tola: Decimal;
    total_npr_paid: Decimal;
    maturity_date: string;
    days_to_maturity: number;
    is_mature: boolean;
}

// ─── Pure Calculation Functions ───────────────────────────────────────────────

/**
 * Convert an NPR amount to gold weight (grams) at a given gold rate.
 * GoldWeightGrams = (NPR / RatePerTola) × GRAMS_PER_TOLA
 */
export function nprToGoldGrams(
    nprAmount: number | Decimal,
    goldRatePerTola: number | Decimal
): Decimal {
    const npr = new Decimal(nprAmount);
    const rate = new Decimal(goldRatePerTola);
    if (rate.lte(0)) return new Decimal(0);
    // (NPR / ratePerTola) gives us tola; multiply by GRAMS_PER_TOLA
    return npr.div(rate).mul(GRAMS_PER_TOLA).toDecimalPlaces(6);
}

/**
 * Sum of all gold grams accumulated across installments.
 */
export function sumAccumulatedGold(installments: ChitInstallment[]): Decimal {
    return installments.reduce(
        (acc, inst) => acc.plus(new Decimal(inst.gold_weight_grams)),
        new Decimal(0)
    ).toDecimalPlaces(6);
}

/**
 * Calculate expected maturity date from start_date and total_months.
 */
export function calcMaturityDate(startDate: string, totalMonths: number): Date {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + totalMonths);
    return d;
}

/**
 * Days remaining until maturity. Negative = already past maturity.
 */
export function daysToMaturity(startDate: string, totalMonths: number): number {
    const maturity = calcMaturityDate(startDate, totalMonths);
    const diff = maturity.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── DB Operations ────────────────────────────────────────────────────────────

/**
 * Create a new Gold Chit Scheme.
 */
export async function createChitScheme(data: {
    customer_name: string;
    customer_phone?: string;
    monthly_amount_npr: number;
    total_months: number;
    notes?: string;
}): Promise<ChitScheme> {
    const db = await getDb();
    const scheme: ChitScheme = {
        id: safeUUID(),
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone?.trim() || '',
        monthly_amount_npr: new Decimal(data.monthly_amount_npr).toNumber(),
        total_months: data.total_months,
        start_date: new Date().toISOString(),
        status: 'active',
        notes: data.notes || '',
    };
    await db.chit_schemes.insert(scheme);
    await db.audit_log.insert({
        id: safeUUID(),
        timestamp: new Date().toISOString(),
        action: 'CHIT_CREATE',
        details: `Chit scheme created for ${scheme.customer_name} — NPR ${scheme.monthly_amount_npr}/mo × ${scheme.total_months} months`,
        user: 'staff',
    });
    return scheme;
}

/**
 * Record a monthly installment payment.
 * goldRatePerTola must be the LIVE rate on the payment date.
 * Returns the computed gold weight accumulated by this payment.
 */
export async function addInstallmentPayment(data: {
    scheme_id: string;
    amount_npr: number;
    gold_rate_per_tola: number;
    notes?: string;
}): Promise<{ installment: ChitInstallment; gold_weight_grams: Decimal; is_mature: boolean }> {
    const db = await getDb();

    // Find the scheme
    const schemeDoc = await db.chit_schemes.findOne(data.scheme_id).exec();
    if (!schemeDoc) throw new Error(`Chit scheme ${data.scheme_id} not found.`);
    const scheme = schemeDoc.toJSON() as ChitScheme;

    if (scheme.status !== 'active') {
        throw new Error(`Chit scheme is ${scheme.status}, cannot add payment.`);
    }

    // Count existing installments
    const existing = await db.chit_installments
        .find({ selector: { scheme_id: data.scheme_id } })
        .exec();
    const installmentNumber = existing.length + 1;

    const goldGrams = nprToGoldGrams(data.amount_npr, data.gold_rate_per_tola);

    const installment: ChitInstallment = {
        id: safeUUID(),
        scheme_id: data.scheme_id,
        installment_number: installmentNumber,
        payment_date: new Date().toISOString(),
        amount_npr: new Decimal(data.amount_npr).toNumber(),
        gold_rate_on_day: data.gold_rate_per_tola,
        gold_weight_grams: goldGrams.toNumber(),
        notes: data.notes || '',
    };
    await db.chit_installments.insert(installment);

    // Check maturity
    const isMature = installmentNumber >= scheme.total_months;
    if (isMature) {
        await schemeDoc.patch({ status: 'matured' });
        await db.audit_log.insert({
            id: safeUUID(),
            timestamp: new Date().toISOString(),
            action: 'CHIT_MATURED',
            details: `Chit scheme matured for ${scheme.customer_name} — all ${scheme.total_months} installments paid`,
            user: 'staff',
        });
    }

    await db.audit_log.insert({
        id: safeUUID(),
        timestamp: new Date().toISOString(),
        action: 'CHIT_PAYMENT',
        details: JSON.stringify({
            scheme_id: data.scheme_id,
            customer: scheme.customer_name,
            installment: installmentNumber,
            amount_npr: data.amount_npr,
            gold_rate: data.gold_rate_per_tola,
            gold_grams: goldGrams.toNumber(),
        }),
        user: 'staff',
    });

    return { installment, gold_weight_grams: goldGrams, is_mature: isMature };
}

/**
 * Get a full summary for a scheme including all installments and gold totals.
 */
export async function getChitSummary(schemeId: string): Promise<ChitSummary> {
    const db = await getDb();
    const schemeDoc = await db.chit_schemes.findOne(schemeId).exec();
    if (!schemeDoc) throw new Error(`Chit scheme ${schemeId} not found.`);
    const scheme = schemeDoc.toJSON() as ChitScheme;

    const installDocs = await db.chit_installments
        .find({ selector: { scheme_id: schemeId } })
        .exec();
    const installments: ChitInstallment[] = installDocs
        .map((d: any) => d.toJSON() as ChitInstallment)
        .sort((a: ChitInstallment, b: ChitInstallment) => a.installment_number - b.installment_number);

    const totalGoldGrams = sumAccumulatedGold(installments);
    const totalNPR = installments.reduce(
        (acc, i) => acc.plus(new Decimal(i.amount_npr)), new Decimal(0)
    );
    const maturityDate = calcMaturityDate(scheme.start_date, scheme.total_months);
    const daysLeft = daysToMaturity(scheme.start_date, scheme.total_months);

    return {
        scheme,
        installments,
        paid_installments: installments.length,
        remaining_installments: Math.max(0, scheme.total_months - installments.length),
        total_gold_grams: totalGoldGrams,
        total_gold_tola: totalGoldGrams.div(GRAMS_PER_TOLA).toDecimalPlaces(4),
        total_npr_paid: totalNPR.toDecimalPlaces(2),
        maturity_date: maturityDate.toISOString(),
        days_to_maturity: daysLeft,
        is_mature: scheme.status === 'matured' || installments.length >= scheme.total_months,
    };
}

/**
 * Get schemes that are maturing this month — for dashboard alert banners.
 */
export async function getMaturityAlerts(): Promise<ChitSummary[]> {
    const db = await getDb();
    const schemes = await db.chit_schemes
        .find({ selector: { status: 'active' } })
        .exec();

    const alerts: ChitSummary[] = [];
    for (const schemeDoc of schemes) {
        const scheme = schemeDoc.toJSON() as ChitScheme;
        const days = daysToMaturity(scheme.start_date, scheme.total_months);
        // Alert if < 30 days to maturity or already overdue
        if (days <= 30) {
            const summary = await getChitSummary(scheme.id);
            alerts.push(summary);
        }
    }
    return alerts;
}

/**
 * List all chit schemes, sorted by status then start date.
 */
export async function listChitSchemes(): Promise<ChitScheme[]> {
    const db = await getDb();
    const docs = await db.chit_schemes.find().exec();
    return docs
        .map((d: any) => d.toJSON() as ChitScheme)
        .sort((a: ChitScheme, b: ChitScheme) => {
            // active first, then matured, then cancelled
            const order = { active: 0, matured: 1, cancelled: 2 };
            const statusDiff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
            if (statusDiff !== 0) return statusDiff;
            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        });
}

/**
 * Cancel an active chit scheme.
 */
export async function cancelChitScheme(schemeId: string): Promise<void> {
    const db = await getDb();
    const doc = await db.chit_schemes.findOne(schemeId).exec();
    if (!doc) throw new Error(`Chit scheme ${schemeId} not found.`);
    const scheme = doc.toJSON() as ChitScheme;
    await doc.patch({ status: 'cancelled' });
    await db.audit_log.insert({
        id: safeUUID(),
        timestamp: new Date().toISOString(),
        action: 'CHIT_CANCEL',
        details: `Chit scheme cancelled for ${scheme.customer_name}`,
        user: 'staff',
    });
}
