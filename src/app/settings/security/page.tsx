"use client";

import { PinLock } from "@/components/auth/pin-lock";
import { StaffManager } from "@/components/settings/staff-manager";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import Link from "next/link";

export default function SecuritySettingsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/settings">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-border/30" />
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            Security & Access
                        </h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <PinLock requiredRole="owner">
                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-3xl font-bold tracking-tight">Staff Credentials</h2>
                            <p className="text-muted-foreground">Manage roles and secure PINs for all staff members.</p>
                        </div>

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
                </PinLock>
            </main>
        </div>
    );
}
