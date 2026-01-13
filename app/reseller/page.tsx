"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import {
    TrendingUp,
    Users,
    DollarSign,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Globe,
    ShieldCheck,
    Loader2,
    RefreshCw,
    ShoppingBag,
    Zap
} from "lucide-react";
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
    Cell
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { useSettingsStore } from "@/lib/store/settingsStore";

const MetricCard = ({ title, value, change, icon: Icon, trend, loading }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 group"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon size={24} />
            </div>
            {change && (
                <div className={cn(
                    "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
                    trend === "up" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                    {trend === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {change}
                </div>
            )}
        </div>
        <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded mt-1" />
            ) : (
                <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
            )}
        </div>
    </motion.div>
);

export default function ResellerDashboard() {
    const { t } = useLanguage();
    const { user } = useAuthStore();
    const { formatPrice, settings } = useSettingsStore();
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, revenueRes] = await Promise.all([
                api.get("/reports/dashboard"),
                api.get("/reports/monthly-revenue")
            ]);
            setStats(statsRes.data.data.stats);
            setRevenueData(revenueRes.data.data.chartData);
        } catch (error) {
            console.error("Error fetching reseller data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <AuthGuard allowedRoles={["RESELLER"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header */}
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                    Reseller <span className="text-primary">Command Center</span>
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium">
                                    Hello {user?.firstName}, manage your infrastructure and scale your revenue.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <Button variant="outline" asChild className="h-12 px-6 rounded-xl font-bold border-border hover:bg-secondary/50">
                                    <Link href="/reseller/settings">
                                        <Globe className="w-5 h-5 mr-3" />
                                        White-Label Config
                                    </Link>
                                </Button>
                                <Button asChild className="h-12 px-6 rounded-xl font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Link href="/reseller/payouts">
                                        <Wallet className="w-5 h-5 mr-3" />
                                        Payouts
                                    </Link>
                                </Button>
                            </div>
                        </header>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard
                                title="ActiveClients"
                                value={stats?.activeServices || '0'}
                                change="+5.2%"
                                trend="up"
                                icon={Users}
                                loading={loading}
                            />
                            <MetricCard
                                title="Total Sales"
                                value={formatPrice(stats?.totalRevenue?._sum?.totalAmount || 0)}
                                change="+12.8%"
                                trend="up"
                                icon={TrendingUp}
                                loading={loading}
                            />
                            <MetricCard
                                title="My Commission (15%)"
                                value={formatPrice(Number(stats?.totalRevenue?._sum?.totalAmount || 0) * 0.15)}
                                change="+12.8%"
                                trend="up"
                                icon={DollarSign}
                                loading={loading}
                            />
                            <MetricCard
                                title="Withdrawable"
                                value={formatPrice(185.50)}
                                icon={Wallet}
                                loading={loading}
                            />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Performance Chart */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 md:p-10 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-extrabold">Revenue Intelligence</h3>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Growth Matrix Over Time</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5 text-primary" onClick={fetchDashboardData}>
                                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                                    </Button>
                                </div>
                                <div className="h-[350px] w-full">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueData}>
                                                <defs>
                                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(val) => formatPrice(val)} />
                                                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px" }} formatter={(val: any) => [formatPrice(val), "Revenue"]} />
                                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </motion.div>

                            {/* Quick Stats & Actions */}
                            <div className="space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-sm"
                                >
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Strategic Gateways</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Button className="h-12 rounded-xl justify-start gap-3 bg-secondary/30 hover:bg-primary/10 hover:text-primary transition-all font-bold border-l-4 border-l-primary">
                                            <Users size={18} /> Manage Clients
                                        </Button>
                                        <Button className="h-12 rounded-xl justify-start gap-3 bg-secondary/30 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all font-bold border-l-4 border-l-emerald-500">
                                            <ShoppingBag size={18} /> Market Store
                                        </Button>
                                        <Button className="h-12 rounded-xl justify-start gap-3 bg-secondary/30 hover:bg-amber-500/10 hover:text-amber-500 transition-all font-bold border-l-4 border-l-amber-500">
                                            <ShieldCheck size={18} /> Security Logs
                                        </Button>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-gradient-to-br from-primary/5 via-primary/5 to-transparent border border-primary/10 rounded-2xl p-8 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4">
                                        <Zap size={80} className="text-primary" />
                                    </div>
                                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Affiliate Program</h3>
                                    <p className="text-muted-foreground font-medium text-sm leading-relaxed relative z-10">
                                        Refer other resellers and earn an additional <span className="text-foreground font-bold">5% commission</span> indefinitely.
                                    </p>
                                    <Button className="mt-6 w-full h-11 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all border-none">
                                        Get Referral Link
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
