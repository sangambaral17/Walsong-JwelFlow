import { RxJsonSchema } from 'rxdb';

export const inventorySchema: RxJsonSchema<any> = {
    title: 'inventory schema',
    version: 1,
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
        // v1 additions
        sale_price: { type: 'number' },    // dynamically updated by Live Rate Sync
        rfid_tag: { type: 'string' },      // RFID UUID for bulk-scan audit
    },
    required: ['id', 'name', 'category', 'net_weight_grams', 'created_at']
};

export const dhitoSchema: RxJsonSchema<any> = {
    title: 'dhito schema',
    version: 1,
    description: 'describes a pawned item (dhito)',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        customer_name: { type: 'string' },
        customer_phone: { type: 'string' },
        item_description: { type: 'string' },
        gold_karat: { type: 'string' },          // "24K", "22K", "18K", "Silver"
        weight_grams: { type: 'number' },
        loan_amount: { type: 'number' },
        interest_rate: { type: 'number' },
        date_pawned: { type: 'string' },
        date_redeemed: { type: 'string' },
        status: { type: 'string' },               // "active" | "redeemed" | "forfeited"
        payments: { type: 'string' },              // JSON stringified PaymentEntry[]
        notes: { type: 'string' },
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
        invoice_footer: { type: 'string' },
        premium_gold: { type: 'number' },
        premium_silver: { type: 'number' }
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

export const invoicesSchema: RxJsonSchema<any> = {
    title: 'invoices schema',
    version: 2,
    description: 'completed sale invoices with full detail',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        date: { type: 'string' },
        customer_name: { type: 'string' },
        customer_phone: { type: 'string' },
        customer_address: { type: 'string' },
        items: { type: 'string' }, // JSON stringified CartItem[]
        subtotal: { type: 'number' },
        vat_amount: { type: 'number' },
        grand_total: { type: 'number' },
        paid_amount: { type: 'number' },
        balance_due: { type: 'number' },
        cashier: { type: 'string' },
        payment_method: { type: 'string' }, // 'cash', 'bank', 'credit'
        notes: { type: 'string' },
        // v2: AML / KYC compliance fields (IRD mandate)
        aml_flagged: { type: 'boolean' },       // true if grand_total >= NPR 1,000,000
        kyc_name: { type: 'string' },
        kyc_id_type: { type: 'string' },        // 'citizenship', 'passport', 'license', 'voter'
        kyc_id_number: { type: 'string' },
        kyc_address: { type: 'string' },
    },
    required: ['id', 'date', 'grand_total', 'cashier']
};

// ─── Karigar (Craftsman) ──────────────────────────────────────────────────────

export const karigarSchema: RxJsonSchema<any> = {
    title: 'karigar schema',
    version: 0,
    description: 'craftsman / karigar master record',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        phone: { type: 'string' },
        specialty: { type: 'string' },  // e.g., 'Necklace', 'Ring', 'General'
        active: { type: 'boolean' },
        created_at: { type: 'string' },
    },
    required: ['id', 'name', 'created_at']
};

export const karigarJobSchema: RxJsonSchema<any> = {
    title: 'karigar job schema',
    version: 0,
    description: 'tracks raw-out / finished-in cycles per karigar',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        karigar_id: { type: 'string' },
        karigar_name: { type: 'string' },
        item_description: { type: 'string' },
        // Raw-Out (gold sent to karigar)
        raw_out_weight_grams: { type: 'number' },
        raw_out_date: { type: 'string' },
        raw_out_karat: { type: 'string' },
        // Finished-In (jewelry received back)
        finished_weight_grams: { type: 'number' },   // actual jewelry weight
        jarti_grams: { type: 'number' },             // Jarti (wastage weight in grams)
        stone_weight_grams: { type: 'number' },      // stone / other additions
        finished_date: { type: 'string' },
        wastage_percent: { type: 'number' },         // agreed wastage %
        // Computed
        net_weight_grams: { type: 'number' },        // finished + jarti + stone
        actual_wastage_grams: { type: 'number' },    // finished × wastagePercent / 100
        status: { type: 'string' },                  // 'pending' | 'finished' | 'disputed'
        notes: { type: 'string' },
    },
    required: ['id', 'karigar_id', 'item_description', 'raw_out_weight_grams', 'raw_out_date', 'status']
};

// ─── Gold Chit Scheme ─────────────────────────────────────────────────────────

export const chitSchemeSchema: RxJsonSchema<any> = {
    title: 'chit scheme schema',
    version: 0,
    description: 'monthly gold savings chit scheme',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        customer_name: { type: 'string' },
        customer_phone: { type: 'string' },
        monthly_amount_npr: { type: 'number' },
        total_months: { type: 'number' },
        start_date: { type: 'string' },
        status: { type: 'string' },  // 'active' | 'matured' | 'cancelled'
        notes: { type: 'string' },
    },
    required: ['id', 'customer_name', 'monthly_amount_npr', 'total_months', 'start_date', 'status']
};

export const chitInstallmentSchema: RxJsonSchema<any> = {
    title: 'chit installment schema',
    version: 0,
    description: 'individual installment payment for a chit scheme',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        scheme_id: { type: 'string' },
        installment_number: { type: 'number' },
        payment_date: { type: 'string' },
        amount_npr: { type: 'number' },
        gold_rate_on_day: { type: 'number' },      // NPR per tola on payment date
        gold_weight_grams: { type: 'number' },     // NPR converted to gold at day's rate
        notes: { type: 'string' },
    },
    required: ['id', 'scheme_id', 'installment_number', 'payment_date', 'amount_npr', 'gold_rate_on_day']
};
