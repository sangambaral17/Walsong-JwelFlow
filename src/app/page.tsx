import { RatesWidget } from "@/components/dashboard/rates-widget";
import { PinLock } from "@/components/auth/pin-lock";
import { BackupButton } from "@/components/settings/backup-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Settings, HandCoins, Store, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Subtle radial glow behind header */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/3 blur-[120px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/70 backdrop-blur-xl transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-black font-bold text-xl leading-none tracking-tighter">W</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground hidden sm:block">Walsong Jewellers</h1>
          </div>
          <nav className="flex items-center gap-6 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            <Link href="/pos" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <HandCoins className="w-3.5 h-3.5" /> Point of Sale
            </Link>
            <Link href="/inventory" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Inventory
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 space-y-12 max-w-7xl relative z-10">
        {/* Welcome Section */}
        <section className="space-y-2 pt-4">
          <h2 className="text-4xl font-medium tracking-tight">JwelFlow Dashboard</h2>
          <p className="text-muted-foreground text-lg">Manage inventory, process sales, and monitor real-time market rates.</p>
        </section>

        {/* Daily Rates + Quick Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <RatesWidget />
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <Link href="/pos" className="block group">
              <Card className="glass-card h-full hover:border-primary/40 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 h-full">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <HandCoins className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-medium text-lg tracking-tight">New Sale</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/inventory" className="block group">
              <Card className="glass-card h-full hover:border-primary/40 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 h-full">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Package className="w-6 h-6 text-foreground" />
                  </div>
                  <span className="font-medium text-lg tracking-tight">Inventory</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Secure Owner Sections */}
        <section className="pt-8 border-t border-border/20">
          <PinLock>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">

              {/* Stock Overview */}
              <Card className="glass-card gold-shimmer relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary text-2xl tracking-tight">
                    <ShieldCheck className="w-6 h-6" />
                    Stock Portfolio
                  </CardTitle>
                  <CardDescription>Protected confidential data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-muted-foreground uppercase text-xs tracking-wider">Total Gold Stock</span>
                      <span className="font-mono font-medium text-lg">145<span className="text-xs text-muted-foreground">T</span> 5<span className="text-xs text-muted-foreground">M</span> 0<span className="text-xs text-muted-foreground">L</span></span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-muted-foreground uppercase text-xs tracking-wider">Total Silver Stock</span>
                      <span className="font-mono font-medium text-lg">850<span className="text-xs text-muted-foreground">T</span> 0<span className="text-xs text-muted-foreground">M</span> 0<span className="text-xs text-muted-foreground">L</span></span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20 mt-4">
                      <span className="text-primary font-medium tracking-wide">Estimated Value</span>
                      <span className="font-mono font-bold text-2xl text-foreground tracking-tight">रू 4,85,60,000</span>
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
