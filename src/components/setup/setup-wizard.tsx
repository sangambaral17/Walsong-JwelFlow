"use client";

import { useState, useEffect } from "react";
import { useShop } from "@/lib/shop-context";
import { getDb } from "@/lib/db";
import { safeUUID } from "@/lib/utils/safe-uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Store, ArrowRight, ArrowLeft, Check, Shield, Globe, Database,
    Eye, EyeOff, Gem, Lock, Building2, Phone, MapPin, Hash,
    CheckCircle2, Loader2
} from "lucide-react";

// ─── Step Definitions ─────────────────────────────────────────────────────────
const STEPS = [
    { id: 0, icon: Building2, label: "पसल परिचय", en: "Business Identity" },
    { id: 1, icon: Shield, label: "प्रशासक खाता", en: "Admin Account" },
    { id: 2, icon: Globe, label: "क्षेत्रीय सेटिङ", en: "Regional Settings" },
    { id: 3, icon: Database, label: "सुरु गर्दै", en: "Initializing" },
];

const ACCENT_PRESETS = [
    { name: "सुनौलो", color: "#D4AF37" },
    { name: "रोज गोल्ड", color: "#B76E79" },
    { name: "नीलो", color: "#4169E1" },
    { name: "हरियो", color: "#16a34a" },
    { name: "बैजनी", color: "#7B2D8E" },
    { name: "रातो", color: "#E0115F" },
];

