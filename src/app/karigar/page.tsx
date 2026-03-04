"use client";

import { useState, useEffect } from "react";
import {
    listKarigars,
    addKarigar,
    createRawOutJob,
    receiveFinishedJob,
    getJobsForKarigar,
    getRawOutBalance,
    gramsToTolaDisplay,
    type Karigar,
    type KarigarJob
} from "@/lib/karigar-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GlobalNav } from "@/components/global-nav";
import { useLang } from "@/lib/lang-context";
import { useShop } from "@/lib/shop-context";
import {
    Hammer, Send, PackageCheck, UserPlus, Briefcase, History, AlertCircle, CheckCircle2, Clock, Phone
} from "lucide-react";
import { toast } from "sonner";

export default function KarigarPage() {
    const { profile } = useShop();
    const { t, lang } = useLang();

    const [karigars, setKarigars] = useState<Karigar[]>([]);
    const [selected, setSelected] = useState<Karigar | null>(null);
    const [jobs, setJobs] = useState<KarigarJob[]>([]);
    const [balance, setBalance] = useState<Awaited<ReturnType<typeof getRawOutBalance>> | null>(null);
    const [loading, setLoading] = useState(false);

    const [newK, setNewK] = useState({ name: "", phone: "", specialty: "" });
    const [jobForm, setJobForm] = useState({ item: "", weight: "", karat: "24K", wastage: "0.5" });
    const [recvForm, setRecvForm] = useState({ jobId: "", finished: "", jarti: "", stone: "" });

    useEffect(() => { loadKarigars(); }, []);
    useEffect(() => { if (selected) loadDetail(selected.id); }, [selected]);

    async function loadKarigars() {
        const list = await listKarigars();
        setKarigars(list);
        if (list.length > 0 && !selected) setSelected(list[0]);
    }

    async function loadDetail(id: string) {
        setLoading(true);
        const [j, b] = await Promise.all([getJobsForKarigar(id), getRawOutBalance(id)]);
        setJobs(j);
        setBalance(b);
        setLoading(false);
    }

    async function onAddKarigar() {
        if (!newK.name.trim()) { toast.error(lang === "en" ? "Karigar name is required." : "कारीगरको नाम आवश्यक छ ।"); return; }
        await addKarigar(newK);
        setNewK({ name: "", phone: "", specialty: "" });
        await loadKarigars();
        toast.success(lang === "en" ? "Karigar added successfully ✓" : "कारीगर सफलतापूर्वक थपियो ✓");
    }

    async function onDispatch() {
        if (!selected) return;
        if (!jobForm.item.trim()) { toast.error(lang === "en" ? "Item description is required." : "सामानको विवरण भर्नुहोस् ।"); return; }
        if (!jobForm.weight || parseFloat(jobForm.weight) <= 0) { toast.error(lang === "en" ? "Enter raw weight." : "कच्चा तौल भर्नुहोस् ।"); return; }
        await createRawOutJob({
            karigar_id: selected.id,
            karigar_name: selected.name,
            item_description: jobForm.item,
            raw_out_weight_grams: parseFloat(jobForm.weight),
            raw_out_karat: jobForm.karat,
            wastage_percent: parseFloat(jobForm.wastage),
        });
        setJobForm({ item: "", weight: "", karat: "24K", wastage: "0.5" });
        await loadDetail(selected.id);
        toast.success(lang === "en"
            ? `${jobForm.item} — dispatched to karigar ✓`
            : `${jobForm.item} — कारीगरकहाँ पठाइयो ✓`
        );
    }

    async function onReceive() {
        if (!recvForm.jobId) { toast.error(lang === "en" ? "Select a pending job first." : "पहिले काम छान्नुहोस् ।"); return; }
        if (!recvForm.finished || parseFloat(recvForm.finished) <= 0) { toast.error(lang === "en" ? "Enter finished weight." : "फिनिस तौल भर्नुहोस् ।"); return; }
        const res = await receiveFinishedJob(recvForm.jobId, {
            finished_weight_grams: parseFloat(recvForm.finished),
            jarti_grams: parseFloat(recvForm.jarti || "0"),
            stone_weight_grams: parseFloat(recvForm.stone || "0"),
        });
        const lossG = res.gold_loss_grams.toFixed(3);
        setRecvForm({ jobId: "", finished: "", jarti: "", stone: "" });
        if (selected) await loadDetail(selected.id);
        toast.success(lang === "en"
            ? `Work received ✓  |  Gold Loss: ${lossG}g`
            : `काम सफलतापूर्वक प्राप्त भयो ✓  |  सुन घाटा: ${lossG}g`
        );
    }

    const pendingJobs = jobs.filter(j => j.status === "pending");

    // Karat display labels switch with language
    const karatOptions = lang === "en"
        ? [
            { value: "24K", label: "24K Hallmark" },
            { value: "Tejabi", label: "Tejabi (18K Gold)" },
            { value: "22K", label: "22K Gold (Asali)" },
            { value: "18K", label: "18K Gold" },
        ]
        : [
            { value: "24K", label: "२४क हलमार्क (छापावाल)" },
            { value: "Tejabi", label: "तेजाबी (तेजावी)" },
            { value: "22K", label: "२२क असली सुन" },
            { value: "18K", label: "१८क सुन" },
        ];

    return (
        <div className="min-h-screen warm-bg-gradient text-foreground">
            <GlobalNav />
            <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            <Hammer className="w-6 h-6 text-primary" />
                            {t('karigarMgmt')}
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">{t('karigarSubtitle')}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {balance && (
                            <div className="flex gap-3">
                                <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-center">
                                    <p className="text-[10px] uppercase font-bold text-primary/60 tracking-widest">{t('goldAtKarigar')}</p>
                                    <p className="text-xl font-mono font-extrabold text-primary leading-none mt-1">
                                        {balance.balance_grams.toFixed(3)}<span className="text-sm">g</span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">{gramsToTolaDisplay(balance.balance_grams)}</p>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                    <p className="text-[10px] uppercase font-bold text-amber-500/60 tracking-widest">{t('pendingJobs')}</p>
                                    <p className="text-xl font-mono font-extrabold text-amber-500 leading-none mt-1">{balance.pending_jobs}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <Card className="lg:col-span-1">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" /> {t('karigarName')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/20 max-h-64 overflow-auto">
                                {karigars.length === 0 && (
                                    <p className="p-4 text-xs text-muted-foreground italic text-center">{t('noData')}</p>
                                )}
                                {karigars.map(k => (
                                    <button
                                        key={k.id}
                                        onClick={() => setSelected(k)}
                                        className={`w-full text-left px-4 py-3 transition-all flex items-center gap-3 ${selected?.id === k.id
                                            ? "bg-primary/10 border-l-4 border-primary"
                                            : "hover:bg-accent"
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                            {k.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate">{k.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{k.specialty || (lang === "en" ? "General" : "सामान्य")}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Add form */}
                            <div className="p-4 border-t border-border/30 bg-muted/10 space-y-3">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('addKarigar')}</p>
                                <Input
                                    placeholder={`${t('name')} *`}
                                    value={newK.name}
                                    onChange={e => setNewK({ ...newK, name: e.target.value })}
                                    className="h-8 text-xs"
                                />
                                <Input
                                    placeholder={t('specialty')}
                                    value={newK.specialty}
                                    onChange={e => setNewK({ ...newK, specialty: e.target.value })}
                                    className="h-8 text-xs"
                                />
                                <Input
                                    placeholder={t('phone')}
                                    value={newK.phone}
                                    onChange={e => setNewK({ ...newK, phone: e.target.value })}
                                    className="h-8 text-xs"
                                />
                                <Button onClick={onAddKarigar} size="sm" className="w-full text-xs h-8 bg-primary text-primary-foreground">
                                    <UserPlus className="w-3 h-3 mr-2" /> {t('addKarigar')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Panel */}
                    <div className="lg:col-span-3">
                        {!selected ? (
                            <div className="h-full flex items-center justify-center py-40 text-muted-foreground border border-dashed rounded-2xl text-sm">
                                <p>{t('selectKarigar')}</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="history" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6">
                                    <TabsTrigger value="history" className="flex items-center gap-2 text-xs">
                                        <History className="w-4 h-4" /> {t('jobHistory')}
                                    </TabsTrigger>
                                    <TabsTrigger value="dispatch" className="flex items-center gap-2 text-xs">
                                        <Send className="w-4 h-4" /> {lang === "en" ? "Raw-Out" : "सुन पठाउनुहोस्"}
                                    </TabsTrigger>
                                    <TabsTrigger value="receive" className="flex items-center gap-2 text-xs">
                                        <PackageCheck className="w-4 h-4" /> {lang === "en" ? "Finished-In" : "गहना लिनुहोस्"}
                                    </TabsTrigger>
                                </TabsList>

                                {/* Job History */}
                                <TabsContent value="history" className="space-y-3">
                                    {loading ? (
                                        <div className="text-center py-20 text-muted-foreground text-sm">{t('loading')}</div>
                                    ) : jobs.length === 0 ? (
                                        <div className="py-20 text-center border border-dashed rounded-2xl text-muted-foreground text-sm">
                                            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p>{t('noJobsFound')}</p>
                                        </div>
                                    ) : (
                                        jobs.map(job => {
                                            const isPending = job.status === "pending";
                                            return (
                                                <Card key={job.id} className={`overflow-hidden transition-all ${isPending ? "border-amber-500/30" : "border-green-500/20 opacity-80"}`}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${isPending ? "bg-amber-500/15" : "bg-green-500/15"}`}>
                                                                    {isPending
                                                                        ? <Clock className="w-4 h-4 text-amber-500" />
                                                                        : <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                                    }
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-sm truncate">{job.item_description}</p>
                                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                                                                        {new Date(job.raw_out_date).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-GB")}
                                                                        {selected?.phone && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const phone = selected.phone.replace(/[^0-9]/g, "");
                                                                                    const msg = `Namaste ${selected.name} Ji! 🙏\n\nJob update from *${profile.shop_name || "Walsong Jewellers"}*:\n• Item: ${job.item_description}\n• Given Weight: ${job.raw_out_weight_grams}g (${job.raw_out_karat})\n\n${isPending ? "Please update us on the progress." : "Thank you for completing this job!"}`;
                                                                                    window.open(`https://wa.me/977${phone}?text=${encodeURIComponent(msg)}`, "_blank");
                                                                                }}
                                                                                className="text-green-500 hover:text-green-600 transition-colors"
                                                                                title="Send WhatsApp Update"
                                                                            >
                                                                                WhatsApp
                                                                            </button>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge variant="outline" className={`shrink-0 text-[9px] px-2 ${isPending ? "text-amber-500 border-amber-500/50" : "text-green-500 border-green-500/50"}`}>
                                                                {isPending ? t('pending') : t('completed')}
                                                            </Badge>
                                                        </div>

                                                        <div className="mt-3 grid grid-cols-3 divide-x divide-border/30 bg-muted/30 rounded-lg overflow-hidden text-center">
                                                            <div className="py-2">
                                                                <p className="text-[9px] uppercase text-muted-foreground">{lang === "en" ? "Dispatched" : "पठाएको"}</p>
                                                                <p className="font-mono text-sm font-bold">{job.raw_out_weight_grams}g</p>
                                                                <p className="text-[9px] text-muted-foreground">{job.raw_out_karat}</p>
                                                            </div>
                                                            <div className="py-2">
                                                                <p className="text-[9px] uppercase text-muted-foreground">{lang === "en" ? "Finished" : "फिनिस"}</p>
                                                                <p className="font-mono text-sm font-bold">{isPending ? "—" : `${job.finished_weight_grams}g`}</p>
                                                                <p className="text-[9px] text-muted-foreground">{lang === "en" ? "Jarti" : "जर्ती"}: {isPending ? "—" : `${job.jarti_grams}g`}</p>
                                                            </div>
                                                            <div className="py-2">
                                                                <p className="text-[9px] uppercase text-muted-foreground">{lang === "en" ? "Net" : "नेट"}</p>
                                                                <p className="font-mono text-sm font-bold">{isPending ? "—" : `${job.net_weight_grams}g`}</p>
                                                                <p className="text-[9px] text-muted-foreground">{isPending ? "" : gramsToTolaDisplay(job.net_weight_grams)}</p>
                                                            </div>
                                                        </div>

                                                        {!isPending && job.actual_wastage_grams > 0 && (
                                                            <div className="mt-2 text-[10px] text-muted-foreground flex gap-4 justify-end">
                                                                <span>{lang === "en" ? "Jarti used:" : "जर्ती प्रयोग:"} <strong>{job.actual_wastage_grams.toFixed(3)}g</strong></span>
                                                                <span>{t('goldLoss')}: <strong className="text-red-400">{(job.raw_out_weight_grams - job.net_weight_grams).toFixed(3)}g</strong></span>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    )}
                                </TabsContent>

                                {/* Dispatch Tab */}
                                <TabsContent value="dispatch">
                                    <Card>
                                        <CardHeader className="border-b border-border/30 pb-4">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Send className="w-4 h-4 text-primary" /> {t('issueGold')}
                                            </CardTitle>
                                            <CardDescription>
                                                {lang === "en"
                                                    ? `Issue raw gold to ${selected.name}`
                                                    : `${selected.name}लाई कच्चा सुन दिनुहोस्`}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">{t('itemDesc')} *</Label>
                                                    <Input
                                                        placeholder={lang === "en" ? "e.g. 2 Necklaces, 1 Rani Haar" : "जस्तै: २ नेकलेस, १ रानीहार"}
                                                        value={jobForm.item}
                                                        onChange={e => setJobForm({ ...jobForm, item: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">{t('rawWeight')} *</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.000"
                                                            value={jobForm.weight}
                                                            onChange={e => setJobForm({ ...jobForm, weight: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">{t('karat')}</Label>
                                                        <select
                                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                            value={jobForm.karat}
                                                            onChange={e => setJobForm({ ...jobForm, karat: e.target.value })}
                                                        >
                                                            {karatOptions.map(o => (
                                                                <option key={o.value} value={o.value}>{o.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">{t('wastagePercent')} *</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.5"
                                                        value={jobForm.wastage}
                                                        onChange={e => setJobForm({ ...jobForm, wastage: e.target.value })}
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {lang === "en"
                                                            ? "Agreed jarti allowance — calculated on receipt."
                                                            : "सहमत जर्ती प्रतिशत — काम आउँदा हिसाब हुन्छ ।"}
                                                    </p>
                                                </div>

                                                {jobForm.weight && parseFloat(jobForm.weight) > 0 && (
                                                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs space-y-1">
                                                        <p className="font-bold text-primary text-[10px] uppercase tracking-wider">{t('preview')}</p>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">{lang === "en" ? "Gold to dispatch:" : "पठाइने सुन:"}</span>
                                                            <span className="font-mono font-bold">{parseFloat(jobForm.weight).toFixed(3)}g</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">{lang === "en" ? `Expected jarti (${jobForm.wastage}%):` : `अपेक्षित जर्ती (${jobForm.wastage}%):`}</span>
                                                            <span className="font-mono">{(parseFloat(jobForm.weight) * parseFloat(jobForm.wastage || "0") / 100).toFixed(3)}g</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <Button onClick={onDispatch} className="w-full h-12 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
                                                    <Send className="w-5 h-5 mr-2" /> {t('dispatch')}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Receive Tab */}
                                <TabsContent value="receive">
                                    <Card>
                                        <CardHeader className="border-b border-border/30 pb-4">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <PackageCheck className="w-4 h-4 text-green-500" /> {t('receiveGold')}
                                            </CardTitle>
                                            <CardDescription>
                                                {lang === "en"
                                                    ? `Enter weights after receiving finished jewelry from ${selected.name}`
                                                    : `${selected.name}बाट गहना लिएपछि तौल भर्नुहोस्`}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-5">
                                            <div className="space-y-2">
                                                <Label className="text-xs">{t('selectPendingJob')} *</Label>
                                                {pendingJobs.length === 0 ? (
                                                    <div className="h-10 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground gap-2">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {lang === "en" ? "No pending jobs" : "कुनै बाँकी काम छैन"}
                                                    </div>
                                                ) : (
                                                    <select
                                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        value={recvForm.jobId}
                                                        onChange={e => setRecvForm({ ...recvForm, jobId: e.target.value })}
                                                    >
                                                        <option value="">{lang === "en" ? "Select a job…" : "छान्नुहोस्…"}</option>
                                                        {pendingJobs.map(job => (
                                                            <option key={job.id} value={job.id}>
                                                                {job.item_description} — {job.raw_out_weight_grams}g {lang === "en" ? "dispatched" : "पठाएको"} ({job.raw_out_karat})
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs flex items-center gap-1">
                                                        {t('finishedWeight')} <Badge className="text-[8px] h-3 px-1" variant="secondary">{t('required')}</Badge>
                                                    </Label>
                                                    <Input type="number" placeholder="0.000" value={recvForm.finished} onChange={e => setRecvForm({ ...recvForm, finished: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">{t('jarti')}</Label>
                                                    <Input type="number" placeholder="0.000" value={recvForm.jarti} onChange={e => setRecvForm({ ...recvForm, jarti: e.target.value })} />
                                                    <p className="text-[9px] text-muted-foreground">{lang === "en" ? "Dust / Scrap" : "धूलो / स्क्र्याप"}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">{t('stoneWeight')}</Label>
                                                    <Input type="number" placeholder="0.000" value={recvForm.stone} onChange={e => setRecvForm({ ...recvForm, stone: e.target.value })} />
                                                    <p className="text-[9px] text-muted-foreground">{lang === "en" ? "Added stones" : "थपिएको ढुंगा"}</p>
                                                </div>
                                            </div>

                                            {recvForm.finished && parseFloat(recvForm.finished) > 0 && recvForm.jobId && (
                                                <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 text-xs space-y-1">
                                                    <p className="font-bold text-green-500 text-[10px] uppercase tracking-wider">{t('preview')}</p>
                                                    {(() => {
                                                        const job = pendingJobs.find(j => j.id === recvForm.jobId);
                                                        if (!job) return null;
                                                        const f = parseFloat(recvForm.finished || "0");
                                                        const ja = parseFloat(recvForm.jarti || "0");
                                                        const st = parseFloat(recvForm.stone || "0");
                                                        const net = f + ja + st;
                                                        const loss = job.raw_out_weight_grams - net;
                                                        return (
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between"><span className="text-muted-foreground">{lang === "en" ? "Net weight (F+J+S):" : "नेट तौल (F+J+S):"}</span><span className="font-mono font-bold">{net.toFixed(3)}g</span></div>
                                                                <div className="flex justify-between"><span className="text-muted-foreground">{lang === "en" ? "Dispatched:" : "पठाएको:"}</span><span className="font-mono">{job.raw_out_weight_grams.toFixed(3)}g</span></div>
                                                                <div className="flex justify-between border-t border-green-500/20 pt-1">
                                                                    <span className="text-muted-foreground">{t('goldLoss')}:</span>
                                                                    <span className={`font-mono font-bold ${loss > 0 ? "text-red-400" : "text-green-400"}`}>{loss.toFixed(3)}g</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            <Button
                                                onClick={onReceive}
                                                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-500/20"
                                                disabled={pendingJobs.length === 0}
                                            >
                                                <PackageCheck className="w-5 h-5 mr-2" /> {t('receiveClose')}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
