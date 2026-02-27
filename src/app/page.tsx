"use client";

import { RatesWidget } from "@/components/dashboard/rates-widget";
import { PinLock } from "@/components/auth/pin-lock";
import { useAuth } from "@/lib/auth-context";
import { BackupButton } from "@/components/settings/backup-button";
import { EodModal } from "@/components/reports/eod-modal";
import { useShop } from "@/lib/shop-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Settings, HandCoins, ShieldCheck, ArrowRight, Users, Lock, Eye, EyeOff, TrendingUp, History, CheckCircle2, AlertTriangle, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/db";

export default function Home() {
  const { profile } = useShop();
  const { lockSession, user } = useAuth();
  const [showFinancials, setShowFinancials] = useState(false);

  // Live Stats State
  const [stats, setStats] = useState({
    goldWeight: { t: 0, m: 0, l: 0 },
    silverWeight: { t: 0, m: 0, l: 0 },
    revenueDay: 0,
    dhitoLiability: 0,
    itemCount: 0,
    // New dashboard metrics
    txCountToday: 0,
    cashTotal: 0,
    digitalTotal: 0,
    creditTotal: 0,
    lowStockItems: [] as { name: string; category: string; grams: number }[],
  });

  useEffect(() => {
    const fetchStats = async () => {
      const db = await getDb();

      // 1. Gold Stock
      const inventory = await db.inventory.find().exec();
      let totalGoldGrams = 0;
      let totalSilverGrams = 0;
      const lowStockItems: { name: string; category: string; grams: number }[] = [];

      inventory.forEach((item: any) => {
        const grams = item.net_weight_grams || 0;
        if (item.category?.toLowerCase().includes('gold')) {
          totalGoldGrams += grams;
        } else if (item.category?.toLowerCase().includes('silver')) {
          totalSilverGrams += grams;
        }
        // Low stock = items with weight below 2 grams
        if (grams > 0 && grams < 2) {
          lowStockItems.push({ name: item.name, category: item.category, grams });
        }
      });

      // Simple Grams to T/M/L conversion (Approx: 1 Tola = 11.66g, 1 Masha = 0.97g, 1 Lal = 0.01g)
      const toTML = (grams: number) => {
        const t = Math.floor(grams / 11.6639);
        const remainingAfterT = grams % 11.6639;
        const m = Math.floor(remainingAfterT / 0.972);
        const l = Math.round((remainingAfterT % 0.972) / 0.0116);
        return { t, m, l };
      };

      // 2. Today's invoices (real data, not audit log)
      const allInvoices = await db.invoices.find().exec();
      const today = new Date().toISOString().split('T')[0];
      let revenue = 0;
      let txCount = 0;
      let cashTotal = 0;
      let digitalTotal = 0;
      let creditTotal = 0;

      allInvoices.forEach((doc: any) => {
        const inv = doc.toJSON();
        if (inv.date && inv.date.startsWith(today)) {
          revenue += inv.grand_total || 0;
          txCount += 1;

          const method = (inv.payment_method || "cash").toLowerCase();
          if (method === "cash") cashTotal += inv.grand_total || 0;
          else if (method === "bank") digitalTotal += inv.grand_total || 0;
          else if (method === "credit") creditTotal += inv.grand_total || 0;
          else cashTotal += inv.grand_total || 0;
        }
      });

      // 3. Dhito Liability
      const dhitos = await db.dhito.find({
        selector: { status: 'active' }
      }).exec();
      let liability = 0;
      dhitos.forEach((d: any) => liability += d.loan_amount || 0);

      setStats({
        goldWeight: toTML(totalGoldGrams),
        silverWeight: toTML(totalSilverGrams),
        revenueDay: revenue,
        dhitoLiability: liability,
        itemCount: inventory.length,
        txCountToday: txCount,
        cashTotal,
        digitalTotal,
        creditTotal,
        lowStockItems: lowStockItems.slice(0, 5),
      });
    };

    fetchStats();

    // Subscribe to changes
    const dbPromise = getDb();
    let sub: any;
    let sub2: any;
    dbPromise.then((db: any) => {
      sub = db.inventory.find().$.subscribe(() => fetchStats());
      sub2 = db.invoices.find().$.subscribe(() => fetchStats());
    });

    return () => { sub?.unsubscribe(); sub2?.unsubscribe(); };
  }, []);

  const isOwner = user?.role === "owner";
  const totalDayPayments = stats.cashTotal + stats.digitalTotal + stats.creditTotal;
  const cashPercent = totalDayPayments > 0 ? Math.round((stats.cashTotal / totalDayPayments) * 100) : 0;
  const digitalPercent = totalDayPayments > 0 ? Math.round((stats.digitalTotal / totalDayPayments) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Subtle radial glow behind header */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/3 blur-[120px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/70 backdrop-blur-xl transition-all print:hidden">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-black font-bold text-xl leading-none tracking-tighter">W</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground hidden sm:block">{profile.shop_name || "JwelFlow"}</h1>
          </div>
          <nav className="flex items-center gap-6 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            <Link href="/pos" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <HandCoins className="w-3.5 h-3.5" /> POS
            </Link>
            <Link href="/inventory" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Inventory
            </Link>
            <Link href="/dhito" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <HandCoins className="w-3.5 h-3.5" /> Dhito
            </Link>
            <Link href="/customers" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Customers
            </Link>
            <Link href="/reports" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Reports
            </Link>
            <Link href="/settings" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Settings
            </Link>
            <div className="h-4 w-px bg-border/50 mx-1" />
            <button onClick={lockSession} className="hover:text-destructive transition-colors flex items-center gap-1.5 font-bold">
              <Lock className="w-3.5 h-3.5" /> Lock Session
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 space-y-12 max-w-7xl relative z-10 print:hidden">
        {/* Welcome Section */}
        <section className="flex items-center justify-between pt-4">
          <div className="space-y-2">
            <h2 className="text-4xl font-medium tracking-tight">Welcome, {user?.name || "Walsong Group"}</h2>
            <p className="text-muted-foreground text-lg">Manage inventory, process sales, and monitor real-time market rates.</p>
          </div>
          <div className="flex items-center gap-3">
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFinancials(!showFinancials)}
                className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/50 transition-all"
              >
                {showFinancials ? <><EyeOff className="w-4 h-4 mr-2 text-primary" /> Mask Financials</> : <><Eye className="w-4 h-4 mr-2 text-primary" /> Reveal Financials</>}
              </Button>
            )}
            <EodModal />
          </div>
        </section>

        {/* ===== TODAY AT A GLANCE (New Section) ===== */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">आजको बिक्री (Today&apos;s Sales)</p>
              <p className="text-3xl font-bold font-mono text-primary tracking-tight">
                रू {stats.revenueDay.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Transactions Today</p>
              <p className="text-3xl font-bold font-mono text-foreground tracking-tight">
                {stats.txCountToday}
              </p>
              <p className="text-xs text-muted-foreground mt-1">invoices generated</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Cash vs Digital</p>
              {totalDayPayments > 0 ? (
                <>
                  <div className="flex h-3 rounded-full overflow-hidden bg-background/50 border border-border/30">
                    <div className="bg-green-500 transition-all" style={{ width: `${cashPercent}%` }} />
                    <div className="bg-blue-500 transition-all" style={{ width: `${digitalPercent}%` }} />
                    <div className="bg-orange-500 flex-1" />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>💵 {cashPercent}%</span>
                    <span>🏦 {digitalPercent}%</span>
                    <span>📝 {100 - cashPercent - digitalPercent}%</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No payments today</p>
              )}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Inventory Items</p>
              <p className="text-3xl font-bold font-mono text-foreground tracking-tight">
                {stats.itemCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">total items in stock</p>
            </CardContent>
          </Card>
        </section>

        {/* Low Stock Alerts */}
        {stats.lowStockItems.length > 0 && (
          <section>
            <Card className="glass-card border-orange-500/20 bg-orange-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-orange-500 flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5" /> Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {stats.lowStockItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <span className="text-xs font-mono text-orange-500 font-semibold">{item.grams.toFixed(2)}g</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Zero State / Welcome Banner */}
        {stats.itemCount === 0 && (
          <div className="glass-card border-primary/20 bg-gradient-to-r from-primary/10 via-background to-transparent p-8 rounded-2xl flex items-center justify-between overflow-hidden relative group">
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-1000"></div>
            <div className="space-y-4 relative z-10 max-w-xl">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Ready for Production
              </div>
              <h3 className="text-3xl font-bold tracking-tight">Welcome to JewelFlow by Walsong Group</h3>
              <p className="text-muted-foreground text-lg">
                Your system is locally synchronized and secure. Start by adding items to your inventory or configuring your staff roles in Settings.
              </p>
              <div className="flex gap-4">
                <Link href="/inventory">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Package className="w-4 h-4 mr-2" /> Add First Item
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="border-border/60 hover:border-primary/40">
                    <Settings className="w-4 h-4 mr-2" /> Configure App
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex relative z-10">
              <div className="w-32 h-32 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center rotate-12 -mr-8 animate-pulse hover:rotate-0 transition-all duration-700">
                <History className="w-12 h-12 text-primary/40" />
              </div>
              <div className="w-32 h-32 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center -rotate-6 animate-pulse hover:rotate-0 transition-all duration-700 delay-150">
                <TrendingUp className="w-12 h-12 text-primary/60" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions + Daily Rates */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <RatesWidget />
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <Link href="/pos" className="block group h-full">
              <Card className="glass-card h-full hover:border-primary/40 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5 active:scale-[0.97]">
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 h-full">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <HandCoins className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-medium text-lg tracking-tight">New Sale</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/inventory" className="block group h-full">
              <Card className="glass-card h-full hover:border-primary/40 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5 active:scale-[0.97]">
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 h-full">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-6 h-6 text-foreground" />
                  </div>
                  <span className="font-medium text-lg tracking-tight">Inventory</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports" className="block group h-full">
              <Card className="glass-card h-full hover:border-primary/40 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5 active:scale-[0.97]">
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 h-full">
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="font-medium text-lg tracking-tight">Reports</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/settings" className="block group h-full">
              <Card className="glass-card h-full hover:border-primary/40 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5 active:scale-[0.97]">
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 h-full">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Settings className="w-6 h-6 text-foreground" />
                  </div>
                  <span className="font-medium text-lg tracking-tight">Settings</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Secure Owner Sections */}
        <section className="pt-8 border-t border-border/20">
          <PinLock requiredRole="owner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">

              {/* Stock Overview */}
              <Card className="glass-card gold-shimmer relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary text-2xl tracking-tight">
                    <ShieldCheck className="w-6 h-6" />
                    Stock Portfolio
                  </CardTitle>
                  <CardDescription>Real-time inventory calculation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-muted-foreground uppercase text-xs tracking-wider">Total Gold Stock</span>
                      <span className="font-mono font-medium text-lg">
                        {stats.goldWeight.t}<span className="text-xs text-muted-foreground">T</span> {stats.goldWeight.m}<span className="text-xs text-muted-foreground">M</span> {stats.goldWeight.l}<span className="text-xs text-muted-foreground">L</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-muted-foreground uppercase text-xs tracking-wider">Total Silver Stock</span>
                      <span className="font-mono font-medium text-lg">
                        {stats.silverWeight.t}<span className="text-xs text-muted-foreground">T</span> {stats.silverWeight.m}<span className="text-xs text-muted-foreground">M</span> {stats.silverWeight.l}<span className="text-xs text-muted-foreground">L</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20 mt-4 h-16">
                      <span className="text-primary font-medium tracking-wide">Daily Revenue</span>
                      <span className={`font-mono font-bold text-2xl text-foreground tracking-tight transition-all duration-500 ${!showFinancials ? 'blur-md select-none' : ''}`}>
                        रू {stats.revenueDay.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-xl border border-border/30 h-16">
                      <span className="text-muted-foreground font-medium tracking-wide">Dhito Liability</span>
                      <span className={`font-mono font-bold text-2xl text-foreground tracking-tight transition-all duration-500 ${!showFinancials ? 'blur-md select-none' : ''}`}>
                        रू {stats.dhitoLiability.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl tracking-tight">
                    <Settings className="w-6 h-6 text-foreground" />
                    System Settings
                  </CardTitle>
                  <CardDescription>Local-first database controls and IRD logs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-foreground tracking-tight">Local Database Backup</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Export the current RxDB to a JSON file. Save to a pen drive daily to protect your data.
                    </p>
                    <BackupButton />
                  </div>
                  <div className="pt-6 border-t border-border/50">
                    <h4 className="text-base font-medium text-foreground mb-4">Hardware Integrations</h4>
                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-sm text-muted-foreground font-medium">Digital Weighing Scale</span>
                      <span className="text-sm font-medium text-green-500 bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Ready
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </PinLock>
        </section>
      </main>
    </div>
  );
}