const DEFAULT_KARIGAR_CATEGORIES = [
    "नेकलेस / Necklace", "औंठी / Ring", "कान बाला / Earring",
    "बाला / Bracelet", "टीका / Tikka", "सामान्य / General"
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-center gap-0 mb-10">
            {STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i < current;
                const active = i === current;
                return (
                    <div key={step.id} className="flex items-center">
                        <div className={`flex flex-col items-center gap-1`}>
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold text-sm
                                ${done ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : ""}
                                ${active ? "bg-primary/20 border-2 border-primary text-primary ring-4 ring-primary/10" : ""}
                                ${!done && !active ? "bg-muted border-2 border-border text-muted-foreground" : ""}
                            `}>
                                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <span className={`text-[9px] font-medium tracking-wide ${active ? "text-primary" : "text-muted-foreground"}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`w-12 h-0.5 mx-1 mb-4 transition-all duration-500 ${i < current ? "bg-primary" : "bg-border"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function SetupWizard() {
    const { saveProfile } = useShop();
    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Step 1 — Business Identity
    const [biz, setBiz] = useState({
        shop_name: "",
        pan_vat_number: "",
        address: "",
        phone: "",
        invoice_footer: "हाम्रो पसलमा स्वागत छ! धन्यवाद।",
        accent_color: "#D4AF37",
    });

    // Step 2 — Admin Security
    const [admin, setAdmin] = useState({
        name: "",
        username: "owner",
        pin: "",
        pin_confirm: "",
    });
    const [showPin, setShowPin] = useState(false);

    // Step 3 — Regional
    const [regional] = useState({
        currency: "NPR (नेपाली रुपैयाँ)",
        weight_unit: "Tola / Gram (तोला / ग्राम)",
        timezone: "Asia/Kathmandu (NST UTC+5:45)",
    });

    // Step 4 — Progress
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState("सुरु हुँदैछ...");
    const [done, setDone] = useState(false);

    // ── Validation ──────────────────────────────────────────────────────────
    function validateStep0() {
        const e: Record<string, string> = {};
        if (!biz.shop_name.trim()) e.shop_name = "पसलको नाम आवश्यक छ";
        if (!biz.pan_vat_number.trim() || !/^\d{9}$/.test(biz.pan_vat_number.trim()))
            e.pan_vat_number = "PAN/VAT ९ अंकको हुनुपर्छ";
        if (!biz.address.trim()) e.address = "ठेगाना आवश्यक छ";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function validateStep1() {
        const e: Record<string, string> = {};
        if (!admin.name.trim()) e.name = "पूरा नाम आवश्यक छ";
        if (!/^\d{4,6}$/.test(admin.pin)) e.pin = "PIN ४–६ अंकको हुनुपर्छ";
        if (admin.pin !== admin.pin_confirm) e.pin_confirm = "PIN मेल भएन";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function goNext() {
        setErrors({});
        if (step === 0 && !validateStep0()) return;
        if (step === 1 && !validateStep1()) return;
        if (step === 2) { runInitialization(); return; }
        setStep(s => s + 1);
    }

    // ── DB Initialization ───────────────────────────────────────────────────
    async function runInitialization() {
        setStep(3);

        const tick = (msg: string, pct: number) => {
            setProgressMsg(msg);
            setProgress(pct);
        };

        try {
            const db = await getDb();

            tick("पसलको प्रोफाइल सुरक्षित गर्दैछ...", 15);
            await saveProfile({
                shop_name: biz.shop_name,
                pan_vat_number: biz.pan_vat_number,
                address: biz.address,
                phone: biz.phone,
                invoice_footer: biz.invoice_footer,
                accent_color: biz.accent_color,
                premium_gold: 0,
                premium_silver: 0,
            });

            await new Promise(r => setTimeout(r, 600));
            tick("प्रशासक खाता बनाउँदैछ...", 35);

            // Remove default owner if exists, then insert the real one
            const existing = await db.staff.findOne("default_owner").exec();
            if (existing) await existing.remove();

            await db.staff.insert({
                id: safeUUID(),
                name: admin.name.trim(),
                pin: admin.pin,
                role: "owner",
                active: true,
            });

            await new Promise(r => setTimeout(r, 600));
            tick("डेटाबेस सुरु हुँदैछ...", 60);

            // Insert default karigar categories as sample karigars (named stubs)
            for (const cat of DEFAULT_KARIGAR_CATEGORIES) {
                // just seed the audit log with them as categories — no insert needed
                // karigar categories are free-form text; this seeds the hints
                await db.audit_log.insert({
                    id: safeUUID(),
                    timestamp: new Date().toISOString(),
                    action: "SETUP_SEED",
                    details: `Default karigar specialty seeded: ${cat}`,
                    user: admin.name.trim(),
                });
            }

            await new Promise(r => setTimeout(r, 600));
            tick("IRD अडिट लग सक्रिय गर्दैछ...", 80);

            await db.audit_log.insert({
                id: safeUUID(),
                timestamp: new Date().toISOString(),
                action: "SETUP_COMPLETE",
                details: `Walsong JwelFlow पहिलो पटक सेटअप सम्पन्न। पसल: ${biz.shop_name}`,
                user: admin.name.trim(),
            });

            await new Promise(r => setTimeout(r, 500));
            tick("सबै तयार छ! 🎉", 100);
            await new Promise(r => setTimeout(r, 800));

            setDone(true);
        } catch (err) {
            console.error("Setup failed:", err);
            tick("⚠ सेटअपमा त्रुटि भयो। पुनः प्रयास गर्नुहोस्।", 0);
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20 transition-all duration-1000"
                    style={{ backgroundColor: biz.accent_color }}
                />
            </div>

            <div className="w-full max-w-xl relative z-10">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div
                        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl transition-all duration-500"
                        style={{ background: `linear-gradient(135deg, ${biz.accent_color}, ${biz.accent_color}88)` }}
                    >
                        <Gem className="w-8 h-8 text-black" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Walsong JwelFlow</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        पहिलो सेटअप — {STEPS[Math.min(step, 3)].en}
                    </p>
                </div>

                <StepIndicator current={step} />

                <div className="bg-card border border-border/50 rounded-2xl shadow-xl p-8 space-y-6">

                    {/* ── STEP 0: Business Identity ── */}
                    {step === 0 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-400">
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold" style={{ color: biz.accent_color }}>
                                    <Building2 className="w-5 h-5 inline mr-2 mb-1" />पसल परिचय
                                </h2>
                                <p className="text-sm text-muted-foreground">IRD दर्ता भएको व्यापार विवरण भर्नुहोस्</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                        पसलको नाम (Shop Name) *
                                    </Label>
                                    <Input
                                        value={biz.shop_name}
                                        onChange={e => setBiz({ ...biz, shop_name: e.target.value })}
                                        placeholder="जस्तै: Walsong Gold & Jewellers"
                                        className={errors.shop_name ? "border-red-500" : ""}
                                    />
                                    {errors.shop_name && <p className="text-xs text-red-500">{errors.shop_name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                        PAN / VAT नम्बर *
                                    </Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            value={biz.pan_vat_number}
                                            onChange={e => setBiz({ ...biz, pan_vat_number: e.target.value.replace(/\D/g, "") })}
                                            placeholder="123456789"
                                            maxLength={9}
                                            className={`pl-9 font-mono ${errors.pan_vat_number ? "border-red-500" : ""}`}
                                        />
                                    </div>
                                    {errors.pan_vat_number
                                        ? <p className="text-xs text-red-500">{errors.pan_vat_number}</p>
                                        : <p className="text-[10px] text-muted-foreground">IRD मा दर्ता भएको ९ अंकको PAN</p>
                                    }
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                            <MapPin className="w-3 h-3 inline mr-1" />ठेगाना *
                                        </Label>
                                        <Input
                                            value={biz.address}
                                            onChange={e => setBiz({ ...biz, address: e.target.value })}
                                            placeholder="काठमाडौं, नेपाल"
                                            className={errors.address ? "border-red-500" : ""}
                                        />
                                        {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                            <Phone className="w-3 h-3 inline mr-1" />फोन नम्बर
                                        </Label>
                                        <Input
                                            value={biz.phone}
                                            onChange={e => setBiz({ ...biz, phone: e.target.value })}
                                            placeholder="+977-1-XXXXXXX"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">इनभ्वाइस फुटर</Label>
                                    <Textarea
                                        value={biz.invoice_footer}
                                        onChange={e => setBiz({ ...biz, invoice_footer: e.target.value })}
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>

                                {/* Accent Color */}
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">ब्रान्ड रङ</Label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {ACCENT_PRESETS.map(p => (
                                            <button
                                                key={p.color}
                                                onClick={() => setBiz({ ...biz, accent_color: p.color })}
                                                title={p.name}
                                                className={`h-8 rounded-lg border-2 transition-all ${biz.accent_color === p.color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-90"}`}
                                                style={{ backgroundColor: p.color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button onClick={goNext} className="w-full h-12 font-bold" style={{ backgroundColor: biz.accent_color, color: "#000" }}>
                                अर्को <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {/* ── STEP 1: Admin Account ── */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-400">
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold" style={{ color: biz.accent_color }}>
                                    <Shield className="w-5 h-5 inline mr-2 mb-1" />प्रशासक खाता बनाउनुहोस्
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    यो मालिक/owner खाता हो — POS override र गोप्य डेटा हेर्न प्रयोग हुन्छ
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">पूरा नाम *</Label>
                                    <Input
                                        value={admin.name}
                                        onChange={e => setAdmin({ ...admin, name: e.target.value })}
                                        placeholder="जस्तै: Ram Bahadur Shrestha"
                                        className={errors.name ? "border-red-500" : ""}
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                </div>

                                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                                    <p className="text-xs font-bold flex items-center gap-2">
                                        <Lock className="w-3 h-3 text-primary" /> सुरक्षा PIN
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        यो PIN POS मा login गर्न र सुरक्षित कार्यहरू सञ्चालन गर्न प्रयोग हुन्छ। कसैसँग नसाझा गर्नुहोस्।
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">PIN बनाउनुहोस् *</Label>
                                        <div className="relative">
                                            <Input
                                                type={showPin ? "text" : "password"}
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={admin.pin}
                                                onChange={e => setAdmin({ ...admin, pin: e.target.value.replace(/\D/g, "") })}
                                                placeholder="• • • •"
                                                className={`font-mono tracking-widest pr-10 ${errors.pin ? "border-red-500" : ""}`}
                                            />
                                            <button
                                                onClick={() => setShowPin(s => !s)}
                                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.pin && <p className="text-xs text-red-500">{errors.pin}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">PIN पुष्टि *</Label>
                                        <Input
                                            type={showPin ? "text" : "password"}
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={admin.pin_confirm}
                                            onChange={e => setAdmin({ ...admin, pin_confirm: e.target.value.replace(/\D/g, "") })}
                                            placeholder="• • • •"
                                            className={`font-mono tracking-widest ${errors.pin_confirm ? "border-red-500" : ""}`}
                                        />
                                        {errors.pin_confirm && <p className="text-xs text-red-500">{errors.pin_confirm}</p>}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs flex gap-2">
                                    <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-muted-foreground">
                                        PIN <strong>४ देखि ६ अंक</strong>को हुनुपर्छ। भविष्यमा Settings बाट परिवर्तन गर्न सकिन्छ।
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-12">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> पछाडि
                                </Button>
                                <Button onClick={goNext} className="flex-1 h-12 font-bold" style={{ backgroundColor: biz.accent_color, color: "#000" }}>
                                    अर्को <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Regional Settings ── */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-400">
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold" style={{ color: biz.accent_color }}>
                                    <Globe className="w-5 h-5 inline mr-2 mb-1" />क्षेत्रीय सेटिङ
                                </h2>
                                <p className="text-sm text-muted-foreground">नेपाल बजारका लागि पूर्वनिर्धारित सेटिङहरू</p>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { label: "मुद्रा / Currency", value: regional.currency, icon: "₹" },
                                    { label: "तौल एकाइ / Weight Unit", value: regional.weight_unit, icon: "⚖" },
                                    { label: "समय क्षेत्र / Timezone", value: regional.timezone, icon: "🕐" },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{item.label}</p>
                                            <p className="text-sm font-semibold truncate">{item.value}</p>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-sm text-muted-foreground">
                                <p className="font-bold text-amber-500 mb-1 text-xs uppercase tracking-wider">डेटाबेस ब्याकअप</p>
                                <p className="text-xs">
                                    पहिलो सेटअप पछि, <strong>Settings → Backup</strong> मा गई स्वचालित ब्याकअपको लागि फोल्डर छान्न सकिन्छ।
                                    प्रत्येक दिन USB मा ब्याकअप राख्न सिफारिस गरिन्छ।
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> पछाडि
                                </Button>
                                <Button onClick={goNext} className="flex-1 h-12 font-bold" style={{ backgroundColor: biz.accent_color, color: "#000" }}>
                                    <Database className="w-4 h-4 mr-2" /> JwelFlow सुरु गर्नुहोस्
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Initializing ── */}
                    {step === 3 && (
                        <div className="space-y-6 py-4 animate-in fade-in duration-400">
                            <div className="text-center space-y-3">
                                {done ? (
                                    <div
                                        className="w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-2xl"
                                        style={{ background: `linear-gradient(135deg, ${biz.accent_color}, ${biz.accent_color}88)` }}
                                    >
                                        <Check className="w-10 h-10 text-black" />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-muted/30 border-2 border-primary/30">
                                        <Loader2 className="w-9 h-9 text-primary animate-spin" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold">{done ? "सबै तयार छ!" : "सेटअप हुँदैछ..."}</h2>
                                    <p className="text-sm text-muted-foreground mt-1">{progressMsg}</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-2 rounded-full transition-all duration-700"
                                        style={{ width: `${progress}%`, backgroundColor: biz.accent_color }}
                                    />
                                </div>
                                <p className="text-xs text-right text-muted-foreground">{progress}%</p>
                            </div>

                            {/* Summary card (shown when done) */}
                            {done && (
                                <div className="space-y-2 animate-in fade-in duration-500">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        {[
                                            { label: "पसल", value: biz.shop_name },
                                            { label: "PAN/VAT", value: biz.pan_vat_number },
                                            { label: "मालिक", value: admin.name },
                                            { label: "ठेगाना", value: biz.address },
                                        ].map(r => (
                                            <div key={r.label} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                                                <p className="text-[9px] uppercase text-muted-foreground font-bold">{r.label}</p>
                                                <p className="font-semibold truncate">{r.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={() => window.location.href = "/"}
                                        className="w-full h-12 font-bold text-base shadow-2xl mt-2"
                                        style={{ backgroundColor: biz.accent_color, color: "#000" }}
                                    >
                                        <CheckCircle2 className="w-5 h-5 mr-2" /> JwelFlow खोल्नुहोस् →
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-[10px] text-muted-foreground mt-6">
                    Walsong JwelFlow — IRD Compliant, Local-First Jewelry ERP for Nepal &nbsp;•&nbsp; v0.1
                </p>
            </div>
        </div>
    );
}
