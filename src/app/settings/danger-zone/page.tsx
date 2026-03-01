"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { resetDatabase, exportEncryptedBackup } from "@/lib/db";
import { PinLock } from "@/components/auth/pin-lock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCcw, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DangerZonePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Warning, 2: First PIN, 3: Second PIN
    const [pin1, setPin1] = useState("");
    const [pin2, setPin2] = useState("");
    const [error, setError] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const handleInitialConfirm = () => {
        setStep(2);
    };

    const handleFirstPin = () => {
        if (pin1 === user?.pin) {
            setStep(3);
            setError("");
        } else {
            setError("Incorrect owner PIN. Authentication failed.");
        }
    };

    const handleFinalReset = async () => {
        if (pin2 !== user?.pin) {
            setError("Final PIN verification failed.");
            return;
        }

        setIsResetting(true);
        try {
            // 1. Export Emergency Backup
            await exportEncryptedBackup();

            // 2. Wipe Collections
            await resetDatabase();

            // 3. Redirect to Setup wizard (effectively reload and ShopProvider will handle it)
            window.location.href = "/";
        } catch (err) {
            console.error("Reset failed:", err);
            setError("A system error occurred during reset.");
            setIsResetting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/settings"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary"><ArrowLeft className="w-4 h-4 mr-2" /> Settings</Button></Link>
                        <div className="h-6 w-px bg-border/30" />
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Danger Zone</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 max-w-2xl">
                <PinLock requiredRole="owner">
                    <div className="space-y-8 animate-in fade-in zoom-in duration-500">

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

                                    <Button
                                        onClick={handleInitialConfirm}
                                        variant="destructive"
                                        className="w-full h-14 text-lg font-bold shadow-xl shadow-destructive/20"
                                    >
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
                                        <Input
                                            type="password"
                                            placeholder="••••"
                                            value={pin1}
                                            onChange={e => setPin1(e.target.value)}
                                            className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                                            onKeyDown={e => e.key === 'Enter' && handleFirstPin()}
                                        />
                                        <Button onClick={handleFirstPin} className="w-full h-12 bg-destructive hover:bg-destructive/90">
                                            Continue (1/2)
                                        </Button>
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
                                        <Input
                                            type="password"
                                            placeholder="••••"
                                            value={pin2}
                                            onChange={e => setPin2(e.target.value)}
                                            className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-destructive focus-visible:ring-destructive"
                                            onKeyDown={e => e.key === 'Enter' && handleFinalReset()}
                                            disabled={isResetting}
                                        />
                                        <Button
                                            onClick={handleFinalReset}
                                            className="w-full h-14 bg-destructive text-white hover:bg-red-700 shadow-2xl flex items-center justify-center gap-2 text-lg font-black"
                                            disabled={isResetting}
                                        >
                                            {isResetting ? (
                                                <><RefreshCcw className="w-5 h-5 animate-spin" /> Resetting System...</>
                                            ) : (
                                                <><Download className="w-5 h-5" /> Download Backup & WIPE SYSTEM</>
                                            )}
                                        </Button>
                                    </div>
                                    {error && <p className="text-destructive font-medium">{error}</p>}
                                </>
                            )}
                        </div>

                    </div>
                </PinLock>
            </main>
        </div>
    );
}
