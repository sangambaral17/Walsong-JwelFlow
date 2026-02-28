"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { getDb } from "@/lib/db";
import { safeUUID } from "@/lib/utils/safe-uuid";
import { toGrams, formatTML, toTolaMashaLal } from "@/lib/jewelry-math";
import { useShop } from "@/lib/shop-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, HandCoins, CheckCircle2, Search, Wallet, Clock, AlertTriangle, Ban, CreditCard, Printer, ChevronDown, ChevronUp, Phone, FileText } from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaymentEntry {
    id: string;
    date: string;
    amount: number;
    note: string;
}

interface DhitoItem {
    id: string;
    customer_name: string;
    customer_phone: string;
    item_description: string;
    gold_karat: string;
    weight_grams: number;
    loan_amount: number;
    interest_rate: number;
    date_pawned: string;
    date_redeemed: string;
    status: string;
    payments: string; // JSON stringified PaymentEntry[]
    notes: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysElapsed(datePawned: string): number {
    const start = new Date(datePawned).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

function calcInterest(loanAmount: number, interestRate: number, daysElapsed: number): number {
    return loanAmount * (interestRate / 100) * (daysElapsed / 365);
}

function parsePayments(payments: string | undefined): PaymentEntry[] {
    try { return JSON.parse(payments || "[]"); } catch { return []; }
}

function totalPayments(payments: PaymentEntry[]): number {
    return payments.reduce((sum, p) => sum + p.amount, 0);
}

function getDaysColor(days: number): string {
    if (days < 90) return "text-green-400";
    if (days <= 180) return "text-amber-400";
    return "text-red-400";
}

function getDaysBg(days: number): string {
    if (days < 90) return "bg-green-500/10 border-green-500/20";
    if (days <= 180) return "bg-amber-500/10 border-amber-500/20";
    return "bg-red-500/10 border-red-500/20";
}

// TML conversion constants (matching user spec: 1 Tola = 12 Masha, 1 Masha = 10 Lal)
function gramsToTMLDisplay(grams: number): string {
    const tml = toTolaMashaLal(grams);
    return formatTML(tml);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DhitoPage() {
    const { profile } = useShop();
    const [items, setItems] = useState<DhitoItem[]>([]);
    const [activeTab, setActiveTab] = useState<"active" | "redeemed" | "forfeited">("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Dialog states
    const [newDialogOpen, setNewDialogOpen] = useState(false);
    const [payDialogOpen, setPayDialogOpen] = useState(false);
    const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
    const [forfeitDialogOpen, setForfeitDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DhitoItem | null>(null);

    // Customer suggestions
    const [customerSuggestions, setCustomerSuggestions] = useState<{ name: string; phone: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // New Dhito form
    const [form, setForm] = useState({
        customer: "", phone: "", description: "", karat: "24K",
        tola: "", masha: "", lal: "",
        loan: "", interest: "24", notes: "",
    });

    // Payment form
    const [payAmount, setPayAmount] = useState("");
    const [payNote, setPayNote] = useState("");

    // ─── Data Loading ──────────────────────────────────────────────────────────

    const loadItems = useCallback(async () => {
        const db = await getDb();
        const results = await db.dhito.find().exec();
        setItems(results.map((r: any) => r.toJSON()));
    }, []);

    useEffect(() => {
        loadItems();
        let sub: any;
        (async () => {
            const db = await getDb();
            sub = db.dhito.find().$.subscribe(() => loadItems());
        })();
        return () => sub?.unsubscribe();
    }, [loadItems]);

    // ─── Customer Auto-Suggest ─────────────────────────────────────────────────

    const handleCustomerSearch = useCallback(async (query: string) => {
        setForm(f => ({ ...f, customer: query }));
        if (query.length < 2) { setShowSuggestions(false); return; }
        try {
            const db = await getDb();
            const all = await db.customers.find().exec();
            const matches = all
                .map((c: any) => c.toJSON())
                .filter((c: any) =>
                    c.name?.toLowerCase().includes(query.toLowerCase()) ||
                    c.phone?.includes(query)
                )
                .slice(0, 5)
                .map((c: any) => ({ name: c.name, phone: c.phone || "" }));
            setCustomerSuggestions(matches);
            setShowSuggestions(matches.length > 0);
        } catch { setShowSuggestions(false); }
    }, []);

    // ─── Live Gram Conversion ──────────────────────────────────────────────────

    const liveGrams = useMemo(() => {
        const t = Number(form.tola) || 0;
        const m = Number(form.masha) || 0;
        const l = Number(form.lal) || 0;
        if (t === 0 && m === 0 && l === 0) return 0;
        return toGrams({ tola: t, masha: m, lal: l }).toNumber();
    }, [form.tola, form.masha, form.lal]);

    // ─── Stats Calculations ────────────────────────────────────────────────────

    const stats = useMemo(() => {
        const active = items.filter(i => i.status === "active");
        const totalDisbursed = active.reduce((s, i) => s + i.loan_amount, 0);
        const accruedInterest = active.reduce((s, i) => {
            const days = getDaysElapsed(i.date_pawned);
            return s + calcInterest(i.loan_amount, i.interest_rate, days);
        }, 0);
        const overdue = active.filter(i => getDaysElapsed(i.date_pawned) > 180).length;
        return { activeCount: active.length, totalDisbursed, accruedInterest, overdue };
    }, [items]);

    // ─── Filtered Items ────────────────────────────────────────────────────────

    const filteredItems = useMemo(() => {
        let filtered = items.filter(i => i.status === activeTab);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(i =>
                i.customer_name?.toLowerCase().includes(q) ||
                i.customer_phone?.includes(q)
            );
        }
        // Sort: most recent first
        return filtered.sort((a, b) => new Date(b.date_pawned).getTime() - new Date(a.date_pawned).getTime());
    }, [items, activeTab, searchQuery]);

    // ─── CRUD Handlers ─────────────────────────────────────────────────────────

    const handleAdd = async () => {
        const db = await getDb();
        const weightGrams = toGrams({
            tola: Number(form.tola) || 0,
            masha: Number(form.masha) || 0,
            lal: Number(form.lal) || 0,
        });
        await db.dhito.insert({
            id: safeUUID(),
            customer_name: form.customer,
            customer_phone: form.phone,
            item_description: form.description,
            gold_karat: form.karat,
            weight_grams: weightGrams.toNumber(),
            loan_amount: Number(form.loan) || 0,
            interest_rate: Number(form.interest) || 24,
            date_pawned: new Date().toISOString(),
            date_redeemed: "",
            status: "active",
            payments: "[]",
            notes: form.notes,
        });
        await db.audit_log.insert({
            id: safeUUID(),
            timestamp: new Date().toISOString(),
            action: "DHITO_NEW",
            details: `Loan to ${form.customer} — रू${form.loan} | ${form.karat} ${form.description}`,
            user: "staff",
        });
        setForm({ customer: "", phone: "", description: "", karat: "24K", tola: "", masha: "", lal: "", loan: "", interest: "24", notes: "" });
        setNewDialogOpen(false);
    };

    const handlePayment = async () => {
        if (!selectedItem) return;
        const db = await getDb();
        const doc = await db.dhito.findOne(selectedItem.id).exec();
        if (!doc) return;
        const payments = parsePayments(doc.payments);
        payments.push({
            id: safeUUID(),
            date: new Date().toISOString(),
            amount: Number(payAmount) || 0,
            note: payNote,
        });
        await doc.patch({ payments: JSON.stringify(payments) });
        await db.audit_log.insert({
            id: safeUUID(),
            timestamp: new Date().toISOString(),
            action: "DHITO_PAYMENT",
            details: `Payment रू${payAmount} from ${selectedItem.customer_name}`,
            user: "staff",
        });
        setPayAmount("");
        setPayNote("");
        setPayDialogOpen(false);
        setSelectedItem(null);
    };

    const handleRedeem = async () => {
        if (!selectedItem) return;
        const db = await getDb();
        const doc = await db.dhito.findOne(selectedItem.id).exec();
        if (!doc) return;
        await doc.patch({ status: "redeemed", date_redeemed: new Date().toISOString() });
        await db.audit_log.insert({
            id: safeUUID(),
            timestamp: new Date().toISOString(),
            action: "DHITO_REDEEM",
            details: `Redeemed for ${selectedItem.customer_name} — रू${selectedItem.loan_amount}`,
            user: "staff",
        });
        setRedeemDialogOpen(false);
        setSelectedItem(null);
    };

    const handleForfeit = async () => {
        if (!selectedItem) return;
        const db = await getDb();
        const doc = await db.dhito.findOne(selectedItem.id).exec();
        if (!doc) return;
        await doc.patch({ status: "forfeited", date_redeemed: new Date().toISOString() });
        await db.audit_log.insert({
            id: safeUUID(),
            timestamp: new Date().toISOString(),
            action: "DHITO_FORFEIT",
            details: `Forfeited item from ${selectedItem.customer_name} — ${selectedItem.item_description}`,
            user: "staff",
        });
        setForfeitDialogOpen(false);
        setSelectedItem(null);
    };

    // ─── Print Receipt ─────────────────────────────────────────────────────────

    const handlePrint = (item: DhitoItem) => {
        const days = getDaysElapsed(item.date_pawned);
        const interest = calcInterest(item.loan_amount, item.interest_rate, days);
        const payments = parsePayments(item.payments);
        const paid = totalPayments(payments);
        const tml = gramsToTMLDisplay(item.weight_grams);
        const shopName = profile.shop_name || "JwelFlow";

        const printWindow = window.open("", "_blank", "width=400,height=700");
        if (!printWindow) return;

        printWindow.document.write(`<!DOCTYPE html><html><head><title>Dhito Receipt</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; max-width: 380px; margin: 0 auto; color: #000; background: #fff; }
            .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 16px; }
            .header h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
            .header p { font-size: 11px; color: #555; }
            .title { text-align: center; font-size: 16px; font-weight: bold; margin: 12px 0; text-transform: uppercase; letter-spacing: 2px; }
            .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
            .row .label { color: #555; }
            .row .value { font-weight: 600; }
            .divider { border-top: 1px dashed #ccc; margin: 10px 0; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; font-weight: bold; border-top: 2px solid #000; margin-top: 8px; }
            .terms { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #ccc; font-size: 10px; color: #666; }
            .terms h4 { font-size: 11px; margin-bottom: 4px; color: #333; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #999; }
        </style></head><body>
            <div class="header">
                <h1>${shopName}</h1>
                <p>${profile.address || ""} ${profile.phone ? "| " + profile.phone : ""}</p>
                ${profile.pan_vat_number ? `<p>PAN/VAT: ${profile.pan_vat_number}</p>` : ""}
            </div>
            <div class="title">⚖️ Dhito Receipt</div>
            <div class="row"><span class="label">Date:</span><span class="value">${new Date(item.date_pawned).toLocaleDateString("ne-NP")}</span></div>
            <div class="row"><span class="label">Customer:</span><span class="value">${item.customer_name}</span></div>
            ${item.customer_phone ? `<div class="row"><span class="label">Phone:</span><span class="value">${item.customer_phone}</span></div>` : ""}
            <div class="divider"></div>
            <div class="row"><span class="label">Item:</span><span class="value">${item.item_description} (${item.gold_karat})</span></div>
            <div class="row"><span class="label">Weight:</span><span class="value">${tml} (${item.weight_grams.toFixed(2)}g)</span></div>
            <div class="divider"></div>
            <div class="row"><span class="label">Loan Amount:</span><span class="value">रू ${item.loan_amount.toLocaleString()}</span></div>
            <div class="row"><span class="label">Interest Rate:</span><span class="value">${item.interest_rate}% / year</span></div>
            <div class="row"><span class="label">Days Elapsed:</span><span class="value">${days} days</span></div>
            <div class="row"><span class="label">Accrued Interest:</span><span class="value">रू ${Math.round(interest).toLocaleString()}</span></div>
            <div class="row"><span class="label">Payments Made:</span><span class="value">रू ${Math.round(paid).toLocaleString()}</span></div>
            <div class="total-row"><span>Net Payable:</span><span>रू ${Math.round(item.loan_amount + interest - paid).toLocaleString()}</span></div>
            <div class="terms">
                <h4>Terms & Conditions:</h4>
                <p>1. Items not redeemed within 6 months may be forfeited by the shop.</p>
                <p>2. Interest is calculated at the agreed rate on a daily basis.</p>
                <p>3. This receipt must be presented at the time of redemption.</p>
                <p>4. The shop is not responsible for loss due to natural calamities.</p>
            </div>
            <div class="footer">
                <p>Thank you for choosing ${shopName}</p>
                <p>Powered by JwelFlow</p>
            </div>
        </body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 300);
    };

    // ─── Settlement Calculations ───────────────────────────────────────────────

    const settlementCalc = useMemo(() => {
        if (!selectedItem) return { principal: 0, interest: 0, paid: 0, net: 0, days: 0 };
        const days = getDaysElapsed(selectedItem.date_pawned);
        const interest = calcInterest(selectedItem.loan_amount, selectedItem.interest_rate, days);
        const paid = totalPayments(parsePayments(selectedItem.payments));
        return {
            principal: selectedItem.loan_amount,
            interest: Math.round(interest),
            paid: Math.round(paid),
            net: Math.round(selectedItem.loan_amount + interest - paid),
            days,
        };
    }, [selectedItem]);

    // ─── Tab Data ──────────────────────────────────────────────────────────────

    const tabCounts = useMemo(() => ({
        active: items.filter(i => i.status === "active").length,
        redeemed: items.filter(i => i.status === "redeemed").length,
        forfeited: items.filter(i => i.status === "forfeited").length,
    }), [items]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Subtle ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/3 blur-[120px]" />
            </div>

            {/* ─── Header ─── */}
            <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary"><ArrowLeft className="w-4 h-4 mr-2" /> Dashboard</Button></Link>
                        <div className="h-6 w-px bg-border/30" />
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><HandCoins className="w-5 h-5 text-primary" /> Dhito (बन्धकी)</h1>
                    </div>
                    <Button onClick={() => setNewDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" /> New Dhito
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8 relative z-10">

                {/* ─── Stats Dashboard ─── */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="glass-card border-primary/20">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">Active Loans</p>
                            </div>
                            <p className="text-3xl font-bold font-mono text-primary tracking-tight">{stats.activeCount}</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-blue-400" />
                                </div>
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Disbursed</p>
                            </div>
                            <p className="text-2xl font-bold font-mono text-foreground tracking-tight">रू {stats.totalDisbursed.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                </div>
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">Accrued Interest</p>
                            </div>
                            <p className="text-2xl font-bold font-mono text-amber-400 tracking-tight">रू {Math.round(stats.accruedInterest).toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                </div>
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">Overdue (&gt;6mo)</p>
                            </div>
                            <p className="text-3xl font-bold font-mono text-red-400 tracking-tight">{stats.overdue}</p>
                        </CardContent>
                    </Card>
                </section>

                {/* ─── Search + Tabs ─── */}
                <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl border border-border/30">
                        {(["active", "redeemed", "forfeited"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab
                                    ? tab === "active" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : tab === "redeemed" ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    }`}
                            >
                                {tab === "active" ? "Active" : tab === "redeemed" ? "Redeemed" : "Forfeited"}
                                <span className="ml-1.5 text-xs opacity-70">({tabCounts[tab]})</span>
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name or phone..."
                            className="pl-10 bg-background/50 border-border/30"
                        />
                    </div>
                </section>

                {/* ─── Loans Table ─── */}
                <section className="glass-card rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/30 hover:bg-transparent">
                                <TableHead className="text-primary uppercase text-xs tracking-wider">Customer</TableHead>
                                <TableHead className="text-primary uppercase text-xs tracking-wider">Item</TableHead>
                                <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Weight</TableHead>
                                <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Loan रू</TableHead>
                                {activeTab === "active" && (
                                    <>
                                        <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Interest रू</TableHead>
                                        <TableHead className="text-primary uppercase text-xs tracking-wider text-center">Days</TableHead>
                                    </>
                                )}
                                <TableHead className="text-primary uppercase text-xs tracking-wider text-center">Status</TableHead>
                                <TableHead className="text-primary uppercase text-xs tracking-wider text-right w-48">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={activeTab === "active" ? 8 : 6} className="text-center py-16 text-muted-foreground">
                                        <HandCoins className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-base">No {activeTab} dhito loans found.</p>
                                        {activeTab === "active" && (
                                            <Button onClick={() => setNewDialogOpen(true)} variant="outline" size="sm" className="mt-4 border-primary/30 text-primary hover:bg-primary/10">
                                                <Plus className="w-3 h-3 mr-1" /> Create First Dhito
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : filteredItems.map((item) => {
                                const days = getDaysElapsed(item.date_pawned);
                                const interest = calcInterest(item.loan_amount, item.interest_rate, days);
                                const payments = parsePayments(item.payments);
                                const paid = totalPayments(payments);
                                const isExpanded = expandedRow === item.id;

                                return (
                                    <Fragment key={item.id}>
                                        <TableRow
                                            className="border-border/20 hover:bg-primary/5 cursor-pointer transition-colors"
                                            onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                                                    <div>
                                                        <p className="font-medium">{item.customer_name}</p>
                                                        {item.customer_phone && (
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Phone className="w-2.5 h-2.5" />{item.customer_phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-muted-foreground">{item.item_description}</p>
                                                <Badge variant="outline" className="mt-0.5 text-xs border-primary/30 text-primary">{item.gold_karat || "24K"}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">{gramsToTMLDisplay(item.weight_grams)}</TableCell>
                                            <TableCell className="text-right font-mono font-semibold">रू {item.loan_amount.toLocaleString()}</TableCell>
                                            {activeTab === "active" && (
                                                <>
                                                    <TableCell className="text-right font-mono text-amber-400">
                                                        रू {Math.round(interest).toLocaleString()}
                                                        {paid > 0 && (
                                                            <p className="text-xs text-green-400">-{Math.round(paid).toLocaleString()} paid</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${getDaysBg(days)} ${getDaysColor(days)}`}>
                                                            {days}d
                                                        </span>
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell className="text-center">
                                                {item.status === "active" && <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25">Active</Badge>}
                                                {item.status === "redeemed" && <Badge className="bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25">Redeemed</Badge>}
                                                {item.status === "forfeited" && <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25">Forfeited</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-1.5 justify-end" onClick={e => e.stopPropagation()}>
                                                    <Button variant="ghost" size="sm" onClick={() => handlePrint(item)} className="text-muted-foreground hover:text-primary h-8 w-8 p-0">
                                                        <Printer className="w-3.5 h-3.5" />
                                                    </Button>
                                                    {item.status === "active" && (
                                                        <>
                                                            <Button
                                                                variant="outline" size="sm"
                                                                onClick={() => { setSelectedItem(item); setPayDialogOpen(true); }}
                                                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-8 text-xs"
                                                            >
                                                                <CreditCard className="w-3 h-3 mr-1" /> Pay
                                                            </Button>
                                                            <Button
                                                                variant="outline" size="sm"
                                                                onClick={() => { setSelectedItem(item); setRedeemDialogOpen(true); }}
                                                                className="border-green-500/30 text-green-400 hover:bg-green-500/10 h-8 text-xs"
                                                            >
                                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Redeem
                                                            </Button>
                                                            <Button
                                                                variant="outline" size="sm"
                                                                onClick={() => { setSelectedItem(item); setForfeitDialogOpen(true); }}
                                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 text-xs"
                                                            >
                                                                <Ban className="w-3 h-3 mr-1" /> Forfeit
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Detail Row */}
                                        {isExpanded && (
                                            <TableRow className="bg-background/30 border-border/10">
                                                <TableCell colSpan={activeTab === "active" ? 8 : 6} className="p-0">
                                                    <div className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                                                                <p className="text-xs text-muted-foreground mb-1">Date Pawned</p>
                                                                <p className="font-mono text-sm">{new Date(item.date_pawned).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                                                                <p className="text-xs text-muted-foreground mb-1">Weight (grams)</p>
                                                                <p className="font-mono text-sm">{item.weight_grams.toFixed(2)}g</p>
                                                            </div>
                                                            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                                                                <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
                                                                <p className="font-mono text-sm">{item.interest_rate}% /yr ({(item.interest_rate / 12).toFixed(1)}% /mo)</p>
                                                            </div>
                                                            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                                                                <p className="text-xs text-muted-foreground mb-1">Total Payments</p>
                                                                <p className="font-mono text-sm text-green-400">रू {Math.round(paid).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        {item.notes && (
                                                            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                                                                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                                                <p className="text-sm">{item.notes}</p>
                                                            </div>
                                                        )}
                                                        {payments.length > 0 && (
                                                            <div>
                                                                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Payment History</p>
                                                                <div className="space-y-1.5">
                                                                    {payments.map((p, idx) => (
                                                                        <div key={p.id || idx} className="flex items-center justify-between p-2.5 rounded-lg bg-green-500/5 border border-green-500/10">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                                    <CreditCard className="w-3 h-3 text-green-400" />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-sm font-mono font-medium text-green-400">रू {p.amount.toLocaleString()}</p>
                                                                                    {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {item.status !== "active" && item.date_redeemed && (
                                                            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                                                                <p className="text-xs text-muted-foreground mb-1">
                                                                    {item.status === "redeemed" ? "Date Redeemed" : "Date Forfeited"}
                                                                </p>
                                                                <p className="font-mono text-sm">{new Date(item.date_redeemed).toLocaleDateString()}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </section>
            </main>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* DIALOGS                                                           */}
            {/* ═══════════════════════════════════════════════════════════════════ */}

            {/* ─── New Dhito Dialog ─── */}
            <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
                <DialogContent className="glass-card sm:max-w-lg border-primary/20">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2"><HandCoins className="w-6 h-6 text-primary" /> New Dhito Entry</DialogTitle>
                        <DialogDescription>Record a new pawned item with customer details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Customer Name *</Label>
                                <Input
                                    value={form.customer}
                                    onChange={e => handleCustomerSearch(e.target.value)}
                                    onFocus={() => form.customer.length >= 2 && setShowSuggestions(customerSuggestions.length > 0)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    className="mt-1 bg-background/50"
                                    placeholder="राम बहादुर"
                                />
                                {showSuggestions && (
                                    <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden">
                                        {customerSuggestions.map((c, i) => (
                                            <button
                                                key={i}
                                                className="w-full px-3 py-2 text-left hover:bg-primary/10 text-sm flex justify-between transition-colors"
                                                onMouseDown={() => {
                                                    setForm(f => ({ ...f, customer: c.name, phone: c.phone }));
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <span>{c.name}</span>
                                                {c.phone && <span className="text-muted-foreground text-xs">{c.phone}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
                                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 bg-background/50" placeholder="98XXXXXXXX" />
                            </div>
                        </div>

                        {/* Item Info */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Item Description *</Label>
                                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 bg-background/50" placeholder="Gold Ring, Necklace..." />
                            </div>
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-primary">Karat</Label>
                                <select
                                    value={form.karat}
                                    onChange={e => setForm({ ...form, karat: e.target.value })}
                                    className="mt-1 w-full h-9 rounded-md border border-input bg-background/50 px-3 text-sm"
                                >
                                    <option value="24K">24K Gold</option>
                                    <option value="22K">22K Gold</option>
                                    <option value="18K">18K Gold</option>
                                    <option value="Silver">Silver</option>
                                </select>
                            </div>
                        </div>

                        {/* Weight TML */}
                        <div>
                            <Label className="text-xs uppercase tracking-wider text-primary mb-2 block">Weight (Tola - Masha - Lal)</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Tola</Label>
                                    <Input type="number" min="0" value={form.tola} onChange={e => setForm({ ...form, tola: e.target.value })} className="mt-1 bg-background/50 border-primary/30 font-mono" placeholder="0" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Masha</Label>
                                    <Input type="number" min="0" max="11" value={form.masha} onChange={e => setForm({ ...form, masha: e.target.value })} className="mt-1 bg-background/50 border-primary/30 font-mono" placeholder="0" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Lal</Label>
                                    <Input type="number" min="0" max="9" value={form.lal} onChange={e => setForm({ ...form, lal: e.target.value })} className="mt-1 bg-background/50 border-primary/30 font-mono" placeholder="0" />
                                </div>
                            </div>
                            {liveGrams > 0 && (
                                <p className="mt-2 text-xs text-primary font-mono bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 inline-block">
                                    ≈ {liveGrams.toFixed(2)} grams
                                </p>
                            )}
                        </div>

                        {/* Financial */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Loan Amount रू *</Label>
                                <Input type="number" value={form.loan} onChange={e => setForm({ ...form, loan: e.target.value })} className="mt-1 bg-background/50 font-mono" placeholder="50,000" />
                            </div>
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Interest %/yr</Label>
                                <Input type="number" value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} className="mt-1 bg-background/50 font-mono" placeholder="24" />
                                <p className="text-xs text-muted-foreground mt-1">{((Number(form.interest) || 0) / 12).toFixed(1)}% monthly</p>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes (Optional)</Label>
                            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 bg-background/50 min-h-[60px]" placeholder="Any additional details..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleAdd}
                            disabled={!form.customer || !form.loan || !form.description}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full shadow-lg shadow-primary/20 h-11 text-base"
                        >
                            <HandCoins className="w-4 h-4 mr-2" /> Record Dhito
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Payment Dialog ─── */}
            <Dialog open={payDialogOpen} onOpenChange={(open) => { setPayDialogOpen(open); if (!open) setSelectedItem(null); }}>
                <DialogContent className="glass-card sm:max-w-md border-blue-500/20">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400" /> Record Payment</DialogTitle>
                        <DialogDescription>Record a partial interest payment for {selectedItem?.customer_name}.</DialogDescription>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                                    <p className="text-xs text-muted-foreground">Principal</p>
                                    <p className="font-mono font-semibold">रू {selectedItem.loan_amount.toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-xs text-amber-400">Interest Owed</p>
                                    <p className="font-mono font-semibold text-amber-400">रू {settlementCalc.interest.toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <p className="text-xs text-green-400">Already Paid</p>
                                    <p className="font-mono font-semibold text-green-400">रू {settlementCalc.paid.toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                    <p className="text-xs text-primary">Days Elapsed</p>
                                    <p className="font-mono font-semibold">{settlementCalc.days} days</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Payment Amount रू</Label>
                                <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="mt-1 bg-background/50 font-mono text-lg" placeholder="Enter amount..." autoFocus />
                            </div>
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Note (Optional)</Label>
                                <Input value={payNote} onChange={e => setPayNote(e.target.value)} className="mt-1 bg-background/50" placeholder="Monthly interest payment..." />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handlePayment} disabled={!payAmount || Number(payAmount) <= 0} className="w-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 h-10">
                            <CreditCard className="w-4 h-4 mr-2" /> Record Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Redemption Settlement Dialog ─── */}
            <Dialog open={redeemDialogOpen} onOpenChange={(open) => { setRedeemDialogOpen(open); if (!open) setSelectedItem(null); }}>
                <DialogContent className="glass-card sm:max-w-md border-green-500/20">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" /> Final Settlement</DialogTitle>
                        <DialogDescription>Settle and redeem the pawned item for {selectedItem?.customer_name}.</DialogDescription>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 rounded-xl bg-background/50 border border-border/30 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Principal Loan</span>
                                    <span className="font-mono font-semibold">रू {settlementCalc.principal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-amber-400">+ Total Interest ({settlementCalc.days} days)</span>
                                    <span className="font-mono font-semibold text-amber-400">रू {settlementCalc.interest.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-400">− Payments Made</span>
                                    <span className="font-mono font-semibold text-green-400">रू {settlementCalc.paid.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-border/30 pt-3 flex justify-between text-lg">
                                    <span className="font-semibold text-primary">Net Payable</span>
                                    <span className="font-mono font-bold text-primary">रू {settlementCalc.net.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                                <p className="font-semibold mb-1">✓ Upon confirmation:</p>
                                <p>• The item will be returned to {selectedItem.customer_name}</p>
                                <p>• Status will be marked as &quot;Redeemed&quot;</p>
                                <p>• An audit trail entry will be created</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setRedeemDialogOpen(false); setSelectedItem(null); }} className="flex-1">Cancel</Button>
                        <Button onClick={handleRedeem} className="flex-1 bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Redemption
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Forfeiture Dialog ─── */}
            <Dialog open={forfeitDialogOpen} onOpenChange={(open) => { setForfeitDialogOpen(open); if (!open) setSelectedItem(null); }}>
                <DialogContent className="glass-card sm:max-w-md border-red-500/20">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2"><Ban className="w-5 h-5 text-red-400" /> Forfeit Item (जब्त)</DialogTitle>
                        <DialogDescription>This action cannot be undone. The item will be permanently forfeited.</DialogDescription>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2 text-sm">
                                <p><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{selectedItem.customer_name}</span></p>
                                <p><span className="text-muted-foreground">Item:</span> <span className="font-medium">{selectedItem.item_description} ({selectedItem.gold_karat})</span></p>
                                <p><span className="text-muted-foreground">Weight:</span> <span className="font-mono">{gramsToTMLDisplay(selectedItem.weight_grams)}</span></p>
                                <p><span className="text-muted-foreground">Outstanding:</span> <span className="font-mono font-semibold text-red-400">रू {settlementCalc.net.toLocaleString()}</span></p>
                                <p><span className="text-muted-foreground">Days Elapsed:</span> <span className="font-mono">{settlementCalc.days} days</span></p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                                <p className="font-semibold mb-1">⚠️ Warning:</p>
                                <p>Forfeiting this item means the shop claims ownership. This is typically done when the customer has not redeemed the item within the agreed period (6 months).</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setForfeitDialogOpen(false); setSelectedItem(null); }} className="flex-1">Cancel</Button>
                        <Button onClick={handleForfeit} className="flex-1 bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20">
                            <Ban className="w-4 h-4 mr-2" /> Confirm Forfeiture
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
