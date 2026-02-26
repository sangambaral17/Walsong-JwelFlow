"use client";

import { useState, useEffect } from "react";
import { getDb } from "@/lib/db";
import { toGrams, calculateFinalPrice, formatTML, toTolaMashaLal } from "@/lib/jewelry-math";
import { useShop } from "@/lib/shop-context";
import { useAuth } from "@/lib/auth-context";
import Decimal from "decimal.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Scale, ShoppingCart, Printer, Plus, Trash2, QrCode, CheckCircle2, Usb, User, Search, X, Package } from "lucide-react";
import Link from "next/link";

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

interface CustomerInfo {
    name: string;
    phone: string;
    address: string;
}

interface InvoiceData {
    id: string;
    date: string;
    customer: CustomerInfo;
    items: CartItem[];
    subtotal: string;
    vatAmount: string;
    grandTotal: string;
    paidAmount: string;
    balanceDue: string;
    cashier: string;
    paymentMethod: string;
}

export default function POSPage() {
    const { profile } = useShop();
    const { user } = useAuth();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [goldRate, setGoldRate] = useState(314800);
    const [silverRate, setSilverRate] = useState(4200);
    const [scaleWeight, setScaleWeight] = useState<number | null>(null);
    const [scaleConnected, setScaleConnected] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [lastInvoice, setLastInvoice] = useState<InvoiceData | null>(null);

    // Customer state
    const [customer, setCustomer] = useState<CustomerInfo>({ name: "", phone: "", address: "" });
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerResults, setCustomerResults] = useState<any[]>([]);
    const [showCustomerPanel, setShowCustomerPanel] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [isPartialPayment, setIsPartialPayment] = useState(false);
    const [paidAmountInput, setPaidAmountInput] = useState("");

    // Inventory search state
    const [inventorySearch, setInventorySearch] = useState("");
    const [inventoryResults, setInventoryResults] = useState<any[]>([]);
    const [showInventorySearch, setShowInventorySearch] = useState(true);

    // Form for adding items
    const [form, setForm] = useState({
        name: "", category: "Gold", tola: "", masha: "", lal: "", wastage: "", making: "",
    });

    useEffect(() => {
        (async () => {
            const db = await getDb();
            const today = new Date().toISOString().split("T")[0];
            const rate = await db.rates.findOne(today).exec();
            if (rate) {
                setGoldRate(rate.gold_tola_rate);
                setSilverRate(rate.silver_tola_rate);
            }
        })();
    }, []);

    // Search existing customers
    useEffect(() => {
        if (!customerSearch.trim()) {
            setCustomerResults([]);
            return;
        }
        const search = async () => {
            const db = await getDb();
            const all = await db.customers.find().exec();
            const q = customerSearch.toLowerCase();
            const filtered = all
                .map((d: any) => d.toJSON())
                .filter((c: any) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q));
            setCustomerResults(filtered.slice(0, 5));
        };
        search();
    }, [customerSearch]);

    // Search inventory items for POS
    useEffect(() => {
        if (!inventorySearch.trim()) {
            setInventoryResults([]);
            return;
        }
        const searchInventory = async () => {
            const db = await getDb();
            const all = await db.inventory.find().exec();
            const q = inventorySearch.toLowerCase();
            const filtered = all
                .map((d: any) => d.toJSON())
                .filter((item: any) =>
                    item.name?.toLowerCase().includes(q) ||
                    item.category?.toLowerCase().includes(q)
                );
            setInventoryResults(filtered.slice(0, 8));
        };
        searchInventory();
    }, [inventorySearch]);

    const selectInventoryItem = (item: any) => {
        setForm({
            name: item.name || "",
            category: item.category || "Gold",
            tola: String(item.weight_tola || 0),
            masha: String(item.weight_masha || 0),
            lal: String(item.weight_lal || 0),
            wastage: String(item.jarti || 0),
            making: String(item.jyala || 0),
        });
        setInventorySearch("");
        setInventoryResults([]);
        setShowInventorySearch(false);
        console.log(`[POS] Selected inventory item: ${item.name} (${item.net_weight_grams}g)`);
    };

    const selectCustomer = (c: any) => {
        setCustomer({ name: c.name, phone: c.phone || "", address: c.address || "" });
        setCustomerSearch("");
        setCustomerResults([]);
    };

    const handleCaptureWeight = async () => {
        try {
            if (!("serial" in navigator)) {
                alert("Web Serial API not supported. Using manual weight entry.");
                return;
            }
            const { WeighingScaleService } = await import("@/lib/hardware/weighing-scale");
            const service = new WeighingScaleService();
            const connected = await service.connect();
            if (connected) {
                setScaleConnected(true);
                service.readWeight((w) => {
                    setScaleWeight(w);
                    const tml = toTolaMashaLal(w);
                    setForm(f => ({ ...f, tola: String(tml.tola), masha: String(tml.masha), lal: String(tml.lal) }));
                });
            }
        } catch (e) {
            console.error("Scale error:", e);
        }
    };

    const handleAddToCart = () => {
        const weightGrams = toGrams({
            tola: Number(form.tola) || 0,
            masha: Number(form.masha) || 0,
            lal: Number(form.lal) || 0,
        });
        if (weightGrams.lte(0)) {
            alert("Please enter the weight before adding to cart.");
            return;
        }
        const rate = form.category === "Silver" ? silverRate : goldRate;
        const pricing = calculateFinalPrice({
            ratePerTola: rate,
            weightGrams: weightGrams,
            wastageAmount: Number(form.wastage) || 0,
            makingCharge: Number(form.making) || 0,
        });

        const item: CartItem = {
            id: crypto.randomUUID(),
            name: form.name || `${form.category} Item`,
            category: form.category,
            weightGrams: weightGrams.toNumber(),
            ratePerTola: rate,
            wastage: Number(form.wastage) || 0,
            making: Number(form.making) || 0,
            total: pricing.total.toString(),
        };
        setCart([...cart, item]);
        setForm({ name: "", category: "Gold", tola: "", masha: "", lal: "", wastage: "", making: "" });
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter((c) => c.id !== id));
    };

    const grandTotal = cart.reduce((acc, item) => acc.plus(new Decimal(item.total)), new Decimal(0));

    const handleCheckout = async () => {
        if (!customer.name.trim()) {
            alert("Please enter customer name before generating invoice.");
            return;
        }
        if (cart.length === 0) {
            alert("Cart is empty. Add items before checkout.");
            return;
        }

        const db = await getDb();
        const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;

        // Calculate true totals
        let totalSubtotal = new Decimal(0);
        let totalVat = new Decimal(0);

        for (const item of cart) {
            const pricing = calculateFinalPrice({
                ratePerTola: item.ratePerTola,
                weightGrams: item.weightGrams,
                wastageAmount: item.wastage,
                makingCharge: item.making,
            });
            totalSubtotal = totalSubtotal.plus(pricing.subtotal);
            totalVat = totalVat.plus(pricing.vatAmount);

            // Write immutable audit log entry for each sale item
            await db.audit_log.insert({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                action: "SALE",
                details: JSON.stringify({
                    invoice_id: invoiceId,
                    customer: customer.name,
                    item: item.name,
                    category: item.category,
                    weight_grams: item.weightGrams,
                    rate: item.ratePerTola,
                    wastage: item.wastage,
                    making: item.making,
                    total: item.total,
                    total_amount: Number(item.total),
                }),
                user: user?.name || "staff",
            });
        }

        // Partial payment logic
        const paidAmt = isPartialPayment
            ? new Decimal(paidAmountInput || "0")
            : grandTotal;
        const balAmt = grandTotal.minus(paidAmt);
        const effectivePaymentMethod = isPartialPayment && balAmt.gt(0) ? "credit" : paymentMethod;

        const invoiceData: InvoiceData = {
            id: invoiceId,
            date: new Date().toISOString(),
            customer: { ...customer },
            items: [...cart],
            subtotal: totalSubtotal.toFixed(2),
            vatAmount: totalVat.toFixed(2),
            grandTotal: grandTotal.toFixed(2),
            paidAmount: paidAmt.toFixed(2),
            balanceDue: balAmt.lt(0) ? "0.00" : balAmt.toFixed(2),
            cashier: user?.name || "Staff",
            paymentMethod: effectivePaymentMethod,
        };

        // Save invoice to DB for history
        await db.invoices.insert({
            id: invoiceId,
            date: invoiceData.date,
            customer_name: customer.name,
            customer_phone: customer.phone,
            customer_address: customer.address,
            items: JSON.stringify(cart),
            subtotal: totalSubtotal.toNumber(),
            vat_amount: totalVat.toNumber(),
            grand_total: grandTotal.toNumber(),
            paid_amount: paidAmt.toNumber(),
            balance_due: balAmt.lt(0) ? 0 : balAmt.toNumber(),
            cashier: invoiceData.cashier,
            payment_method: effectivePaymentMethod,
            notes: "",
        });

        // Save new customer if not already in DB
        if (customer.name.trim()) {
            const exists = await db.customers.find({ selector: { name: customer.name } }).exec();
            if (exists.length === 0) {
                await db.customers.insert({
                    id: crypto.randomUUID(),
                    name: customer.name,
                    phone: customer.phone,
                    address: customer.address,
                    notes: "",
                    created_at: new Date().toISOString(),
                });
            }
        }

        setLastInvoice(invoiceData);
        setShowInvoice(true);
        setCart([]);
        setIsPartialPayment(false);
        setPaidAmountInput("");
    };

    const handlePrintInvoice = () => {
        if (!lastInvoice) return;

        const shopName = profile.shop_name || "Walsong Jewellers";
        const shopAddr = profile.address || "Kathmandu, Nepal";
        const shopPan = profile.pan_vat_number || "N/A";
        const shopPhone = profile.phone || "N/A";
        const footer = profile.invoice_footer || "Thank you for your business!";
        const dateObj = new Date(lastInvoice.date);
        const dateStr = dateObj.toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" });
        const timeStr = dateObj.toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" });

        // Build item rows
        const itemRows = lastInvoice.items.map((item, i) => {
            const tml = toTolaMashaLal(item.weightGrams);
            const pricing = calculateFinalPrice({ ratePerTola: item.ratePerTola, weightGrams: item.weightGrams, wastageAmount: item.wastage, makingCharge: item.making });
            return `<tr>
                <td style="padding:4px 6px;border-bottom:1px solid #eee;font-size:10px;">${i + 1}</td>
                <td style="padding:4px 6px;border-bottom:1px solid #eee;font-size:10px;font-weight:600;">${item.name}</td>
                <td style="padding:4px 6px;border-bottom:1px solid #eee;font-size:10px;">${item.category}</td>
                <td style="padding:4px 6px;border-bottom:1px solid #eee;font-size:10px;font-family:monospace;">${formatTML(tml)} (${item.weightGrams.toFixed(2)}g)</td>
                <td style="padding:4px 6px;border-bottom:1px solid #eee;font-size:10px;text-align:right;font-family:monospace;">रू${item.ratePerTola.toLocaleString()}</td>
                <td style="padding:4px 6px;border-bottom:1px solid #eee;font-size:10px;text-align:right;font-family:monospace;">रू${item.wastage.toLocaleString()}</td>
                <td style="padding:4px 6px;border-bottom:1px solid #eee;font-size:10px;text-align:right;font-family:monospace;">रू${item.making.toLocaleString()}</td>
                <td style="padding:4px 6px;border-bottom:1px solid #eee;font-size:10px;text-align:right;font-family:monospace;font-weight:700;">रू${pricing.subtotal.toFixed(2)}</td>
            </tr>`;
        }).join("");

        const balanceDueSection = Number(lastInvoice.balanceDue) > 0 ? `
            <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;border-top:1px dashed #aaa;margin-top:4px;">
                <span>Paid Today (${lastInvoice.paymentMethod.toUpperCase()})</span>
                <span style="font-family:monospace;color:#16a34a;">रू ${Number(lastInvoice.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;font-weight:700;color:#dc2626;">
                <span>⚠ BALANCE DUE (Credit)</span>
                <span style="font-family:monospace;">रू ${Number(lastInvoice.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <p style="font-size:9px;color:#666;font-style:italic;margin-top:2px;">* Outstanding balance. Interest may apply after 30 days.</p>
        ` : "";

        const printHtml = `<!DOCTYPE html><html><head>
            <title>Invoice ${lastInvoice.id}</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #000; background: #fff; max-width: 210mm; padding: 12mm; margin: 0 auto; }
                table { width: 100%; border-collapse: collapse; }
                @media print { @page { size: A5; margin: 12mm; } }
            </style>
        </head><body>
            <!-- Header -->
            <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:8px;">
                <h1 style="font-size:20px;font-weight:800;margin:0;letter-spacing:1px;">✦ ${shopName} ✦</h1>
                <p style="margin:2px 0;font-size:10px;color:#444;">${shopAddr}</p>
                <p style="margin:2px 0;font-size:10px;color:#444;">PAN/VAT: ${shopPan} &nbsp;•&nbsp; Phone: ${shopPhone}</p>
                <p style="font-weight:700;margin-top:6px;font-size:13px;letter-spacing:2px;">TAX INVOICE</p>
            </div>

            <!-- Meta -->
            <div style="display:flex;justify-content:space-between;font-size:10px;padding:6px 0;border-bottom:1px solid #ccc;margin-bottom:8px;">
                <div><strong>Invoice #:</strong> ${lastInvoice.id}<br/><strong>Cashier:</strong> ${lastInvoice.cashier}<br/><strong>Payment:</strong> ${lastInvoice.paymentMethod.toUpperCase()}</div>
                <div style="text-align:right;"><strong>Date:</strong> ${dateStr}<br/><strong>Time:</strong> ${timeStr}</div>
            </div>

            <!-- Customer -->
            <div style="border:1px solid #ccc;padding:6px 10px;margin-bottom:10px;font-size:10px;">
                <strong>Bill To:</strong><br/>
                <span style="font-size:12px;font-weight:700;">${lastInvoice.customer.name}</span><br/>
                ${lastInvoice.customer.phone ? `Phone: ${lastInvoice.customer.phone}<br/>` : ""}
                ${lastInvoice.customer.address ? `Address: ${lastInvoice.customer.address}` : ""}
            </div>

            <!-- Items Table -->
            <table style="margin-bottom:8px;">
                <thead><tr style="background:#f3f3f3;">
                    <th style="text-align:left;padding:6px;font-size:9px;border-bottom:2px solid #000;">#</th>
                    <th style="text-align:left;padding:6px;font-size:9px;border-bottom:2px solid #000;">Item</th>
                    <th style="text-align:left;padding:6px;font-size:9px;border-bottom:2px solid #000;">Type</th>
                    <th style="text-align:left;padding:6px;font-size:9px;border-bottom:2px solid #000;">Weight</th>
                    <th style="text-align:right;padding:6px;font-size:9px;border-bottom:2px solid #000;">Rate/T</th>
                    <th style="text-align:right;padding:6px;font-size:9px;border-bottom:2px solid #000;">Jarti</th>
                    <th style="text-align:right;padding:6px;font-size:9px;border-bottom:2px solid #000;">Jyala</th>
                    <th style="text-align:right;padding:6px;font-size:9px;border-bottom:2px solid #000;">Amount</th>
                </tr></thead>
                <tbody>${itemRows}</tbody>
            </table>

            <!-- Totals -->
            <div style="border-top:2px solid #000;padding-top:8px;margin-top:8px;">
                <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>Subtotal (before VAT)</span><span style="font-family:monospace;">रू ${Number(lastInvoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>VAT (13%)</span><span style="font-family:monospace;">रू ${Number(lastInvoice.vatAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                <div style="display:flex;justify-content:space-between;padding:6px 0 0;font-size:15px;font-weight:800;border-top:1px solid #000;margin-top:4px;"><span>GRAND TOTAL</span><span style="font-family:monospace;">रू ${Number(lastInvoice.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                ${balanceDueSection}
            </div>

            <!-- Footer -->
            <div style="text-align:center;margin-top:16px;padding-top:8px;border-top:1px dashed #999;font-size:9px;color:#666;">
                <p>${footer}</p>
                <p style="margin-top:4px;">Powered by Walsong JwelFlow ERP • © ${new Date().getFullYear()}</p>
            </div>
        </body></html>`;

        const printWindow = window.open("", "_blank", "width=600,height=800");
        if (printWindow) {
            printWindow.document.write(printHtml);
            printWindow.document.close();
            printWindow.onload = () => { printWindow.focus(); printWindow.print(); printWindow.close(); };
            setTimeout(() => { try { printWindow.focus(); printWindow.print(); printWindow.close(); } catch { } }, 1500);
        }
    };

    const currentWeightGrams = toGrams({
        tola: Number(form.tola) || 0,
        masha: Number(form.masha) || 0,
        lal: Number(form.lal) || 0,
    });
    const currentRate = form.category === "Silver" ? silverRate : goldRate;
    const livePrice = calculateFinalPrice({
        ratePerTola: currentRate,
        weightGrams: currentWeightGrams,
        wastageAmount: Number(form.wastage) || 0,
        makingCharge: Number(form.making) || 0,
    });

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* === PRINT-ONLY INVOICE === */}
            {lastInvoice && (
                <div className="hidden print:block" id="printable-invoice">
                    <style>{`
                        @media print {
                            @page { size: A5; margin: 12mm; }
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .no-print, header.no-print, main.no-print, [role="dialog"] { display: none !important; }
                            #printable-invoice { display: block !important; font-family: 'Segoe UI', Arial, sans-serif; color: #000; font-size: 11px; }
                            #printable-invoice * { box-sizing: border-box; }
                        }
                    `}</style>

                    <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 8, marginBottom: 8 }}>
                        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: 1 }}>✦ {profile.shop_name || "Walsong Jewellers"} ✦</h1>
                        <p style={{ margin: "2px 0", fontSize: 10, color: "#444" }}>{profile.address || "Kathmandu, Nepal"}</p>
                        <p style={{ margin: "2px 0", fontSize: 10, color: "#444" }}>PAN/VAT: {profile.pan_vat_number || "N/A"} &nbsp;•&nbsp; Phone: {profile.phone || "N/A"}</p>
                        <p style={{ fontWeight: 700, marginTop: 6, fontSize: 13, letterSpacing: 2 }}>TAX INVOICE</p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "6px 0", borderBottom: "1px solid #ccc", marginBottom: 8 }}>
                        <div>
                            <strong>Invoice #:</strong> {lastInvoice.id}<br />
                            <strong>Cashier:</strong> {lastInvoice.cashier}<br />
                            <strong>Payment:</strong> {lastInvoice.paymentMethod.toUpperCase()}
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <strong>Date:</strong> {new Date(lastInvoice.date).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}<br />
                            <strong>Time:</strong> {new Date(lastInvoice.date).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                    </div>

                    {/* Customer Box */}
                    <div style={{ border: "1px solid #ccc", padding: "6px 10px", marginBottom: 10, fontSize: 10 }}>
                        <strong>Bill To:</strong><br />
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{lastInvoice.customer.name}</span><br />
                        {lastInvoice.customer.phone && <span>Phone: {lastInvoice.customer.phone}<br /></span>}
                        {lastInvoice.customer.address && <span>Address: {lastInvoice.customer.address}</span>}
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
                        <thead>
                            <tr style={{ background: "#f3f3f3" }}>
                                <th style={{ textAlign: "left", padding: "6px 6px", fontSize: 9, borderBottom: "2px solid #000" }}>#</th>
                                <th style={{ textAlign: "left", padding: "6px 6px", fontSize: 9, borderBottom: "2px solid #000" }}>Item</th>
                                <th style={{ textAlign: "left", padding: "6px 6px", fontSize: 9, borderBottom: "2px solid #000" }}>Type</th>
                                <th style={{ textAlign: "left", padding: "6px 6px", fontSize: 9, borderBottom: "2px solid #000" }}>Weight</th>
                                <th style={{ textAlign: "right", padding: "6px 6px", fontSize: 9, borderBottom: "2px solid #000" }}>Rate/T</th>
                                <th style={{ textAlign: "right", padding: "6px 6px", fontSize: 9, borderBottom: "2px solid #000" }}>Jarti</th>
                                <th style={{ textAlign: "right", padding: "6px 6px", fontSize: 9, borderBottom: "2px solid #000" }}>Jyala</th>
                                <th style={{ textAlign: "right", padding: "6px 6px", fontSize: 9, borderBottom: "2px solid #000" }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lastInvoice.items.map((item, i) => {
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

                    <div style={{ borderTop: "2px solid #000", paddingTop: 8, marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}><span>Subtotal (before VAT)</span><span style={{ fontFamily: "monospace" }}>रू {Number(lastInvoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}><span>VAT (13%)</span><span style={{ fontFamily: "monospace" }}>रू {Number(lastInvoice.vatAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", fontSize: 15, fontWeight: 800, borderTop: "1px solid #000", marginTop: 4 }}><span>GRAND TOTAL</span><span style={{ fontFamily: "monospace" }}>रू {Number(lastInvoice.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        {Number(lastInvoice.balanceDue) > 0 && (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, borderTop: "1px dashed #aaa", marginTop: 4 }}><span>Paid Today ({lastInvoice.paymentMethod.toUpperCase()})</span><span style={{ fontFamily: "monospace", color: "#16a34a" }}>रू {Number(lastInvoice.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, fontWeight: 700, color: "#dc2626" }}><span>⚠ BALANCE DUE (Credit)</span><span style={{ fontFamily: "monospace" }}>रू {Number(lastInvoice.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                <p style={{ fontSize: 9, color: "#666", fontStyle: "italic", marginTop: 2 }}>* Outstanding balance. Interest may apply after 30 days.</p>
                            </>
                        )}
                    </div>

                    <div style={{ textAlign: "center", marginTop: 16 }}>
                        <div style={{ width: 60, height: 60, border: "1px solid #ccc", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                            <QrCode style={{ width: 40, height: 40, color: "#999" }} />
                        </div>
                        <p style={{ fontSize: 8, color: "#aaa", marginTop: 4 }}>IRD Verification QR</p>
                    </div>

                    <div style={{ textAlign: "center", marginTop: 12, paddingTop: 8, borderTop: "1px dashed #999", fontSize: 9, color: "#666" }}>
                        <p>{profile.invoice_footer || "Thank you for your business!"}</p>
                        <p style={{ marginTop: 4 }}>Powered by Walsong JwelFlow ERP • © {new Date().getFullYear()}</p>
                    </div>
                </div>
            )}

            {/* Top bar */}
            <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl no-print">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-border/30" />
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-primary" /> Point of Sale
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/sales">
                            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                                Sales History
                            </Button>
                        </Link>
                        <Badge variant="outline" className="border-primary/30 text-primary font-mono">
                            Gold: रू {goldRate.toLocaleString()}/T
                        </Badge>
                        <Badge variant="outline" className="border-border text-muted-foreground font-mono">
                            Silver: रू {silverRate.toLocaleString()}/T
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-7xl no-print">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* LEFT: Customer + Item Entry */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* Customer Details Card */}
                        <div className="glass-card rounded-xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" /> Customer Details
                                </h2>
                                {customer.name && (
                                    <Button variant="ghost" size="sm" onClick={() => setCustomer({ name: "", phone: "", address: "" })} className="text-muted-foreground hover:text-destructive">
                                        <X className="w-4 h-4 mr-1" /> Clear
                                    </Button>
                                )}
                            </div>

                            {/* Search existing customers */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search existing customer by name or phone..."
                                    value={customerSearch}
                                    onChange={e => setCustomerSearch(e.target.value)}
                                    className="pl-10 bg-background/50"
                                />
                                {customerResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-xl max-h-48 overflow-auto">
                                        {customerResults.map((c: any) => (
                                            <button
                                                key={c.id}
                                                onClick={() => selectCustomer(c)}
                                                className="w-full text-left px-4 py-3 hover:bg-primary/10 border-b border-border/30 last:border-0 transition-colors"
                                            >
                                                <p className="font-medium text-sm">{c.name}</p>
                                                <p className="text-xs text-muted-foreground">{c.phone || "No phone"} • {c.address || "No address"}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Customer Name <span className="text-destructive">*</span></Label>
                                    <Input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="mt-1 bg-background/50" placeholder="Enter name" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
                                    <Input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} className="mt-1 bg-background/50" placeholder="98XXXXXXXX" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Address</Label>
                                    <Input value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="mt-1 bg-background/50" placeholder="Kathmandu" />
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="flex items-center gap-3">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Payment:</Label>
                                {["cash", "bank", "credit"].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setPaymentMethod(m)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${paymentMethod === m ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-background/50 text-muted-foreground border-border hover:border-primary/40"}`}
                                    >
                                        {m === "cash" ? "💵 Cash" : m === "bank" ? "🏦 Bank Transfer" : "📝 Credit"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Inventory Item Search */}
                        <div className="glass-card rounded-xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                                    <Package className="w-5 h-5 text-primary" /> Search Inventory
                                </h2>
                                <button
                                    onClick={() => setShowInventorySearch(!showInventorySearch)}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showInventorySearch ? "Hide" : "Show"}
                                </button>
                            </div>
                            {showInventorySearch && (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search inventory by name or category..."
                                        value={inventorySearch}
                                        onChange={e => setInventorySearch(e.target.value)}
                                        className="pl-10 bg-background/50"
                                    />
                                    {inventoryResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-xl max-h-64 overflow-auto">
                                            {inventoryResults.map((item: any) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => selectInventoryItem(item)}
                                                    className="w-full text-left px-4 py-3 hover:bg-primary/10 border-b border-border/30 last:border-0 transition-colors"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium text-sm">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.category} • {item.net_weight_grams?.toFixed(2)}g
                                                                {item.weight_tola > 0 && ` • ${item.weight_tola}T ${item.weight_masha}M ${item.weight_lal}L`}
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline" className="border-primary/30 text-primary text-xs">{item.category}</Badge>
                                                    </div>
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => { setInventorySearch(""); setInventoryResults([]); setShowInventorySearch(false); }}
                                                className="w-full text-center px-4 py-3 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
                                            >
                                                <Plus className="w-3 h-3 inline mr-1" /> Add New Item Manually
                                            </button>
                                        </div>
                                    )}
                                    {inventorySearch.trim() && inventoryResults.length === 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-xl p-4 text-center">
                                            <p className="text-sm text-muted-foreground">No inventory items found for "{inventorySearch}"</p>
                                            <button
                                                onClick={() => { setInventorySearch(""); setShowInventorySearch(false); }}
                                                className="mt-2 text-primary text-sm font-medium hover:underline"
                                            >
                                                <Plus className="w-3 h-3 inline mr-1" /> Enter item manually
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Item Entry Card */}
                        <div className="glass-card rounded-xl p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold tracking-tight">New Item Entry</h2>
                                <Button variant="outline" size="sm" onClick={handleCaptureWeight} className="border-primary/30 text-primary hover:bg-primary/10">
                                    <Usb className="w-4 h-4 mr-2" />
                                    {scaleConnected ? "Scale Connected" : "Connect Scale"}
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Item Name</Label>
                                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 bg-background/50" placeholder="22K Chain" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Metal Type</Label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full h-9 rounded-md border border-input bg-background/50 px-3 text-sm">
                                        <option value="Gold">Gold</option>
                                        <option value="Silver">Silver</option>
                                    </select>
                                </div>
                            </div>

                            <Separator className="bg-border/30" />

                            <div>
                                <Label className="text-xs uppercase tracking-wider text-primary mb-2 block">Weight (Tola - Masha - Lal)</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Input type="number" value={form.tola} onChange={e => setForm({ ...form, tola: e.target.value })} className="bg-background/50 border-primary/30 focus-visible:ring-primary text-center text-lg font-mono" placeholder="T" />
                                        <span className="text-xs text-muted-foreground text-center block mt-1">Tola</span>
                                    </div>
                                    <div>
                                        <Input type="number" value={form.masha} onChange={e => setForm({ ...form, masha: e.target.value })} className="bg-background/50 border-primary/30 focus-visible:ring-primary text-center text-lg font-mono" placeholder="M" />
                                        <span className="text-xs text-muted-foreground text-center block mt-1">Masha</span>
                                    </div>
                                    <div>
                                        <Input type="number" value={form.lal} onChange={e => setForm({ ...form, lal: e.target.value })} className="bg-background/50 border-primary/30 focus-visible:ring-primary text-center text-lg font-mono" placeholder="L" />
                                        <span className="text-xs text-muted-foreground text-center block mt-1">Lal</span>
                                    </div>
                                </div>
                                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 text-center text-sm">
                                    = <span className="font-mono font-semibold text-primary text-lg">{currentWeightGrams.toFixed(4)}</span> grams
                                    {scaleWeight !== null && (
                                        <span className="ml-4 text-muted-foreground">
                                            <Scale className="w-3 h-3 inline mr-1" /> Live: {scaleWeight.toFixed(2)}g
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Separator className="bg-border/30" />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Jarti (Wastage) रू</Label>
                                    <Input type="number" value={form.wastage} onChange={e => setForm({ ...form, wastage: e.target.value })} className="mt-1 bg-background/50" placeholder="0" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Jyala (Making) रू</Label>
                                    <Input type="number" value={form.making} onChange={e => setForm({ ...form, making: e.target.value })} className="mt-1 bg-background/50" placeholder="0" />
                                </div>
                            </div>

                            {/* Live Pricing */}
                            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Base Price ({currentWeightGrams.div(new Decimal("11.6638")).toFixed(3)}T × रू{currentRate.toLocaleString()})</span>
                                    <span className="font-mono">रू {livePrice.basePrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>+ Jarti (Wastage)</span>
                                    <span className="font-mono">रू {livePrice.wastage.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>+ Jyala (Making)</span>
                                    <span className="font-mono">रू {livePrice.making.toFixed(2)}</span>
                                </div>
                                <Separator className="bg-primary/10" />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="font-mono">रू {livePrice.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>VAT (13%)</span>
                                    <span className="font-mono">रू {livePrice.vatAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 text-primary">
                                    <span>Total</span>
                                    <span className="font-mono">रू {livePrice.total.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button onClick={handleAddToCart} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base shadow-lg shadow-primary/20 transition-all">
                                <Plus className="w-5 h-5 mr-2" /> Add to Cart
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT: Cart & Checkout */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card rounded-xl p-6 space-y-4 sticky top-24">
                            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-primary" /> Cart
                                {cart.length > 0 && <Badge className="bg-primary text-primary-foreground ml-auto">{cart.length}</Badge>}
                            </h2>

                            {cart.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Cart is empty. Add items from the left panel.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-auto">
                                    {cart.map((item) => {
                                        const tml = toTolaMashaLal(item.weightGrams);
                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30">
                                                <div>
                                                    <p className="font-medium text-sm">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{formatTML(tml)} • {item.category}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-sm font-semibold text-primary">रू {Number(item.total).toLocaleString()}</span>
                                                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-destructive/60 hover:text-destructive p-1 h-auto">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Customer summary in cart */}
                            {customer.name && (
                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                                    <p className="font-medium"><User className="w-3 h-3 inline mr-1" /> {customer.name}</p>
                                    {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
                                </div>
                            )}

                            {cart.length > 0 && (
                                <>
                                    <Separator className="bg-border/30" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-lg font-semibold">Grand Total</span>
                                        <span className="text-2xl font-bold text-primary font-mono">रू {grandTotal.toFixed(2)}</span>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["cash", "bank", "credit"] as const).map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setPaymentMethod(m)}
                                                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all capitalize ${paymentMethod === m
                                                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                                                    : "border-border/40 text-muted-foreground hover:border-primary/40"
                                                    }`}
                                            >
                                                {m === "cash" ? "💵 Cash" : m === "bank" ? "🏦 Bank" : "📋 Credit"}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Partial Payment Toggle */}
                                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isPartialPayment}
                                                onChange={(e) => {
                                                    setIsPartialPayment(e.target.checked);
                                                    if (!e.target.checked) setPaidAmountInput("");
                                                }}
                                                className="w-4 h-4 accent-amber-500"
                                            />
                                            <span className="text-sm font-medium text-amber-400">💳 Partial / Advance Payment (Credit)</span>
                                        </label>
                                        {isPartialPayment && (
                                            <div className="space-y-1">
                                                <Label className="text-xs text-amber-300">Amount Paid Today (रू)</Label>
                                                <Input
                                                    type="number"
                                                    value={paidAmountInput}
                                                    onChange={(e) => setPaidAmountInput(e.target.value)}
                                                    placeholder={`Max: ${grandTotal.toFixed(2)}`}
                                                    className="bg-background/60 border-amber-500/30 focus-visible:ring-amber-500"
                                                />
                                                {paidAmountInput && (
                                                    <div className="flex justify-between text-xs pt-1">
                                                        <span className="text-muted-foreground">Balance Due:</span>
                                                        <span className="font-mono font-bold text-red-400">
                                                            रू {Math.max(0, grandTotal.toNumber() - Number(paidAmountInput)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleCheckout}
                                        disabled={!customer.name.trim()}
                                        className="w-full bg-gradient-to-r from-primary to-[#B8962E] text-primary-foreground h-12 text-base shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle2 className="w-5 h-5 mr-2" /> Generate Invoice
                                    </Button>
                                    {!customer.name.trim() && (
                                        <p className="text-xs text-destructive text-center animate-pulse">⚠ Enter customer name to proceed</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Invoice Preview Modal */}
            <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white text-black max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="p-5 pb-0">
                        <DialogTitle className="text-center text-lg font-bold text-black">Invoice Generated Successfully</DialogTitle>
                        <DialogDescription className="text-center text-sm text-gray-500">Review below and print to PDF or paper.</DialogDescription>
                    </DialogHeader>
                    {lastInvoice && (
                        <div className="p-5 pt-3 text-sm text-black">
                            <div className="border border-gray-200 rounded-lg p-5 space-y-4 bg-white">
                                {/* Header */}
                                <div className="text-center border-b-2 border-black pb-3">
                                    <h3 className="font-extrabold text-xl tracking-wide">{profile.shop_name || "Walsong Jewellers"}</h3>
                                    <p className="text-xs text-gray-500">{profile.address || "Kathmandu, Nepal"}</p>
                                    <p className="text-xs text-gray-500">PAN/VAT: {profile.pan_vat_number || "N/A"} • Phone: {profile.phone || "N/A"}</p>
                                    <p className="font-bold text-xs mt-2 tracking-[0.2em] uppercase">Tax Invoice</p>
                                </div>

                                {/* Meta + Customer */}
                                <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-200 pb-3">
                                    <div>
                                        <p><strong>Invoice #:</strong> {lastInvoice.id}</p>
                                        <p><strong>Date:</strong> {new Date(lastInvoice.date).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}</p>
                                        <p><strong>Cashier:</strong> {lastInvoice.cashier}</p>
                                        <p><strong>Payment:</strong> {lastInvoice.paymentMethod.toUpperCase()}</p>
                                    </div>
                                    <div className="border-l border-gray-200 pl-4">
                                        <p className="font-semibold text-gray-700 mb-1">Bill To:</p>
                                        <p className="font-bold text-sm">{lastInvoice.customer.name}</p>
                                        {lastInvoice.customer.phone && <p>Phone: {lastInvoice.customer.phone}</p>}
                                        {lastInvoice.customer.address && <p>Address: {lastInvoice.customer.address}</p>}
                                    </div>
                                </div>

                                {/* Items Table */}
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
                                        {lastInvoice.items.map((item, i) => {
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

                                {/* Totals */}
                                <div className="border-t-2 border-black pt-3 space-y-1">
                                    <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-mono">रू {Number(lastInvoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                    <div className="flex justify-between text-sm"><span>VAT (13%)</span><span className="font-mono">रू {Number(lastInvoice.vatAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                    <div className="flex justify-between text-base font-extrabold border-t border-black pt-2 mt-2"><span>GRAND TOTAL</span><span className="font-mono text-lg">रू {Number(lastInvoice.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                    {Number(lastInvoice.balanceDue) > 0 && (
                                        <>
                                            <div className="flex justify-between text-sm text-green-700 border-t border-dashed border-gray-300 pt-2"><span>Paid Today</span><span className="font-mono">रू {Number(lastInvoice.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                            <div className="flex justify-between text-base font-extrabold text-red-600"><span>⚠ BALANCE DUE</span><span className="font-mono">रू {Number(lastInvoice.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                            <p className="text-[9px] text-gray-400 italic">* Balance is due. Interest may apply after 30 days.</p>
                                        </>
                                    )}
                                </div>

                                {/* QR + Footer */}
                                <div className="text-center pt-4 border-t border-dashed border-gray-300 mt-4">
                                    <div className="w-16 h-16 mx-auto border border-gray-300 rounded flex items-center justify-center bg-gray-50">
                                        <QrCode className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-1">IRD Verification QR</p>
                                    <p className="text-[10px] text-gray-500 mt-3">{profile.invoice_footer || "Thank you for your business!"}</p>
                                    <p className="text-[9px] text-gray-400">Powered by Walsong JwelFlow ERP</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="p-4 pt-0 flex gap-2">
                        <Button onClick={() => setShowInvoice(false)} variant="outline" className="flex-1 text-gray-700 border-gray-300">
                            Close
                        </Button>
                        <Button onClick={handlePrintInvoice} className="flex-1 bg-black text-white hover:bg-gray-800">
                            <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
