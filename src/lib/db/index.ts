import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { inventorySchema, dhitoSchema, ratesSchema, auditLogSchema, shopProfileSchema, customerSchema, staffSchema } from './schemas';

// Only add plugins once
let pluginsAdded = false;

const initPlugins = () => {
    if (pluginsAdded) return;
    addRxPlugin(RxDBQueryBuilderPlugin);
    pluginsAdded = true;
};

let dbPromise: any = null;

const createDB = async () => {
    initPlugins();
    const db = await createRxDatabase({
        name: 'walsongdb',
        storage: getRxStorageDexie()
    });

    await db.addCollections({
        inventory: { schema: inventorySchema },
        dhito: { schema: dhitoSchema },
        rates: { schema: ratesSchema },
        audit_log: { schema: auditLogSchema },
        shop_profile: { schema: shopProfileSchema },
        customers: { schema: customerSchema },
        staff: { schema: staffSchema }
    });

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
    const collections = ['inventory', 'dhito', 'rates', 'audit_log', 'customers', 'staff'];

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
    const data = await db.exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jwelflow_emergency_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};
