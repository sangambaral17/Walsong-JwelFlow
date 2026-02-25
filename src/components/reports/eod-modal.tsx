"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Printer, CheckCircle2 } from "lucide-react";
import { useShop } from "@/lib/shop-context";

export function EodModal() {
    const { profile } = useShop();
    const [open, setOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    // Mock tallies for demonstration
    const [tallies] = useState({
        cash_received: 245000,
        digital_received: 520000,
        dhito_disbursed: 85000,
        dhito_collected: 110000,
    });

    const netCash = tallies.cash_received + tallies.dhito_collected - tallies.dhito_disbursed;
    const totalRevenue = tallies.cash_received + tallies.digital_received;

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
            setOpen(false);
        }, 500);
    };

    return (
        <>
            {/* Hidden 80mm Print Layout */}
            <div className="hidden print:block w-[80mm] bg-white text-black p-4 font-mono text-xs mx-auto">
                <div className="text-center pb-4 border-b border-dashed border-gray-400 mb-4">
                    <h1 className="font-bold text-lg mb-1">{profile.shop_name || "JwelFlow"}</h1>
                    <p>PAN: {profile.pan_vat_number}</p>
                    <p>{profile.address}</p>
                    <p>END OF DAY SETTLEMENT</p>
                    <p className="mt-2">{format(new Date(), "yyyy-MM-dd HH:mm")}</p>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex justify-between"><span>Sales (Cash):</span><span>Rs.{tallies.cash_received}</span></div>
                    <div className="flex justify-between"><span>Sales (Digital):</span><span>Rs.{tallies.digital_received}</span></div>
                    <div className="border-t border-dashed border-gray-400 my-1 pt-1 flex justify-between font-bold">
                        <span>TOTAL SALES:</span><span>Rs.{totalRevenue}</span>
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-red-600"><span>Dhito Disbursed:</span><span>-Rs.{tallies.dhito_disbursed}</span></div>
                    <div className="flex justify-between"><span>Dhito Redeemed:</span><span>+Rs.{tallies.dhito_collected}</span></div>
                </div>

                <div className="border-t border-dashed border-gray-400 my-2 pt-2">
                    <div className="flex justify-between font-bold text-sm">
                        <span>EXPECTED CASH:</span><span>Rs.{netCash}</span>
                    </div>
                </div>

                <div className="text-center mt-8 pt-4 border-t border-gray-400 text-[10px]">
                    <p>Verified by: _________________</p>
                    <p className="mt-4 break-words">{profile.invoice_footer}</p>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="print:hidden bg-background/50 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                        <Calculator className="w-4 h-4 mr-2" /> EOD Settlement
                    </Button>
                </DialogTrigger>
                <DialogContent className="glass-card sm:max-w-md print:hidden text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-primary font-medium flex items-center gap-2">
                            <Calculator className="w-6 h-6" /> Daily Closing
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-background/50 rounded-xl border border-border/50">
                            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Revenues</h4>
                            <div className="space-y-2 font-mono">
                                <div className="flex justify-between text-sm"><span>Cash Sales:</span><span>रू {tallies.cash_received.toLocaleString()}</span></div>
                                <div className="flex justify-between text-sm"><span>Digital Sales:</span><span>रू {tallies.digital_received.toLocaleString()}</span></div>
                                <div className="flex justify-between text-base font-bold text-foreground border-t border-border/50 pt-2 mt-2">
                                    <span>Total Revenue:</span><span className="text-primary">रू {totalRevenue.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-background/50 rounded-xl border border-border/50">
                            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Dhito (Pawn) Activity</h4>
                            <div className="space-y-2 font-mono text-sm">
                                <div className="flex justify-between text-red-400"><span>Disbursed (Out):</span><span>- रू {tallies.dhito_disbursed.toLocaleString()}</span></div>
                                <div className="flex justify-between text-green-400"><span>Collected (In):</span><span>+ रू {tallies.dhito_collected.toLocaleString()}</span></div>
                            </div>
                        </div>

                        <div className="p-4 bg-primary/10 rounded-xl border border-primary/30">
                            <h4 className="text-xs uppercase tracking-wider text-primary mb-1">Expected Cash in Drawer</h4>
                            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
                                रू {netCash.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between">
                        <p className="text-xs text-muted-foreground self-center">Printing generates an 80mm cash receipt.</p>
                        <Button onClick={handlePrint} disabled={isPrinting} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                            {isPrinting ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Printing...</> : <><Printer className="w-4 h-4 mr-2" /> Settle & Print</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
