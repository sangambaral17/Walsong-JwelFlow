/**
 * Karigar Management Engine — Walsong JwelFlow
 *
 * Tracks the Raw-Out / Finished-In life-cycle for each karigar (craftsman).
 * All weight calculations use Decimal.js for floating-point safety.
 *
 * Key formulas (per user specification):
 *   WastageWeight  = ActualJewelryWeight × (WastagePercentage / 100)
 *   NetWeight      = FinishedWeight + Jarti + StoneWeight
 *   RawBalance     = Σ raw_out_weight − Σ finished_weight  (per karigar)
 */

import Decimal from 'decimal.js';
import { getDb } from './db';
import { safeUUID } from './utils/safe-uuid';
import { GRAMS_PER_TOLA } from './jewelry-math';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Karigar {
    id: string;
    name: string;
    phone: string;
    specialty: string;
    active: boolean;
    created_at: string;
}

export interface KarigarJob {
    id: string;
    karigar_id: string;
    karigar_name: string;
    item_description: string;
    // Raw-Out
    raw_out_weight_grams: number;
    raw_out_date: string;
    raw_out_karat: string;
    // Finished-In (may be 0 while job is still pending)
    finished_weight_grams: number;
    jarti_grams: number;
    stone_weight_grams: number;
    finished_date: string;
    wastage_percent: number;
    // Computed
    net_weight_grams: number;
    actual_wastage_grams: number;
    status: 'pending' | 'finished' | 'disputed';
    notes: string;
}

// ─── Pure Calculation Functions ───────────────────────────────────────────────

/**
 * WastageWeight = ActualJewelryWeight (grams) × WastagePercentage / 100
 */
export function calcWastageWeight(
    finishedGrams: number | Decimal,
    wastagePercent: number | Decimal
): Decimal {
    const w = new Decimal(finishedGrams);
    const p = new Decimal(wastagePercent);
    return w.mul(p).div(100).toDecimalPlaces(4);
}

/**
 * NetWeight = FinishedWeight + Jarti + StoneWeight
 */
export function calcNetWeight(
    finishedGrams: number | Decimal,
    jartiGrams: number | Decimal,
    stoneGrams: number | Decimal
): Decimal {
    return new Decimal(finishedGrams)
        .plus(new Decimal(jartiGrams))
        .plus(new Decimal(stoneGrams))
        .toDecimalPlaces(4);
}

/**
 * Gold loss = RawOut − Net (i.e., unaccounted weight)
 */
export function calcGoldLoss(
    rawOutGrams: number | Decimal,
    netWeightGrams: number | Decimal
): Decimal {
    return new Decimal(rawOutGrams)
        .minus(new Decimal(netWeightGrams))
        .toDecimalPlaces(4);
}

/**
 * Convert grams to Tola string display
 */
export function gramsToTolaDisplay(grams: number | Decimal): string {
    const tola = new Decimal(grams).div(GRAMS_PER_TOLA).toDecimalPlaces(3);
    return `${tola.toFixed(3)}T`;
}

// ─── DB Operations ────────────────────────────────────────────────────────────

/**
 * Create a new Karigar master record.
 */
export async function addKarigar(data: {
    name: string;
    phone?: string;
    specialty?: string;
}): Promise<Karigar> {
    const db = await getDb();
    const doc: Karigar = {
        id: safeUUID(),
        name: data.name.trim(),
        phone: data.phone?.trim() || '',
        specialty: data.specialty?.trim() || 'General',
        active: true,
        created_at: new Date().toISOString(),
    };
    await db.karigar.insert(doc);
    await db.audit_log.insert({
        id: safeUUID(),
        timestamp: new Date().toISOString(),
        action: 'KARIGAR_ADD',
        details: `Karigar added: ${doc.name} (${doc.specialty})`,
        user: 'staff',
    });
    return doc;
}

/**
 * Dispatch gold to karigar — "Raw Out" transaction.
 */
export async function createRawOutJob(data: {
    karigar_id: string;
    karigar_name: string;
    item_description: string;
    raw_out_weight_grams: number;
    raw_out_karat: string;
    wastage_percent: number;
    notes?: string;
}): Promise<KarigarJob> {
    const db = await getDb();
    const job: KarigarJob = {
        id: safeUUID(),
        karigar_id: data.karigar_id,
        karigar_name: data.karigar_name,
        item_description: data.item_description,
        raw_out_weight_grams: data.raw_out_weight_grams,
        raw_out_date: new Date().toISOString(),
        raw_out_karat: data.raw_out_karat,
        // These are filled later when job is received back
        finished_weight_grams: 0,
        jarti_grams: 0,
        stone_weight_grams: 0,
        finished_date: '',
        wastage_percent: data.wastage_percent,
        net_weight_grams: 0,
        actual_wastage_grams: 0,
        status: 'pending',
        notes: data.notes || '',
    };
    await db.karigar_jobs.insert(job);
    await db.audit_log.insert({
        id: safeUUID(),
        timestamp: new Date().toISOString(),
        action: 'KARIGAR_RAW_OUT',
        details: `Raw Out: ${data.item_description} — ${data.raw_out_weight_grams.toFixed(3)}g to ${data.karigar_name} (${data.raw_out_karat})`,
        user: 'staff',
    });
    return job;
}

