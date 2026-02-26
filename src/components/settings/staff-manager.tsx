"use client";

import { useState, useEffect } from "react";
import { getDb } from "@/lib/db";
import { Staff } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Trash2, Key, Users, UserCheck, UserX } from "lucide-react";
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
        confirmPin: "",
        role: "cashier", // Default
    });
    const [formError, setFormError] = useState("");
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [editPin, setEditPin] = useState("");
    const [editConfirmPin, setEditConfirmPin] = useState("");
    const [editName, setEditName] = useState("");
    const [editError, setEditError] = useState("");
    const [currentPinVerify, setCurrentPinVerify] = useState("");
    const [showCurrentPinVerify, setShowCurrentPinVerify] = useState(false);

    const loadStaff = async () => {
        const db = await getDb();
        const allStaff = await db.staff.find().exec();
        setStaffList(allStaff.map((doc: any) => doc.toJSON() as Staff));
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const handleAddStaff = async () => {
        setFormError("");

        if (!form.name.trim()) {
            setFormError("Staff name is required.");
            return;
        }

        if (!form.pin || form.pin.length < 4) {
            setFormError("PIN must be at least 4 digits.");
            return;
        }

        if (form.pin !== form.confirmPin) {
            setFormError("PIN and Confirm PIN do not match.");
            return;
        }

        // Prevent duplicate PINs for security
        const existing = staffList.find(s => s.pin === form.pin);
        if (existing) {
            setFormError("This PIN is already in use by another staff member.");
            return;
        }

        const db = await getDb();
        await db.staff.insert({
            id: crypto.randomUUID(),
            name: form.name.trim(),
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

        console.log(`[Staff] Created staff: ${form.name} (${form.role})`);
        setForm({ name: "", pin: "", confirmPin: "", role: "cashier" });
        setFormError("");
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
            console.log(`[Staff] Deleted staff: ${name}`);
            loadStaff();
        }
    };

    const handleToggleActive = async (id: string, name: string, currentActive: boolean) => {
        if (id === "default_owner") {
            alert("Cannot deactivate the default owner account.");
            return;
        }

        const db = await getDb();
        const doc = await db.staff.findOne(id).exec();
        if (doc) {
            await doc.patch({ active: !currentActive });
            await db.audit_log.insert({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                action: currentActive ? "STAFF_DEACTIVATED" : "STAFF_ACTIVATED",
                details: `${currentActive ? "Deactivated" : "Activated"} user: ${name}`,
                user: "owner"
            });
            console.log(`[Staff] ${currentActive ? "Deactivated" : "Activated"} staff: ${name}`);
            loadStaff();
        }
    };

    const handleUpdatePin = async () => {
        setEditError("");

        if (!editingStaffId) return;

        // Find the staff being edited
        const staff = staffList.find(s => s.id === editingStaffId);

        // For owner accounts, require current PIN verification
        if (staff?.role === "owner" && showCurrentPinVerify) {
            if (currentPinVerify !== staff.pin) {
                setEditError("Current PIN is incorrect.");
                return;
            }
        }

        if (editPin && editPin.length < 4) {
            setEditError("PIN must be at least 4 digits.");
            return;
        }

        if (editPin && editPin !== editConfirmPin) {
            setEditError("PIN and Confirm PIN do not match.");
            return;
        }

        // Check if new PIN is already used by someone else
        if (editPin) {
            const duplicate = staffList.find(s => s.pin === editPin && s.id !== editingStaffId);
            if (duplicate) {
                setEditError("This PIN is already in use by another staff member.");
                return;
            }
        }

        const db = await getDb();
        const doc = await db.staff.findOne(editingStaffId).exec();
        if (doc) {
            const patchData: any = { name: editName };
            if (editPin) {
                patchData.pin = editPin;
            }

            await doc.patch(patchData);
            await db.audit_log.insert({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                action: "STAFF_PIN_UPDATE",
                details: `Updated ${editPin ? "PIN and name" : "name"} for user: ${editName}`,
                user: "owner"
            });
            console.log(`[Staff] Updated staff: ${editName}`);

            setEditingStaffId(null);
            setEditPin("");
            setEditConfirmPin("");
            setEditError("");
            setCurrentPinVerify("");
            setShowCurrentPinVerify(false);
            loadStaff();
        }
    };

    const startEdit = (staff: Staff) => {
        setEditingStaffId(staff.id);
        setEditPin("");
        setEditConfirmPin("");
        setEditName(staff.name);
        setEditError("");
        setCurrentPinVerify("");
        setShowCurrentPinVerify(staff.role === "owner");
    };

    return (
        <section className="glass-card rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-primary flex items-center gap-2">
                    <Users className="w-5 h-5" /> Staff Management
                </h2>
                <Dialog open={open} onOpenChange={(v) => { setOpen(v); setFormError(""); }}>
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
                                <Label>Staff Name <span className="text-destructive">*</span></Label>
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
                                </select>
                            </div>
                            <div>
                                <Label>Unique PIN (min 4 digits) <span className="text-destructive">*</span></Label>
                                <Input
                                    type="password"
                                    maxLength={10}
                                    placeholder="••••"
                                    value={form.pin}
                                    onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
                                    className="mt-1 bg-background/50 font-mono tracking-widest text-center"
                                />
                            </div>
                            <div>
                                <Label>Confirm PIN <span className="text-destructive">*</span></Label>
                                <Input
                                    type="password"
                                    maxLength={10}
                                    placeholder="••••"
                                    value={form.confirmPin}
                                    onChange={e => setForm({ ...form, confirmPin: e.target.value.replace(/\D/g, "") })}
                                    className="mt-1 bg-background/50 font-mono tracking-widest text-center"
                                />
                            </div>
                            {formError && (
                                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {formError}
                                </p>
                            )}
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
                                    <p className="font-medium text-foreground flex items-center gap-2">
                                        {staff.name} {staff.role === 'owner' && "(Master Account)"}
                                        {staff.active ? (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-semibold">ACTIVE</span>
                                        ) : (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-semibold">INACTIVE</span>
                                        )}
                                    </p>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{staff.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Activate/Deactivate Toggle */}
                                {staff.role !== 'owner' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleActive(staff.id, staff.name, staff.active)}
                                        className={staff.active ? "text-orange-500 hover:bg-orange-500/10" : "text-green-500 hover:bg-green-500/10"}
                                        title={staff.active ? "Deactivate Staff" : "Activate Staff"}
                                    >
                                        {staff.active ? <UserX className="w-4 h-4 mr-1" /> : <UserCheck className="w-4 h-4 mr-1" />}
                                        <span className="text-xs">{staff.active ? "Deactivate" : "Activate"}</span>
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEdit(staff)}
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
                                {/* Current PIN verification for owner */}
                                {showCurrentPinVerify && (
                                    <div className="space-y-1.5 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                        <Label className="text-[10px] uppercase text-primary">Current PIN (Required for Owner)</Label>
                                        <Input
                                            type="password"
                                            value={currentPinVerify}
                                            onChange={e => setCurrentPinVerify(e.target.value.replace(/\D/g, ""))}
                                            className="h-9 bg-background/50 font-mono tracking-widest"
                                            maxLength={10}
                                            placeholder="Enter current PIN"
                                        />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase">Display Name</Label>
                                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9 bg-background/50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase">New PIN (min 4 digits)</Label>
                                        <Input
                                            type="password"
                                            value={editPin}
                                            onChange={e => setEditPin(e.target.value.replace(/\D/g, ""))}
                                            className="h-9 bg-background/50 font-mono tracking-widest"
                                            maxLength={10}
                                            placeholder="Leave blank to keep current"
                                        />
                                    </div>
                                </div>
                                {editPin && (
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase">Confirm New PIN</Label>
                                        <Input
                                            type="password"
                                            value={editConfirmPin}
                                            onChange={e => setEditConfirmPin(e.target.value.replace(/\D/g, ""))}
                                            className="h-9 bg-background/50 font-mono tracking-widest"
                                            maxLength={10}
                                            placeholder="Re-enter new PIN"
                                        />
                                    </div>
                                )}
                                {editError && (
                                    <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {editError}
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={handleUpdatePin} size="sm" className="flex-1 bg-primary text-primary-foreground">Update Access</Button>
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingStaffId(null); setEditError(""); }}>Cancel</Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
