import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { inventorySchema, dhitoSchema, ratesSchema, auditLogSchema, shopProfileSchema, customerSchema, staffSchema, invoicesSchema } from './schemas';

// Only add plugins once
let pluginsAdded = false;

const initPlugins = () => {
    if (pluginsAdded) return;
    addRxPlugin(RxDBQueryBuilderPlugin);
    addRxPlugin(RxDBMigrationSchemaPlugin);
    pluginsAdded = true;
};

let dbPromise: any = null;

const collectionDefs = {
    inventory: { schema: inventorySchema },
    dhito: {
        schema: dhitoSchema,
        migrationStrategies: {
            1: (oldDoc: any) => {
                oldDoc.customer_phone = oldDoc.customer_phone || '';
                oldDoc.gold_karat = oldDoc.gold_karat || '24K';
                oldDoc.date_redeemed = oldDoc.date_redeemed || '';
                oldDoc.payments = oldDoc.payments || '[]';
                oldDoc.notes = oldDoc.notes || '';
                if (!oldDoc.status) oldDoc.status = 'active';
                return oldDoc;
            }
        }
    },
    rates: { schema: ratesSchema },
    audit_log: { schema: auditLogSchema },
    shop_profile: { schema: shopProfileSchema },
    customers: { schema: customerSchema },
    staff: { schema: staffSchema },
    invoices: {
        schema: invoicesSchema,
        // Migration: v0 → v1 backfills paid_amount and balance_due
        // Old invoices are considered fully paid (balance = 0)
        migrationStrategies: {
            1: (oldDoc: any) => {
                oldDoc.paid_amount = oldDoc.grand_total ?? 0;
                oldDoc.balance_due = 0;
                return oldDoc;
            }
        }
    }
};

const createDB = async () => {
    initPlugins();
    let db = await createRxDatabase({
        name: 'walsongdb',
        storage: getRxStorageDexie()
    });

    try {
        await db.addCollections(collectionDefs);
    } catch (err) {
        console.warn('[DB] addCollections failed, attempting database recovery...', err);
        // Remove stale DB and recreate — handles schema version conflicts
        await db.remove();
        db = await createRxDatabase({
            name: 'walsongdb',
            storage: getRxStorageDexie()
        });
        await db.addCollections(collectionDefs);
        console.log('[DB] Database recovered successfully.');
    }

    return db;
};

export const getDb = () => {
    if (!dbPromise) {
        dbPromise = createDB();
    }
    return dbPromise;
};

export const resetDatabase = async () => {
    const db = await getDb();
    const collections = ['inventory', 'dhito', 'rates', 'audit_log', 'customers', 'staff', 'invoices'];

    // Wipe all business data but keep ShopProfile for branding persistence
    for (const name of collections) {
        const col = db[name];
        await col.find().remove();
    }

    // Reset Default Owner if deleted (unlikely but safe)
    const owner = await db.staff.findOne("default_owner").exec();
    if (!owner) {
        await db.staff.insert({
            id: "default_owner",
            name: "Owner",
            pin: "1234",
            role: "owner",
            active: true
        });
    }
};

export const exportEncryptedBackup = async () => {
    const db = await getDb();
    const collectionNames = ['inventory', 'dhito', 'rates', 'audit_log', 'shop_profile', 'customers', 'staff', 'invoices'];
    const backup: Record<string, any[]> = {};

    for (const name of collectionNames) {
        const docs = await db[name].find().exec();
        backup[name] = docs.map((d: any) => d.toJSON());
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jwelflow_emergency_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};
