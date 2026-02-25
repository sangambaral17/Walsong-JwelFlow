import { RatesWidget } from "@/components/dashboard/rates-widget";
import { PinLock } from "@/components/auth/pin-lock";
import { BackupButton } from "@/components/settings/backup-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Settings, Store, HandCoins } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background selection:bg-primary/30">

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/50 backdrop-blur-xl transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-black font-bold text-xl leading-none tracking-tighter mt-[-1px]">W</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground hidden sm:block">Walsong Group</h1>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">
            <span className="hover:text-primary transition-colors cursor-pointer">Point of Sale</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Dhito</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 space-y-12 max-w-7xl">
        {/* Welcome Section */}
        <section className="space-y-2">
          <h2 className="text-4xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">JwelFlow Dashboard</h2>
          <p className="text-muted-foreground text-lg">Manage inventory, monitor real-time rates, and secure your local-first data.</p>
        </section>

        {/* Public/Staff Dashboard Items */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <RatesWidget />
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <Card className="bg-card/40 backdrop-blur-sm border-border hover:border-primary/50 transition-all cursor-pointer group hover:shadow-xl hover:shadow-primary/5">
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 h-full">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <HandCoins className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium text-lg tracking-tight">New Sale</span>
              </CardContent>
            </Card>
            <Card className="bg-card/40 backdrop-blur-sm border-border hover:border-secondary/50 transition-all cursor-pointer group hover:shadow-xl hover:shadow-secondary/5">
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 h-full">
                <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Store className="w-6 h-6 text-foreground" />
                </div>
                <span className="font-medium text-lg tracking-tight">New Dhito</span>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Secure Owner Sections */}
        <section className="pt-8 border-t border-border/20">
          <PinLock>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">

              {/* Stock Overview */}
              <Card className="bg-card/60 backdrop-blur-xl border-primary/20 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-100 pointer-events-none"></div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary text-2xl tracking-tight">
                    <Package className="w-6 h-6 text-primary" />
                    Inventory Stock
                  </CardTitle>
                  <CardDescription>Confidential overall stock values</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-muted-foreground uppercase text-sm tracking-wider">Total Gold Stock</span>
                      <span className="font-mono font-medium text-lg">145<span className="text-sm text-muted-foreground">T</span> 5<span className="text-sm text-muted-foreground">M</span> 0<span className="text-sm text-muted-foreground">L</span></span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-muted-foreground uppercase text-sm tracking-wider">Total Silver Stock</span>
                      <span className="font-mono font-medium text-lg">850<span className="text-sm text-muted-foreground">T</span> 0<span className="text-sm text-muted-foreground">M</span> 0<span className="text-sm text-muted-foreground">L</span></span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20 mt-6">
                      <span className="text-primary font-medium tracking-wide">Estimated Value</span>
                      <span className="font-mono font-bold text-2xl text-foreground tracking-tight">रू 4,85,60,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Settings */}
              <Card className="bg-card/60 backdrop-blur-xl border-border shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl tracking-tight">
                    <Settings className="w-6 h-6 text-foreground" />
                    System Settings
                  </CardTitle>
                  <CardDescription>Local-first database controls and IRD Logs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-foreground tracking-tight">Local Database Backup</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Export the current RxDB snapshot to a JSON file. Use this for offline backups or synchronization to prevent data loss if the browser cache is cleared.
                    </p>
                    <BackupButton />
                  </div>

                  <div className="pt-6 border-t border-border/50">
                    <h4 className="text-base font-medium text-foreground mb-4">Hardware Integrations</h4>
                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border/50">
                      <span className="text-sm text-muted-foreground font-medium">Digital Weighing Scale</span>
                      <span className="text-sm font-medium text-green-500 bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Connected (COM3)
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
