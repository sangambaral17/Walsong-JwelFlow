"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Unlock, ShieldAlert } from "lucide-react";

interface PinLockProps {
    children: React.ReactNode;
    requiredRole?: "owner" | "manager" | "cashier";
}

export function PinLock({ children, requiredRole }: PinLockProps) {
    const { user, login, logout } = useAuth();
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    const handleUnlock = async () => {
        const success = await login(pin);
        if (!success) {
            setError(true);
            setPin("");
        } else {
            setError(false);
            setPin("");
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-border/40 rounded-2xl bg-gradient-to-b from-card/30 to-background/50 backdrop-blur-xl shadow-Inner h-full min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-medium mb-3 text-foreground tracking-tight">Staff Login</h3>
                <p className="text-muted-foreground text-sm mb-8 text-center max-w-sm">
                    Please authenticate to access this section. (Default Owner PIN: 1234)
                </p>

                <div className="flex space-x-3 w-full max-w-xs">
                    <Input
                        type="password"
                        maxLength={10}
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

    // Role check
    if (requiredRole) {
        if (requiredRole === "owner" && user.role !== "owner") {
            return (
                <div className="flex flex-col items-center justify-center p-12 border border-destructive/40 rounded-2xl bg-destructive/5 backdrop-blur-xl h-full min-h-[300px]">
                    <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
                    <h3 className="text-xl font-medium mb-2 text-foreground">Access Denied</h3>
                    <p className="text-muted-foreground mb-6">You must be an Owner to view this section.</p>
                    <Button variant="outline" onClick={logout}>Switch User</Button>
                </div>
            );
        }
        if (requiredRole === "manager" && user.role === "cashier") {
            return (
                <div className="flex flex-col items-center justify-center p-12 border border-destructive/40 rounded-2xl bg-destructive/5 backdrop-blur-xl h-full min-h-[300px]">
                    <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
                    <h3 className="text-xl font-medium mb-2 text-foreground">Access Denied</h3>
                    <p className="text-muted-foreground mb-6">You must be a Manager or Owner to view this section.</p>
                    <Button variant="outline" onClick={logout}>Switch User</Button>
                </div>
            );
        }
    }

    return (
        <div className="relative w-full">
            <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground hover:bg-background/50 backdrop-blur-sm">
                    <Unlock className="w-4 h-4 mr-2" />
                    Lock View ({user.name})
                </Button>
            </div>
            {children}
        </div>
    );
}
