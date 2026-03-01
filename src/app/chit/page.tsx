"use client";

import { useState, useEffect } from "react";
import { getDb } from "@/lib/db";
import {
    listChitSchemes,
    createChitScheme,
    addInstallmentPayment,
    getChitSummary,
    getMaturityAlerts,
    type ChitScheme,
    type ChitSummary
} from "@/lib/chit-engine";
import { fetchLiveRatesFromFederation } from "@/lib/rates-sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, Calendar, User, Phone, TrendingUp, AlertCircle, CheckCircle2, Navigation } from "lucide-react";
import { toast } from "sonner";

export default function ChitPage() {
    const [schemes, setSchemes] = useState<ChitScheme[]>([]);
    const [selectedSummary, setSelectedSummary] = useState<ChitSummary | null>(null);
    const [alerts, setAlerts] = useState<ChitSummary[]>([]);
    const [liveRate, setLiveRate] = useState<number>(0);

    // Form states
    const [newScheme, setNewScheme] = useState({ name: "", phone: "", amount: "10000", months: "12" });
    const [payAmount, setPayAmount] = useState("");

    useEffect(() => {
        loadData();
        fetchRate();
    }, []);

    async function loadData() {
        const [list, matAlerts] = await Promise.all([
            listChitSchemes(),
            getMaturityAlerts()
        ]);
        setSchemes(list);
        setAlerts(matAlerts);
        if (list.length > 0 && !selectedSummary) {
            handleSelectScheme(list[0].id);
        }
    }

    async function fetchRate() {
        const rates = await fetchLiveRatesFromFederation();
        setLiveRate(rates.gold);
    }

    async function handleSelectScheme(id: string) {
        const summary = await getChitSummary(id);
        setSelectedSummary(summary);
    }

    async function handleCreateScheme() {
        if (!newScheme.name || !newScheme.amount) return;
        await createChitScheme({
            customer_name: newScheme.name,
            customer_phone: newScheme.phone,
            monthly_amount_npr: parseFloat(newScheme.amount),
            total_months: parseInt(newScheme.months)
        });
        setNewScheme({ name: "", phone: "", amount: "10000", months: "12" });
        loadData();
        toast.success("New Chit Scheme started!");
    }

    async function handlePayment() {
        if (!selectedSummary || !payAmount || liveRate <= 0) return;
        await addInstallmentPayment({
            scheme_id: selectedSummary.scheme.id,
            amount_npr: parseFloat(payAmount),
            gold_rate_per_tola: liveRate
        });
        setPayAmount("");
        handleSelectScheme(selectedSummary.scheme.id);
        toast.success("Installment paid successfully!");
    }

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <Coins className="w-8 h-8 text-amber-500" /> Gold Chit Savings
                    </h1>
                    <p className="text-muted-foreground mt-1">Monthly savings ledger converted to physical gold weight.</p>
                </div>
                <div className="flex bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-500 uppercase">Live Rate:</span>
                    <span className="font-mono font-bold">रू {liveRate.toLocaleString()}/Tola</span>
                </div>
            </header>

            {alerts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.map(a => (
                        <div key={a.scheme.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 flex items-center gap-3 animate-pulse">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <div className="text-xs">
                                <p className="font-bold text-red-500">Maturity Alert: {a.scheme.customer_name}</p>
                                <p className="text-muted-foreground">{a.days_to_maturity <= 0 ? "Matured" : `In ${a.days_to_maturity} days`}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Scheme List */}
                <Card className="lg:col-span-4 glass-card h-fit">
                    <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-sm">Savings Ledgers</CardTitle>
                        <Badge variant="outline">{schemes.length}</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/30 max-h-[600px] overflow-auto custom-scrollbar">
                            {schemes.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSelectScheme(s.id)}
                                    className={`w-full text-left p-4 transition-all flex items-center justify-between ${selectedSummary?.scheme.id === s.id ? "bg-amber-500/10 border-l-4 border-amber-500" : "hover:bg-accent"
                                        }`}
                                >
                                    <div>
                                        <p className="font-bold text-sm tracking-tight">{s.customer_name}</p>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                            <Calendar className="w-2 h-2" /> Start: {new Date(s.start_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge variant={s.status === 'active' ? 'secondary' : 'default'} className="text-[10px]">
                                        {s.status}
                                    </Badge>
                                </button>
                            ))}
                        </div>
                        <div className="p-4 border-t bg-muted/20 space-y-3">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Start New Scheme</p>
                            <Input placeholder="Customer Name" value={newScheme.name} onChange={e => setNewScheme({ ...newScheme, name: e.target.value })} className="h-8 text-xs" />
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="NPR / Month" value={newScheme.amount} onChange={e => setNewScheme({ ...newScheme, amount: e.target.value })} className="h-8 text-xs" />
                                <Input placeholder="Months" value={newScheme.months} onChange={e => setNewScheme({ ...newScheme, months: e.target.value })} className="h-8 text-xs" />
                            </div>
                            <Button onClick={handleCreateScheme} className="w-full h-8 text-xs bg-amber-500 text-white hover:bg-amber-600">
                                <Plus className="w-3 h-3 mr-2" /> Start Scheme
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Summary & Payments */}
                {selectedSummary ? (
                    <div className="lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="glass-card bg-amber-500/5">
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="p-4 rounded-2xl bg-amber-500/20">
                                        <Coins className="w-10 h-10 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest">Accumulated gold</p>
                                        <p className="text-4xl font-mono font-extrabold text-amber-600 leading-none mt-1">
                                            {selectedSummary.total_gold_grams.toFixed(3)}<span className="text-lg">g</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2 font-medium">≈ {selectedSummary.total_gold_tola.toFixed(3)} Tola</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="p-4 rounded-2xl bg-primary/10">
                                        <CheckCircle2 className="w-10 h-10 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Progress</p>
                                        <p className="text-4xl font-mono font-extrabold leading-none mt-1">
                                            {selectedSummary.paid_installments}<span className="text-lg text-muted-foreground">/{selectedSummary.scheme.total_months}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2 font-medium">{selectedSummary.remaining_installments} months remaining</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="glass-card overflow-hidden">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-lg">Installment Ledger</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 border-b border-border/50">
                                        <tr>
                                            <th className="p-3 text-left">#</th>
                                            <th className="p-3 text-left">Date</th>
                                            <th className="p-3 text-right">Amount (NPR)</th>
                                            <th className="p-3 text-right">Rate (NPR/T)</th>
                                            <th className="p-3 text-right">Gold (Grams)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {selectedSummary.installments.map(i => (
                                            <tr key={i.id} className="hover:bg-accent/30 transition-colors">
                                                <td className="p-3 font-bold">{i.installment_number}</td>
                                                <td className="p-3 text-muted-foreground">{new Date(i.payment_date).toLocaleDateString()}</td>
                                                <td className="p-3 text-right font-mono">रू {i.amount_npr.toLocaleString()}</td>
                                                <td className="p-3 text-right font-mono text-muted-foreground">{i.gold_rate_on_day.toLocaleString()}</td>
                                                <td className="p-3 text-right font-mono font-bold text-amber-600">+{i.gold_weight_grams.toFixed(4)}g</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {selectedSummary.scheme.status === 'active' && (
                                    <div className="p-6 bg-muted/10 border-t flex items-end gap-4">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Pay installment</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">रू</span>
                                                <Input
                                                    type="number"
                                                    value={payAmount}
                                                    onChange={e => setPayAmount(e.target.value)}
                                                    placeholder={selectedSummary.scheme.monthly_amount_npr.toString()}
                                                    className="pl-8 bg-background"
                                                />
                                            </div>
                                        </div>
                                        <Button onClick={handlePayment} className="h-10 bg-amber-500 hover:bg-amber-600 px-8 shadow-lg shadow-amber-500/20">
                                            Record Payment
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="lg:col-span-8 flex flex-col items-center justify-center py-40 text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-border/50">
                        <Navigation className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select a savings scheme to view details.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
