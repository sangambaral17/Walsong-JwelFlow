"use client";

import { useState, useEffect } from "react";
import { getDb } from "@/lib/db";
import { Staff } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Trash2, Key, Users } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

export function StaffManager() {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        name: "",
        pin: "",
        role: "cashier", // Default
    });
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [editPin, setEditPin] = useState("");
    const [editName, setEditName] = useState("");

    const loadStaff = async () => {
        const db = await getDb();
        const allStaff = await db.staff.find().exec();
        setStaffList(allStaff.map((doc: any) => doc.toJSON() as Staff));
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const handleAddStaff = async () => {
        if (!form.name || !form.pin) return;

        // Prevent duplicate PINs for security
        const existing = staffList.find(s => s.pin === form.pin);
        if (existing) {
            alert("This PIN is already in use by another staff member.");
            return;
        }

        const db = await getDb();
        await db.staff.insert({
            id: crypto.randomUUID(),
            name: form.name,
            pin: form.pin,
            role: form.role,
            active: true,
        });

        await db.audit_log.insert({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action: "STAFF_CREATED",
            details: `Created new ${form.role}: ${form.name}`,
            user: "owner"
        });

        setForm({ name: "", pin: "", role: "cashier" });
        setOpen(false);
        loadStaff();
    };

    const handleDelete = async (id: string, name: string) => {
        if (id === "default_owner") {
            alert("Cannot delete the default owner account.");
            return;
        }
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        const db = await getDb();
        const doc = await db.staff.findOne(id).exec();
        if (doc) {
            await doc.remove();
            await db.audit_log.insert({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                action: "STAFF_DELETED",
                details: `Deleted user: ${name}`,
                user: "owner"
            });
            loadStaff();
        }
    };

    const handleUpdatePin = async () => {
        if (!editingStaffId || !editPin) return;

        const db = await getDb();
        const doc = await db.staff.findOne(editingStaffId).exec();
        if (doc) {
            await doc.patch({ pin: editPin, name: editName });
            await db.audit_log.insert({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                action: "STAFF_PIN_UPDATE",
                details: `Updated PIN for user: ${editName}`,
                user: "owner"
            });
            setEditingStaffId(null);
            setEditPin("");
            loadStaff();
        }
    };

    return (
        <section className="glass-card rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-primary flex items-center gap-2">
                    <Users className="w-5 h-5" /> Staff Management
                </h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                            Add Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Staff Name</Label>
                                <Input
                                    placeholder="e.g. Ram Kumar"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="mt-1 bg-background/50"
                                />
                            </div>
                            <div>
                                <Label>Role</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                >
                                    <option value="manager" className="bg-background text-foreground">Manager (Access Inventory & Dhito)</option>
                                    <option value="cashier" className="bg-background text-foreground">Cashier (POS Only)</option>
                                    <option value="owner" className="bg-background text-foreground hidden">Owner</option>
                                </select>
                            </div>
                            <div>
                                <Label>Unique 4-Digit PIN</Label>
                                <Input
                                    type="password"
                                    maxLength={10}
                                    placeholder="••••"
                                    value={form.pin}
                                    onChange={e => setForm({ ...form, pin: e.target.value })}
                                    className="mt-1 bg-background/50 font-mono tracking-widest text-center"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddStaff} className="w-full">Create Staff</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {staffList.map((staff) => (
                    <div key={staff.id} className="flex flex-col space-y-2 p-4 rounded-xl border border-border/40 bg-background/30 hover:bg-background/50 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${staff.role === 'owner' ? 'bg-primary/20 text-primary' : staff.role === 'manager' ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                    {staff.role === 'owner' ? <Key className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{staff.name} {staff.role === 'owner' && "(Master Account)"}</p>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{staff.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setEditingStaffId(staff.id);
                                        setEditPin(staff.pin);
                                        setEditName(staff.name);
                                    }}
                                    className="text-primary hover:bg-primary/10"
                                >
                                    Modify
                                </Button>
                                {staff.role !== 'owner' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(staff.id, staff.name)} className="text-destructive hover:bg-destructive/10">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {editingStaffId === staff.id && (
                            <div className="pt-4 border-t border-border/20 space-y-4 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase">Display Name</Label>
                                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9 bg-background/50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase">Security PIN</Label>
                                        <Input type="password" value={editPin} onChange={e => setEditPin(e.target.value)} className="h-9 bg-background/50 font-mono tracking-widest" maxLength={10} />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleUpdatePin} size="sm" className="flex-1 bg-primary text-primary-foreground">Update Access</Button>
                                    <Button variant="ghost" size="sm" onClick={() => setEditingStaffId(null)}>Cancel</Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
