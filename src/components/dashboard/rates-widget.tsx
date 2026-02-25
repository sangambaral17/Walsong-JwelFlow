"use client";

import { useEffect, useState } from "react";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, TrendingUp } from "lucide-react";

export function RatesWidget() {
    const [rates, setRates] = useState<{ gold: number; silver: number } | null>(null);

    useEffect(() => {
        // Mocking rates setup: usually fetched from an API
        const loadRates = async () => {
            const db = await getDb();
            const today = new Date().toISOString().split('T')[0];

            let currentRate = await db.rates.findOne(today).exec();
            if (!currentRate) {
                currentRate = await db.rates.insert({
                    date: today,
                    gold_tola_rate: 314800,
                    silver_tola_rate: 4200 // Mocked silver rate
                });
            }

            setRates({
                gold: currentRate.gold_tola_rate,
                silver: currentRate.silver_tola_rate
            });
        };

        loadRates();
    }, []);

    return (
        <Card className="bg-card/40 backdrop-blur-xl border-primary/20 bg-gradient-to-br from-card/80 to-card/10 shadow-2xl relative overflow-hidden group w-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <CardHeader>
                <CardTitle className="text-xl font-medium tracking-wide flex items-center space-x-2 text-primary">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>Live Market Rates</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                    NPR values per Fine Tola
                </CardDescription>
            </CardHeader>
            <CardContent>
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
