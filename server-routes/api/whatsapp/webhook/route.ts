/**
 * WhatsApp Business Webhook Handler
 * Route: POST /api/whatsapp/webhook
 *        GET  /api/whatsapp/webhook  (verification handshake from Meta)
 *
 * Handles:
 *  - GET: webhook verification challenge from Meta dashboard
 *  - POST: incoming message events (status updates, customer replies)
 *
 * Set the following in .env.local:
 *   WA_WEBHOOK_VERIFY_TOKEN=your-secret-token
 */
import { NextRequest } from 'next/server';

// ── GET — Meta Webhook Verification ──────────────────────────────────────────
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WA_WEBHOOK_VERIFY_TOKEN ?? 'jwelflow_walsong_secret';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[WhatsApp Webhook] Verification successful');
        return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
}

// ── POST — Incoming events from Meta ─────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // WhatsApp webhook sends an "entry" array
        const entries = body?.entry ?? [];

        for (const entry of entries) {
            for (const change of entry?.changes ?? []) {
                const value = change?.value;

                // ── Incoming message from a customer ──
                if (value?.messages) {
                    for (const msg of value.messages) {
                        const from = msg.from;        // Customer WhatsApp phone
                        const text = msg?.text?.body ?? '';

                        console.log(`[WA Inbound] From: ${from} → "${text}"`);

                        // TODO: Hook into repair status lookup, chit balance queries, etc.
                        // For now, just log to audit trail
                        const { getDb } = await import('@/lib/db');
                        const { safeUUID } = await import('@/lib/utils/safe-uuid');
                        const db = await getDb();
                        await db.audit_log.insert({
                            id: safeUUID(),
                            timestamp: new Date().toISOString(),
                            action: 'WA_INBOUND',
                            details: `From: ${from} | Message: ${text.slice(0, 200)}`,
                            user: 'whatsapp_bot',
                        });
                    }
                }

                // ── Message status updates (sent, delivered, read, failed) ──
                if (value?.statuses) {
                    for (const status of value.statuses) {
                        console.log(`[WA Status] ID: ${status.id} → ${status.status}`);
                    }
                }
            }
        }

        // Meta expects a 200 OK immediately
        return Response.json({ status: 'ok' });
    } catch (err: any) {
        console.error('[WA Webhook Error]', err);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
}
