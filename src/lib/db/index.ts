import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { inventorySchema, dhitoSchema, ratesSchema, auditLogSchema } from './schemas';

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
        audit_log: { schema: auditLogSchema }
    });

    return db;
};

export const getDb = () => {
    if (!dbPromise) {
        dbPromise = createDB();
    }
    return dbPromise;
};
