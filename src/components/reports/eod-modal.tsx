"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Printer, CheckCircle2 } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { getDb } from "@/lib/db";

interface InvoiceRecord {
    id: string;
    date: string;
    customer_name: string;
    items: string;
    subtotal: number;
    vat_amount: number;
    grand_total: number;
    paid_amount?: number;
    balance_due?: number;
    cashier: string;
    payment_method: string;
}

export function EodModal() {
    const { profile } = useShop();
    const [open, setOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [tallies, setTallies] = useState({
        totalSales: 0,
        totalVat: 0,
        totalSubtotal: 0,
        cashTotal: 0,
        bankTotal: 0,
        creditTotal: 0,
        invoiceCount: 0,
    });

    const fetchTodayInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const db = await getDb();

            // Get today's date string in Nepal timezone (UTC+5:45)
            // This creates a proper Nepal date stamp for comparison
            const nepalNow = new Date(Date.now() + (5 * 60 + 45) * 60000 + new Date().getTimezoneOffset() * 60000);
            const todayStr = nepalNow.toISOString().split("T")[0]; // "YYYY-MM-DD"

            // Fetch ALL invoices and filter by today
            const allInvoices = await db.invoices.find().exec();
            const todayInvoices: InvoiceRecord[] = allInvoices
                .map((doc: any) => doc.toJSON() as InvoiceRecord)
                .filter((inv: InvoiceRecord) => {
                    // Convert stored UTC date to Nepal local date for comparison
                    const invDate = new Date(inv.date);
                    const invNepal = new Date(invDate.getTime() + (5 * 60 + 45) * 60000 + invDate.getTimezoneOffset() * 60000);
                    const invDateStr = invNepal.toISOString().split("T")[0];
                    return invDateStr === todayStr;
                });

            console.log(`[EOD] Found ${allInvoices.length} total invoices, ${todayInvoices.length} for today (${todayStr})`);

            // Aggregate
            let totalSales = 0, totalVat = 0, totalSubtotal = 0;
            let cashTotal = 0, bankTotal = 0, creditTotal = 0;

            todayInvoices.forEach((inv) => {
                totalSales += inv.grand_total || 0;
                totalVat += inv.vat_amount || 0;
                totalSubtotal += inv.subtotal || 0;

                const method = (inv.payment_method || "cash").toLowerCase();
                if (method === "cash") cashTotal += inv.grand_total || 0;
                else if (method === "bank") bankTotal += inv.grand_total || 0;
                else if (method === "credit") creditTotal += inv.grand_total || 0;
                else cashTotal += inv.grand_total || 0;
            });

            setInvoices(todayInvoices);
            setTallies({ totalSales, totalVat, totalSubtotal, cashTotal, bankTotal, creditTotal, invoiceCount: todayInvoices.length });
        } catch (err) {
            console.error("[EOD] Failed to fetch invoices:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) fetchTodayInvoices();
    }, [open, fetchTodayInvoices]);

    const parseItems = (itemsJson: string): any[] => {
        try { return JSON.parse(itemsJson); } catch { return []; }
    };

    const handlePrint = () => {
        console.log(`[EOD] Printing EOD with ${invoices.length} invoices`);
        setIsPrinting(true);

        const shopName = profile.shop_name || "JwelFlow";
        const panVat = profile.pan_vat_number || "N/A";
        const addr = profile.address || "";
        const footer = profile.invoice_footer || "";
        const dateStr = format(new Date(), "yyyy-MM-dd HH:mm");

        const invoiceRows = invoices.map((inv, idx) => {
            const items = parseItems(inv.items);
            const itemLines = items.map((item: any) =>
                `<div style="display:flex;justify-content:space-between;font-size:9px;padding-left:8px;"><span>${item.name || "Item"} (${item.category || ""})</span><span>Rs.${Number(item.total || 0).toLocaleString()}</span></div>`
            ).join("");
            return `<div style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px dotted #ccc;">
                <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:11px;"><span>${idx + 1}. ${inv.id}</span><span>Rs.${(inv.grand_total || 0).toLocaleString()}</span></div>
                <div style="font-size:9px;color:#555;">${inv.customer_name || "Walk-in"} • ${(inv.payment_method || "cash").toUpperCase()}</div>
                ${itemLines}
            </div>`;
        }).join("");

        const bodyContent = invoices.length === 0
            ? `<div style="text-align:center;padding:20px 0;font-weight:bold;border-bottom:1px dashed #000;margin-bottom:12px;">No transactions recorded for this day</div>`
            : `<div style="margin-bottom:12px;"><div style="font-weight:bold;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;">INVOICES (${invoices.length})</div>${invoiceRows}</div>
               <div style="margin-bottom:10px;"><div style="font-weight:bold;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;">PAYMENT BREAKDOWN</div>
                   <div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>Cash:</span><span>Rs.${tallies.cashTotal.toLocaleString()}</span></div>
                   <div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>Bank/Digital:</span><span>Rs.${tallies.bankTotal.toLocaleString()}</span></div>
                   <div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>Credit:</span><span>Rs.${tallies.creditTotal.toLocaleString()}</span></div>
               </div>
               <div style="margin-bottom:10px;"><div style="font-weight:bold;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;">SUMMARY</div>
                   <div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>Subtotal:</span><span>Rs.${tallies.totalSubtotal.toLocaleString()}</span></div>
                   <div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>VAT (13%):</span><span>Rs.${tallies.totalVat.toLocaleString()}</span></div>
                   <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:12px;border-top:1px dashed #000;margin-top:4px;padding-top:4px;"><span>TOTAL SALES:</span><span>Rs.${tallies.totalSales.toLocaleString()}</span></div>
               </div>
               <div style="background:#f0f0f0;padding:8px;border:1px solid #999;margin-top:8px;"><div style="font-size:10px;font-weight:bold;">EXPECTED CASH IN DRAWER</div><div style="font-size:18px;font-weight:bold;">Rs.${tallies.cashTotal.toLocaleString()}</div></div>`;

        const printHtml = `<!DOCTYPE html><html><head><title>EOD - ${dateStr}</title>
            <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;font-size:11px;color:#000;background:#fff;width:80mm;padding:6mm;margin:0 auto;}@media print{@page{size:80mm auto;margin:2mm;}}</style>
        </head><body>
            <div style="text-align:center;border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:10px;">
                <div style="font-size:16px;font-weight:bold;">${shopName}</div>
                <div>PAN: ${panVat}</div><div>${addr}</div>
                <div style="font-weight:bold;margin-top:4px;letter-spacing:2px;">END OF DAY SETTLEMENT</div>
                <div>${dateStr}</div>
            </div>
            ${bodyContent}
            <div style="border-top:1px solid #000;margin-top:12px;padding-top:8px;text-align:center;font-size:9px;color:#555;">
                <div>Total Invoices: ${tallies.invoiceCount}</div>
                <div style="margin-top:12px;">Verified by: _________________</div>
                ${footer ? `<div style="margin-top:8px;">${footer}</div>` : ""}
                <div style="margin-top:4px;">Powered by Walsong JwelFlow ERP</div>
            </div>
        </body></html>`;

        const printWindow = window.open("", "_blank", "width=400,height=700");
        if (printWindow) {
            printWindow.document.write(printHtml);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            };
            // Fallback if onload doesn't fire (some browsers)
            setTimeout(() => {
                try { printWindow.focus(); printWindow.print(); printWindow.close(); } catch { }
            }, 1500);
        }

        setIsPrinting(false);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="print:hidden bg-background/50 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                    <Calculator className="w-4 h-4 mr-2" /> EOD Settlement
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-card sm:max-w-md print:hidden text-foreground max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-primary font-medium flex items-center gap-2">
                        <Calculator className="w-6 h-6" /> Daily Closing
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading today&apos;s data...</div>
                ) : (
                    <div className="space-y-4 py-4">
                        {/* Invoice Count */}
                        <div className="p-3 bg-background/50 rounded-xl border border-border/50 text-center">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Invoices Today</p>
                            <p className="text-3xl font-bold font-mono text-foreground">{tallies.invoiceCount}</p>
                            {tallies.invoiceCount === 0 && (
                                <p className="text-xs text-muted-foreground mt-1">No transactions recorded for this day</p>
                            )}
                        </div>

                        {tallies.invoiceCount > 0 && (
                            <>
                                {/* Revenue */}
                                <div className="p-4 bg-background/50 rounded-xl border border-border/50">
                                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Revenue</h4>
                                    <div className="space-y-2 font-mono">
                                        <div className="flex justify-between text-sm"><span>Subtotal:</span><span>रू {tallies.totalSubtotal.toLocaleString()}</span></div>
                                        <div className="flex justify-between text-sm"><span>VAT (13%):</span><span>रू {tallies.totalVat.toLocaleString()}</span></div>
                                        <div className="flex justify-between text-base font-bold text-foreground border-t border-border/50 pt-2 mt-2">
                                            <span>Total Sales:</span><span className="text-primary">रू {tallies.totalSales.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div className="p-4 bg-background/50 rounded-xl border border-border/50">
                                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Payment Breakdown</h4>
                                    <div className="space-y-2 font-mono text-sm">
                                        <div className="flex justify-between"><span>💵 Cash:</span><span>रू {tallies.cashTotal.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>🏦 Bank/Digital:</span><span>रू {tallies.bankTotal.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>📝 Credit:</span><span>रू {tallies.creditTotal.toLocaleString()}</span></div>
                                    </div>
                                </div>

                                {/* Invoice Details */}
                                <div className="p-4 bg-background/50 rounded-xl border border-border/50 max-h-[200px] overflow-y-auto">
                                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Invoice Details</h4>
                                    <div className="space-y-2">
                                        {invoices.map((inv) => (
                                            <div key={inv.id} className="flex justify-between items-center text-sm py-1 border-b border-border/20 last:border-0">
                                                <div>
                                                    <span className="font-mono text-xs text-primary">{inv.id}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">{inv.customer_name || "Walk-in"}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono font-medium">रू {inv.grand_total?.toLocaleString()}</span>
                                                    <span className="text-xs text-muted-foreground ml-1 uppercase">{inv.payment_method}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Expected Cash */}
                                <div className="p-4 bg-primary/10 rounded-xl border border-primary/30">
                                    <h4 className="text-xs uppercase tracking-wider text-primary mb-1">Expected Cash in Drawer</h4>
                                    <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
                                        रू {tallies.cashTotal.toLocaleString()}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <DialogFooter className="sm:justify-between">
                    <p className="text-xs text-muted-foreground self-center">Prints clean 80mm receipt in a new window.</p>
                    <Button onClick={handlePrint} disabled={isPrinting} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                        {isPrinting ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Printing...</> : <><Printer className="w-4 h-4 mr-2" /> Settle & Print</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
