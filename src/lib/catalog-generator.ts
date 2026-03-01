/**
 * Catalog Generator — Walsong JwelFlow
 *
 * Builds a digital jewelry catalog from live inventory data.
 * Can output:
 *   - JSON object (for WhatsApp Catalog API)
 *   - Markdown string (for sharing via WhatsApp text message)
 *   - HTML snippet (for embedding in printed flyers)
 *
 * Catalog entries include name, category, gold type, weight in Tola/Grams,
 * and dynamically computed sale price from the most recent live rate.
 */

import Decimal from 'decimal.js';
import { GRAMS_PER_TOLA } from './jewelry-math';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogItem {
    id: string;
    name: string;
    category: string;
    weight_tola: string;
    weight_grams: string;
    karat?: string;
    sale_price_npr: number;
    has_rfid: boolean;
}

export interface DigitalCatalog {
    generated_at: string;
    shop_name: string;
    gold_rate_per_tola: number;
    silver_rate_per_tola: number;
    total_items: number;
    items: CatalogItem[];
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

/**
 * Generate a full digital catalog from the current inventory and live rates.
 */
export async function generateCatalog(params: {
    shop_name: string;
    gold_rate_per_tola: number;
    silver_rate_per_tola: number;
}): Promise<DigitalCatalog> {
    const { getDb } = await import('./db');
    const db = await getDb();
    const inventoryDocs = await db.inventory.find().exec();

    const items: CatalogItem[] = inventoryDocs.map((doc: any) => {
        const item = doc.toJSON();
        const grams = new Decimal(item.net_weight_grams ?? 0);
        const tola = grams.div(GRAMS_PER_TOLA);
        const isGold = !item.category?.toLowerCase().includes('silver');
        const rate = isGold ? params.gold_rate_per_tola : params.silver_rate_per_tola;
        const salePrice = item.sale_price
            ? item.sale_price
            : tola.mul(rate).plus(item.jyala ?? 0).toDecimalPlaces(0).toNumber();

        return {
            id: item.id,
            name: item.name,
            category: item.category ?? 'Uncategorized',
            weight_tola: tola.toFixed(3),
            weight_grams: grams.toFixed(3),
            sale_price_npr: salePrice,
            has_rfid: !!item.rfid_tag,
        };
    });

    return {
        generated_at: new Date().toISOString(),
        shop_name: params.shop_name,
        gold_rate_per_tola: params.gold_rate_per_tola,
        silver_rate_per_tola: params.silver_rate_per_tola,
        total_items: items.length,
        items,
    };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

/**
 * Format catalog as a WhatsApp-ready text message (uses Unicode for formatting).
 */
export function catalogToWhatsAppText(catalog: DigitalCatalog): string {
    const lines: string[] = [
        `🏪 *${catalog.shop_name}* — गहना मूल्य सूची`,
        `📅 ${new Date(catalog.generated_at).toLocaleDateString('ne-NP')}`,
        `📊 सुन: रू ${catalog.gold_rate_per_tola.toLocaleString()}/तोला  |  चाँदी: रू ${catalog.silver_rate_per_tola.toLocaleString()}/तोला`,
        ``,
    ];

    // Group by category
    const grouped = new Map<string, CatalogItem[]>();
    for (const item of catalog.items) {
        if (!grouped.has(item.category)) grouped.set(item.category, []);
        grouped.get(item.category)!.push(item);
    }

    for (const [category, items] of grouped.entries()) {
        lines.push(`*${category.toUpperCase()}*`);
        for (const item of items) {
            lines.push(
                `  • ${item.name}  —  ${item.weight_tola}T (${item.weight_grams}g)  —  रू ${item.sale_price_npr.toLocaleString()}`
            );
        }
        lines.push('');
    }

    lines.push('_सम्पर्क गर्नुहोस् वा पसलमा आउनुहोस् ।_');
    return lines.join('\n');
}

/**
 * Export catalog as downloadable JSON file (for WhatsApp Product Catalog API).
 */
export function downloadCatalogJson(catalog: DigitalCatalog, filename = 'catalog.json'): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Export catalog as a simple HTML price list (for printing or sharing).
 */
export function catalogToHtml(catalog: DigitalCatalog): string {
    const rows = catalog.items.map(i =>
        `<tr>
            <td>${i.name}</td>
            <td>${i.category}</td>
            <td style="text-align:center">${i.weight_tola}T</td>
            <td style="text-align:right">रू ${i.sale_price_npr.toLocaleString()}</td>
        </tr>`
    ).join('\n');

    return `<!DOCTYPE html>
<html lang="ne">
<head>
  <meta charset="UTF-8">
  <title>${catalog.shop_name} — मूल्य सूची</title>
  <style>
    body { font-family: sans-serif; padding: 24px; }
    h1 { color: #D4AF37; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; font-size: 13px; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>${catalog.shop_name}</h1>
  <p>मिति: ${new Date(catalog.generated_at).toLocaleDateString('ne-NP')}</p>
  <p>सुन दर: रू ${catalog.gold_rate_per_tola.toLocaleString()}/तोला | चाँदी: रू ${catalog.silver_rate_per_tola.toLocaleString()}/तोला</p>
  <table>
    <thead><tr><th>सामान</th><th>कोटी</th><th>तौल</th><th>मूल्य</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}
