"use client";

import { ShopProvider, useShop } from "@/lib/shop-context";
import { AuthProvider } from "@/lib/auth-context";
import { SetupWizard } from "@/components/setup/setup-wizard";

function AppGate({ children }: { children: React.ReactNode }) {
    const { isSetup, loading } = useShop();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-muted-foreground text-sm">Loading JwelFlow...</p>
                </div>
            </div>
        );
    }

    if (!isSetup) {
        return <SetupWizard />;
    }

    return <>{children}</>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <ShopProvider>
            <AuthProvider>
                <AppGate>{children}</AppGate>
            </AuthProvider>
        </ShopProvider>
    );
}
