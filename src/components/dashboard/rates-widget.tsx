import { useEffect, useState, useCallback } from "react";
import { getDb } from "@/lib/db";
import { syncMarketRates, MARKET_CONSTANTS } from "@/lib/rates-sync";
import { useShop } from "@/lib/shop-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, TrendingUp, TrendingDown, Calendar, RefreshCw, Wifi, WifiOff, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RateChange {
    amount: number;
    percent: number;
}

function ChangeChip({ change, label }: { change: RateChange | null; label: string }) {
    if (!change) {
        return (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/50 px-2 py-0.5 rounded-full bg-muted/20">
                <Minus className="w-2.5 h-2.5" /> {label}
            </span>
        );
    }
    if (change.amount === 0) {
        return (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted/30">
                <Minus className="w-2.5 h-2.5" /> {label} No change
            </span>
        );
    }
    const isUp = change.amount > 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {isUp ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
            {label} {isUp ? '+' : ''}रू{Math.abs(change.amount).toLocaleString()} ({isUp ? '+' : ''}{change.percent.toFixed(1)}%)
        </span>
    );
}

export function RatesWidget() {
    const { profile } = useShop();
    const [rates, setRates] = useState<{ gold: number; silver: number } | null>(null);
    const [yesterdayRates, setYesterdayRates] = useState<{ gold: number; silver: number } | null>(null);
    const [updateDate, setUpdateDate] = useState<string>("");
    const [isLive, setIsLive] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [goldChanges, setGoldChanges] = useState<{ day: RateChange | null; week: RateChange | null }>({ day: null, week: null });
    const [silverChanges, setSilverChanges] = useState<{ day: RateChange | null; week: RateChange | null }>({ day: null, week: null });

    const loadRates = useCallback(async () => {
        setRefreshing(true);
        try {
            const synced = await syncMarketRates();

            const db = await getDb();
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            setUpdateDate(now.toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' }));

            const currentRateSnapshot = await db.rates.findOne(today).exec();
            const baseGold = currentRateSnapshot?.gold_tola_rate ?? MARKET_CONSTANTS.HALLMARK_GOLD;
            const baseSilver = currentRateSnapshot?.silver_tola_rate ?? MARKET_CONSTANTS.SILVER;

            setIsLive(baseGold !== MARKET_CONSTANTS.HALLMARK_GOLD || synced);

            setRates({
                gold: baseGold + (profile.premium_gold || 0),
                silver: baseSilver + (profile.premium_silver || 0)
            });

            // Fetch historical rates
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);

            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const weekAgoStr = weekAgo.toISOString().split('T')[0];

            const yesterdayRate = await db.rates.findOne(yesterdayStr).exec();
            const weekAgoRate = await db.rates.findOne(weekAgoStr).exec();

            // Store yesterday's rates for display
            if (yesterdayRate) {
                setYesterdayRates({
                    gold: yesterdayRate.gold_tola_rate + (profile.premium_gold || 0),
                    silver: yesterdayRate.silver_tola_rate + (profile.premium_silver || 0),
                });
            }

            // Calculate changes
            const calcChange = (current: number, previous: number | undefined): RateChange | null => {
                if (!previous) return null;
                const amount = current - previous;
                const percent = (amount / previous) * 100;
                return { amount: Math.round(amount), percent };
            };

            setGoldChanges({
                day: calcChange(baseGold, yesterdayRate?.gold_tola_rate),
                week: calcChange(baseGold, weekAgoRate?.gold_tola_rate),
            });

            setSilverChanges({
                day: calcChange(baseSilver, yesterdayRate?.silver_tola_rate),
                week: calcChange(baseSilver, weekAgoRate?.silver_tola_rate),
            });

        } finally {
            setRefreshing(false);
        }
    }, [profile.premium_gold, profile.premium_silver]);

    useEffect(() => {
        loadRates();
        const interval = setInterval(loadRates, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadRates]);

    return (
        <Card className="bg-card/40 backdrop-blur-xl border-primary/20 bg-gradient-to-br from-card/80 to-card/10 shadow-2xl relative overflow-hidden group w-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-xl font-medium tracking-wide flex items-center space-x-2 text-primary">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span>Live Market Rates</span>
                        {isLive ? (
                            <span className="ml-2 text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                <Wifi className="w-3 h-3" /> Live
                            </span>
                        ) : (
                            <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                <WifiOff className="w-3 h-3" /> Offline
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        NPR per Fine Tola (incl. Shop Premium)
                    </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Button variant="ghost" size="sm" onClick={loadRates} disabled={refreshing} className="h-7 px-2 text-muted-foreground hover:text-primary">
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <span className="text-[10px] uppercase tracking-tighter text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {updateDate || "Synchronizing..."}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {rates ? (
                    <>
                        {/* Main Rate Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Gold Card */}
                            <div className="flex flex-col space-y-2 p-5 rounded-xl bg-background/30 border border-primary/10 hover:border-primary/40 transition-colors shadow-inner backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                                    <Coins className="w-24 h-24" />
                                </div>
                                <span className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2 z-10">
                                    <Coins className="h-4 w-4 text-primary" />
                                    24K Fine Gold
                                </span>
                                <span className="text-3xl font-bold text-foreground tracking-tight z-10">
                                    रू {rates.gold.toLocaleString()}
                                </span>
                                {/* Yesterday's rate */}
                                {yesterdayRates && (
                                    <div className="text-xs text-muted-foreground z-10 flex items-center gap-1">
                                        <span>Yesterday: रू {yesterdayRates.gold.toLocaleString()}</span>
                                        {goldChanges.day && goldChanges.day.amount !== 0 && (
                                            <span className={`font-semibold ${goldChanges.day.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ({goldChanges.day.amount > 0 ? '↑' : '↓'} रू{Math.abs(goldChanges.day.amount).toLocaleString()})
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Change chips */}
                                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30 z-10">
                                    <ChangeChip change={goldChanges.day} label="1D" />
                                    <ChangeChip change={goldChanges.week} label="7D" />
                                </div>
                            </div>

                            {/* Silver Card */}
                            <div className="flex flex-col space-y-2 p-5 rounded-xl bg-background/30 border border-border hover:border-border/80 transition-colors shadow-inner backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                                    <Coins className="w-24 h-24" />
                                </div>
                                <span className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2 z-10">
                                    <Coins className="h-4 w-4 text-muted-foreground" />
                                    Pure Silver
                                </span>
                                <span className="text-3xl font-bold text-foreground tracking-tight z-10">
                                    रू {rates.silver.toLocaleString()}
                                </span>
                                {/* Yesterday's rate */}
                                {yesterdayRates && (
                                    <div className="text-xs text-muted-foreground z-10 flex items-center gap-1">
                                        <span>Yesterday: रू {yesterdayRates.silver.toLocaleString()}</span>
                                        {silverChanges.day && silverChanges.day.amount !== 0 && (
                                            <span className={`font-semibold ${silverChanges.day.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ({silverChanges.day.amount > 0 ? '↑' : '↓'} रू{Math.abs(silverChanges.day.amount).toLocaleString()})
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Change chips */}
                                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30 z-10">
                                    <ChangeChip change={silverChanges.day} label="1D" />
                                    <ChangeChip change={silverChanges.week} label="7D" />
                                </div>
                            </div>
                        </div>

                        {/* Summary strip */}
                        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60 uppercase tracking-widest pt-1">
                            <span>Source: FENEGOSIDA</span>
                            <span>•</span>
                            <span>Auto-refresh: 30min</span>
                            <span>•</span>
                            <span>Premium applied</span>
                        </div>
                    </>
                ) : (
                    <div className="h-24 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
