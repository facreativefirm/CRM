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
    Server,
    Search,
    Filter,
    RefreshCw,
    Loader2,
    ChevronRight,
    Users,
    Database,
    ExternalLink
} from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ResellerServicesPage() {
    const { t } = useLanguage();
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchResellerServices();
    }, []);

    const fetchResellerServices = async () => {
        try {
            setLoading(true);
            const response = await api.get("/reseller/services");
            setServices(response.data.data.services || []);
        } catch (err) {
            console.error("Error fetching services:", err);
            // Mock data for demo
            setServices([
                { id: 501, client: "John Doe", product: "Cloud Pro", domain: "john-site.com", price: 15.00, status: "ACTIVE", nextDue: "2026-01-15T00:00:00Z" },
                { id: 502, client: "Alice Smith", product: "VPS Starter", domain: "dev-srv.io", price: 45.00, status: "ACTIVE", nextDue: "2026-02-10T00:00:00Z" },
                { id: 503, client: "Bob Wilson", product: "Eco Hosting", domain: "myblog.net", price: 5.00, status: "SUSPENDED", nextDue: "2025-12-01T00:00:00Z" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: "Client / Domain",
            accessorKey: "client" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Users size={16} />
                    </div>
                    <div>
                        <p className="font-black text-foreground">{item.client}</p>
                        <p className="text-[10px] text-muted-foreground font-bold hover:text-primary cursor-pointer flex items-center gap-1">
                            {item.domain} <ExternalLink size={8} />
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: "Product Group",
            accessorKey: "product" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <Database size={14} className="text-muted-foreground" />
                    <span className="font-bold text-sm tracking-tight">{item.product}</span>
                </div>
            )
        },
        {
            header: "Recurring Revenue",
            accessorKey: "price" as any,
            cell: (item: any) => (
                <span className="font-black text-emerald-500">${Number(item.price).toFixed(2)}</span>
            )
        },
        {
            header: "Status",
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge variant={item.status === 'ACTIVE' ? 'success' : 'destructive'} className="px-2 py-0.5 rounded-md font-black text-[10px] tracking-widest">
                    {item.status}
                </Badge>
            )
        },
        {
            header: "Operations",
            accessorKey: "id" as any,
            cell: (item: any) => (
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl font-black text-[10px] tracking-widest uppercase bg-white/5 border-white/10 hover:bg-primary hover:text-white transition-all gap-2">
                    Manage Asset
                    <ChevronRight size={12} />
                </Button>
            )
        }
    ];

    return (
        <AuthGuard allowedRoles={["RESELLER"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                    Service <span className="text-primary">Inventory</span>
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium">Monitoring and management of services assigned to your sub-clients.</p>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-primary-foreground shadow-md gap-2 w-full md:w-auto">
                                    Broadcast Update
                                </Button>
                            </div>
                        </div>

                        {/* Inventory Controls */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filter by client or domain..."
                                    className="pl-12 h-12 rounded-2xl bg-card/50 border-border/50 focus:border-primary/50 transition-all font-bold text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <Button variant="outline" className="h-12 rounded-xl bg-secondary/30 border-border font-bold gap-2">
                                    <Filter size={18} /> Filters
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12 rounded-xl bg-secondary/30 border-border hover:bg-secondary/50"
                                    onClick={fetchResellerServices}
                                >
                                    <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
                                </Button>
                            </div>
                        </div>

                        {/* Main Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-2xl overflow-hidden p-6 md:p-8 shadow-sm"
                        >
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                    <p className="text-muted-foreground font-black uppercase text-xs tracking-widest animate-pulse">Scanning Infrastructure...</p>
                                </div>
                            ) : (
                                <DataTable columns={columns} data={services.filter(s => s.domain.toLowerCase().includes(searchTerm.toLowerCase()) || s.client.toLowerCase().includes(searchTerm.toLowerCase()))} />
                            )}
                        </motion.div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
