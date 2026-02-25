"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, ShieldAlert } from "lucide-react";
import { getDb } from "@/lib/db";

export function BackupButton() {
    const [isExporting, setIsExporting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        setSuccess(false);
        try {
            const db = await getDb();

            const inventory = await db.inventory.find().exec();
            const dhito = await db.dhito.find().exec();
            const rates = await db.rates.find().exec();
            const auditLog = await db.audit_log.find().exec();

            const exportData = {
                timestamp: new Date().toISOString(),
                backup_version: "1.0",
                data: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    inventory: inventory.map((d: any) => d.toJSON()),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    dhito: dhito.map((d: any) => d.toJSON()),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    rates: rates.map((d: any) => d.toJSON()),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    audit_log: auditLog.map((d: any) => d.toJSON()),
                }
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `walsong_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Backup failed", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                <span>Ensure you save this JSON file to a secure pen drive daily.</span>
            </div>
            <Button
                onClick={handleExport}
                disabled={isExporting}
                variant="outline"
                className="border-primary/30 hover:bg-primary/10 text-primary transition-all duration-300 w-fit h-11 px-6 shadow-sm"
            >
                {success ? (
                    <><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> <span className="text-foreground">Backup Saved Successfully</span></>
                ) : (
                    <><Download className="w-5 h-5 mr-3" /> {isExporting ? 'Exporting...' : 'Export Local Database (JSON)'}</>
                )}
            </Button>
        </div>
    );
}
