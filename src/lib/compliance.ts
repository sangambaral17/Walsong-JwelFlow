/**
 * IRD & AML Compliance Engine — Walsong JwelFlow
 *
 * Implements two compliance pillars:
 *
 * 1. AML (Anti-Money Laundering) Block
 *    ─ If TransactionValue >= NPR 1,000,000:
 *        • "Cash" payment is DISABLED (mandate digital/bank payment)
 *        • KYC fields MUST be filled before allowing checkout
 *        • Invoice is flagged as `aml_flagged = true`
 *
 * 2. IRD E-Billing / Immutable Audit Log
 *    ─ audit_log collection is NEVER deleted or updated — append-only.
 *    ─ Provides getAuditTrail(from, to) for IRD/CBMS export.
 */

import Decimal from 'decimal.js';
import { getDb } from './db';
import { safeUUID } from './utils/safe-uuid';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Hardcoded AML threshold per Nepal Rastra Bank & FATF directive.
 * Transactions AT or ABOVE this value require KYC and non-cash payment.
 */
export const AML_THRESHOLD_NPR = new Decimal('1000000'); // NPR 10,00,000

// ─── Types ────────────────────────────────────────────────────────────────────

export type KycIdType = 'citizenship' | 'passport' | 'license' | 'voter' | 'pan';

export interface KycFields {
    kyc_name: string;
    kyc_id_type: KycIdType | '';
    kyc_id_number: string;
    kyc_address: string;
}

export interface AmlValidationResult {
    /** Whether the transaction is ALLOWED to proceed */
    valid: boolean;
    /** Whether this transaction is above the AML threshold */
    aml_triggered: boolean;
    /** Human-readable errors to display in the UI */
    errors: string[];
    /** Whether cash is disabled for this transaction */
    cash_disabled: boolean;
}

export interface AuditEntry {
    id: string;
    timestamp: string;
    action: string;
    details: string;
    user: string;
}

// ─── AML Validation ────────────────────────────────────────────────────────────

/**
 * Validate a transaction against AML rules.
 *
 * Call this BEFORE allowing checkout to proceed.
 *
 * @param transactionValue  Grand total of the transaction (NPR)
 * @param paymentMethod     'cash' | 'bank' | 'credit'
 * @param kyc               KYC fields entered by cashier
 */
export function validateAML(
    transactionValue: number | Decimal,
    paymentMethod: string,
    kyc: Partial<KycFields>
): AmlValidationResult {
    const amount = new Decimal(transactionValue);
    const amlTriggered = amount.gte(AML_THRESHOLD_NPR);
    const errors: string[] = [];

    if (!amlTriggered) {
        // Below threshold — no restrictions
        return { valid: true, aml_triggered: false, errors: [], cash_disabled: false };
    }

    // --- AML TRIGGERED ---

    // Rule 1: Cash is forbidden for transactions >= NPR 10,00,000
    if (paymentMethod === 'cash') {
        errors.push(
            `Cash payment is not allowed for transactions ≥ NPR ${AML_THRESHOLD_NPR.toNumber().toLocaleString()}. ` +
            'Please use Bank Transfer or Credit.'
        );
    }

    // Rule 2: Full KYC required
    if (!kyc.kyc_name?.trim()) {
        errors.push('KYC: Full legal name is required.');
    }
    if (!kyc.kyc_id_type?.trim()) {
        errors.push('KYC: ID type must be selected.');
    }
    if (!kyc.kyc_id_number?.trim()) {
        errors.push('KYC: ID number is required.');
    }
    if (!kyc.kyc_address?.trim()) {
        errors.push('KYC: Address is required.');
    }

    return {
        valid: errors.length === 0,
        aml_triggered: true,
        errors,
        cash_disabled: true,
    };
}

/**
 * Check if AML will be triggered for a given amount.
 * Lightweight helper for reactive UI (e.g., disabling the Cash button as total grows).
 */
export function isAmlTriggered(transactionValue: number | Decimal): boolean {
    return new Decimal(transactionValue).gte(AML_THRESHOLD_NPR);
}

/**
 * Format the AML threshold as a human-readable string.
 */
export function amlThresholdDisplay(): string {
    return `NPR ${AML_THRESHOLD_NPR.toNumber().toLocaleString()}`;
}

// ─── Immutable Audit Log ───────────────────────────────────────────────────────

/**
 * Append an immutable audit log entry.
 * This is the ONLY way the system writes to audit_log.
 * audit_log entries are NEVER updated or deleted — IRD/CBMS mandate.
 */
export async function appendAuditLog(
    action: string,
    details: string,
    user: string = 'system'
): Promise<void> {
    const db = await getDb();
    await db.audit_log.insert({
        id: safeUUID(),
        timestamp: new Date().toISOString(),
        action,
        details,
        user,
    });
}

/**
 * Get all audit entries between two ISO date strings.
 * Useful for IRD/CBMS compliance reporting and inspector access.
 *
 * @param from  ISO date string (inclusive), e.g. '2026-01-01'
 * @param to    ISO date string (inclusive), e.g. '2026-03-31'
 */
export async function getAuditTrail(from: string, to: string): Promise<AuditEntry[]> {
    const db = await getDb();
    const fromFull = from + 'T00:00:00.000Z';
    const toFull = to + 'T23:59:59.999Z';

    const docs = await db.audit_log.find().exec();
    return docs
        .map((d: any) => d.toJSON() as AuditEntry)
        .filter((e: AuditEntry) => e.timestamp >= fromFull && e.timestamp <= toFull)
        .sort((a: AuditEntry, b: AuditEntry) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
}

/**
 * Get all AML-flagged invoices for compliance review.
 */
export async function getAmlFlaggedInvoices(): Promise<any[]> {
    const db = await getDb();
    const docs = await db.invoices
        .find({ selector: { aml_flagged: true } })
        .exec();
    return docs
        .map((d: any) => d.toJSON())
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Export audit trail as a downloadable JSON file for IRD submission.
 */
export function downloadAuditTrail(entries: AuditEntry[], filename?: string): void {
    const blob = new Blob(
        [JSON.stringify(entries, null, 2)],
        { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ?? `audit_trail_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
