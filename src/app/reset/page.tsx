"use client";

import { useEffect, useState } from "react";
import { Trash2, RefreshCw, ShieldAlert } from "lucide-react";

/**
 * Full Database Reset Page
 * Navigate to /reset to completely wipe all local data and start fresh.
 * This deletes the entire IndexedDB database (walsongdb), all session
 * storage, and all local storage — then redirects to home so the
 * Setup Wizard fires automatically.
 */
export default function ResetPage() {
    const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    async function handleReset() {
        setStatus("running");
        setLog([]);

        try {
            addLog("⏳ Clearing session storage...");
            sessionStorage.clear();

            addLog("⏳ Clearing local storage...");
            localStorage.clear();

            addLog("⏳ Deleting IndexedDB database 'walsongdb'...");
            await new Promise<void>((resolve, reject) => {
                const req = indexedDB.deleteDatabase("walsongdb");
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
                req.onblocked = () => {
                    addLog("⚠ DB blocked — close other tabs/windows of the app and retry.");
                }
            });

            // Also wipe any other dexie meta DBs that may have been created
            const allDbs = await indexedDB.databases?.() ?? [];
            for (const dbInfo of allDbs) {
                if (dbInfo.name && dbInfo.name !== "walsongdb") {
                    addLog(`⏳ Deleting related DB: ${dbInfo.name}...`);
                    await new Promise<void>(resolve => {
                        const r = indexedDB.deleteDatabase(dbInfo.name!);
                        r.onsuccess = () => resolve();
                        r.onerror = () => resolve(); // ignore errors for unrelated DBs
                    });
                }
            }

            addLog("✅ All data wiped successfully!");
            setStatus("done");

            setTimeout(() => {
                window.location.replace("/");
            }, 1500);
        } catch (err: any) {
            addLog(`❌ Error: ${err?.message ?? String(err)}`);
            setStatus("error");
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Fresh Start</h1>
                    <p className="text-muted-foreground text-sm">
                        This will <strong>permanently delete all data</strong> — shop profile, inventory,
                        staff accounts, invoices, karigars, chit schemes — everything.
                        You will be redirected to the Setup Wizard.
                    </p>
                </div>

                {log.length > 0 && (
                    <div className="rounded-xl bg-muted/30 border border-border/30 p-4 space-y-1 font-mono text-xs text-muted-foreground">
                        {log.map((l, i) => <p key={i}>{l}</p>)}
                    </div>
                )}

                {status === "idle" && (
                    <button
                        onClick={handleReset}
                        className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/20"
                    >
                        <Trash2 className="w-5 h-5" /> सबै डेटा मेट्नुहोस् र नयाँ सुरु गर्नुहोस्
                    </button>
                )}

                {status === "running" && (
                    <div className="w-full h-12 rounded-xl bg-muted flex items-center justify-center gap-3 text-sm text-muted-foreground">
                        <RefreshCw className="w-4 h-4 animate-spin" /> मेट्दैछ...
                    </div>
                )}

                {status === "done" && (
                    <div className="w-full h-12 rounded-xl bg-green-600/10 border border-green-600/20 flex items-center justify-center gap-3 text-sm text-green-500 font-bold">
                        ✅ सफलतापूर्वक मेटियो — Setup Wizard मा जाँदैछ...
                    </div>
                )}

                {status === "error" && (
                    <button
                        onClick={handleReset}
                        className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-3"
                    >
                        <RefreshCw className="w-4 h-4" /> पुनः प्रयास गर्नुहोस्
                    </button>
                )}

                <p className="text-center text-xs text-muted-foreground">
                    यो पृष्ठ केवल विकासको क्रममा प्रयोग गर्नुहोस् ।
                </p>
            </div>
        </div>
    );
}
