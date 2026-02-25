"use client";

import { useState, useEffect } from "react";
import { getDb } from "@/lib/db";
import { toTolaMashaLal, formatTML, calculateFinalPrice } from "@/lib/jewelry-math";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Search, Receipt, Printer, Calendar, User, QrCode } from "lucide-react";
import Link from "next/link";
import { useShop } from "@/lib/shop-context";

interface StoredInvoice {
    id: string;
    date: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    items: string; // JSON
    subtotal: number;
    vat_amount: number;
    grand_total: number;
    cashier: string;
    payment_method: string;
    notes: string;
}

interface CartItem {
    id: string;
    name: string;
    category: string;
    weightGrams: number;
    ratePerTola: number;
    wastage: number;
    making: number;
    total: string;
}

export default function SalesHistoryPage() {
    const { profile } = useShop();
    const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const db = await getDb();
            const all = await db.invoices.find().exec();
            const data = all.map((d: any) => d.toJSON() as StoredInvoice);
            // Sort by date descending (newest first)
            data.sort((a: StoredInvoice, b: StoredInvoice) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setInvoices(data);
            setLoading(false);
        };
        load();
    }, []);

    const filtered = invoices.filter(inv => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            inv.id.toLowerCase().includes(q) ||
            inv.customer_name.toLowerCase().includes(q) ||
            inv.customer_phone?.includes(q)
        );
    });

    const todayTotal = invoices
        .filter(inv => inv.date.startsWith(new Date().toISOString().split("T")[0]))
        .reduce((sum, inv) => sum + inv.grand_total, 0);

    const handlePrintInvoice = () => {
        window.print();
    };

    const parsedItems = (inv: StoredInvoice): CartItem[] => {
        try { return JSON.parse(inv.items); } catch { return []; }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Print-only invoice for selected */}
            {selectedInvoice && (
                <div className="hidden print:block" id="printable-invoice">
                    <style>{`
                        @media print {
                            @page { size: A5; margin: 12mm; }
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .no-print, header, main, [role="dialog"] { display: none !important; }
                            #printable-invoice { display: block !important; font-family: 'Segoe UI', Arial, sans-serif; color: #000; font-size: 11px; }
                        }
                    `}</style>
                    <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 8, marginBottom: 8 }}>
                        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>✦ {profile.shop_name || "Walsong Jewellers"} ✦</h1>
                        <p style={{ margin: "2px 0", fontSize: 10, color: "#444" }}>{profile.address || "Kathmandu, Nepal"}</p>
                        <p style={{ margin: "2px 0", fontSize: 10, color: "#444" }}>PAN/VAT: {profile.pan_vat_number || "N/A"} • Phone: {profile.phone || "N/A"}</p>
                        <p style={{ fontWeight: 700, marginTop: 6, fontSize: 13 }}>TAX INVOICE</p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "6px 0", borderBottom: "1px solid #ccc", marginBottom: 8 }}>
                        <div><strong>Invoice #:</strong> {selectedInvoice.id}<br /><strong>Cashier:</strong> {selectedInvoice.cashier}<br /><strong>Payment:</strong> {selectedInvoice.payment_method?.toUpperCase()}</div>
                        <div style={{ textAlign: "right" }}><strong>Date:</strong> {new Date(selectedInvoice.date).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}<br /><strong>Time:</strong> {new Date(selectedInvoice.date).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div style={{ border: "1px solid #ccc", padding: "6px 10px", marginBottom: 10, fontSize: 10 }}>
                        <strong>Bill To:</strong><br />
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{selectedInvoice.customer_name}</span><br />
                        {selectedInvoice.customer_phone && <span>Phone: {selectedInvoice.customer_phone}<br /></span>}
                        {selectedInvoice.customer_address && <span>Address: {selectedInvoice.customer_address}</span>}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
                        <thead>
                            <tr style={{ background: "#f3f3f3" }}>
                                {["#", "Item", "Type", "Weight", "Rate/T", "Jarti", "Jyala", "Amount"].map((h, i) => (
                                    <th key={i} style={{ textAlign: i >= 4 ? "right" : "left", padding: "6px", fontSize: 9, borderBottom: "2px solid #000" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {parsedItems(selectedInvoice).map((item, i) => {
                                const tml = toTolaMashaLal(item.weightGrams);
                                const pricing = calculateFinalPrice({ ratePerTola: item.ratePerTola, weightGrams: item.weightGrams, wastageAmount: item.wastage, makingCharge: item.making });
                                return (
                                    <tr key={i}>
                                        <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", fontSize: 10 }}>{i + 1}</td>
                                        <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", fontSize: 10, fontWeight: 600 }}>{item.name}</td>
                                        <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", fontSize: 10 }}>{item.category}</td>
                                        <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", fontSize: 10, fontFamily: "monospace" }}>{formatTML(tml)} ({item.weightGrams.toFixed(2)}g)</td>
                                        <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", fontSize: 10, textAlign: "right", fontFamily: "monospace" }}>रू{item.ratePerTola.toLocaleString()}</td>
                                        <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", fontSize: 10, textAlign: "right", fontFamily: "monospace" }}>रू{item.wastage.toLocaleString()}</td>
                                        <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", fontSize: 10, textAlign: "right", fontFamily: "monospace" }}>रू{item.making.toLocaleString()}</td>
                                        <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", fontSize: 10, textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>रू{pricing.subtotal.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div style={{ borderTop: "2px solid #000", paddingTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}><span>Subtotal</span><span style={{ fontFamily: "monospace" }}>रू {selectedInvoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}><span>VAT (13%)</span><span style={{ fontFamily: "monospace" }}>रू {selectedInvoice.vat_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", fontSize: 15, fontWeight: 800, borderTop: "1px solid #000", marginTop: 4 }}><span>GRAND TOTAL</span><span style={{ fontFamily: "monospace" }}>रू {selectedInvoice.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    </div>
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                        <div style={{ width: 60, height: 60, border: "1px solid #ccc", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><QrCode style={{ width: 40, height: 40, color: "#999" }} /></div>
                        <p style={{ fontSize: 8, color: "#aaa", marginTop: 4 }}>IRD Verification QR</p>
                    </div>
                    <div style={{ textAlign: "center", marginTop: 12, paddingTop: 8, borderTop: "1px dashed #999", fontSize: 9, color: "#666" }}>
                        <p>{profile.invoice_footer || "Thank you for your business!"}</p>
                    </div>
                </div>
            )}

            <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl no-print">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/pos">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <ArrowLeft className="w-4 h-4 mr-2" /> POS
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-border/30" />
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-primary" /> Sales History
                        </h1>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary font-mono">
                        Today: रू {todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Badge>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6 no-print">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by invoice #, customer name, or phone..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background/50 h-11"
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="glass-card">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-primary">{invoices.length}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Invoices</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-primary">रू {invoices.reduce((s, i) => s + i.grand_total, 0).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-primary">रू {todayTotal.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Today&apos;s Sales</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Invoice List */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Receipt className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">{searchQuery ? "No invoices match your search." : "No sales recorded yet."}</p>
                        <p className="text-sm mt-2">Complete a sale in the POS to see it here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(inv => {
                            const items = parsedItems(inv);
                            return (
                                <button
                                    key={inv.id}
                                    onClick={() => setSelectedInvoice(inv)}
                                    className="w-full text-left glass-card rounded-xl p-4 hover:border-primary/40 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Receipt className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{inv.id}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <User className="w-3 h-3" /> {inv.customer_name}
                                                    <span>•</span>
                                                    <Calendar className="w-3 h-3" /> {new Date(inv.date).toLocaleDateString("en-NP", { month: "short", day: "numeric", year: "numeric" })}
                                                    <span>•</span>
                                                    {items.length} item{items.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary font-mono text-lg">रू {inv.grand_total.toLocaleString()}</p>
                                            <Badge variant="outline" className="text-[10px] border-border">{inv.payment_method?.toUpperCase() || "CASH"}</Badge>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Invoice Detail Modal */}
            <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white text-black max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="p-5 pb-0">
                        <DialogTitle className="text-center text-lg font-bold text-black">{selectedInvoice?.id}</DialogTitle>
                        <DialogDescription className="text-center text-sm text-gray-500">Invoice details and reprint option.</DialogDescription>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="p-5 pt-3 text-sm text-black">
                            <div className="border border-gray-200 rounded-lg p-5 space-y-4 bg-white">
                                <div className="text-center border-b-2 border-black pb-3">
                                    <h3 className="font-extrabold text-xl">{profile.shop_name || "Walsong Jewellers"}</h3>
                                    <p className="text-xs text-gray-500">{profile.address} • PAN: {profile.pan_vat_number}</p>
                                    <p className="font-bold text-xs mt-2 tracking-[0.2em] uppercase">Tax Invoice</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-200 pb-3">
                                    <div>
                                        <p><strong>Invoice #:</strong> {selectedInvoice.id}</p>
                                        <p><strong>Date:</strong> {new Date(selectedInvoice.date).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}</p>
                                        <p><strong>Cashier:</strong> {selectedInvoice.cashier}</p>
                                        <p><strong>Payment:</strong> {selectedInvoice.payment_method?.toUpperCase()}</p>
                                    </div>
                                    <div className="border-l border-gray-200 pl-4">
                                        <p className="font-semibold text-gray-700 mb-1">Bill To:</p>
                                        <p className="font-bold text-sm">{selectedInvoice.customer_name}</p>
                                        {selectedInvoice.customer_phone && <p>Phone: {selectedInvoice.customer_phone}</p>}
                                        {selectedInvoice.customer_address && <p>Address: {selectedInvoice.customer_address}</p>}
                                    </div>
                                </div>

                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="text-left p-2 font-semibold">#</th>
                                            <th className="text-left p-2 font-semibold">Item</th>
                                            <th className="text-left p-2 font-semibold">Type</th>
                                            <th className="text-left p-2 font-semibold">Weight</th>
                                            <th className="text-right p-2 font-semibold">Rate/T</th>
                                            <th className="text-right p-2 font-semibold">Jarti</th>
                                            <th className="text-right p-2 font-semibold">Jyala</th>
                                            <th className="text-right p-2 font-semibold">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedItems(selectedInvoice).map((item, i) => {
                                            const tml = toTolaMashaLal(item.weightGrams);
                                            const pricing = calculateFinalPrice({ ratePerTola: item.ratePerTola, weightGrams: item.weightGrams, wastageAmount: item.wastage, makingCharge: item.making });
                                            return (
                                                <tr key={i} className="border-b border-gray-100">
                                                    <td className="p-2 text-gray-500">{i + 1}</td>
                                                    <td className="p-2 font-medium">{item.name}</td>
                                                    <td className="p-2">{item.category}</td>
                                                    <td className="p-2 font-mono">{formatTML(tml)} <span className="text-gray-400">({item.weightGrams.toFixed(2)}g)</span></td>
                                                    <td className="p-2 text-right font-mono">रू{item.ratePerTola.toLocaleString()}</td>
                                                    <td className="p-2 text-right font-mono">रू{item.wastage.toLocaleString()}</td>
                                                    <td className="p-2 text-right font-mono">रू{item.making.toLocaleString()}</td>
                                                    <td className="p-2 text-right font-mono font-semibold">रू{pricing.subtotal.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                <div className="border-t-2 border-black pt-3 space-y-1">
                                    <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-mono">रू {selectedInvoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                    <div className="flex justify-between text-sm"><span>VAT (13%)</span><span className="font-mono">रू {selectedInvoice.vat_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                    <div className="flex justify-between text-base font-extrabold border-t border-black pt-2 mt-2"><span>GRAND TOTAL</span><span className="font-mono text-lg">रू {selectedInvoice.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="p-4 pt-0 flex gap-2">
                        <Button onClick={() => setSelectedInvoice(null)} variant="outline" className="flex-1 text-gray-700 border-gray-300">Close</Button>
                        <Button onClick={handlePrintInvoice} className="flex-1 bg-black text-white hover:bg-gray-800">
                            <Printer className="w-4 h-4 mr-2" /> Reprint Invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
