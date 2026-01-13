"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { useAuthStore } from "@/lib/store/authStore";
import {
    Server,
    Globe,
    CreditCard,
    Search,
    Zap,
    ShieldCheck,
    Clock,
    Activity,
    ChevronRight,
    Sparkles,
    Loader2,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSettingsStore } from "@/lib/store/settingsStore";

export default function ClientDashboard() {
    const { t } = useLanguage();
    const router = useRouter();
    const { user } = useAuthStore();
    const { formatPrice, fetchSettings } = useSettingsStore();
    const [loading, setLoading] = useState(true);

    const [services, setServices] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [stats, setStats] = useState({
        activeServices: 0,
        unpaidInvoices: 0,
        unpaidTotal: 0,
        tickets: 0,
        domains: 0
    });

    // Domain Search State
    const [domainSearch, setDomainSearch] = useState("");
    const [checkingDomain, setCheckingDomain] = useState(false);
    const [domainResult, setDomainResult] = useState<{ name: string; available: boolean } | null>(null);

    useEffect(() => {
        fetchSettings();
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [servicesRes, invoicesRes, domainsRes] = await Promise.all([
                api.get("/services"),
                api.get("/invoices?status=UNPAID"),
                api.get("/domains")
            ]);

            const fetchedServices = servicesRes.data.data.services || [];
            const fetchedInvoices = invoicesRes.data.data.invoices || [];
            const fetchedDomains = domainsRes.data.data.domains || [];

            setServices(fetchedServices);
            setInvoices(fetchedInvoices);

            setStats({
                activeServices: fetchedServices.filter((s: any) => s.status === 'ACTIVE').length,
                unpaidInvoices: fetchedInvoices.length,
                unpaidTotal: fetchedInvoices.reduce((acc: number, inv: any) => acc + parseFloat(inv.totalAmount), 0),
                tickets: 0, // Placeholder until support API is ready
                domains: fetchedDomains.length
            });
        } catch (err) {
            console.error("Dashboard hydration error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDomainCheck = async () => {
        if (!domainSearch) return;
        setCheckingDomain(true);
        setDomainResult(null);
        await new Promise(r => setTimeout(r, 1000));
        const isAvailable = !domainSearch.includes("google") && !domainSearch.includes("taken");
        setDomainResult({
            name: domainSearch.includes(".") ? domainSearch : `${domainSearch}.com`,
            available: isAvailable
        });
        setCheckingDomain(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Nexus</span>
                </div>
            </div>
        );
    }

    return (
        <AuthGuard allowedRoles={["CLIENT", "RESELLER", "ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6 pb-20">

                        {/* Minimalist Hero */}
                        <header className="relative p-4 md:p-5 rounded-2xl overflow-hidden bg-primary/5 border border-primary/10">
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="space-y-2 text-center md:text-left">
                                    <div className="flex items-center gap-2 justify-center md:justify-start">
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-tighter text-[9px] px-2 py-0.5 rounded-sm">Operational Status: Optimal</Badge>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                                        Welcome, <span className="text-primary">{user?.firstName || user?.username}</span>
                                    </h1>
                                </div>
                                <div className="flex gap-3">
                                    <Button asChild className="h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 active:scale-95 transition-all">
                                        <Link href="/client/store">
                                            <Sparkles size={16} /> Deploy Assets
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border bg-background hover:bg-accent">
                                        <Activity size={18} className="text-primary" />
                                    </Button>
                                </div>
                            </div>
                        </header>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            {[
                                { label: "Active Nodes", value: stats.activeServices.toString().padStart(2, '0'), icon: Server, color: "text-primary" },
                                { label: "Registered Domains", value: stats.domains.toString().padStart(2, '0'), icon: Globe, color: "text-blue-500" },
                                { label: "Unpaid Balance", value: formatPrice(stats.unpaidTotal), icon: CreditCard, color: "text-rose-500" },
                                { label: "Network Load", value: "0.02%", icon: Zap, color: "text-amber-500" }
                            ].map((stat, i) => (
                                <div key={i} className="bg-card border border-border rounded-xl p-4 md:p-5 hover:border-primary/20 transition-all flex flex-col justify-between h-28 md:h-32">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground opacity-60 leading-tight">{stat.label}</span>
                                        <stat.icon size={16} className={stat.color} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className={cn("text-xl md:text-2xl font-black tracking-tighter", stat.color)}>{stat.value}</h3>
                                        <div className="w-8 h-1 bg-current opacity-10 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Core Operations Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Service Registry */}
                            <section className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 md:p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Server className="text-primary" size={16} />
                                        Node Management
                                    </h2>
                                    <Button variant="ghost" size="sm" asChild className="text-[10px] font-bold uppercase hover:bg-primary/5 rounded-lg h-8">
                                        <Link href="/client/services">Full Register <ChevronRight size={14} /></Link>
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {services.length > 0 ? services.slice(0, 4).map(service => (
                                        <div key={service.id} className="bg-secondary/10 border border-border/50 rounded-xl p-3 flex items-center justify-between group hover:border-primary/20 hover:bg-secondary/20 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                                                    <Server size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-xs group-hover:text-primary transition-colors leading-tight">{service.domain || service.product?.name}</h4>
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{service.product?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge variant={service.status === 'ACTIVE' ? 'success' : 'secondary'} className="px-1.5 py-0 text-[8px] font-black rounded-sm">{service.status}</Badge>
                                                <span className="text-[8px] font-bold text-muted-foreground flex items-center gap-1">
                                                    <Clock size={8} /> {new Date(service.nextDueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-10 text-center space-y-2 border-2 border-dashed border-border rounded-xl">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">No active nodes detected</p>
                                            <Button size="sm" variant="link" className="text-[10px] font-bold h-auto p-0" asChild>
                                                <Link href="/client/store">Deploy Initial Unit</Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Sidebar Widgets */}
                            <div className="space-y-4">
                                {/* Domain Rapid Search */}
                                <section className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Globe className="text-primary" size={16} />
                                        <h3 className="text-[10px] font-black uppercase tracking-widest">Rapid Name Check</h3>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            placeholder="domain.com"
                                            className="h-9 rounded-lg bg-background border-border text-xs font-bold focus:ring-primary/20"
                                            value={domainSearch}
                                            onChange={(e) => setDomainSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleDomainCheck()}
                                        />
                                        <Button
                                            size="icon"
                                            className="absolute right-1 top-1 h-7 w-7 rounded-md"
                                            onClick={handleDomainCheck}
                                            disabled={checkingDomain}
                                        >
                                            {checkingDomain ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                                        </Button>
                                    </div>
                                    <AnimatePresence>
                                        {domainResult && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn(
                                                    "p-2 rounded-lg border text-[10px] font-bold flex items-center justify-between",
                                                    domainResult.available ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                                                )}
                                            >
                                                <span className="truncate max-w-[120px]">{domainResult.name}</span>
                                                {domainResult.available ? (
                                                    <Link href="/client/store" className="underline decoration-2 underline-offset-2">Secure Now</Link>
                                                ) : (
                                                    <span>Taken</span>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>

                                {/* Financial Summary */}
                                <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Financial Status</h3>
                                        <CreditCard size={14} className="text-rose-500" />
                                    </div>
                                    {invoices.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Amount Due</p>
                                                    <p className="text-2xl font-black tracking-tighter">{formatPrice(stats.unpaidTotal)}</p>
                                                </div>
                                                <Button size="sm" asChild className="h-8 rounded-lg text-[9px] font-black uppercase bg-rose-500 hover:bg-rose-600 shadow-sm">
                                                    <Link href="/client/billing">Settle Balance</Link>
                                                </Button>
                                            </div>
                                            <div className="pt-3 border-t border-border">
                                                <p className="text-[9px] font-bold text-muted-foreground leading-tight">Your access to critical infrastructure may be throttled if balance remains unsettled beyond due date.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 space-y-2">
                                            <div className="inline-flex items-center justify-center p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Account is Clear</p>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
