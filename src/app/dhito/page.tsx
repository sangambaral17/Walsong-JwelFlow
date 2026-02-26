"use client";

import { useState, useEffect, useCallback } from "react";
import { getDb } from "@/lib/db";
import { safeUUID } from "@/lib/utils/safe-uuid";
import { toGrams, formatTML, toTolaMashaLal } from "@/lib/jewelry-math";
import { useShop } from "@/lib/shop-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, HandCoins, CheckCircle2, RotateCw } from "lucide-react";
import Link from "next/link";

interface DhitoItem {
    id: string;
    customer_name: string;
    item_description: string;
    weight_grams: number;
    loan_amount: number;
    interest_rate: number;
    date_pawned: string;
    status: string;
}

export default function DhitoPage() {
    const { profile } = useShop();
    const [items, setItems] = useState<DhitoItem[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({
        customer: "", description: "", tola: "", masha: "", lal: "", loan: "", interest: "24",
    });

    const loadItems = useCallback(async () => {
        const db = await getDb();
        const results = await db.dhito.find().exec();
        setItems(results.map((r: any) => r.toJSON()));
    }, []);

    useEffect(() => {
        loadItems();
        let sub: any;
        (async () => { const db = await getDb(); sub = db.dhito.find().$.subscribe(() => loadItems()); })();
        return () => sub?.unsubscribe();
    }, [loadItems]);

    const handleAdd = async () => {
        const db = await getDb();
        const weightGrams = toGrams({ tola: Number(form.tola) || 0, masha: Number(form.masha) || 0, lal: Number(form.lal) || 0 });
        await db.dhito.insert({
            id: safeUUID(),
            customer_name: form.customer,
            item_description: form.description,
            weight_grams: weightGrams.toNumber(),
            loan_amount: Number(form.loan) || 0,
            interest_rate: Number(form.interest) || 24,
            date_pawned: new Date().toISOString(),
            status: "active",
        });
        await db.audit_log.insert({ id: safeUUID(), timestamp: new Date().toISOString(), action: "DHITO_NEW", details: `Loan to ${form.customer} — रू${form.loan}`, user: "staff" });
        setForm({ customer: "", description: "", tola: "", masha: "", lal: "", loan: "", interest: "24" });
        setDialogOpen(false);
    };

    const handleRedeem = async (id: string) => {
        const db = await getDb();
        const doc = await db.dhito.findOne(id).exec();
        if (doc) {
            await doc.patch({ status: "redeemed" });
            await db.audit_log.insert({ id: safeUUID(), timestamp: new Date().toISOString(), action: "DHITO_REDEEM", details: `Redeemed for ${doc.customer_name}`, user: "staff" });
        }
    };

    const active = items.filter(i => i.status === "active");
    const redeemed = items.filter(i => i.status === "redeemed");

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary"><ArrowLeft className="w-4 h-4 mr-2" /> Dashboard</Button></Link>
                        <div className="h-6 w-px bg-border/30" />
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><HandCoins className="w-5 h-5 text-primary" /> Dhito (बन्धकी)</h1>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> New Dhito</Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">New Dhito Entry</DialogTitle>
                                <DialogDescription>Record a new pawned item.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Customer Name</Label><Input value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} className="mt-1 bg-background/50" placeholder="Ram Bahadur" /></div>
                                    <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Item Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 bg-background/50" placeholder="Gold Ring 22K" /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><Label className="text-xs uppercase tracking-wider text-primary">Tola</Label><Input type="number" value={form.tola} onChange={e => setForm({ ...form, tola: e.target.value })} className="mt-1 bg-background/50 border-primary/30" placeholder="0" /></div>
                                    <div><Label className="text-xs uppercase tracking-wider text-primary">Masha</Label><Input type="number" value={form.masha} onChange={e => setForm({ ...form, masha: e.target.value })} className="mt-1 bg-background/50 border-primary/30" placeholder="0" /></div>
                                    <div><Label className="text-xs uppercase tracking-wider text-primary">Lal</Label><Input type="number" value={form.lal} onChange={e => setForm({ ...form, lal: e.target.value })} className="mt-1 bg-background/50 border-primary/30" placeholder="0" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Loan Amount रू</Label><Input type="number" value={form.loan} onChange={e => setForm({ ...form, loan: e.target.value })} className="mt-1 bg-background/50" placeholder="50000" /></div>
                                    <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Interest %/yr</Label><Input type="number" value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} className="mt-1 bg-background/50" placeholder="24" /></div>
                                </div>
                            </div>
                            <DialogFooter><Button onClick={handleAdd} disabled={!form.customer || !form.loan} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full shadow-lg shadow-primary/20">Record Dhito</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
                {/* Active Loans */}
                <section>
                    <h2 className="text-lg font-medium mb-4 text-primary">Active Loans ({active.length})</h2>
                    <div className="glass-card rounded-xl overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/30 hover:bg-transparent">
                                    <TableHead className="text-primary uppercase text-xs tracking-wider">Customer</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider">Item</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Weight</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Loan रू</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Interest</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Date</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider text-right w-24"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {active.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground"><HandCoins className="w-8 h-8 mx-auto mb-2 opacity-30" />No active dhito loans.</TableCell></TableRow>
                                ) : active.map((item) => {
                                    const tml = toTolaMashaLal(item.weight_grams);
                                    return (
                                        <TableRow key={item.id} className="border-border/20 hover:bg-primary/5">
                                            <TableCell className="font-medium">{item.customer_name}</TableCell>
                                            <TableCell className="text-muted-foreground">{item.item_description}</TableCell>
                                            <TableCell className="text-right font-mono">{formatTML(tml)}</TableCell>
                                            <TableCell className="text-right font-mono font-semibold">रू {item.loan_amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono">{item.interest_rate}%</TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">{new Date(item.date_pawned).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleRedeem(item.id)} className="border-green-500/30 text-green-500 hover:bg-green-500/10"><CheckCircle2 className="w-3 h-3 mr-1" /> Redeem</Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </section>

                {/* Redeemed */}
                {redeemed.length > 0 && (
                    <section>
                        <h2 className="text-lg font-medium mb-4 text-muted-foreground">Redeemed ({redeemed.length})</h2>
                        <div className="glass-card rounded-xl overflow-hidden opacity-70">
                            <Table>
                                <TableBody>
                                    {redeemed.map((item) => {
                                        const tml = toTolaMashaLal(item.weight_grams);
                                        return (
                                            <TableRow key={item.id} className="border-border/20">
                                                <TableCell className="font-medium">{item.customer_name}</TableCell>
                                                <TableCell className="text-muted-foreground">{item.item_description}</TableCell>
                                                <TableCell className="text-right font-mono">{formatTML(tml)}</TableCell>
                                                <TableCell className="text-right font-mono">रू {item.loan_amount.toLocaleString()}</TableCell>
                                                <TableCell><Badge variant="outline" className="border-green-500/30 text-green-500">Redeemed</Badge></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
