"use client";

import { useState, useEffect, useRef } from "react";
import { getAuditTrail, downloadAuditTrail, type AuditEntry } from "@/lib/compliance";
import {
    runBulkScanAudit,
    getInventoryTagOverview,
    assignRfidTag,
    removeRfidTag,
    getTaggingStats,
    type AuditReport,
    type InventoryTagStatus,
} from "@/lib/rfid-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LangToggle } from "@/components/ui/lang-toggle";
import { useLang } from "@/lib/lang-context";
import {
    ShieldCheck, Download, Search, FileText, Tag, ScanLine,
    AlertTriangle, CheckCircle2, XCircle, Wifi, Calendar
} from "lucide-react";
import { toast } from "sonner";

export default function AuditPage() {
    const { t, lang } = useLang();

    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

    const [inventory, setInventory] = useState<InventoryTagStatus[]>([]);
    const [tagStats, setTagStats] = useState({ total: 0, tagged: 0, untagged: 0 });
    const [scanInput, setScanInput] = useState("");
    const [scannedTags, setScannedTags] = useState<string[]>([]);
    const [report, setReport] = useState<AuditReport | null>(null);
    const [scanning, setScanning] = useState(false);
    const [tagAssignItemId, setTagAssignItemId] = useState("");
    const [tagAssignValue, setTagAssignValue] = useState("");
    const scanInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        handleAuditSearch();
        loadInventoryTags();
    }, []);

    async function handleAuditSearch() {
        const data = await getAuditTrail(dateFrom, dateTo);
        setAuditLog(data);
    }

    async function loadInventoryTags() {
        const [items, stats] = await Promise.all([getInventoryTagOverview(), getTaggingStats()]);
        setInventory(items);
        setTagStats(stats);
    }

    function handleAddScanTag() {
        const tag = scanInput.trim();
        if (!tag) return;
        if (!scannedTags.includes(tag)) setScannedTags(prev => [...prev, tag]);
        setScanInput("");
        scanInputRef.current?.focus();
    }

    async function handleRunAudit() {
        if (scannedTags.length === 0) {
            toast.error(lang === "en" ? "Scan at least one tag first." : "पहिले ट्याग स्क्यान गर्नुहोस् ।");
            return;
        }
        setScanning(true);
        const r = await runBulkScanAudit(scannedTags);
        setReport(r);
        setScanning(false);
        toast.success(lang === "en"
            ? `Audit complete — ${r.matched} matched, ${r.unmatched} unknown`
            : `अडिट सम्पन्न — ${r.matched} मेल, ${r.unmatched} अज्ञात`
        );
    }

    async function handleAssignTag() {
        if (!tagAssignItemId || !tagAssignValue.trim()) {
            toast.error(lang === "en" ? "Select an item and enter a tag UUID." : "सामान र ट्याग दुवै भर्नुहोस् ।");
            return;
        }
        await assignRfidTag({ item_id: tagAssignItemId, rfid_tag: tagAssignValue.trim() });
        setTagAssignItemId("");
        setTagAssignValue("");
        await loadInventoryTags();
        toast.success(lang === "en" ? "RFID tag assigned ✓" : "RFID ट्याग सफलतापूर्वक जोडियो ✓");
    }

    async function handleRemoveTag(item_id: string) {
        await removeRfidTag(item_id);
        await loadInventoryTags();
        toast.success(lang === "en" ? "Tag removed" : "ट्याग हटाइयो");
    }

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-indigo-500" />
                        </span>
                        {t('rfidAudit')}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">{t('rfidSubtitle')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <LangToggle />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {tagStats.tagged}/{tagStats.total} {t('tagged')}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">
                        <ShieldCheck className="w-3 h-3" /> AES Encrypted
                    </div>
                </div>
            </header>

            <Tabs defaultValue="rfid" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rfid" className="flex items-center gap-2 text-xs">
                        <ScanLine className="w-4 h-4" /> {t('scanAudit')}
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="flex items-center gap-2 text-xs">
                        <Tag className="w-4 h-4" /> {t('tagMgmt')}
                    </TabsTrigger>
                    <TabsTrigger value="log" className="flex items-center gap-2 text-xs">
                        <FileText className="w-4 h-4" /> {t('activityJournal')}
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: RFID Scan Audit */}
                <TabsContent value="rfid" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Scanner Panel */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-3 border-b border-border/30">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Wifi className="w-4 h-4 text-indigo-400" /> {t('scanTags')}
                                </CardTitle>
                                <CardDescription className="text-xs">{t('scanTagsDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        ref={scanInputRef}
                                        value={scanInput}
                                        onChange={e => setScanInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") handleAddScanTag(); }}
                                        placeholder={lang === "en" ? "Tag UUID — press Enter…" : "ट्याग UUID — Enter थिच्नुहोस्…"}
                                        className="font-mono text-xs"
                                        autoFocus
                                    />
                                    <Button onClick={handleAddScanTag} size="sm" variant="outline" className="shrink-0">
                                        <ScanLine className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-1.5 max-h-48 overflow-auto">
                                    {scannedTags.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                                            <ScanLine className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                            {lang === "en" ? "Scanned tags will appear here" : "स्क्यान गरिएका ट्यागहरू यहाँ देखिन्छन्"}
                                        </div>
                                    ) : (
                                        scannedTags.map((tag, i) => (
                                            <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md text-xs font-mono">
                                                <span className="text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                                                <span className="truncate flex-1">{tag}</span>
                                                <button
                                                    onClick={() => setScannedTags(ts => ts.filter(x => x !== tag))}
                                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                                >×</button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleRunAudit}
                                        disabled={scanning || scannedTags.length === 0}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                    >
                                        {scanning
                                            ? (lang === "en" ? "Running audit…" : "अडिट हुँदैछ…")
                                            : `${t('runAudit')} (${scannedTags.length})`
                                        }
                                    </Button>
                                    {scannedTags.length > 0 && (
                                        <Button onClick={() => { setScannedTags([]); setReport(null); }} variant="outline" size="sm" className="shrink-0">
                                            {t('cancel')}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Report Panel */}
                        <Card className="lg:col-span-3">
                            <CardHeader className="pb-3 border-b border-border/30">
                                <CardTitle className="text-base">{t('auditReport')}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {!report ? (
                                    <div className="py-16 text-center text-muted-foreground text-sm">
                                        <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                        <p>{lang === "en" ? "Scan tags then run audit to see the report" : "ट्याग स्क्यान गरेपछि अडिट चलाउनुहोस्"}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: t('matched'), value: report.matched, color: "text-green-500", bg: "bg-green-500/10" },
                                                { label: t('unmatched'), value: report.unmatched, color: "text-red-400", bg: "bg-red-500/10" },
                                                { label: t('missingItem'), value: report.db_items_not_scanned, color: "text-amber-500", bg: "bg-amber-500/10" },
                                            ].map(s => (
                                                <div key={s.label} className={`p-3 rounded-xl ${s.bg} text-center`}>
                                                    <p className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</p>
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {report.missing_items.length > 0 && (
                                            <div className="rounded-xl bg-amber-500/5 border border-amber-500/30 overflow-hidden">
                                                <div className="px-4 py-2 bg-amber-500/10 flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                    <span className="text-xs font-bold text-amber-500">
                                                        {lang === "en"
                                                            ? `Missing Items (${report.missing_items.length})`
                                                            : `हराएका सामानहरू (${report.missing_items.length})`}
                                                    </span>
                                                </div>
                                                <div className="divide-y divide-border/20 max-h-32 overflow-auto">
                                                    {report.missing_items.map(item => (
                                                        <div key={item.item_id} className="px-4 py-2 flex items-center justify-between text-xs">
                                                            <div>
                                                                <p className="font-bold">{item.item_name}</p>
                                                                <p className="text-muted-foreground font-mono">{item.rfid_tag}</p>
                                                            </div>
                                                            <span className="text-amber-500 font-mono">{item.net_weight_grams.toFixed(2)}g</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="rounded-xl border border-border/30 overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted/50 border-b border-border/30">
                                                    <tr>
                                                        <th className="p-2 text-left">Tag UUID</th>
                                                        <th className="p-2 text-left">{lang === "en" ? "Item" : "सामान"}</th>
                                                        <th className="p-2 text-center">{t('status')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/10">
                                                    {report.scan_results.map(r => (
                                                        <tr key={r.tag} className="hover:bg-accent/30">
                                                            <td className="p-2 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">{r.tag}</td>
                                                            <td className="p-2">{r.item_name ?? <span className="italic text-muted-foreground">{t('unknown')}</span>}</td>
                                                            <td className="p-2 text-center">
                                                                {r.status === "matched"
                                                                    ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                                                    : <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                                                                }
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab 2: Tag Management */}
                <TabsContent value="tags" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader className="pb-3 border-b border-border/30">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Tag className="w-4 h-4 text-primary" /> {t('assignTag')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs">{lang === "en" ? "Select Item" : "सामान छान्नुहोस्"}</Label>
                                <select
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={tagAssignItemId}
                                    onChange={e => setTagAssignItemId(e.target.value)}
                                >
                                    <option value="">{lang === "en" ? "-- Select item --" : "-- सामान छान्नुहोस् --"}</option>
                                    {inventory.filter(i => !i.tagged).map(i => (
                                        <option key={i.item_id} value={i.item_id}>{i.item_name} ({i.net_weight_grams}g)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">RFID Tag UUID</Label>
                                <Input
                                    value={tagAssignValue}
                                    onChange={e => setTagAssignValue(e.target.value)}
                                    placeholder="EPC UUID or hex string"
                                    className="font-mono text-xs"
                                />
                            </div>
                            <Button onClick={handleAssignTag} className="h-10 bg-primary font-bold">
                                <Tag className="w-4 h-4 mr-2" /> {t('assignTag')}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between">
                            <CardTitle className="text-base">{t('stockOverview')}</CardTitle>
                            <div className="flex gap-2 text-xs">
                                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold">{tagStats.tagged} {t('tagged')}</span>
                                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">{tagStats.untagged} {t('untagged')}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-96 overflow-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 sticky top-0 border-b border-border/30">
                                        <tr>
                                            <th className="p-3 text-left">{t('itemName')}</th>
                                            <th className="p-3 text-left">{t('category')}</th>
                                            <th className="p-3 text-right">{t('weight')}</th>
                                            <th className="p-3 text-left">RFID Tag</th>
                                            <th className="p-3 text-center">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10">
                                        {inventory.map(item => (
                                            <tr key={item.item_id} className="hover:bg-accent/30 transition-colors">
                                                <td className="p-3 font-bold">{item.item_name}</td>
                                                <td className="p-3 text-muted-foreground">{item.category}</td>
                                                <td className="p-3 text-right font-mono">{item.net_weight_grams.toFixed(2)}g</td>
                                                <td className="p-3">
                                                    {item.rfid_tag
                                                        ? <span className="font-mono text-[10px] text-green-400">{item.rfid_tag}</span>
                                                        : <span className="italic text-muted-foreground">{t('untagged')}</span>
                                                    }
                                                </td>
                                                <td className="p-3 text-center">
                                                    {item.tagged && (
                                                        <button
                                                            onClick={() => handleRemoveTag(item.item_id)}
                                                            className="text-[10px] text-red-400 hover:text-red-300 px-2 py-0.5 rounded border border-red-400/30 hover:bg-red-400/10 transition-all"
                                                        >
                                                            {t('removeTag')}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {inventory.length === 0 && (
                                            <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">{t('noData')}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Compliance Audit Log */}
                <TabsContent value="log" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <Card className="lg:col-span-3 h-fit">
                            <CardHeader className="pb-3 border-b border-border/30">
                                <CardTitle className="text-base">{t('auditFilter')}</CardTitle>
                                <CardDescription className="text-xs">{t('auditFilterDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs"><Calendar className="w-3 h-3 inline mr-1" />{t('from')}</Label>
                                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-background" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs"><Calendar className="w-3 h-3 inline mr-1" />{t('to')}</Label>
                                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-background" />
                                </div>
                                <Button onClick={handleAuditSearch} className="w-full">
                                    <Search className="w-4 h-4 mr-2" /> {t('searchLogs')}
                                </Button>
                                <Button
                                    onClick={() => downloadAuditTrail(auditLog)}
                                    variant="outline"
                                    className="w-full border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/5"
                                >
                                    <Download className="w-4 h-4 mr-2" /> {t('exportIrd')}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-9 overflow-hidden">
                            <CardHeader className="bg-muted/20 border-b border-border/30 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">{t('activityJournal')}</CardTitle>
                                    <CardDescription className="text-xs">{auditLog.length} {t('entries')}</CardDescription>
                                </div>
                                <FileText className="w-8 h-8 opacity-10" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[520px] overflow-auto">
                                    {auditLog.length === 0 ? (
                                        <div className="py-20 text-center text-muted-foreground italic text-sm">
                                            {t('noLogsFound')}
                                        </div>
                                    ) : (
                                        <table className="w-full text-[11px]">
                                            <thead className="bg-muted/40 border-b border-border/30 sticky top-0">
                                                <tr>
                                                    <th className="p-3 text-left w-36">{t('time')}</th>
                                                    <th className="p-3 text-left w-28">{t('action')}</th>
                                                    <th className="p-3 text-left">{t('description')}</th>
                                                    <th className="p-3 text-left w-20">{t('user')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="font-mono divide-y divide-border/10">
                                                {auditLog.map(entry => (
                                                    <tr key={entry.id} className="hover:bg-primary/5 transition-colors">
                                                        <td className="p-3 text-muted-foreground whitespace-nowrap text-[10px]">
                                                            {new Date(entry.timestamp).toLocaleString(lang === "ne" ? "ne-NP" : "en-GB")}
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-indigo-500/30 text-indigo-400 font-mono">
                                                                {entry.action}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3 text-muted-foreground leading-relaxed max-w-sm truncate font-sans">{entry.details}</td>
                                                        <td className="p-3 text-primary/60 font-semibold font-sans">{entry.user}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
