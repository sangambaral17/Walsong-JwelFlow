"use client";

import { RatesWidget } from "@/components/dashboard/rates-widget";
import { PinLock } from "@/components/auth/pin-lock";
import { useAuth } from "@/lib/auth-context";
import { BackupButton } from "@/components/settings/backup-button";
import { EodModal } from "@/components/reports/eod-modal";
import { useShop } from "@/lib/shop-context";
import { useLang } from "@/lib/lang-context";
import { GlobalNav } from "@/components/global-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Settings, HandCoins, ShieldCheck, ArrowRight, Lock, Eye, EyeOff, TrendingUp, History, CheckCircle2, AlertTriangle, BarChart3, Hammer, Coins } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/db";

export default function Home() {
  const { profile } = useShop();
  const { lockSession, user } = useAuth();
  const { t, lang } = useLang();
  const [showFinancials, setShowFinancials] = useState(false);

  const [stats, setStats] = useState({
    goldWeight: { t: 0, m: 0, l: 0 },
    silverWeight: { t: 0, m: 0, l: 0 },
    revenueDay: 0,
    dhitoLiability: 0,
    itemCount: 0,
    txCountToday: 0,
    cashTotal: 0,
    digitalTotal: 0,
    creditTotal: 0,
    lowStockItems: [] as { name: string; category: string; grams: number }[],
  });

  useEffect(() => {
    const fetchStats = async () => {
      const db = await getDb();
      const inventory = await db.inventory.find().exec();
      let totalGoldGrams = 0;
      let totalSilverGrams = 0;
      const lowStockItems: { name: string; category: string; grams: number }[] = [];

      inventory.forEach((item: any) => {
        const grams = item.net_weight_grams || 0;
        if (item.category?.toLowerCase().includes('gold')) totalGoldGrams += grams;
        else if (item.category?.toLowerCase().includes('silver')) totalSilverGrams += grams;
        if (grams > 0 && grams < 2) lowStockItems.push({ name: item.name, category: item.category, grams });
      });

      const toTML = (grams: number) => {
        const t = Math.floor(grams / 11.6639);
        const remainingAfterT = grams % 11.6639;
        const m = Math.floor(remainingAfterT / 0.972);
        const l = Math.round((remainingAfterT % 0.972) / 0.0116);
        return { t, m, l };
      };

      const allInvoices = await db.invoices.find().exec();
      const today = new Date().toISOString().split('T')[0];
      let revenue = 0, txCount = 0, cashTotal = 0, digitalTotal = 0, creditTotal = 0;

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

      const dhitos = await db.dhito.find({ selector: { status: 'active' } }).exec();
      let liability = 0;
      dhitos.forEach((d: any) => liability += d.loan_amount || 0);

      setStats({
        goldWeight: toTML(totalGoldGrams),
        silverWeight: toTML(totalSilverGrams),
        revenueDay: revenue,
        dhitoLiability: liability,
        itemCount: inventory.length,
        txCountToday: txCount,
        cashTotal, digitalTotal, creditTotal,
        lowStockItems: lowStockItems.slice(0, 5),
      });
    };

    fetchStats();
    const dbPromise = getDb();
    let sub: any, sub2: any;
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
    <div className="min-h-screen warm-bg-gradient text-foreground selection:bg-primary/30">
      <GlobalNav />

      <main className="container mx-auto px-4 py-8 space-y-10 max-w-7xl relative z-10 print:hidden">
        {/* Welcome */}
        <section className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-medium tracking-tight">{t('welcome')}, {profile?.shop_name || "Walsong Group"}</h2>
            <p className="text-muted-foreground text-base">{t('manageInventory')}</p>
          </div>
          <div className="flex items-center gap-3">
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFinancials(!showFinancials)}
                className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/50 transition-all"
              >
                {showFinancials
                  ? <><EyeOff className="w-4 h-4 mr-2 text-primary" /> {t('maskFinancials')}</>
                  : <><Eye className="w-4 h-4 mr-2 text-primary" /> {t('revealFinancials')}</>
                }
              </Button>
            )}
            <EodModal />
          </div>
        </section>

        {/* Today at a Glance */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t('todaySales')}</p>
              <p className="text-3xl font-bold font-mono text-primary tracking-tight">
                रू {stats.revenueDay.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t('transactionsToday')}</p>
              <p className="text-3xl font-bold font-mono text-foreground tracking-tight">{stats.txCountToday}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('invoicesGenerated')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t('cashVsDigital')}</p>
              {totalDayPayments > 0 ? (
                <>
                  <div className="flex h-3 rounded-full overflow-hidden bg-muted border border-border/30">
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
                <p className="text-sm text-muted-foreground">{t('noPaymentsToday')}</p>
              )}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t('inventoryItems')}</p>
              <p className="text-3xl font-bold font-mono text-foreground tracking-tight">{stats.itemCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('totalItemsInStock')}</p>
            </CardContent>
          </Card>
        </section>

        {/* Low Stock Alerts */}
        {stats.lowStockItems.length > 0 && (
          <section>
            <Card className="glass-card border-orange-500/20 bg-orange-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-orange-600 flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5" /> {t('lowStockAlert')}
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
                      <span className="text-xs font-mono text-orange-600 font-semibold">{item.grams.toFixed(2)}g</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Welcome Banner (Zero State) */}
        {stats.itemCount === 0 && (
          <div className="glass-card border-primary/20 bg-gradient-to-r from-primary/5 via-background to-transparent p-8 rounded-2xl flex items-center justify-between overflow-hidden relative group">
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-1000" />
            <div className="space-y-4 relative z-10 max-w-xl">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                <CheckCircle2 className="w-4 h-4" /> {t('readyForProduction')}
              </div>
              <h3 className="text-3xl font-bold tracking-tight">{t('welcomeTitle')}</h3>
              <p className="text-muted-foreground text-lg">{t('welcomeDesc')}</p>
              <div className="flex gap-4">
                <Link href="/inventory">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Package className="w-4 h-4 mr-2" /> {t('addFirstItem')}
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="border-border/60 hover:border-primary/40">
                    <Settings className="w-4 h-4 mr-2" /> {t('configureApp')}
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

        {/* Quick Actions + Rates */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <RatesWidget />
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              { href: "/pos", icon: HandCoins, label: t('newSale'), color: "bg-primary/10 text-primary" },
              { href: "/inventory", icon: Package, label: t('inventory'), color: "bg-secondary text-foreground" },
              { href: "/reports", icon: BarChart3, label: t('reports'), color: "bg-blue-500/10 text-blue-600" },
              { href: "/settings", icon: Settings, label: t('settings'), color: "bg-secondary text-foreground" },
              { href: "/karigar", icon: Hammer, label: t('karigar'), color: "bg-primary/10 text-primary" },
              { href: "/chit", icon: Coins, label: t('chit'), color: "bg-amber-500/10 text-amber-600" },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href} className="block group h-full">
                <Card className="glass-card h-full hover:border-primary/40 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5 active:scale-[0.97]">
                  <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 h-full">
                    <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-lg tracking-tight">{label}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Secure Owner Sections */}
        <section className="pt-8 border-t border-border/20">
          <PinLock requiredRole="owner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <Card className="glass-card gold-shimmer relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary text-2xl tracking-tight">
                    <ShieldCheck className="w-6 h-6" /> {t('stockPortfolio')}
                  </CardTitle>
                  <CardDescription>{t('realTimeCalc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-muted-foreground uppercase text-xs tracking-wider">{t('totalGoldStock')}</span>
                      <span className="font-mono font-medium text-lg">
                        {stats.goldWeight.t}<span className="text-xs text-muted-foreground">T</span> {stats.goldWeight.m}<span className="text-xs text-muted-foreground">M</span> {stats.goldWeight.l}<span className="text-xs text-muted-foreground">L</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-muted-foreground uppercase text-xs tracking-wider">{t('totalSilverStock')}</span>
                      <span className="font-mono font-medium text-lg">
                        {stats.silverWeight.t}<span className="text-xs text-muted-foreground">T</span> {stats.silverWeight.m}<span className="text-xs text-muted-foreground">M</span> {stats.silverWeight.l}<span className="text-xs text-muted-foreground">L</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20 mt-4 h-16">
                      <span className="text-primary font-medium tracking-wide">{t('dailyRevenue')}</span>
                      <span className={`font-mono font-bold text-2xl text-foreground tracking-tight transition-all duration-500 ${!showFinancials ? 'blur-md select-none' : ''}`}>
                        रू {stats.revenueDay.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-xl border border-border/30 h-16">
                      <span className="text-muted-foreground font-medium tracking-wide">{t('dhitoLiability')}</span>
                      <span className={`font-mono font-bold text-2xl text-foreground tracking-tight transition-all duration-500 ${!showFinancials ? 'blur-md select-none' : ''}`}>
                        रू {stats.dhitoLiability.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl tracking-tight">
                    <Settings className="w-6 h-6 text-foreground" /> {t('systemSettings')}
                  </CardTitle>
                  <CardDescription>{t('localFirstDb')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-foreground tracking-tight">{t('localDbBackup')}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t('backupDesc')}</p>
                    <BackupButton />
                  </div>
                  <div className="pt-6 border-t border-border/50">
                    <h4 className="text-base font-medium text-foreground mb-4">{t('hardwareInteg')}</h4>
                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-sm text-muted-foreground font-medium">{t('weighingScale')}</span>
                      <span className="text-sm font-medium text-green-600 bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {t('ready')}
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
