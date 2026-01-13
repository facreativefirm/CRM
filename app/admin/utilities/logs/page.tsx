"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import {
    Activity,
    Search,
    RefreshCw,
    Loader2,
    Clock,
    User,
    Terminal,
    Filter,
    FileText
} from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ActivityLogsPage() {
    const { t } = useLanguage();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get("/system/logs");
            setLogs(response.data.data.logs || []);
        } catch (err) {
            console.error("Error fetching logs:", err);
            // Mock data for demo
            setLogs([
                { id: 1, action: "Admin Login", description: "Admin logged in successfully from 192.168.1.1", timestamp: new Date().toISOString(), user: { firstName: "System", lastName: "Admin" }, status: "SUCCESS" },
                { id: 2, action: "Service Updated", description: "Hosting package #502 updated by Admin", timestamp: new Date(Date.now() - 3600000).toISOString(), user: { firstName: "Admin", lastName: "Staff" }, status: "INFO" },
                { id: 3, action: "Failed Login", description: "Failed login attempt for user 'naimur'", timestamp: new Date(Date.now() - 7200000).toISOString(), user: { firstName: "N/A", lastName: "" }, status: "WARNING" },
                { id: 4, action: "Settings Changed", description: "System currency changed to USD", timestamp: new Date(Date.now() - 86400000).toISOString(), user: { firstName: "Super", lastName: "Admin" }, status: "DANGER" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: t("activity_protocol"),
            accessorKey: "action" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                        item.status === 'SUCCESS' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                            item.status === 'WARNING' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                item.status === 'DANGER' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                                    "bg-primary/10 border-primary/20 text-primary"
                    )}>
                        {item.action.includes("Login") ? <User size={18} /> :
                            item.action.includes("Settings") ? <Terminal size={18} /> :
                                <Activity size={18} />}
                    </div>
                    <div>
                        <p className="font-black text-foreground">{item.action}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mt-1">Status: {item.status}</p>
                    </div>
                </div>
            )
        },
        {
            header: t("technical_narrative"),
            accessorKey: "description" as any,
            cell: (item: any) => (
                <span className="text-sm font-medium text-muted-foreground leading-relaxed max-w-md block">
                    {item.description}
                </span>
            )
        },
        {
            header: t("author"),
            accessorKey: "user" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-black">
                        {item.user?.firstName[0]}
                    </div>
                    <span className="font-bold text-xs">{item.user?.firstName} {item.user?.lastName}</span>
                </div>
            )
        },
        {
            header: t("timestamp"),
            accessorKey: "timestamp" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={12} />
                    <span className="text-xs font-medium">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
            )
        },
        {
            header: t("trace"),
            accessorKey: "id" as any,
            cell: (item: any) => (
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 text-muted-foreground hover:text-white">
                    <FileText size={14} />
                </Button>
            )
        }
    ];

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black tracking-[0.2em] px-3">Omniscient Log Engine</Badge>
                                </div>
                                <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic">
                                    {t("activity_stream")}
                                </h1>
                                <p className="text-muted-foreground mt-1 text-lg font-medium">{t("log_engine_desc")}</p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder={t("search_logs_placeholder")}
                                    className="pl-12 h-14 rounded-2xl bg-card/40 border-border/50 focus:border-primary/50 text-sm font-bold"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" className="h-14 px-8 rounded-2xl bg-card/40 border-white/5 font-black uppercase text-xs tracking-widest gap-2">
                                    <Filter size={18} /> {t("advanced_filters")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-14 w-14 rounded-2xl bg-card/40 border-white/5 hover:bg-card"
                                    onClick={fetchLogs}
                                >
                                    <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
                                </Button>
                            </div>
                        </div>

                        {/* Log Stream Container */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden p-8"
                        >
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-32 gap-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                    <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">{t("aggregating_logs")}</p>
                                </div>
                            ) : (
                                <DataTable columns={columns} data={logs.filter(l => l.action.toLowerCase().includes(searchTerm.toLowerCase()) || l.description.toLowerCase().includes(searchTerm.toLowerCase()))} />
                            )}
                        </motion.div>

                        <div className="flex justify-center pb-20">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-30">WHMCS Fusion Protocol • Version 2.0.4-LGC</p>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