/**
 * Receive finished jewelry from karigar — "Finished In" transaction.
 * Computes and persists WastageWeight and NetWeight.
 */
export async function receiveFinishedJob(
    jobId: string,
    data: {
        finished_weight_grams: number;
        jarti_grams: number;
        stone_weight_grams: number;
        status?: 'finished' | 'disputed';
        notes?: string;
    }
): Promise<{
    net_weight_grams: Decimal;
    actual_wastage_grams: Decimal;
    gold_loss_grams: Decimal;
}> {
    const db = await getDb();
    const doc = await db.karigar_jobs.findOne(jobId).exec();
    if (!doc) throw new Error(`KarigarJob ${jobId} not found.`);

    const job = doc.toJSON() as KarigarJob;
    const finished = new Decimal(data.finished_weight_grams);
    const jarti = new Decimal(data.jarti_grams);
    const stone = new Decimal(data.stone_weight_grams);

    const netWeight = calcNetWeight(finished, jarti, stone);
    const actualWastage = calcWastageWeight(finished, job.wastage_percent);
    const goldLoss = calcGoldLoss(job.raw_out_weight_grams, netWeight);

    await doc.patch({
        finished_weight_grams: data.finished_weight_grams,
        jarti_grams: data.jarti_grams,
        stone_weight_grams: data.stone_weight_grams,
        finished_date: new Date().toISOString(),
        net_weight_grams: netWeight.toNumber(),
        actual_wastage_grams: actualWastage.toNumber(),
        status: data.status || 'finished',
        notes: data.notes ?? job.notes,
    });

    await db.audit_log.insert({
        id: safeUUID(),
        timestamp: new Date().toISOString(),
        action: 'KARIGAR_FINISHED_IN',
        details: JSON.stringify({
            job_id: jobId,
            karigar: job.karigar_name,
            item: job.item_description,
            raw_out_g: job.raw_out_weight_grams,
            finished_g: data.finished_weight_grams,
            net_g: netWeight.toNumber(),
            wastage_g: actualWastage.toNumber(),
            gold_loss_g: goldLoss.toNumber(),
        }),
        user: 'staff',
    });

    return { net_weight_grams: netWeight, actual_wastage_grams: actualWastage, gold_loss_grams: goldLoss };
}

/**
 * Get the outstanding raw gold balance for a karigar
 * Balance = Σ raw_out − Σ finished (net)  [for pending + disputed jobs]
 */
export async function getRawOutBalance(karigarId: string): Promise<{
    pending_jobs: number;
    raw_out_total_grams: Decimal;
    finished_total_grams: Decimal;
    balance_grams: Decimal;
}> {
    const db = await getDb();
    const jobs = await db.karigar_jobs
        .find({ selector: { karigar_id: karigarId } })
        .exec();

    let rawTotal = new Decimal(0);
    let finishedTotal = new Decimal(0);
    let pendingCount = 0;

    for (const j of jobs) {
        const job = j.toJSON() as KarigarJob;
        rawTotal = rawTotal.plus(new Decimal(job.raw_out_weight_grams));
        if (job.status === 'finished') {
            finishedTotal = finishedTotal.plus(new Decimal(job.net_weight_grams));
        } else {
            pendingCount++;
        }
    }

    return {
        pending_jobs: pendingCount,
        raw_out_total_grams: rawTotal.toDecimalPlaces(4),
        finished_total_grams: finishedTotal.toDecimalPlaces(4),
        balance_grams: rawTotal.minus(finishedTotal).toDecimalPlaces(4),
    };
}

/**
 * Get all karigar records (active only by default).
 */
export async function listKarigars(onlyActive = true): Promise<Karigar[]> {
    const db = await getDb();
    const selector = onlyActive ? { selector: { active: true } } : {};
    const docs = await db.karigar.find(selector).exec();
    return docs.map((d: any) => d.toJSON() as Karigar);
}

/**
 * Get jobs for a specific karigar, sorted newest first.
 */
export async function getJobsForKarigar(karigarId: string): Promise<KarigarJob[]> {
    const db = await getDb();
    const docs = await db.karigar_jobs
        .find({ selector: { karigar_id: karigarId } })
        .exec();
    return docs
        .map((d: any) => d.toJSON() as KarigarJob)
        .sort((a: KarigarJob, b: KarigarJob) =>
            new Date(b.raw_out_date).getTime() - new Date(a.raw_out_date).getTime()
        );
}

/**
 * Get ALL pending jobs across all karigars.
 */
export async function getAllPendingJobs(): Promise<KarigarJob[]> {
    const db = await getDb();
    const docs = await db.karigar_jobs
        .find({ selector: { status: 'pending' } })
        .exec();
    return docs
        .map((d: any) => d.toJSON() as KarigarJob)
        .sort((a: KarigarJob, b: KarigarJob) =>
            new Date(a.raw_out_date).getTime() - new Date(b.raw_out_date).getTime()
        );
}
