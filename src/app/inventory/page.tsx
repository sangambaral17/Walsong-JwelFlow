"use client";

import { useState, useEffect, useCallback } from "react";
import { getDb } from "@/lib/db";
import { safeUUID } from "@/lib/utils/safe-uuid";
import { toGrams, formatTML, toTolaMashaLal } from "@/lib/jewelry-math";
import { PinLock } from "@/components/auth/pin-lock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Package, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

interface InventoryItem {
    id: string;
    name: string;
    category: string;
    weight_tola: number;
    weight_masha: number;
    weight_lal: number;
    net_weight_grams: number;
    jarti: number;
    jyala: number;
    created_at: string;
}

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({
        name: "", category: "Gold", tola: "", masha: "", lal: "", jarti: "", jyala: "",
    });

    const loadItems = useCallback(async () => {
        const db = await getDb();
        const results = await db.inventory.find().exec();
        setItems(results.map((r: any) => r.toJSON()));
    }, []);

    useEffect(() => {
        loadItems();
        // Subscribe for live reactivity
        let sub: any;
        (async () => {
            const db = await getDb();
            sub = db.inventory.find().$.subscribe(() => loadItems());
        })();
        return () => sub?.unsubscribe();
    }, [loadItems]);

    const handleAdd = async () => {
        const db = await getDb();
        const weightGrams = toGrams({
            tola: Number(form.tola) || 0,
            masha: Number(form.masha) || 0,
            lal: Number(form.lal) || 0,
        });

        await db.inventory.insert({
            id: safeUUID(),
            name: form.name,
            category: form.category,
            weight_tola: Number(form.tola) || 0,
            weight_masha: Number(form.masha) || 0,
            weight_lal: Number(form.lal) || 0,
            net_weight_grams: weightGrams.toNumber(),
            jarti: Number(form.jarti) || 0,
            jyala: Number(form.jyala) || 0,
            created_at: new Date().toISOString(),
        });

        // Write audit log
        await db.audit_log.insert({
            id: safeUUID(),
            timestamp: new Date().toISOString(),
            action: "INVENTORY_ADD",
            details: `Added ${form.name} (${weightGrams.toFixed(2)}g)`,
            user: "owner",
        });

        setForm({ name: "", category: "Gold", tola: "", masha: "", lal: "", jarti: "", jyala: "" });
        setDialogOpen(false);
    };

    const handleDelete = async (id: string) => {
        const db = await getDb();
        const doc = await db.inventory.findOne(id).exec();
        if (doc) {
            await db.audit_log.insert({
                id: safeUUID(),
                timestamp: new Date().toISOString(),
                action: "INVENTORY_DELETE",
                details: `Removed ${doc.name}`,
                user: "owner",
            });
            await doc.remove();
        }
    };

    const calculatedGrams = toGrams({
        tola: Number(form.tola) || 0,
        masha: Number(form.masha) || 0,
        lal: Number(form.lal) || 0,
    });

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
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
                            <Package className="w-5 h-5 text-primary" /> Inventory
                        </h1>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Add Inventory Item</DialogTitle>
                                <DialogDescription className="text-muted-foreground">Enter weight in Tola-Masha-Lal format.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Item Name</Label>
                                        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 bg-background/50" placeholder="22K Chain" />
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
                                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full h-9 rounded-md border border-input bg-background/50 px-3 text-sm">
                                            <option value="Gold">Gold</option>
                                            <option value="Silver">Silver</option>
                                            <option value="Diamond">Diamond</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-primary">Tola</Label>
                                        <Input type="number" value={form.tola} onChange={e => setForm({ ...form, tola: e.target.value })} className="mt-1 bg-background/50 border-primary/30 focus-visible:ring-primary" placeholder="0" />
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-primary">Masha</Label>
                                        <Input type="number" value={form.masha} onChange={e => setForm({ ...form, masha: e.target.value })} className="mt-1 bg-background/50 border-primary/30 focus-visible:ring-primary" placeholder="0" />
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-primary">Lal</Label>
                                        <Input type="number" value={form.lal} onChange={e => setForm({ ...form, lal: e.target.value })} className="mt-1 bg-background/50 border-primary/30 focus-visible:ring-primary" placeholder="0" />
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-center">
                                    = <span className="font-mono font-semibold text-primary text-lg">{calculatedGrams.toFixed(4)}</span> grams
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Jarti (Wastage) रू</Label>
                                        <Input type="number" value={form.jarti} onChange={e => setForm({ ...form, jarti: e.target.value })} className="mt-1 bg-background/50" placeholder="0" />
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Jyala (Making) रू</Label>
                                        <Input type="number" value={form.jyala} onChange={e => setForm({ ...form, jyala: e.target.value })} className="mt-1 bg-background/50" placeholder="0" />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAdd} disabled={!form.name} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full shadow-lg shadow-primary/20">
                                    Add to Inventory
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <PinLock requiredRole="manager">
                    <div className="glass-card rounded-xl overflow-hidden gold-shimmer">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/30 hover:bg-transparent">
                                    <TableHead className="text-primary uppercase text-xs tracking-wider">Item</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider">Category</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Weight (T-M-L)</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Grams</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Jarti</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Jyala</TableHead>
                                    <TableHead className="text-primary uppercase text-xs tracking-wider text-right w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                            No inventory items yet. Click "Add Item" to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => {
                                        const tml = toTolaMashaLal(item.net_weight_grams);
                                        return (
                                            <TableRow key={item.id} className="border-border/20 hover:bg-primary/5 transition-colors">
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell><Badge variant="outline" className="border-primary/30 text-primary">{item.category}</Badge></TableCell>
                                                <TableCell className="text-right font-mono">{formatTML(tml)}</TableCell>
                                                <TableCell className="text-right font-mono">{item.net_weight_grams.toFixed(2)}g</TableCell>
                                                <TableCell className="text-right font-mono">रू {item.jarti?.toLocaleString() || 0}</TableCell>
                                                <TableCell className="text-right font-mono">रू {item.jyala?.toLocaleString() || 0}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-destructive/60 hover:text-destructive">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{items.length} item(s) in inventory</span>
                        <span className="font-mono">Total gold: {items.filter(i => i.category === 'Gold').reduce((a, b) => a + b.net_weight_grams, 0).toFixed(2)}g</span>
                    </div>
                </PinLock>
            </main>
        </div>
    );
}
