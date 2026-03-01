/**
 * WhatsApp Business API Layer — Walsong JwelFlow
 *
 * Uses the WhatsApp Cloud API (Meta) to send:
 *   - Dhito (pawn) payment reminders
 *   - Karigar job status notifications
 *   - Gold Chit maturity alerts
 *   - Custom jewelry order repair updates
 *
 * Setup required:
 *   1. Set NEXT_PUBLIC_WA_PHONE_NUMBER_ID in .env.local
 *   2. Set WA_ACCESS_TOKEN in .env.local  (keep server-side only)
 *   3. Set WA_WEBHOOK_VERIFY_TOKEN in .env.local
 *
 * Uses the /messages endpoint of WhatsApp Cloud API v19.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WaMessageResult {
    success: boolean;
    message_id?: string;
    error?: string;
}

export type WaTemplateType =
    | 'dhito_reminder'
    | 'karigar_job_ready'
    | 'chit_maturity'
    | 'repair_ready'
    | 'invoice_receipt';

// Internal API base — sends from the server-side Next.js route to meta
const WA_API_BASE = 'https://graph.facebook.com/v19.0';

// ─── Core Send Function ────────────────────────────────────────────────────────

/**
 * Low-level function to POST to the WhatsApp Cloud API /messages endpoint.
 * Always call via the Next.js server-side API route to keep token secret.
 */
async function sendWhatsAppMessage(payload: object): Promise<WaMessageResult> {
    const phoneNumberId = process.env.NEXT_PUBLIC_WA_PHONE_NUMBER_ID;
    const accessToken = process.env.WA_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        return { success: false, error: 'WA_ACCESS_TOKEN or WA_PHONE_NUMBER_ID not configured' };
    }

    try {
        const res = await fetch(`${WA_API_BASE}/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
            return { success: false, error: json?.error?.message ?? `HTTP ${res.status}` };
        }

        return { success: true, message_id: json?.messages?.[0]?.id };
    } catch (err: any) {
        return { success: false, error: err?.message ?? 'Network error' };
    }
}

// ─── Template Builders ────────────────────────────────────────────────────────

/**
 * Dhito Reminder — "Your Dhito (pledge) is due in X days."
 *
 * Expected WA template name: `jwelflow_dhito_reminder`
 * Template language: ne (Nepali) + en (English)
 */
export async function sendDhitoReminder(params: {
    to: string;           // phone in E.164 format e.g. "+9779841234567"
    customer_name: string;
    item_description: string;
    due_date: string;     // Formatted date string
    loan_amount: number;
    shop_name: string;
}): Promise<WaMessageResult> {
    const payload = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'template',
        template: {
            name: 'jwelflow_dhito_reminder',
            language: { code: 'ne' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: params.customer_name },
                        { type: 'text', text: params.item_description },
                        { type: 'text', text: params.due_date },
                        { type: 'text', text: `रू ${params.loan_amount.toLocaleString()}` },
                        { type: 'text', text: params.shop_name },
                    ],
                },
            ],
        },
    };
    return sendWhatsAppMessage(payload);
}

/**
 * Karigar Job Ready — "Your jewelry order is ready for pickup."
 *
 * Expected WA template name: `jwelflow_job_ready`
 */
export async function sendKarigarJobReady(params: {
    to: string;
    customer_name: string;
    item_description: string;
    shop_name: string;
    shop_phone: string;
}): Promise<WaMessageResult> {
    const payload = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'template',
        template: {
            name: 'jwelflow_job_ready',
            language: { code: 'ne' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: params.customer_name },
                        { type: 'text', text: params.item_description },
                        { type: 'text', text: params.shop_name },
                        { type: 'text', text: params.shop_phone },
                    ],
                },
            ],
        },
    };
    return sendWhatsAppMessage(payload);
}

/**
 * Gold Chit Maturity Alert — "Your Gold Chit scheme has matured."
 *
 * Expected WA template name: `jwelflow_chit_maturity`
 */
export async function sendChitMaturityAlert(params: {
    to: string;
    customer_name: string;
    total_gold_grams: number;
    total_gold_tola: number;
    total_paid_npr: number;
    shop_name: string;
}): Promise<WaMessageResult> {
    const payload = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'template',
        template: {
            name: 'jwelflow_chit_maturity',
            language: { code: 'ne' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: params.customer_name },
                        { type: 'text', text: `${params.total_gold_grams.toFixed(3)}g (${params.total_gold_tola.toFixed(3)} Tola)` },
                        { type: 'text', text: `रू ${params.total_paid_npr.toLocaleString()}` },
                        { type: 'text', text: params.shop_name },
                    ],
                },
            ],
        },
    };
    return sendWhatsAppMessage(payload);
}

/**
 * Invoice Receipt — "Thank you for your purchase." with amount.
 * Uses a free-form text message (no template needed for first 24h window).
 */
export async function sendInvoiceReceipt(params: {
    to: string;
    customer_name: string;
    invoice_id: string;
    grand_total: number;
    items_summary: string;
    shop_name: string;
}): Promise<WaMessageResult> {
    const text =
        `*${params.shop_name}* — धन्यवाद, ${params.customer_name}!\n\n` +
        `🧾 *बिल नम्बर:* ${params.invoice_id}\n` +
        `🛍 *सामान:* ${params.items_summary}\n` +
        `💰 *जम्मा:* रू ${params.grand_total.toLocaleString()}\n\n` +
        `_तपाईंको किनमेलको लागि हार्दिक धन्यवाद! पुनः स्वागत छ।_`;

    const payload = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'text',
        text: { body: text },
    };
    return sendWhatsAppMessage(payload);
}

// ─── Batch Dispatch Helper ─────────────────────────────────────────────────────

/**
 * Send Dhito reminders to all active Dhito customers whose due date
 * falls within the next `daysAhead` days.
 * Call this from a scheduled job or manually from Settings.
 */
export async function dispatchAllDhitoReminders(daysAhead = 7): Promise<{
    sent: number;
    failed: number;
}> {
    // Dynamic import to avoid DB in non-client environments
    const { getDb } = await import('./db');
    const db = await getDb();

    const allDhitos = await db.dhito.find({ selector: { status: 'active' } }).exec();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    let sent = 0, failed = 0;

    for (const doc of allDhitos) {
        const d = doc.toJSON();
        if (!d.customer_phone) continue;
        // Simulate a "due date" from date_pawned + 90 days (typical dhito period)
        const dueDate = new Date(d.date_pawned);
        dueDate.setDate(dueDate.getDate() + 90);
        if (dueDate > cutoff) continue;

        const result = await sendDhitoReminder({
            to: d.customer_phone,
            customer_name: d.customer_name,
            item_description: d.item_description,
            due_date: dueDate.toLocaleDateString('ne-NP'),
            loan_amount: d.loan_amount,
            shop_name: 'Walsong JwelFlow',
        });

        if (result.success) sent++; else failed++;
    }

    return { sent, failed };
}
