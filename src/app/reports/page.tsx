"use client";

import { PinLock } from "@/components/auth/pin-lock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Calendar, Printer, Download } from "lucide-react";
import { GlobalNav } from "@/components/global-nav";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { useShop } from "@/lib/shop-context";
import { useEffect, useState, useCallback } from "react";
import { getDb } from "@/lib/db";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";

type DateFilter = "today" | "7days" | "month" | "year" | "all";

interface InvoiceRecord {
    id: string;
    date: string;
    customer_name: string;
    items: string;
    subtotal: number;
    vat_amount: number;
    grand_total: number;
    cashier: string;
    payment_method: string;
}

interface DailyData {
    date: string;
    label: string;
    revenue: number;
    tax: number;
    count: number;
}

interface Metrics {
    grossSales: number;
    netSales: number;
    totalTax: number;
    transactionCount: number;
    cashSales: number;
    bankSales: number;
    creditSales: number;
}

export default function ReportsPage() {
    const { profile } = useShop();
    const themeColor = profile.accent_color || "#D4AF37";

    const [dateFilter, setDateFilter] = useState<DateFilter>("7days");
    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [dailyData, setDailyData] = useState<DailyData[]>([]);
    const [metrics, setMetrics] = useState<Metrics>({
        grossSales: 0, netSales: 0, totalTax: 0, transactionCount: 0,
        cashSales: 0, bankSales: 0, creditSales: 0,
    });
    const [loading, setLoading] = useState(true);

    // Monthly summary print
    const [showMonthlySummary, setShowMonthlySummary] = useState(false);
    const [monthlySummary, setMonthlySummary] = useState<any>(null);

    const getDateRange = useCallback((filter: DateFilter): { start: Date; end: Date } => {
        const now = new Date();
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);

        switch (filter) {
            case "today": {
                const start = new Date(now);
                start.setHours(0, 0, 0, 0);
                return { start, end };
            }
            case "7days":
                return { start: subDays(now, 6), end };
            case "month":
                return { start: startOfMonth(now), end };
            case "year":
                return { start: startOfYear(now), end };
            case "all":
                return { start: new Date(2000, 0, 1), end };
            default:
                return { start: subDays(now, 6), end };
        }
    }, []);

    const fetchReportData = useCallback(async () => {
        setLoading(true);
        try {
            const db = await getDb();
            const { start, end } = getDateRange(dateFilter);
            const startIso = start.toISOString();
            const endIso = end.toISOString();

            // Fetch all invoices and filter by date range
            const allInvoices = await db.invoices.find().exec();
            const filtered: InvoiceRecord[] = allInvoices
                .map((doc: any) => doc.toJSON() as InvoiceRecord)
                .filter((inv: InvoiceRecord) => inv.date >= startIso && inv.date <= endIso)
                .sort((a: InvoiceRecord, b: InvoiceRecord) => a.date.localeCompare(b.date));

            console.log(`[Reports] Fetched ${filtered.length} invoices for filter: ${dateFilter}`);

            // Calculate metrics
            let grossSales = 0, netSales = 0, totalTax = 0;
            let cashSales = 0, bankSales = 0, creditSales = 0;

            filtered.forEach(inv => {
                grossSales += inv.grand_total || 0;
                netSales += inv.subtotal || 0;
                totalTax += inv.vat_amount || 0;

                const method = (inv.payment_method || "cash").toLowerCase();
                if (method === "cash") cashSales += inv.grand_total || 0;
                else if (method === "bank") bankSales += inv.grand_total || 0;
                else if (method === "credit") creditSales += inv.grand_total || 0;
                else cashSales += inv.grand_total || 0;
            });

            setMetrics({
                grossSales, netSales, totalTax,
                transactionCount: filtered.length,
                cashSales, bankSales, creditSales,
            });

            // Group by date for chart
            const dailyMap = new Map<string, DailyData>();
            filtered.forEach(inv => {
                const dateKey = inv.date.split("T")[0];
                const existing = dailyMap.get(dateKey) || {
                    date: dateKey,
                    label: format(new Date(dateKey), "MMM dd"),
                    revenue: 0,
                    tax: 0,
                    count: 0,
                };
                existing.revenue += inv.grand_total || 0;
                existing.tax += inv.vat_amount || 0;
                existing.count += 1;
                dailyMap.set(dateKey, existing);
            });

            const sortedDaily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
            setDailyData(sortedDaily);
            setInvoices(filtered);
        } catch (err) {
            console.error("[Reports] Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    }, [dateFilter, getDateRange]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    // Monthly Summary Print Handler
    const handlePrintMonthlySummary = async () => {
        try {
            const db = await getDb();
            const monthStart = startOfMonth(new Date());
            const now = new Date();
            const startIso = monthStart.toISOString();
            const endIso = now.toISOString();

            const allInvoices = await db.invoices.find().exec();
            const monthInvoices: InvoiceRecord[] = allInvoices
                .map((doc: any) => doc.toJSON() as InvoiceRecord)
                .filter((inv: InvoiceRecord) => inv.date >= startIso && inv.date <= endIso);

            console.log(`[Reports] Monthly summary: ${monthInvoices.length} invoices`);

            if (monthInvoices.length === 0) {
                setMonthlySummary({
                    empty: true,
                    month: format(new Date(), "MMMM yyyy"),
                });
                setShowMonthlySummary(true);
                setTimeout(() => window.print(), 300);
                return;
            }

            let totalSales = 0, totalTax = 0, totalSubtotal = 0;
            let cashTotal = 0, bankTotal = 0, creditTotal = 0;
            const itemCounts: Record<string, number> = {};

            monthInvoices.forEach(inv => {
                totalSales += inv.grand_total || 0;
                totalTax += inv.vat_amount || 0;
                totalSubtotal += inv.subtotal || 0;

                const method = (inv.payment_method || "cash").toLowerCase();
                if (method === "cash") cashTotal += inv.grand_total || 0;
                else if (method === "bank") bankTotal += inv.grand_total || 0;
                else if (method === "credit") creditTotal += inv.grand_total || 0;

                try {
                    const items = JSON.parse(inv.items);
                    items.forEach((item: any) => {
                        const name = item.name || "Unknown";
                        itemCounts[name] = (itemCounts[name] || 0) + 1;
                    });
                } catch { /* skip unparseable items */ }
            });

            const topItems = Object.entries(itemCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }));

            setMonthlySummary({
                empty: false,
                month: format(new Date(), "MMMM yyyy"),
                totalSales,
                totalTax,
                totalSubtotal,
                cashTotal,
                bankTotal,
                creditTotal,
                invoiceCount: monthInvoices.length,
                topItems,
            });
            setShowMonthlySummary(true);
            setTimeout(() => window.print(), 300);
        } catch (err) {
            console.error("[Reports] Monthly summary print failed:", err);
        }
    };

    const handleExportAuditLog = async () => {
        try {
            const db = await getDb();
            const logs = await db.audit_log.find().exec();
            const data = logs.map((d: any) => d.toJSON());
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit_log_${format(new Date(), "yyyy-MM-dd")}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("[Reports] Audit log export failed:", err);
        }
    };

    const filterOptions: { label: string; value: DateFilter }[] = [
        { label: "Today", value: "today" },
        { label: "Last 7 Days", value: "7days" },
        { label: "This Month", value: "month" },
        { label: "This Year", value: "year" },
        { label: "All Time", value: "all" },
    ];

    return (
        <div className="min-h-screen warm-bg-gradient text-foreground">
            {/* Monthly Summary Print Layout (hidden, print-only) */}
            {showMonthlySummary && monthlySummary && (
                <div className="hidden print:block w-[80mm] bg-white text-black p-4 font-mono text-xs mx-auto">
                    <div className="text-center pb-4 border-b border-dashed border-gray-400 mb-4">
                        <h1 className="font-bold text-lg mb-1">{profile.shop_name || "JwelFlow"}</h1>
                        <p>PAN: {profile.pan_vat_number}</p>
                        <p>{profile.address}</p>
                        <p className="font-bold mt-2">MONTHLY SUMMARY</p>
                        <p>{monthlySummary.month}</p>
                    </div>

                    {monthlySummary.empty ? (
                        <div className="text-center py-6">
                            <p className="font-bold">No data available for this month</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 mb-4">
                                <p className="font-bold border-b border-gray-400 pb-1">SALES SUMMARY</p>
                                <div className="flex justify-between"><span>Subtotal:</span><span>Rs.{monthlySummary.totalSubtotal?.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>VAT (13%):</span><span>Rs.{monthlySummary.totalTax?.toLocaleString()}</span></div>
                                <div className="flex justify-between font-bold border-t border-dashed border-gray-400 pt-1">
                                    <span>TOTAL SALES:</span><span>Rs.{monthlySummary.totalSales?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between"><span>Total Invoices:</span><span>{monthlySummary.invoiceCount}</span></div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <p className="font-bold border-b border-gray-400 pb-1">PAYMENT BREAKDOWN</p>
                                <div className="flex justify-between"><span>Cash:</span><span>Rs.{monthlySummary.cashTotal?.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Bank/Digital:</span><span>Rs.{monthlySummary.bankTotal?.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Credit:</span><span>Rs.{monthlySummary.creditTotal?.toLocaleString()}</span></div>
                            </div>

                            {monthlySummary.topItems?.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    <p className="font-bold border-b border-gray-400 pb-1">TOP SELLING ITEMS</p>
                                    {monthlySummary.topItems.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{i + 1}. {item.name}</span>
                                            <span>{item.count}x sold</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <div className="text-center mt-6 pt-4 border-t border-gray-400 text-[10px]">
                        <p>Generated: {format(new Date(), "yyyy-MM-dd HH:mm")}</p>
                        <p className="mt-2 break-words">{profile.invoice_footer}</p>
                    </div>
                </div>
            )}

            <GlobalNav />

            <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8 print:hidden">
                <PinLock requiredRole="owner">
                    <div className="space-y-8 animate-in fade-in duration-500">

                        {/* Date Filter Row */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {filterOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setDateFilter(opt.value)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${dateFilter === opt.value
                                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                                        : "bg-background/50 text-muted-foreground border-border hover:border-primary/40"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="text-center py-16 text-muted-foreground">Loading report data...</div>
                        ) : (
                            <>
                                {/* Top Metrics Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card className="glass-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Gross Sales</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">रू {metrics.grossSales.toLocaleString()}</div>
                                            <p className="text-xs text-muted-foreground mt-1">{metrics.transactionCount} transactions</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Net Sales (Before VAT)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">रू {metrics.netSales.toLocaleString()}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Subtotal of all invoices</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Total VAT (13%)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">रू {metrics.totalTax.toLocaleString()}</div>
                                            <p className="text-xs text-muted-foreground mt-1">VAT collected</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Payment Split</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-1 text-sm font-mono">
                                                <div className="flex justify-between"><span className="text-muted-foreground">💵 Cash</span><span>रू {metrics.cashSales.toLocaleString()}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">🏦 Bank</span><span>रू {metrics.bankSales.toLocaleString()}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">📝 Credit</span><span>रू {metrics.creditSales.toLocaleString()}</span></div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Revenue Chart */}
                                    <Card className="glass-card lg:col-span-2">
                                        <CardHeader>
                                            <CardTitle>Revenue Trend</CardTitle>
                                            <CardDescription>
                                                {dailyData.length > 0
                                                    ? `${dailyData.length} day(s) of sales data`
                                                    : "No sales data for this period"}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {dailyData.length > 0 ? (
                                                <div className="h-[300px] w-full pt-4">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={dailyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor={themeColor} stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                            <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                                                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `रू${value / 1000}k`} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: "#121212", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                                                                itemStyle={{ color: themeColor }}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                formatter={(value: any) => [`रू ${Number(value).toLocaleString()}`, "Revenue"]}
                                                            />
                                                            <Area type="monotone" dataKey="revenue" stroke={themeColor} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                                    <p>No data to display for this period</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Daily Transactions Bar Chart */}
                                    <Card className="glass-card">
                                        <CardHeader>
                                            <CardTitle>Daily Transactions</CardTitle>
                                            <CardDescription>Number of invoices per day</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {dailyData.length > 0 ? (
                                                <div className="h-[300px] w-full pt-4">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                            <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                                                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: "#121212", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                                                                itemStyle={{ color: "#50C878" }}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                formatter={(value: any) => [value, "Transactions"]}
                                                            />
                                                            <Bar dataKey="count" fill="#50C878" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                                    <p>No transactions yet</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Transaction Drill-Down Table */}
                                <Card className="glass-card">
                                    <CardHeader>
                                        <CardTitle>Transaction Details</CardTitle>
                                        <CardDescription>{invoices.length} invoice(s) in selected period</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {invoices.length > 0 ? (
                                            <div className="overflow-auto max-h-[400px]">
                                                <table className="w-full text-sm">
                                                    <thead className="sticky top-0 bg-background">
                                                        <tr className="border-b border-border/30">
                                                            <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">Invoice #</th>
                                                            <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                                                            <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">Customer</th>
                                                            <th className="text-right py-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">Subtotal</th>
                                                            <th className="text-right py-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">VAT</th>
                                                            <th className="text-right py-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">Total</th>
                                                            <th className="text-right py-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">Payment</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {invoices.map(inv => (
                                                            <tr key={inv.id} className="border-b border-border/10 hover:bg-primary/5 transition-colors">
                                                                <td className="py-2 px-3 font-mono text-xs text-primary">{inv.id}</td>
                                                                <td className="py-2 px-3 text-xs">{format(new Date(inv.date), "MMM dd, HH:mm")}</td>
                                                                <td className="py-2 px-3 text-sm">{inv.customer_name || "Walk-in"}</td>
                                                                <td className="py-2 px-3 text-right font-mono">रू {inv.subtotal?.toLocaleString()}</td>
                                                                <td className="py-2 px-3 text-right font-mono text-muted-foreground">रू {inv.vat_amount?.toLocaleString()}</td>
                                                                <td className="py-2 px-3 text-right font-mono font-semibold">रू {inv.grand_total?.toLocaleString()}</td>
                                                                <td className="py-2 px-3 text-right">
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${inv.payment_method === "cash" ? "bg-green-500/10 text-green-500" :
                                                                        inv.payment_method === "bank" ? "bg-blue-500/10 text-blue-500" :
                                                                            "bg-orange-500/10 text-orange-500"
                                                                        }`}>
                                                                        {(inv.payment_method || "cash").toUpperCase()}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm">No transactions in this period. Make sales in POS to see data here.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* IRD Compliance + Actions */}
                                <Card className="glass-card border-primary/20 bg-primary/5">
                                    <CardHeader>
                                        <CardTitle className="text-primary text-lg">IRD Compliance & Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Export audit logs or print monthly summaries for IRD compliance and record-keeping.
                                        </p>
                                        <div className="flex gap-4 flex-wrap">
                                            <Button onClick={handleExportAuditLog} variant="outline" className="text-primary border-primary/30 hover:bg-primary/10">
                                                <Download className="w-4 h-4 mr-2" /> Export Audit Log (JSON)
                                            </Button>
                                            <Button onClick={handlePrintMonthlySummary} variant="outline" className="text-primary border-primary/30 hover:bg-primary/10">
                                                <Printer className="w-4 h-4 mr-2" /> Print Monthly Summary
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                            </>
                        )}
                    </div>
                </PinLock>
            </main>
        </div>
    );
}
