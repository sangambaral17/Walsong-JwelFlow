/**
 * API Route: /api/rates
 * 
 * Server-side proxy to fetch live rates from FENEGOSIDA.
 * Works in Next.js dev mode (npm run dev) — no CORS issues.
 * In Tauri/static export mode, the Tauri Rust backend handles this.
 *
 * Actual HTML structure from fenegosida.org:
 *   <div class="rate-gold post">
 *     <p>FINE GOLD (9999)<br><span>per 1 tola<br><br>रु</span> <b>314900</b></p>
 *   </div>
 *   <div class="rate-gold post">
 *     <p>TEJABI GOLD<br><span>per 1 tola<br><br>रु</span> <b>0</b></p>
 *   </div>
 *   <div class="rate-silver post">
 *     <p>SILVER<br><span>per 1 tola<br><br>रु</span> <b>5740</b></p>
 *   </div>
 */
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const response = await fetch("https://fenegosida.org/", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
        });

        if (!response.ok) {
            return Response.json({ error: `Site returned ${response.status}` }, { status: 502 });
        }

        const html = await response.text();

        // The rates appear TWICE in HTML: once for "per 10 grm", once for "per 1 tola"
        // We need the "per 1 tola" values.
        //
        // HTML structure: LABEL<br><span>per 1 tola<br><br>रु</span> <b>NUMBER</b>
        // So regex must handle HTML tags between "per 1 tola" and the number.

        const parseNum = (match: RegExpMatchArray | null) =>
            match ? parseFloat(match[1].replace(/,/g, "")) : 0;

        // Match: "FINE GOLD" ... "per 1 tola" ... <b>NUMBER</b>
        // The [\s\S]*? allows crossing HTML tags
        const goldMatch = html.match(/FINE\s*GOLD[\s\S]*?per\s*1\s*tola[\s\S]*?<b>\s*(\d[\d,]*)\s*<\/b>/i);
        const tejabiMatch = html.match(/TEJABI\s*GOLD[\s\S]*?per\s*1\s*tola[\s\S]*?<b>\s*(\d[\d,]*)\s*<\/b>/i);

        // For SILVER: anchor tightly to "SILVER<br><span>per 1 tola" to avoid
        // crossing from the per-10-grm SILVER past GOLD's per-1-tola entries
        const silverMatch = html.match(/SILVER\s*<br[\s/]*>\s*<span[^>]*>\s*per\s*1\s*tola[\s\S]*?<b>\s*(\d[\d,]*)\s*<\/b>/i);

        const hallmark_gold = parseNum(goldMatch);
        const tejabi_gold = parseNum(tejabiMatch);
        const silver = parseNum(silverMatch);

        if (hallmark_gold === 0 && silver === 0) {
            return Response.json({
                error: "Could not parse rates",
                htmlLength: html.length,
            }, { status: 502 });
        }

        return Response.json({
            hallmark_gold,
            tejabi_gold: tejabi_gold > 0 ? tejabi_gold : hallmark_gold,
            silver,
            source: "FENEGOSIDA (API)",
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        return Response.json({ error: err?.message || "Fetch failed" }, { status: 500 });
    }
}
