"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDb } from "@/lib/db";
import { toGrams, calculateFinalPrice, formatTML, toTolaMashaLal } from "@/lib/jewelry-math";
import Decimal from "decimal.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Scale, ShoppingCart, Printer, Plus, Minus, Trash2, QrCode, CheckCircle2, Usb } from "lucide-react";
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

export default function POSPage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [goldRate, setGoldRate] = useState(314800);
    const [silverRate, setSilverRate] = useState(4200);
    const [scaleWeight, setScaleWeight] = useState<number | null>(null);
    const [scaleConnected, setScaleConnected] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [lastInvoice, setLastInvoice] = useState<any>(null);

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
        const db = await getDb();

        // Deduct from inventory if matching items exist
        for (const item of cart) {
            // Write immutable audit log entry for each sale
            await db.audit_log.insert({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                action: "SALE",
                details: JSON.stringify({
                    item: item.name,
                    category: item.category,
                    weight_grams: item.weightGrams,
                    rate: item.ratePerTola,
                    wastage: item.wastage,
                    making: item.making,
                    total: item.total,
                }),
                user: "staff",
            });
        }

        setLastInvoice({
            id: `INV-${Date.now().toString(36).toUpperCase()}`,
            date: new Date().toISOString(),
            items: [...cart],
            grandTotal: grandTotal.toFixed(2),
        });
        setShowInvoice(true);
        setCart([]);
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

                    {/* LEFT: Item Entry */}
                    <div className="lg:col-span-3 space-y-6">
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

                            {/* Weight Input: Tola-Masha-Lal */}
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

                            {/* Charges */}
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
                                    <span>+ Wastage</span>
                                    <span className="font-mono">रू {livePrice.wastage.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>+ Making Charge</span>
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

                            {cart.length > 0 && (
                                <>
                                    <Separator className="bg-border/30" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-lg font-semibold">Grand Total</span>
                                        <span className="text-2xl font-bold text-primary font-mono">रू {grandTotal.toFixed(2)}</span>
                                    </div>
                                    <Button onClick={handleCheckout} className="w-full bg-gradient-to-r from-primary to-[#B8962E] text-primary-foreground h-12 text-base shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50">
                                        <CheckCircle2 className="w-5 h-5 mr-2" /> Complete Sale & Print Invoice
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Invoice Modal */}
            <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white text-black">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle className="text-center text-lg font-bold">Sale Complete</DialogTitle>
                        <DialogDescription className="text-center text-sm text-gray-500">Your invoice is ready to print.</DialogDescription>
                    </DialogHeader>
                    {lastInvoice && (
                        <div id="invoice-print" className="p-4 text-sm" style={{ width: "80mm", margin: "0 auto" }}>
                            {/* Receipt Header */}
                            <div className="text-center mb-3">
                                <h3 className="font-bold text-base">✦ Walsong Jewellers ✦</h3>
                                <p className="text-xs text-gray-500">Kathmandu, Nepal • PAN: 123456789</p>
                                <p className="text-xs text-gray-500">Phone: +977-1-XXXXXXX</p>
                            </div>
                            <div className="border-t border-dashed border-gray-300 my-2" />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Invoice: {lastInvoice.id}</span>
                                <span>{new Date(lastInvoice.date).toLocaleDateString("ne-NP")}</span>
                            </div>
                            <div className="border-t border-dashed border-gray-300 my-2" />

                            {/* Line Items */}
                            {lastInvoice.items.map((item: CartItem, i: number) => (
                                <div key={i} className="flex justify-between py-1 text-xs">
                                    <div>
                                        <span className="font-medium">{item.name}</span>
                                        <br /><span className="text-gray-400">{item.weightGrams.toFixed(2)}g {item.category}</span>
                                    </div>
                                    <span className="font-mono">रू {Number(item.total).toLocaleString()}</span>
                                </div>
                            ))}

                            <div className="border-t border-dashed border-gray-300 my-2" />
                            <div className="flex justify-between font-bold text-sm">
                                <span>Grand Total</span>
                                <span className="font-mono">रू {Number(lastInvoice.grandTotal).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-dashed border-gray-300 my-2" />

                            {/* Dummy QR Code for IRD */}
                            <div className="text-center mt-3">
                                <div className="w-20 h-20 mx-auto border border-gray-300 rounded flex items-center justify-center bg-gray-50">
                                    <QrCode className="w-12 h-12 text-gray-400" />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">IRD Verification QR</p>
                            </div>

                            <p className="text-center text-[10px] text-gray-400 mt-3">Thank you for your business!</p>
                            <p className="text-center text-[10px] text-gray-400">Powered by Walsong JwelFlow ERP</p>
                        </div>
                    )}
                    <DialogFooter className="p-4 pt-0">
                        <Button onClick={() => window.print()} className="w-full bg-black text-white hover:bg-gray-800">
                            <Printer className="w-4 h-4 mr-2" /> Print Receipt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
