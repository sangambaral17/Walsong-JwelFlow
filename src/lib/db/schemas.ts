import { RxJsonSchema } from 'rxdb';

export const inventorySchema: RxJsonSchema<any> = {
    title: 'inventory schema',
    version: 0,
    description: 'describes an inventory item',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        category: { type: 'string' },
        weight_tola: { type: 'number' },
        weight_masha: { type: 'number' },
        weight_lal: { type: 'number' },
        net_weight_grams: { type: 'number' },
        jarti: { type: 'number' },
        jyala: { type: 'number' },
        created_at: { type: 'string' },
    },
    required: ['id', 'name', 'category', 'net_weight_grams', 'created_at']
};

export const dhitoSchema: RxJsonSchema<any> = {
    title: 'dhito schema',
    version: 0,
    description: 'describes a pawned item (dhito)',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        customer_name: { type: 'string' },
        item_description: { type: 'string' },
        weight_grams: { type: 'number' },
        loan_amount: { type: 'number' },
        interest_rate: { type: 'number' },
        date_pawned: { type: 'string' },
        status: { type: 'string' }
    },
    required: ['id', 'customer_name', 'item_description', 'loan_amount', 'date_pawned']
};

export const ratesSchema: RxJsonSchema<any> = {
    title: 'rates schema',
    version: 0,
    description: 'daily rates for gold and silver',
    primaryKey: 'date',
    type: 'object',
    properties: {
        date: { type: 'string', maxLength: 100 },
        gold_tola_rate: { type: 'number' },
        silver_tola_rate: { type: 'number' }
    },
    required: ['date', 'gold_tola_rate', 'silver_tola_rate']
};

export const auditLogSchema: RxJsonSchema<any> = {
    title: 'audit log schema',
    version: 0,
    description: 'IRD compliance non-editable audit log',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        timestamp: { type: 'string' },
        action: { type: 'string' },
        details: { type: 'string' },
        user: { type: 'string' }
    },
    required: ['id', 'timestamp', 'action', 'details']
};

export const shopProfileSchema: RxJsonSchema<any> = {
    title: 'shop profile schema',
    version: 0,
    description: 'shop configuration for invoices and branding',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        shop_name: { type: 'string' },
        logo_url: { type: 'string' },
        pan_vat_number: { type: 'string' },
        address: { type: 'string' },
        phone: { type: 'string' },
        accent_color: { type: 'string' },
        invoice_footer: { type: 'string' }
    },
    required: ['id', 'shop_name', 'pan_vat_number']
};

export const customerSchema: RxJsonSchema<any> = {
    title: 'customer schema',
    version: 0,
    description: 'customer database for the shop',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' },
        notes: { type: 'string' },
        created_at: { type: 'string' }
    },
    required: ['id', 'name', 'created_at']
};

export const staffSchema: RxJsonSchema<any> = {
    title: 'staff schema',
    version: 0,
    description: 'staff accounts for role-based access control',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        pin: { type: 'string', maxLength: 10 },
        role: { type: 'string' }, // 'owner', 'manager', 'cashier'
        active: { type: 'boolean' }
    },
    required: ['id', 'name', 'pin', 'role', 'active']
};
