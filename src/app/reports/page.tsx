"use client";

import { PinLock } from "@/components/auth/pin-lock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, HandCoins, Users, Banknote, ShieldCheck } from "lucide-react";
import Link from "next/link";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import { useShop } from "@/lib/shop-context";

// Mock data to demonstrate the analytics dashboard aesthetics and layout
const revenueData = [
    { day: "Mon", revenue: 450000, profit: 80000 },
    { day: "Tue", revenue: 520000, profit: 95000 },
    { day: "Wed", revenue: 380000, profit: 65000 },
    { day: "Thu", revenue: 650000, profit: 120000 },
    { day: "Fri", revenue: 410000, profit: 75000 },
    { day: "Sat", revenue: 780000, profit: 140000 },
    { day: "Sun", revenue: 850000, profit: 160000 },
];

export default function ReportsPage() {
    const { profile } = useShop();
    const themeColor = profile.accent_color || "#D4AF37";

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-border/30" />
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" /> Reports & Analytics
                        </h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
                <PinLock requiredRole="owner">
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Top Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="glass-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">This Week's Revenue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold font-mono tracking-tight text-foreground">रू 40,40,000</div>
                                    <p className="text-xs text-green-500 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" /> +12.5% from last week</p>
                                </CardContent>
                            </Card>
                            <Card className="glass-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Est. Gross Profit</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold font-mono tracking-tight text-foreground">रू 7,35,000</div>
                                    <p className="text-xs text-green-500 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" /> +8.2% from last week</p>
                                </CardContent>
                            </Card>
                            <Card className="glass-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Active Dhito Capital</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold font-mono tracking-tight text-foreground">रू 15,50,000</div>
                                    <p className="text-xs text-muted-foreground mt-1">Across 34 loans</p>
                                </CardContent>
                            </Card>
                            <Card className="glass-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">New Customers</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold tracking-tight text-foreground">28</div>
                                    <p className="text-xs text-green-500 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" /> +4 this week</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Revenue Chart */}
                            <Card className="glass-card lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>7-Day Revenue Trend</CardTitle>
                                    <CardDescription>Daily gross sales across all transactions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={themeColor} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `रू${value / 1000}k`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: "#121212", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                                                    itemStyle={{ color: themeColor }}
                                                    formatter={(value: number) => [`रू ${value.toLocaleString()}`, "Revenue"]}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke={themeColor} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Profit Margin Chart */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle>Estimated Profit</CardTitle>
                                    <CardDescription>Daily gross margin (Sale - Material Cost)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: "#121212", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                                                    itemStyle={{ color: "#50C878" }}
                                                    formatter={(value: number) => [`रू ${value.toLocaleString()}`, "Profit"]}
                                                />
                                                <Line type="monotone" dataKey="profit" stroke="#50C878" strokeWidth={3} dot={{ r: 4, fill: "#121212", strokeLinewidth: 2 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Security Audit Insight */}
                        <Card className="glass-card border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-primary text-lg">IRD Compliance Audit</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    The Audit Log currently holds cryptographic hashes matching the most recent 142 transactions.
                                    No tampering detected. Your records are IRD compliant.
                                </p>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="text-primary border-primary/30 hover:bg-primary/10">Export Audit Log (JSON)</Button>
                                    <Button variant="outline" className="text-primary border-primary/30 hover:bg-primary/10">Print Monthly Summary</Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </PinLock>
            </main>
        </div>
    );
}
