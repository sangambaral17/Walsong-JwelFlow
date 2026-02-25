"use client";

import { useState, useEffect, useCallback } from "react";
import { getDb } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Users, Phone, MapPin } from "lucide-react";
import Link from "next/link";

interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    notes: string;
    created_at: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });

    const loadCustomers = useCallback(async () => {
        const db = await getDb();
        const results = await db.customers.find().exec();
        setCustomers(results.map((r: any) => r.toJSON()));
    }, []);

    useEffect(() => {
        loadCustomers();
        let sub: any;
        (async () => { const db = await getDb(); sub = db.customers.find().$.subscribe(() => loadCustomers()); })();
        return () => sub?.unsubscribe();
    }, [loadCustomers]);

    const handleAdd = async () => {
        const db = await getDb();
        await db.customers.insert({
            id: crypto.randomUUID(),
            name: form.name,
            phone: form.phone,
            address: form.address,
            notes: form.notes,
            created_at: new Date().toISOString(),
        });
        setForm({ name: "", phone: "", address: "", notes: "" });
        setDialogOpen(false);
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary"><ArrowLeft className="w-4 h-4 mr-2" /> Dashboard</Button></Link>
                        <div className="h-6 w-px bg-border/30" />
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Customers</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Input value={search} onChange={e => setSearch(e.target.value)} className="w-64 bg-background/50" placeholder="Search by name or phone..." />
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> Add Customer</Button>
                            </DialogTrigger>
                            <DialogContent className="glass-card sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl">New Customer</DialogTitle>
                                    <DialogDescription>Add a new customer to your database.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 bg-background/50" placeholder="Ram Bahadur Shrestha" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 bg-background/50" placeholder="+977-98XXXXXXXX" /></div>
                                        <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1 bg-background/50" placeholder="Kathmandu" /></div>
                                    </div>
                                    <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 bg-background/50" placeholder="Regular customer, prefers 22K" /></div>
                                </div>
                                <DialogFooter><Button onClick={handleAdd} disabled={!form.name} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full shadow-lg shadow-primary/20">Add Customer</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="glass-card rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/30 hover:bg-transparent">
                                <TableHead className="text-primary uppercase text-xs tracking-wider">Name</TableHead>
                                <TableHead className="text-primary uppercase text-xs tracking-wider">Phone</TableHead>
                                <TableHead className="text-primary uppercase text-xs tracking-wider">Address</TableHead>
                                <TableHead className="text-primary uppercase text-xs tracking-wider">Notes</TableHead>
                                <TableHead className="text-primary uppercase text-xs tracking-wider text-right">Added</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" />{search ? "No matching customers." : "No customers yet."}</TableCell></TableRow>
                            ) : filtered.map((c) => (
                                <TableRow key={c.id} className="border-border/20 hover:bg-primary/5 transition-colors">
                                    <TableCell className="font-medium">{c.name}</TableCell>
                                    <TableCell className="font-mono text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone || "—"}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.address || "—"}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{c.notes || "—"}</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <p className="text-sm text-muted-foreground mt-4">{filtered.length} customer(s)</p>
            </main>
        </div>
    );
}
