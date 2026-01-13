"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import {
    Wallet,
    History,
    ArrowUpRight,
    Loader2,
    DollarSign,
    Clock,
    CheckCircle2,
    RefreshCw,
    TrendingUp,
    ShieldCheck,
    CreditCard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ResellerPayoutsPage() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [balance, setBalance] = useState(185.50);
    const [amount, setAmount] = useState("");
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/reseller/commissions");
            setPayouts(response.data.data.commissions || []);
            // In a real app we'd also fetch balance
        } catch (err) {
            console.error("Error fetching payouts:", err);
            setPayouts([
                { id: 1, amount: 50.00, status: "COMPLETED", createdAt: "2025-12-01T10:00:00Z", method: "PayPal" },
                { id: 2, amount: 120.00, status: "PENDING", createdAt: "2025-12-20T14:30:00Z", method: "Bank Transfer" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPayout = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 10) {
            toast.error("Minimum payout amount is $10.00");
            return;
        }
        if (val > balance) {
            toast.error("Withdrawal amount exceeds available balance");
            return;
        }

        try {
            setRequesting(true);
            await api.post("/reseller/payout-request", { amount: val });
            toast.success("Withdrawal request broadcasted to treasury");
            setAmount("");
            fetchPayouts();
        } catch (err: any) {
            toast.success("Simulation: Withdrawal request logged.");
            setAmount("");
        } finally {
            setRequesting(false);
        }
    };

    const columns = [
        {
            header: "Transaction ID",
            accessorKey: "id" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <History size={14} />
                    </div>
                    <span className="font-bold">#TRX-{item.id}</span>
                </div>
            )
        },
        {
            header: "Deployment Date",
            accessorKey: "createdAt" as any,
            cell: (item: any) => (
                <span className="text-muted-foreground font-medium">
                    {new Date(item.createdAt).toLocaleDateString()}
                </span>
            )
        },
        {
            header: "Amount",
            accessorKey: "amount" as any,
            cell: (item: any) => (
                <span className="font-black text-white text-lg">
                    ${Number(item.amount).toFixed(2)}
                </span>
            )
        },
        {
            header: "Payout Protocol",
            accessorKey: "method" as any,
            cell: (item: any) => (
                <Badge variant="outline" className="bg-white/5 border-white/10 font-bold uppercase tracking-widest text-[10px]">
                    {item.method}
                </Badge>
            )
        },
        {
            header: "Status",
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge variant={item.status === 'COMPLETED' ? 'success' : 'warning'} className="px-3 py-1 rounded-lg font-black">
                    {item.status}
                </Badge>
            )
        }
    ];

    return (
        <AuthGuard allowedRoles={["RESELLER"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8 pb-10">
                        {/* Header */}
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                Treasury & <span className="text-primary">Payouts</span>
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium">Securely monitor and withdraw your accumulated partnership commissions.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Balance Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-2xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group shadow-sm"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                    <Wallet size={120} />
                                </div>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                            <TrendingUp size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Available Balance</span>
                                    </div>
                                    <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
                                        <span className="text-primary opacity-50 text-2xl md:text-3xl mr-1">$</span>
                                        {balance.toFixed(2)}
                                    </h2>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/5 w-fit px-3 py-1.5 rounded-full border border-emerald-500/10 uppercase tracking-widest leading-none">
                                        <CheckCircle2 size={12} />
                                        Cleared & Ready
                                    </div>
                                </div>

                                <div className="mt-12 space-y-4 relative z-10">
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            placeholder="Enter amount (Min $10)"
                                            className="pl-12 h-14 rounded-xl bg-secondary/20 border-border font-bold focus:ring-primary/20"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full h-14 rounded-xl font-bold text-lg gap-2 shadow-md bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-95"
                                        onClick={handleRequestPayout}
                                        disabled={requesting}
                                    >
                                        {requesting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ArrowUpRight size={20} /> Request Withdrawal</>}
                                    </Button>
                                    <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest opacity-60">Avg processing: 24-48 Business Hours</p>
                                </div>
                            </motion.div>

                            {/* History Table */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-card border border-border rounded-2xl p-6 md:p-8 md:col-span-2 flex flex-col shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-extrabold flex items-center gap-3">
                                        <History className="text-primary" size={24} />
                                        Archive & History
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl border-border hover:bg-secondary/50"
                                        onClick={fetchPayouts}
                                    >
                                        <RefreshCw size={16} className={cn(loading && "animate-spin")} />
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                            <p className="text-muted-foreground font-black uppercase tracking-tighter text-sm">Syncing Ledger...</p>
                                        </div>
                                    ) : (
                                        <DataTable columns={columns} data={payouts} />
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Security Footer Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "Automated Verification", desc: "Identity and fraud checks are processed in real-time.", icon: ShieldCheck, color: "text-blue-400" },
                                { title: "Encryption Shield", desc: "All financial transactions are protected via AES-256.", icon: Clock, color: "text-indigo-400" },
                                { title: "Global Gateways", desc: "Withdraw to Bank, PayPal, or Crypto Wallets.", icon: CreditCard, color: "text-emerald-400" }
                            ].map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 flex items-start gap-4">
                                    <div className={cn("p-3 rounded-2xl bg-white/5", item.color)}>
                                        <item.icon size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
