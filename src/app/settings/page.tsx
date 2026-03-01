"use client";

import { useState } from "react";
import { useShop } from "@/lib/shop-context";
import { useAuth } from "@/lib/auth-context";
import { resetDatabase, exportEncryptedBackup } from "@/lib/db";
import { PinLock } from "@/components/auth/pin-lock";
import { BackupButton } from "@/components/settings/backup-button";
import { StaffManager } from "@/components/settings/staff-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft, Save, Palette, Store, CheckCircle2, TrendingUp,
    ShieldCheck, AlertTriangle, Lock, RefreshCcw, Download, ShieldAlert
} from "lucide-react";
import Link from "next/link";

const ACCENT_PRESETS = [
    { name: "Burnished Gold", color: "#D4AF37" },
    { name: "Rose Gold", color: "#B76E79" },
    { name: "Royal Blue", color: "#4169E1" },
    { name: "Emerald", color: "#50C878" },
    { name: "Deep Purple", color: "#7B2D8E" },
    { name: "Ruby Red", color: "#E0115F" },
];

type SettingsTab = "general" | "security" | "danger" | "backup";

const TAB_CONFIG: { key: SettingsTab; label: string; icon: React.ReactNode; color?: string }[] = [
    { key: "general", label: "General", icon: <Store className="w-4 h-4" /> },
    { key: "security", label: "Security", icon: <ShieldCheck className="w-4 h-4" /> },
    { key: "danger", label: "Danger Zone", icon: <AlertTriangle className="w-4 h-4" />, color: "text-destructive" },
    { key: "backup", label: "Backup", icon: <Download className="w-4 h-4" /> },
];

