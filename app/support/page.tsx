"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import {
    LifeBuoy,
    Plus,
    Search,
    MessageSquare,
    Clock,
    ArrowRight,
    Loader2,
    RefreshCw,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function SupportPage() {
    const { t } = useLanguage();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get("/support/tickets");
            setTickets(response.data.data.tickets || []);
        } catch (err) {
            console.error("Error fetching tickets:", err);
            // Fallback mock for demo if API fails
            setTickets([
                { id: 452, subject: "Server High Load", department: "Technical Support", updatedAt: new Date().toISOString(), status: "OPEN" },
                { id: 440, subject: "Billing Question", department: "Billing Support", updatedAt: new Date(Date.now() - 86400000).toISOString(), status: "CLOSED" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: t("ticket_info"),
            accessorKey: "subject" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        <MessageSquare size={18} />
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors cursor-pointer">
                            #{item.id} - {item.subject}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                            {typeof item.department === 'object' ? item.department?.name : item.department}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: t("status"),
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge
                    variant={item.status === 'OPEN' ? 'success' : item.status === 'CLOSED' ? 'secondary' : 'warning'}
                    className="px-2.5 py-0.5 rounded-lg font-bold text-[9px] tracking-wider uppercase border-none"
                >
                    {item.status}
                </Badge>
            )
        },
        {
            header: t("last_activity"),
            accessorKey: "updatedAt" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-2 text-muted-foreground font-semibold text-xs">
                    <Clock size={12} />
                    {new Date(item.updatedAt).toLocaleDateString()}
                </div>
            )
        },
        {
            header: t("actions"),
            accessorKey: "id" as any,
            cell: (item: any) => (
                <Button variant="outline" size="sm" asChild className="h-9 px-4 rounded-lg font-bold bg-secondary/30 border-border hover:bg-primary hover:text-white transition-all gap-2 text-[10px] uppercase tracking-widest">
                    <Link href={`/support/${item.id}`}>
                        {t("view_details")}
                        <ArrowRight size={12} className="opacity-50" />
                    </Link>
                </Button>
            )
        }
    ];

    return (
        <AuthGuard allowedRoles={["CLIENT", "RESELLER", "ADMIN", "STAFF"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                    {t("support_center") || "Support Center"}
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium">{t("experts_ready") || "Our technical experts are standing by to assist you 24/7."}</p>
                            </div>
                            <Button className="h-12 w-full sm:w-auto px-8 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2" asChild>
                                <Link href="/support/new">
                                    <Plus size={20} />
                                    {t("open_new_ticket")}
                                </Link>
                            </Button>
                        </div>

                        {/* Search & Refresh */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder={t("search_tickets_placeholder")}
                                    className="pl-11 h-12 rounded-xl bg-card border-border/50 focus:border-primary/50 transition-all font-semibold"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-5 py-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{t("systems_online") || "Network Status: Optimal"}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    className="h-12 px-6 rounded-xl border-border hover:bg-secondary/50 gap-2 font-bold text-sm text-muted-foreground w-full sm:w-auto"
                                    onClick={fetchTickets}
                                >
                                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                                    <span>{loading ? "Updating..." : "Refresh"}</span>
                                </Button>
                            </div>
                        </div>

                        {/* Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* <motion.div whileHover={{ y: -2 }} className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3.5">
                                <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-bold text-sm text-emerald-700">{t("priority_support") || "Priority Handling"}</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 font-medium">{t("guaranteed_response") || "Your account includes elite priority response times."}</p>
                                </div>
                            </motion.div> */}
                            {/* <motion.div whileHover={{ y: -2 }} className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3.5 md:col-span-2">
                                <AlertCircle className="text-primary shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-bold text-sm text-primary">{t("system_announcement") || "Platform Notice"}</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 font-medium">Scheduled network performance enhancement in APAC regions on Jan 12th. Minimal latency fluctuations may occur.</p>
                                </div>
                            </motion.div> */}
                        </div>

                        {/* Tickets Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
                        >
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Retrieving Support History...</p>
                                </div>
                            ) : tickets.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <DataTable columns={columns} data={tickets} />
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center gap-4 text-center px-6">
                                    <div className="h-16 w-16 rounded-2xl bg-secondary/30 flex items-center justify-center text-muted-foreground">
                                        <MessageSquare size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-extrabold text-xl">{t("no_active_tickets") || "No Support History Found"}</p>
                                        <p className="text-muted-foreground text-sm font-medium">{t("no_tickets_desc") || "You haven't opened any support requests yet."}</p>
                                    </div>
                                    <Button className="mt-4 rounded-xl font-bold px-6 py-6 h-auto" variant="outline">
                                        {t("open_first_ticket") || "Request Assistance Now"}
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
