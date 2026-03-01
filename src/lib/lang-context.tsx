"use client";

/**
 * Language Context — Walsong JwelFlow
 *
 * Standard:
 *  - EN: 100% English. For Nepal-specific trade terms (Karigar, Tola, Jarti, Dhito),
 *        we write the English meaning followed by the Romanized Nepali in italics/parens
 *        so staff understand the local term: e.g. "Wastage (Jarti)"
 *  - NE: 100% Nepali Devanagari. Technical acronyms (RFID, PAN, VAT, PIN) stay as-is
 *        since they are universally recognized even in Nepali usage.
 *
 * Usage:  const { t, lang, setLang } = useLang();
 *         t('karigar')  →  "Karigar (Craftsman)" | "कारीगर"
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Lang = "en" | "ne";

// ─── Bilingual Dictionary ─────────────────────────────────────────────────────
// Rule: en = pure English (+ Romanized term in parens where relevant)
//       ne = pure Nepali Devanagari

export const TRANSLATIONS = {
    // ── App-wide ──────────────────────────────────────────────────────────────
    appName: { en: "Walsong JwelFlow", ne: "वाल्सङ जुवेलफ्लो" },
    dashboard: { en: "Dashboard", ne: "ड्यासबोर्ड" },
    settings: { en: "Settings", ne: "सेटिङ" },
    logout: { en: "Lock Session", ne: "सत्र बन्द गर्नुहोस्" },
    save: { en: "Save", ne: "सुरक्षित गर्नुहोस्" },
    cancel: { en: "Cancel", ne: "रद्द गर्नुहोस्" },
    add: { en: "Add", ne: "थप्नुहोस्" },
    edit: { en: "Edit", ne: "सम्पादन" },
    delete: { en: "Delete", ne: "मेट्नुहोस्" },
    search: { en: "Search", ne: "खोज्नुहोस्" },
    back: { en: "Back", ne: "पछाडि" },
    next: { en: "Next", ne: "अर्को" },
    confirm: { en: "Confirm", ne: "पुष्टि गर्नुहोस्" },
    loading: { en: "Loading…", ne: "लोड हुँदैछ…" },
    noData: { en: "No records found", ne: "कुनै रेकर्ड भेटिएन" },
    required: { en: "Required", ne: "अनिवार्य" },
    preview: { en: "Preview", ne: "पूर्वावलोकन" },
    phone: { en: "Phone", ne: "फोन नम्बर" },
    name: { en: "Name", ne: "नाम" },
    description: { en: "Description", ne: "विवरण" },
    date: { en: "Date", ne: "मिति" },
    notes: { en: "Notes", ne: "टिप्पणी" },
    actions: { en: "Actions", ne: "कार्यहरू" },
    pending: { en: "Pending", ne: "बाँकी" },
    completed: { en: "Completed", ne: "सम्पन्न" },
    disputed: { en: "Disputed", ne: "विवादित" },
    active: { en: "Active", ne: "सक्रिय" },
    status: { en: "Status", ne: "स्थिति" },

    // ── Navigation ────────────────────────────────────────────────────────────
    pos: { en: "POS / Billing", ne: "बिलिङ काउन्टर" },
    inventory: { en: "Inventory", ne: "मौज्दात" },
    karigar: { en: "Karigar", ne: "कारीगर" },
    dhito: { en: "Dhito (Pawn)", ne: "धितो" },
    chit: { en: "Gold Chit", ne: "सुन चिट" },
    audit: { en: "RFID & Audit", ne: "RFID अडिट" },
    reports: { en: "Reports", ne: "रिपोर्ट" },
    customer: { en: "Customers", ne: "ग्राहक" },

    // ── Jewelry / Trade ───────────────────────────────────────────────────────
    gold: { en: "Gold", ne: "सुन" },
    silver: { en: "Silver", ne: "चाँदी" },
    jewelry: { en: "Jewelry", ne: "गहना" },
    tola: { en: "Tola (11.664 g)", ne: "तोला (११.६६४ ग्रा)" },
    gram: { en: "Gram", ne: "ग्राम" },
    weight: { en: "Weight", ne: "तौल" },
    netWeight: { en: "Net Weight", ne: "खाँटी तौल" },
    rawWeight: { en: "Raw Weight (grams)", ne: "कच्चा तौल (ग्राम)" },
    finishedWeight: { en: "Finished Weight (grams)", ne: "बनेको तौल (ग्राम)" },
    karat: { en: "Karat / Purity", ne: "क्यारेट / शुद्धता" },

    // Karat grades (NGSDA official terms)
    k24: { en: "24K Hallmark", ne: "२४क हलमार्क (छापावाल)" },
    k22: { en: "22K Gold (Asali)", ne: "२२क असली सुन" },
    k18: { en: "18K Gold (Tejabi)", ne: "१८क तेजाबी सुन" },

    // ── Karigar Management ────────────────────────────────────────────────────
    karigarMgmt: { en: "Karigar Management", ne: "कारीगर व्यवस्थापन" },
    karigarSubtitle: { en: "Track raw gold dispatched and finished jewelry received", ne: "कच्चा सुन पठाएको र गहना फिर्ता ट्र्याक गर्नुहोस्" },
    karigarName: { en: "Karigar Name", ne: "कारीगरको नाम" },
    specialty: { en: "Specialty", ne: "विशेषता" },
    addKarigar: { en: "Add Karigar", ne: "कारीगर थप्नुहोस्" },
    goldAtKarigar: { en: "Gold at Karigar", ne: "कारीगरसँग सुन" },
    pendingJobs: { en: "Pending Jobs", ne: "बाँकी काम" },
    jobHistory: { en: "Job History", ne: "काम इतिहास" },
    issueGold: { en: "Issue Raw Gold (Raw-Out)", ne: "कच्चा सुन जारी गर्नुहोस्" },
    receiveGold: { en: "Receive Finished Work (Finished-In)", ne: "तयार गहना लिनुहोस्" },
    itemDesc: { en: "Item Description", ne: "सामानको विवरण" },
    wastagePercent: { en: "Wastage % (Jarti)", ne: "जर्ती प्रतिशत (%)" },
    dispatch: { en: "Dispatch Gold", ne: "सुन पठाउनुहोस्" },
    selectPendingJob: { en: "Select Pending Job", ne: "बाँकी काम छान्नुहोस्" },
    jarti: { en: "Jarti — Scrap / Dust (grams)", ne: "जर्ती — धूलो / अवशेष (ग्राम)" },
    stoneWeight: { en: "Stone Weight (grams)", ne: "ढुंगा तौल (ग्राम)" },
    receiveClose: { en: "Receive & Close Job", ne: "काम लिने र बन्द गर्नुहोस्" },
    noJobsFound: { en: "No jobs found for this karigar", ne: "यस कारीगरसँग कुनै काम छैन" },
    selectKarigar: { en: "Select a karigar from the sidebar", ne: "बायाँबाट कारीगर छान्नुहोस्" },
    goldLoss: { en: "Gold Loss (Jarti)", ne: "सुन घाटा (जर्ती)" },
    jyala: { en: "Making Charges (Jyala)", ne: "ज्याला (बनाउने मूल्य)" },

    // ── Dhito / Pawn ──────────────────────────────────────────────────────────
    dhitoMgmt: { en: "Dhito Management — Pawn & Pledge", ne: "धितो व्यवस्थापन" },
    loanAmount: { en: "Loan Amount (NPR)", ne: "ऋण रकम (रु.)" },
    interestRate: { en: "Interest Rate (%)", ne: "ब्याज दर (%)" },
    datePawned: { en: "Date Pledged", ne: "धितो मिति" },
    dateRedeemed: { en: "Date Redeemed", ne: "फिर्ता मिति" },
    redeemed: { en: "Redeemed", ne: "फिर्ता भयो" },
    forfeited: { en: "Forfeited", ne: "जफत" },

    // ── POS / Billing ─────────────────────────────────────────────────────────
    billing: { en: "Billing & POS", ne: "बिलिङ" },
    cartItems: { en: "Cart Items", ne: "छानिएका सामान" },
    customerName: { en: "Customer Name", ne: "ग्राहकको नाम" },
    paymentMethod: { en: "Payment Method", ne: "भुक्तानी तरिका" },
    cash: { en: "Cash", ne: "नगद" },
    bank: { en: "Bank Transfer", ne: "बैंक ट्रान्सफर" },
    credit: { en: "Credit (Udharo)", ne: "उधारो" },
    subtotal: { en: "Subtotal", ne: "उपजम्मा" },
    vat: { en: "VAT (13%)", ne: "मूल्य अभिवृद्धि कर (१३%)" },
    grandTotal: { en: "Grand Total", ne: "जम्मा रकम" },
    paid: { en: "Paid", ne: "तिरिएको" },
    balanceDue: { en: "Balance Due", ne: "बाँकी रकम" },
    printInvoice: { en: "Print Invoice", ne: "बिल छाप्नुहोस्" },
    checkout: { en: "Checkout", ne: "भुक्तानी गर्नुहोस्" },

    // ── Gold Chit ─────────────────────────────────────────────────────────────
    chitScheme: { en: "Gold Chit Scheme", ne: "सुन चिट योजना" },
    chitSubtitle: { en: "Monthly installment gold savings plan", ne: "मासिक किस्ता सुन बचत योजना" },
    monthlyAmount: { en: "Monthly Amount (NPR)", ne: "मासिक किस्ता (रु.)" },
    totalMonths: { en: "Total Months", ne: "कुल महिना" },
    installment: { en: "Installment (Kista)", ne: "किस्ता" },
    matured: { en: "Scheme Matured", ne: "चिट परिपक्व भयो" },
    goldAccumulated: { en: "Gold Accumulated", ne: "जम्मा भएको सुन" },
    startDate: { en: "Start Date", ne: "सुरु मिति" },
    payInstallment: { en: "Pay Installment", ne: "किस्ता तिर्नुहोस्" },
    totalPaid: { en: "Total Paid", ne: "जम्मा तिरिएको" },
    newScheme: { en: "New Chit Scheme", ne: "नयाँ चिट योजना" },
    schemeList: { en: "All Schemes", ne: "सबै योजनाहरू" },

    // ── Live Rates ────────────────────────────────────────────────────────────
    liveRate: { en: "Live Market Rate", ne: "बजार भाउ (लाइभ)" },
    goldRate: { en: "Gold Rate per Tola", ne: "सुन भाउ प्रति तोला" },
    silverRate: { en: "Silver Rate per Tola", ne: "चाँदी भाउ प्रति तोला" },
    rateSource: { en: "Source: FENEGOSIDA", ne: "स्रोत: फेनेगोसिदा" },
    perTola: { en: "Per Tola", ne: "प्रति तोला" },
    perGram: { en: "Per Gram", ne: "प्रति ग्राम" },

    // ── Inventory ─────────────────────────────────────────────────────────────
    itemName: { en: "Item Name", ne: "सामानको नाम" },
    category: { en: "Category", ne: "कोटी" },
    salePrice: { en: "Sale Price", ne: "बिक्री मूल्य" },
    rfidTag: { en: "RFID Tag", ne: "RFID ट्याग" },
    addItem: { en: "Add Item", ne: "सामान थप्नुहोस्" },
    inStock: { en: "In Stock", ne: "मौज्दातमा" },
    sold: { en: "Sold", ne: "बिक्यो" },

    // ── RFID & Audit ─────────────────────────────────────────────────────────
    rfidAudit: { en: "RFID & Compliance Audit", ne: "RFID अडिट र अनुपालन" },
    rfidSubtitle: { en: "Tag assignment, stock audit, and IRD compliance journal", ne: "ट्यागिङ, स्टक अडिट र IRD अनुपालन लग" },
    scanAudit: { en: "RFID Scan Audit", ne: "RFID स्क्यान अडिट" },
    tagMgmt: { en: "Tag Management", ne: "ट्याग व्यवस्थापन" },
    complianceLog: { en: "Compliance Journal", ne: "अनुपालन जर्नल" },
    scanTags: { en: "Scan Tags", ne: "ट्याग स्क्यान गर्नुहोस्" },
    scanTagsDesc: { en: "RFID reader auto-adds tags, or type manually", ne: "RFID रिडरले स्वचालित थप्छ, वा म्यानुअल टाइप गर्नुहोस्" },
    auditReport: { en: "Audit Report", ne: "अडिट रिपोर्ट" },
    runAudit: { en: "Run Audit", ne: "अडिट गर्नुहोस्" },
    matched: { en: "Matched", ne: "मेल भयो" },
    unmatched: { en: "Unknown Tag", ne: "अज्ञात ट्याग" },
    missingItem: { en: "Missing (Not Scanned)", ne: "हराएको (स्क्यान भएन)" },
    assignTag: { en: "Assign RFID Tag", ne: "RFID ट्याग जोड्नुहोस्" },
    removeTag: { en: "Remove Tag", ne: "ट्याग हटाउनुहोस्" },
    stockOverview: { en: "Stock Tag Overview", ne: "स्टक ट्याग अवलोकन" },
    tagged: { en: "Tagged", ne: "ट्याग गरिएको" },
    untagged: { en: "Untagged", ne: "ट्याग छैन" },
    unknown: { en: "Unknown", ne: "अज्ञात" },
    auditFilter: { en: "Audit Filter", ne: "अडिट फिल्टर" },
    auditFilterDesc: { en: "Select date range for IRD export", ne: "IRD निर्यातको लागि मिति दायरा छान्नुहोस्" },
    exportIrd: { en: "Export for IRD (.json)", ne: "IRD निर्यात गर्नुहोस् (.json)" },
    activityJournal: { en: "Activity Journal", ne: "गतिविधि जर्नल" },
    noLogsFound: { en: "No logs found for selected period", ne: "चयनित मितिमा कुनै लग भेटिएन" },
    from: { en: "From", ne: "देखि" },
    to: { en: "To", ne: "सम्म" },
    searchLogs: { en: "Search Logs", ne: "लग खोज्नुहोस्" },
    entries: { en: "entries", ne: "प्रविष्टिहरू" },
    time: { en: "Time", ne: "समय" },
    action: { en: "Action", ne: "कार्य" },
    user: { en: "User", ne: "प्रयोगकर्ता" },

    // ── Compliance / AML ─────────────────────────────────────────────────────
    amlAlert: { en: "AML Alert — High-Value Transaction", ne: "ठूलो कारोबार सूचना (AML)" },
    kycName: { en: "KYC: Full Name", ne: "केवाईसी: पूरा नाम" },
    kycId: { en: "KYC: ID Number", ne: "केवाईसी: परिचय नम्बर" },
    kycIdType: { en: "KYC: ID Type (Citizenship / Passport)", ne: "परिचय प्रकार (नागरिकता / राहदानी)" },
    kycAddress: { en: "KYC: Address", ne: "केवाईसी: ठेगाना" },
    irDept: { en: "IRD — Inland Revenue Department", ne: "आन्तरिक राजश्व विभाग" },

    // ── Staff / Auth ──────────────────────────────────────────────────────────
    ownerPin: { en: "Owner PIN", ne: "मालिक PIN" },
    staffName: { en: "Staff Name", ne: "कर्मचारीको नाम" },
    role: { en: "Role", ne: "भूमिका" },
    owner: { en: "Owner", ne: "मालिक" },
    manager: { en: "Manager", ne: "व्यवस्थापक" },
    cashier: { en: "Cashier", ne: "क्यासियर" },

    // ── Setup Wizard ─────────────────────────────────────────────────────────
    businessIdentity: { en: "Business Identity", ne: "पसल परिचय" },
    shopName: { en: "Shop Name", ne: "पसलको नाम" },
    panVat: { en: "PAN / VAT Number", ne: "PAN / VAT नम्बर" },
    panVatHint: { en: "9-digit PAN registered with IRD", ne: "IRD मा दर्ता भएको ९ अंकको PAN" },
    address: { en: "Address", ne: "ठेगाना" },
    invoiceFooter: { en: "Invoice Footer Message", ne: "बिल फुटर सन्देश" },
    brandColor: { en: "Brand Color", ne: "ब्रान्ड रङ" },
    adminAccount: { en: "Admin Account", ne: "प्रशासक खाता" },
    adminSubtitle: { en: "Owner account used for POS override and secure data access", ne: "POS override र गोप्य डेटा हेर्न मालिक खाता" },
    fullName: { en: "Full Name", ne: "पूरा नाम" },
    createPin: { en: "Create PIN", ne: "PIN बनाउनुहोस्" },
    confirmPin: { en: "Confirm PIN", ne: "PIN पुष्टि गर्नुहोस्" },
    pinHint: { en: "PIN must be 4–6 digits. Can be changed later in Settings.", ne: "PIN ४ देखि ६ अंकको हुनुपर्छ। Settings बाट परिवर्तन गर्न सकिन्छ।" },
    pinMismatch: { en: "PINs do not match", ne: "PIN मेल भएन" },
    pinInvalid: { en: "PIN must be 4–6 digits", ne: "PIN ४–६ अंकको हुनुपर्छ" },
    regionalSettings: { en: "Regional Settings", ne: "क्षेत्रीय सेटिङ" },
    regionalSubtitle: { en: "Pre-configured for Nepal market", ne: "नेपाल बजारका लागि पूर्वनिर्धारित" },
    currency: { en: "Currency: NPR", ne: "मुद्रा: NPR (रु.)" },
    weightUnit: { en: "Weight: Tola / Gram", ne: "तौल: तोला / ग्राम" },
    timezone: { en: "Timezone: NST (UTC+5:45)", ne: "समय क्षेत्र: NST (UTC+5:45)" },
    backupNote: { en: "After setup, go to Settings → Backup to choose an auto-backup folder. Daily USB backup recommended.", ne: "सेटअप पछि Settings → Backup मा गई स्वचालित ब्याकअप फोल्डर छान्नुहोस्। दैनिक USB ब्याकअप सिफारिस गरिन्छ।" },
    backupTitle: { en: "Database Backup", ne: "डेटाबेस ब्याकअप" },
    launchApp: { en: "Launch JwelFlow →", ne: "JwelFlow खोल्नुहोस् →" },
    startSetup: { en: "Start JwelFlow", ne: "JwelFlow सुरु गर्नुहोस्" },
    initializing: { en: "Initializing…", ne: "सुरु हुँदैछ…" },
    allDone: { en: "All Done!", ne: "सबै तयार छ!" },
    firstSetup: { en: "First-time Setup", ne: "पहिलो सेटअप" },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS;

// ─── Context ──────────────────────────────────────────────────────────────────

interface LangContextValue {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: TranslationKey) => string;
    raw: (key: TranslationKey) => { en: string; ne: string };
}

const LangContext = createContext<LangContextValue>({
    lang: "en",
    setLang: () => { },
    t: (key) => TRANSLATIONS[key].en,
    raw: (key) => TRANSLATIONS[key],
});

export const useLang = () => useContext(LangContext);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LangProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>("en");

    useEffect(() => {
        const stored = localStorage.getItem("jwelflow_lang") as Lang | null;
        if (stored === "en" || stored === "ne") setLangState(stored);
    }, []);

    const setLang = useCallback((l: Lang) => {
        setLangState(l);
        localStorage.setItem("jwelflow_lang", l);
    }, []);

    const t = useCallback((key: TranslationKey): string => {
        return TRANSLATIONS[key][lang];
    }, [lang]);

    const raw = useCallback((key: TranslationKey) => TRANSLATIONS[key], []);

    return (
        <LangContext.Provider value={{ lang, setLang, t, raw }}>
            {children}
        </LangContext.Provider>
    );
}
