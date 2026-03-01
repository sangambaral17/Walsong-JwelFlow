"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getDb } from "@/lib/db";
import { safeUUID } from "@/lib/utils/safe-uuid";

export interface ShopProfile {
    id: string;
    shop_name: string;
    logo_url: string;
    pan_vat_number: string;
    address: string;
    phone: string;
    accent_color: string;
    invoice_footer: string;
    premium_gold: number;
    premium_silver: number;
}

const DEFAULT_PROFILE: ShopProfile = {
    id: "default",
    shop_name: "",
    logo_url: "",
    pan_vat_number: "",
    address: "",
    phone: "",
    accent_color: "#D4AF37",
    invoice_footer: "Thank you for your business!",
    premium_gold: 0,
    premium_silver: 0,
};

interface ShopContextValue {
    profile: ShopProfile;
    isSetup: boolean;
    loading: boolean;
    saveProfile: (data: Partial<ShopProfile>) => Promise<void>;
}

const ShopContext = createContext<ShopContextValue>({
    profile: DEFAULT_PROFILE,
    isSetup: false,
    loading: true,
    saveProfile: async () => { },
});

export const useShop = () => useContext(ShopContext);

export function ShopProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<ShopProfile>(DEFAULT_PROFILE);
    const [isSetup, setIsSetup] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async () => {
        try {
            const db = await getDb();
            const doc = await db.shop_profile.findOne("default").exec();
            if (doc) {
                setProfile(doc.toJSON() as ShopProfile);
                setIsSetup(true);
            }
        } catch (err) {
            console.error("Failed to load shop profile:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // Apply accent color as CSS custom property
    useEffect(() => {
        if (profile.accent_color && profile.accent_color !== "#D4AF37") {
            document.documentElement.style.setProperty("--primary", profile.accent_color);
            document.documentElement.style.setProperty("--ring", profile.accent_color);
            document.documentElement.style.setProperty("--gold", profile.accent_color);
        }
    }, [profile.accent_color]);

    const saveProfile = async (data: Partial<ShopProfile>) => {
        const db = await getDb();
        const existing = await db.shop_profile.findOne("default").exec();
        const merged = { ...profile, ...data, id: "default" };

        if (existing) {
            await existing.patch(data);
        } else {
            await db.shop_profile.insert(merged);
        }

        setProfile(merged);
        setIsSetup(true);

        // Audit log
        await db.audit_log.insert({
            id: safeUUID(),
            timestamp: new Date().toISOString(),
            action: "SHOP_PROFILE_UPDATE",
            details: JSON.stringify(data),
            user: "owner",
        });
    };

    return (
        <ShopContext.Provider value={{ profile, isSetup, loading, saveProfile }}>
            {children}
        </ShopContext.Provider>
    );
}
