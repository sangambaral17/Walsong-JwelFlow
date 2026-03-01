/**
 * RFID & Audit Engine — Walsong JwelFlow
 *
 * Handles:
 *  1. Tag assignment  — pairing RFID UUIDs to inventory items
 *  2. Bulk scan audit — detecting discrepancies between physical scan and DB
 *  3. Tamper detection — flagging tags scanned without a matching inventory record
 *
 * RFID tags are stored as `rfid_tag` strings on inventory documents (inventorySchema v1).
 * All tag formats accepted: EPC Gen2 UUID, simple hex strings, or any unique string.
 */

import { getDb } from './db';
import { safeUUID } from './utils/safe-uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RfidScanResult {
    tag: string;
    item_id: string | null;
    item_name: string | null;
    category: string | null;
    status: 'matched' | 'unmatched' | 'untagged';
}

export interface AuditReport {
    scanned_at: string;
    total_scanned: number;
    matched: number;
    unmatched: number;         // tag scanned but no DB record — possible theft / ghost tag
    db_items_not_scanned: number; // DB item with tag but NOT scanned — possible missing item
    scan_results: RfidScanResult[];
    missing_items: MissingItem[];
    summary_line: string;
}

export interface MissingItem {
    item_id: string;
    item_name: string;
    category: string;
    rfid_tag: string;
    net_weight_grams: number;
}

export interface TagAssignment {
    item_id: string;
    rfid_tag: string;
}

// ─── Tag Assignment ────────────────────────────────────────────────────────────

/**
 * Assign an RFID tag UUID to an inventory item.
 * Replaces any existing tag on that item.
 */
export async function assignRfidTag({ item_id, rfid_tag }: TagAssignment): Promise<void> {
    const db = await getDb();
    const doc = await db.inventory.findOne(item_id).exec();
    if (!doc) throw new Error(`Inventory item ${item_id} not found`);

    await doc.patch({ rfid_tag: rfid_tag.trim() });

    await db.audit_log.insert({
        id: safeUUID(),
        timestamp: new Date().toISOString(),
        action: 'RFID_ASSIGN',
        details: `Tag ${rfid_tag} assigned to item "${doc.toJSON().name}" (${item_id})`,
        user: 'staff',
    });
}

/**
 * Remove the RFID tag from an inventory item (e.g. when item is sold).
 */
export async function removeRfidTag(item_id: string): Promise<void> {
    const db = await getDb();
    const doc = await db.inventory.findOne(item_id).exec();
    if (!doc) return;
    await doc.patch({ rfid_tag: '' });
}

/**
 * Get the inventory item associated with a tag UUID, or null if unrecognised.
 */
export async function lookupTag(rfid_tag: string): Promise<RfidScanResult> {
    const db = await getDb();
    const docs = await db.inventory.find({ selector: { rfid_tag } }).exec();
    if (docs.length === 0) {
        return { tag: rfid_tag, item_id: null, item_name: null, category: null, status: 'unmatched' };
    }
    const item = docs[0].toJSON();
    return {
        tag: rfid_tag,
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        status: 'matched',
    };
}

// ─── Bulk Scan Audit ──────────────────────────────────────────────────────────

/**
 * Perform a full stock audit by comparing a list of scanned RFID tags
 * against the database inventory.
 *
 * @param scannedTags  Array of raw tag strings from the RFID reader
 * @param user         Staff member performing the audit
 */
export async function runBulkScanAudit(
    scannedTags: string[],
    user: string = 'staff'
): Promise<AuditReport> {
    const db = await getDb();
    const allInventory = await db.inventory.find().exec();

    // Build a lookup: rfid_tag → inventory item
    const tagToItem = new Map<string, any>();
    const taggedItemIds = new Set<string>();

    for (const doc of allInventory) {
        const item = doc.toJSON();
        if (item.rfid_tag) {
            tagToItem.set(item.rfid_tag, item);
            taggedItemIds.add(item.id);
        }
    }

    // All unique scanned tags
    const uniqueScanned = [...new Set(scannedTags.map(t => t.trim()).filter(Boolean))];

    // Evaluate each scanned tag
    const scanResults: RfidScanResult[] = uniqueScanned.map(tag => {
        const item = tagToItem.get(tag);
        return item
            ? { tag, item_id: item.id, item_name: item.name, category: item.category, status: 'matched' as const }
            : { tag, item_id: null, item_name: null, category: null, status: 'unmatched' as const };
    });

    // Find DB items with tags that were NOT in the scan (potentially missing)
    const scannedSet = new Set(uniqueScanned);
    const missingItems: MissingItem[] = [];

    for (const [tag, item] of tagToItem.entries()) {
        if (!scannedSet.has(tag)) {
            missingItems.push({
                item_id: item.id,
                item_name: item.name,
                category: item.category,
                rfid_tag: tag,
                net_weight_grams: item.net_weight_grams ?? 0,
            });
        }
    }

    const matched = scanResults.filter(r => r.status === 'matched').length;
    const unmatched = scanResults.filter(r => r.status === 'unmatched').length;

    const report: AuditReport = {
        scanned_at: new Date().toISOString(),
        total_scanned: uniqueScanned.length,
        matched,
        unmatched,
        db_items_not_scanned: missingItems.length,
        scan_results: scanResults,
        missing_items: missingItems,
        summary_line: `${matched} मेल | ${unmatched} अज्ञात ट्याग | ${missingItems.length} हराएका`,
    };

    // Persist audit log
    await db.audit_log.insert({
        id: safeUUID(),
        timestamp: report.scanned_at,
        action: 'RFID_AUDIT',
        details: JSON.stringify({
            total: uniqueScanned.length,
            matched,
            unmatched,
            missing: missingItems.length,
        }),
        user,
    });

    return report;
}

// ─── Inventory Tag Overview ────────────────────────────────────────────────────

export interface InventoryTagStatus {
    item_id: string;
    item_name: string;
    category: string;
    net_weight_grams: number;
    rfid_tag: string | null;
    tagged: boolean;
}

/**
 * List all inventory items with their tag status.
 * Useful for the tag-assignment UI.
 */
export async function getInventoryTagOverview(): Promise<InventoryTagStatus[]> {
    const db = await getDb();
    const docs = await db.inventory.find().exec();
    return docs.map((d: any) => {
        const item = d.toJSON();
        return {
            item_id: item.id,
            item_name: item.name,
            category: item.category,
            net_weight_grams: item.net_weight_grams ?? 0,
            rfid_tag: item.rfid_tag || null,
            tagged: !!item.rfid_tag,
        };
    });
}

/**
 * Count of tagged vs untagged items.
 */
export async function getTaggingStats(): Promise<{ total: number; tagged: number; untagged: number }> {
    const items = await getInventoryTagOverview();
    const tagged = items.filter(i => i.tagged).length;
    return { total: items.length, tagged, untagged: items.length - tagged };
}
