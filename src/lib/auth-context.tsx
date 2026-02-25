"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getDb } from "@/lib/db";

export interface Staff {
    id: string;
    name: string;
    pin: string;
    role: string; // 'owner', 'manager', 'cashier'
    active: boolean;
}

interface AuthContextValue {
    user: Staff | null;
    loading: boolean;
    isLocked: boolean;
    login: (pin: string) => Promise<boolean>;
    logout: () => void;
    lockSession: () => void;
    unlockSession: (pin: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    isLocked: false,
    login: async () => false,
    logout: () => { },
    lockSession: () => { },
    unlockSession: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);

    const initAuth = useCallback(async () => {
        try {
            const db = await getDb();
            const staffCount = await db.staff.find().exec();

            // If no staff exists, create the default owner account
            if (staffCount.length === 0) {
                await db.staff.insert({
                    id: "default_owner",
                    name: "Owner",
                    pin: "1234",
                    role: "owner",
                    active: true
                });
            }

            // Check session storage for persistence
            const savedUserId = sessionStorage.getItem("jwelflow_uid");
            if (savedUserId) {
                const savedUser = await db.staff.findOne(savedUserId).exec();
                if (savedUser && savedUser.active) {
                    setUser(savedUser.toJSON() as Staff);
                }
            }
        } catch (err) {
            console.error("Auth init failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    const login = async (pin: string) => {
        const db = await getDb();
        const result = await db.staff.findOne({
            selector: { pin: pin, active: true }
        }).exec();

        if (result) {
            const staffUser = result.toJSON() as Staff;
            setUser(staffUser);
            sessionStorage.setItem("jwelflow_uid", staffUser.id);

            // Audit log the login
            await db.audit_log.insert({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                action: "STAFF_LOGIN",
                details: `Logged in as ${staffUser.name} (${staffUser.role})`,
                user: staffUser.name
            });

            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem("jwelflow_uid");
    };

    const lockSession = () => {
        setIsLocked(true);
        sessionStorage.setItem("jwelflow_locked", "true");
    };

    const unlockSession = async (pin: string) => {
        if (!user) return false;
        if (pin === user.pin) {
            setIsLocked(false);
            sessionStorage.removeItem("jwelflow_locked");
            return true;
        }
        return false;
    };

    useEffect(() => {
        if (sessionStorage.getItem("jwelflow_locked") === "true") {
            setIsLocked(true);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, isLocked, login, logout, lockSession, unlockSession }}>
            {children}
        </AuthContext.Provider>
    );
}
