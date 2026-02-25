import { useEffect, useState } from "react";
import { getDb } from "@/lib/db";
import { syncMarketRates, MARKET_CONSTANTS } from "@/lib/rates-sync";
import { useShop } from "@/lib/shop-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, TrendingUp, Calendar } from "lucide-react";

export function RatesWidget() {
    const { profile } = useShop();
    const [rates, setRates] = useState<{ gold: number; silver: number } | null>(null);
    const [updateDate, setUpdateDate] = useState<string>("");

    useEffect(() => {
        const loadRates = async () => {
            // Trigger sync service (upserts today's rate if not present)
            await syncMarketRates();

            const db = await getDb();
            const today = new Date().toISOString().split('T')[0];
            setUpdateDate(new Date().toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' }));

            const currentRateSnapshot = await db.rates.findOne(today).exec();
            const baseGold = currentRateSnapshot?.gold_tola_rate ?? MARKET_CONSTANTS.HALLMARK_GOLD;
            const baseSilver = currentRateSnapshot?.silver_tola_rate ?? MARKET_CONSTANTS.SILVER;

            setRates({
                gold: baseGold + (profile.premium_gold || 0),
                silver: baseSilver + (profile.premium_silver || 0)
            });
        };

        loadRates();
    }, [profile.premium_gold, profile.premium_silver]);

    return (
        <Card className="bg-card/40 backdrop-blur-xl border-primary/20 bg-gradient-to-br from-card/80 to-card/10 shadow-2xl relative overflow-hidden group w-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-xl font-medium tracking-wide flex items-center space-x-2 text-primary">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span>Live Market Rates</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        NPR values per Fine Tola (incl. Shop Premium)
                    </CardDescription>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-tighter text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Market Updated
                    </span>
                    <span className="text-xs font-medium text-foreground">{updateDate || "Synchronizing..."}</span>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {rates ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1 p-5 rounded-xl bg-background/30 border border-primary/10 hover:border-primary/40 transition-colors shadow-inner backdrop-blur-sm relative overflow-hidden">
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
                        </div>
                        <div className="flex flex-col space-y-1 p-5 rounded-xl bg-background/30 border border-border hover:border-border/80 transition-colors shadow-inner backdrop-blur-sm relative overflow-hidden">
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
                        </div>
                    </div>
                ) : (
                    <div className="h-24 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
