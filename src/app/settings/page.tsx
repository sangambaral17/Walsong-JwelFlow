"use client";

import { useState } from "react";
import { useShop } from "@/lib/shop-context";
import { PinLock } from "@/components/auth/pin-lock";
import { BackupButton } from "@/components/settings/backup-button";
import { StaffManager } from "@/components/settings/staff-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Palette, Store, CheckCircle2, TrendingUp, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

const ACCENT_PRESETS = [
    { name: "Burnished Gold", color: "#D4AF37" },
    { name: "Rose Gold", color: "#B76E79" },
    { name: "Royal Blue", color: "#4169E1" },
    { name: "Emerald", color: "#50C878" },
    { name: "Deep Purple", color: "#7B2D8E" },
    { name: "Ruby Red", color: "#E0115F" },
];

export default function SettingsPage() {
    const { profile, saveProfile } = useShop();
    const [form, setForm] = useState({
        shop_name: profile.shop_name,
        pan_vat_number: profile.pan_vat_number,
        address: profile.address,
        phone: profile.phone,
        accent_color: profile.accent_color || "#D4AF37",
        invoice_footer: profile.invoice_footer,
        premium_gold: profile.premium_gold || 0,
        premium_silver: profile.premium_silver || 0,
    });
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        await saveProfile(form);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary"><ArrowLeft className="w-4 h-4 mr-2" /> Dashboard</Button></Link>
                        <div className="h-6 w-px bg-border/30" />
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Store className="w-5 h-5 text-primary" /> Settings</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <PinLock requiredRole="owner">
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Shop Identity */}
                        <section className="glass-card rounded-xl p-6 space-y-5">
                            <h2 className="text-lg font-medium text-primary flex items-center gap-2"><Store className="w-5 h-5" /> Shop Identity</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Shop Name</Label>
                                    <Input value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} className="mt-1 bg-background/50 text-lg" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">PAN / VAT Number</Label>
                                    <Input value={form.pan_vat_number} onChange={e => setForm({ ...form, pan_vat_number: e.target.value })} className="mt-1 bg-background/50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Address</Label>
                                    <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1 bg-background/50" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
                                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 bg-background/50" />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Invoice Footer Text</Label>
                                <Textarea value={form.invoice_footer} onChange={e => setForm({ ...form, invoice_footer: e.target.value })} className="mt-1 bg-background/50" rows={2} />
                            </div>
                        </section>

                        {/* Manual Price Control */}
                        <section className="glass-card rounded-xl p-6 space-y-5 border-primary/20 bg-primary/5">
                            <h2 className="text-lg font-medium text-primary flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Manual Price Control (Shop Premium)
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Add an extra amount to the live market Hallmark/Silver rates.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Gold Premium (NPR per Tola)</Label>
                                    <Input
                                        type="number"
                                        value={form.premium_gold}
                                        onChange={e => setForm({ ...form, premium_gold: Number(e.target.value) })}
                                        className="mt-1 bg-background/50 text-lg font-mono"
                                        placeholder="e.g. 500"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Silver Premium (NPR per Tola)</Label>
                                    <Input
                                        type="number"
                                        value={form.premium_silver}
                                        onChange={e => setForm({ ...form, premium_silver: Number(e.target.value) })}
                                        className="mt-1 bg-background/50 text-lg font-mono"
                                        placeholder="e.g. 50"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Theme Customization */}
                        <section className="glass-card rounded-xl p-6 space-y-5">
                            <h2 className="text-lg font-medium flex items-center gap-2" style={{ color: form.accent_color }}><Palette className="w-5 h-5" /> Theme Color</h2>
                            <div className="grid grid-cols-6 gap-3">
                                {ACCENT_PRESETS.map((preset) => (
                                    <button key={preset.color} onClick={() => setForm({ ...form, accent_color: preset.color })} className="flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all hover:scale-105" style={{ borderColor: form.accent_color === preset.color ? preset.color : "transparent" }}>
                                        <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: preset.color }} />
                                        <span className="text-[10px] text-muted-foreground">{preset.name}</span>
                                    </button>
                                ))}
                            </div>
                            <Input value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="bg-background/50 font-mono max-w-xs" placeholder="#D4AF37" />
                        </section>

                        {/* Security & Access */}
                        <section className="glass-card rounded-xl p-6 space-y-4">
                            <h2 className="text-lg font-medium flex items-center gap-2 text-foreground">
                                <ShieldCheck className="w-5 h-5" />
                                Security & Access
                            </h2>
                            <p className="text-sm text-muted-foreground">Manage Master PIN, staff roles, and access credentials.</p>
                            <Link href="/settings/security" className="block p-4 rounded-lg border border-border/40 bg-background/30 hover:bg-background/50 hover:border-primary/30 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <ShieldCheck className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Role-Based PIN Management</p>
                                            <p className="text-xs text-muted-foreground">Change Master PIN or manage staff accounts</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </section>

                        <Separator className="bg-border/30" />

                        {/* Backup */}
                        <section className="glass-card rounded-xl p-6 space-y-4">
                            <h2 className="text-lg font-medium">Local Database Backup</h2>
                            <p className="text-sm text-muted-foreground">Export all data to JSON for safekeeping.</p>
                            <BackupButton />
                        </section>

                        <section className="glass-card rounded-xl p-6 space-y-4 border-destructive/20 bg-destructive/5">
                            <h2 className="text-lg font-medium text-destructive">Danger Zone</h2>
                            <p className="text-sm text-muted-foreground italic">Sensitive system-level actions.</p>
                            <Link href="/settings/danger-zone" className="block p-4 rounded-lg border border-destructive/30 hover:bg-destructive/10 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-destructive">
                                        <AlertTriangle className="w-5 h-5" />
                                        <span className="font-medium">System Factory Reset</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-destructive group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </section>

                        <Button onClick={handleSave} className="w-full h-12 text-base shadow-lg shadow-primary/20 transition-all" style={{ backgroundColor: form.accent_color, color: "#121212" }}>
                            {saved ? <><CheckCircle2 className="w-5 h-5 mr-2" /> Saved Successfully</> : <><Save className="w-5 h-5 mr-2" /> Save Settings</>}
                        </Button>
                    </div>
                </PinLock>
            </main>
        </div>
    );
}