/* ─── Danger Zone Inline Panel ─── */
function DangerZonePanel() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [pin1, setPin1] = useState("");
    const [pin2, setPin2] = useState("");
    const [error, setError] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const handleFirstPin = () => {
        if (pin1 === user?.pin) { setStep(3); setError(""); }
        else { setError("Incorrect owner PIN. Authentication failed."); }
    };

    const handleFinalReset = async () => {
        if (pin2 !== user?.pin) { setError("Final PIN verification failed."); return; }
        setIsResetting(true);
        try {
            await exportEncryptedBackup();
            await resetDatabase();
            window.location.href = "/";
        } catch (err) {
            console.error("Reset failed:", err);
            setError("A system error occurred during reset.");
            setIsResetting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="glass-card border-destructive/20 bg-destructive/5 rounded-2xl p-8 space-y-6 text-center shadow-2xl shadow-destructive/10">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                    <ShieldAlert className="w-10 h-10 text-destructive" />
                </div>

                {step === 1 && (
                    <>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">System Factory Reset</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                This action will <span className="text-destructive font-bold">PERMANENTLY DELETE</span> all inventory, sales, customers, and audit logs.
                            </p>
                        </div>
                        <div className="bg-background/40 border border-destructive/30 rounded-xl p-4 text-sm text-left text-destructive flex gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <p>Warning: This cannot be undone. An automatic backup will be downloaded to your machine before the wipe as a safety measure.</p>
                        </div>
                        <Button onClick={() => setStep(2)} variant="destructive" className="w-full h-14 text-lg font-bold shadow-xl shadow-destructive/20">
                            I Understand, Proceed to Reset
                        </Button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Verify Identity</h2>
                            <p className="text-muted-foreground">Please enter your Master PIN to authorize the system wipe.</p>
                        </div>
                        <div className="max-w-xs mx-auto space-y-4">
                            <Input type="password" placeholder="••••" value={pin1} onChange={e => setPin1(e.target.value)} className="h-14 text-center text-2xl tracking-[0.5em] font-mono" onKeyDown={e => e.key === 'Enter' && handleFirstPin()} />
                            <Button onClick={handleFirstPin} className="w-full h-12 bg-destructive hover:bg-destructive/90">Continue (1/2)</Button>
                        </div>
                        {error && <p className="text-destructive font-medium">{error}</p>}
                    </>
                )}

                {step === 3 && (
                    <>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-destructive animate-pulse underline underline-offset-8 decoration-wavy">FINAL CONFIRMATION</h2>
                            <p className="text-muted-foreground">Enter your Master PIN one last time to confirm total system wipe.</p>
                        </div>
                        <div className="max-w-xs mx-auto space-y-4">
                            <Input type="password" placeholder="••••" value={pin2} onChange={e => setPin2(e.target.value)} className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-destructive focus-visible:ring-destructive" onKeyDown={e => e.key === 'Enter' && handleFinalReset()} disabled={isResetting} />
                            <Button onClick={handleFinalReset} className="w-full h-14 bg-destructive text-white hover:bg-red-700 shadow-2xl flex items-center justify-center gap-2 text-lg font-black" disabled={isResetting}>
                                {isResetting ? (<><RefreshCcw className="w-5 h-5 animate-spin" /> Resetting System...</>) : (<><Download className="w-5 h-5" /> Download Backup & WIPE SYSTEM</>)}
                            </Button>
                        </div>
                        {error && <p className="text-destructive font-medium">{error}</p>}
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Main Settings Page ─── */
export default function SettingsPage() {
    const { profile, saveProfile } = useShop();
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
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
                    <div className="space-y-6 animate-in fade-in duration-500">

                        {/* ─── Tab Bar ─── */}
                        <div className="flex gap-1 p-1 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm relative z-20">
                            {TAB_CONFIG.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.key
                                        ? tab.key === "danger"
                                            ? "bg-destructive/10 text-destructive shadow-sm border border-destructive/20"
                                            : "bg-primary/10 text-primary shadow-sm border border-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                        }`}
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* ─── TAB: General ─── */}
                        {activeTab === "general" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
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
                                            <Input type="number" value={form.premium_gold} onChange={e => setForm({ ...form, premium_gold: Number(e.target.value) })} className="mt-1 bg-background/50 text-lg font-mono" placeholder="e.g. 500" />
                                        </div>
                                        <div>
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Silver Premium (NPR per Tola)</Label>
                                            <Input type="number" value={form.premium_silver} onChange={e => setForm({ ...form, premium_silver: Number(e.target.value) })} className="mt-1 bg-background/50 text-lg font-mono" placeholder="e.g. 50" />
                                        </div>
                                    </div>
                                </section>

                                {/* Theme Customization */}
                                <section className="glass-card rounded-xl p-6 space-y-5">
                                    <h2 className="text-lg font-medium flex items-center gap-2" style={{ color: form.accent_color }}><Palette className="w-5 h-5" /> Theme Color</h2>
                                    <div className="grid grid-cols-6 gap-3">
                                        {ACCENT_PRESETS.map((preset) => (
                                            <button key={preset.color} onClick={() => setForm({ ...form, accent_color: preset.color })} className="flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all hover:scale-105 active:scale-95" style={{ borderColor: form.accent_color === preset.color ? preset.color : "transparent" }}>
                                                <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: preset.color }} />
                                                <span className="text-[10px] text-muted-foreground">{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <Input value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="bg-background/50 font-mono max-w-xs" placeholder="#D4AF37" />
                                </section>

                                <Button onClick={handleSave} className="w-full h-12 text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" style={{ backgroundColor: form.accent_color, color: "#121212" }}>
                                    {saved ? <><CheckCircle2 className="w-5 h-5 mr-2" /> Saved Successfully</> : <><Save className="w-5 h-5 mr-2" /> Save Settings</>}
                                </Button>
                            </div>
                        )}

                        {/* ─── TAB: Security ─── */}
                        {activeTab === "security" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-primary/10">
                                        <Lock className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-foreground text-lg">Owner Authorization Required</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Changes to staff PINs or roles are highly sensitive.
                                            Every change is recorded in the <strong>Audit Log</strong> for maximum transparency.
                                        </p>
                                    </div>
                                </div>
                                <StaffManager />
                                <div className="pt-8 text-center text-xs text-muted-foreground uppercase tracking-[0.2em]">
                                    Walsong JewelFlow • Enterprise Security Core
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: Danger Zone ─── */}
                        {activeTab === "danger" && (
                            <DangerZonePanel />
                        )}

                        {/* ─── TAB: Backup ─── */}
                        {activeTab === "backup" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                <section className="glass-card rounded-xl p-6 space-y-4">
                                    <h2 className="text-lg font-medium flex items-center gap-2">
                                        <Download className="w-5 h-5 text-primary" /> Local Database Backup
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Export all data to JSON for safekeeping. Save to a pen drive daily to protect your data.
                                    </p>
                                    <BackupButton />
                                </section>
                            </div>
                        )}

                    </div>
                </PinLock>
            </main>
        </div>
    );
}
