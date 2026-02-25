"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Unlock } from "lucide-react";

interface PinLockProps {
    children: React.ReactNode;
}

export function PinLock({ children }: PinLockProps) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    const OWNER_PIN = "1234"; // Hardcoded for this demo

    const handleUnlock = () => {
        if (pin === OWNER_PIN) {
            setIsUnlocked(true);
            setError(false);
        } else {
            setError(true);
            setPin("");
        }
    };

    if (isUnlocked) {
        return (
            <div className="relative group w-full">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => setIsUnlocked(false)} className="text-muted-foreground hover:text-foreground hover:bg-background/50 backdrop-blur-sm">
                        <Unlock className="w-4 h-4 mr-2" />
                        Lock View
                    </Button>
                </div>
                {children}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-12 border border-border/40 rounded-2xl bg-gradient-to-b from-card/30 to-background/50 backdrop-blur-xl shadow-Inner h-full min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-medium mb-3 text-foreground tracking-tight">Owner Access</h3>
            <p className="text-muted-foreground text-sm mb-8 text-center max-w-sm">
                This section contains sensitive business data. Please authenticate to continue. (PIN: 1234)
            </p>

            <div className="flex space-x-3 w-full max-w-xs">
                <Input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className={`h-12 text-center tracking-[1em] font-mono text-xl bg-background/50 backdrop-blur-sm ${error ? 'border-destructive focus-visible:ring-destructive' : 'border-border'}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                <Button onClick={handleUnlock} className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                    Unlock
                </Button>
            </div>
            {error && <p className="text-destructive text-sm mt-4 animate-in fade-in slide-in-from-top-1">Incorrect PIN. Try again.</p>}
        </div>
    );
}
