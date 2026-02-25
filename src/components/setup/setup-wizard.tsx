"use client";

import { useState } from "react";
import { useShop } from "@/lib/shop-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Store, ArrowRight, Check, Sparkles } from "lucide-react";

const ACCENT_PRESETS = [
    { name: "Burnished Gold", color: "#D4AF37" },
    { name: "Rose Gold", color: "#B76E79" },
    { name: "Royal Blue", color: "#4169E1" },
    { name: "Emerald", color: "#50C878" },
    { name: "Deep Purple", color: "#7B2D8E" },
    { name: "Ruby Red", color: "#E0115F" },
];

export function SetupWizard() {
    const { saveProfile } = useShop();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        shop_name: "",
        pan_vat_number: "",
        address: "",
        phone: "",
        accent_color: "#D4AF37",
        invoice_footer: "Thank you for choosing us!",
    });

    const handleFinish = async () => {
        await saveProfile(form);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl" style={{ background: `linear-gradient(135deg, ${form.accent_color}, ${form.accent_color}88)` }}>
                        <Store className="w-8 h-8 text-black" />
                    </div>
                    <h1 className="text-3xl font-medium tracking-tight mb-2">Welcome to JwelFlow</h1>
                    <p className="text-muted-foreground">Set up your shop profile to get started.</p>
                </div>

                <div className="glass-card rounded-2xl p-8 space-y-6">
                    {step === 0 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-lg font-medium" style={{ color: form.accent_color }}>Shop Identity</h2>
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Shop Name (पसलको नाम)</Label>
                                <Input value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} className="mt-1 bg-background/50 text-lg" placeholder="e.g. Laxmi Gold & Jewellers" />
                            </div>
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">PAN / VAT Number</Label>
                                <Input value={form.pan_vat_number} onChange={e => setForm({ ...form, pan_vat_number: e.target.value })} className="mt-1 bg-background/50" placeholder="e.g. 123456789" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Address (ठेगाना)</Label>
                                    <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1 bg-background/50" placeholder="Kathmandu, Nepal" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone (फोन)</Label>
                                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 bg-background/50" placeholder="+977-1-XXXXXXX" />
                                </div>
                            </div>
                            <Button
                                onClick={() => setStep(1)}
                                disabled={!form.shop_name || !form.pan_vat_number}
                                className="w-full h-12 text-base shadow-lg transition-all"
                                style={{ backgroundColor: form.accent_color, color: "#121212" }}
                            >
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-lg font-medium" style={{ color: form.accent_color }}>
                                <Sparkles className="w-5 h-5 inline mr-2" />
                                Choose Your Theme Color
                            </h2>
                            <p className="text-sm text-muted-foreground">This accent color makes your shop's software unique.</p>
                            <div className="grid grid-cols-3 gap-3">
                                {ACCENT_PRESETS.map((preset) => (
                                    <button
                                        key={preset.color}
                                        onClick={() => setForm({ ...form, accent_color: preset.color })}
                                        className="p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 hover:scale-105"
                                        style={{
                                            borderColor: form.accent_color === preset.color ? preset.color : "rgba(255,255,255,0.1)",
                                            backgroundColor: form.accent_color === preset.color ? `${preset.color}15` : "transparent",
                                        }}
                                    >
                                        <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: preset.color }} />
                                        <span className="text-xs text-muted-foreground">{preset.name}</span>
                                    </button>
                                ))}
                            </div>
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Or enter a custom hex code</Label>
                                <Input
                                    value={form.accent_color}
                                    onChange={e => setForm({ ...form, accent_color: e.target.value })}
                                    className="mt-1 bg-background/50 font-mono"
                                    placeholder="#D4AF37"
                                />
                            </div>
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Invoice Footer Text</Label>
                                <Textarea
                                    value={form.invoice_footer}
                                    onChange={e => setForm({ ...form, invoice_footer: e.target.value })}
                                    className="mt-1 bg-background/50"
                                    rows={2}
                                    placeholder="Thank you for choosing us!"
                                />
                            </div>
                            <Button
                                onClick={handleFinish}
                                className="w-full h-12 text-base shadow-lg transition-all"
                                style={{ backgroundColor: form.accent_color, color: "#121212" }}
                            >
                                <Check className="w-5 h-5 mr-2" /> Launch JwelFlow
                            </Button>
                        </div>
                    )}
                </div>

                {/* Step indicator */}
                <div className="flex justify-center gap-2 mt-6">
                    <div className="w-2 h-2 rounded-full transition-all" style={{ backgroundColor: step === 0 ? form.accent_color : "rgba(255,255,255,0.2)" }} />
                    <div className="w-2 h-2 rounded-full transition-all" style={{ backgroundColor: step === 1 ? form.accent_color : "rgba(255,255,255,0.2)" }} />
                </div>
            </div>
        </div>
    );
}
