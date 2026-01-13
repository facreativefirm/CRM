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
import { Server, Settings, Search, PlusCircle, RefreshCw, Loader2, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settingsStore";

export default function ClientServicesPage() {
    const { t } = useLanguage();
    const { formatPrice } = useSettingsStore();
    const [services, setServices] = useState<any[]>([]);
    const [filteredServices, setFilteredServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await api.get("/services");
            const data = response.data.data.services || [];
            setServices(data);
            setFilteredServices(data);
        } catch (err) {
            console.error("Error fetching services:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const filtered = services.filter(s =>
            s.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.status?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredServices(filtered);
    }, [searchTerm, services]);

    const columns = [
        {
            header: t("product_service"),
            accessorKey: "product" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-colors">
                        <Server className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-foreground">{item.product?.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{item.domain || "Internal Managed Service"}</p>
                    </div>
                </div>
            )
        },
        {
            header: t("pricing"),
            accessorKey: "amount" as any,
            cell: (item: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">{formatPrice(item.amount || 0)}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{item.billingCycle}</span>
                </div>
            )
        },
        {
            header: t("next_due_date"),
            accessorKey: "nextDueDate" as any,
            cell: (item: any) => (
                <span className="font-medium text-sm text-muted-foreground">
                    {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : 'N/A'}
                </span>
            )
        },
        {
            header: t("status"),
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge
                    variant={
                        item.status === 'ACTIVE' ? 'success' :
                            item.status === 'PENDING' ? 'warning' : 'destructive'
                    }
                    className="px-2.5 py-0.5 rounded-lg font-bold text-[9px] tracking-wider uppercase border-none"
                >
                    {item.status}
                </Badge>
            )
        },
        {
            header: t("actions"),
            accessorKey: "id" as any,
            cell: (item: any) => (
                <Button variant="outline" size="sm" asChild className="h-9 px-4 rounded-lg font-bold bg-secondary/30 border-border hover:bg-primary hover:text-white transition-all gap-2 text-[10px] uppercase tracking-widest">
                    <Link href={`/client/services/${item.id}`}>
                        <Settings size={14} />
                        {t("manage")}
                        <ArrowRight size={12} className="opacity-50" />
                    </Link>
                </Button>
            )
        }
    ];

    return (
        <AuthGuard allowedRoles={["CLIENT", "RESELLER", "ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                                    {t("my_services")}
                                </h1>
                            </div>
                            <Button asChild className="h-12 w-full sm:w-auto px-8 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2">
                                <Link href="/client/store">
                                    <PlusCircle size={20} />
                                    {t("order_new_service")}
                                </Link>
                            </Button>
                        </div>

                        {/* Search & Refresh */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder={t("find_service_placeholder") || "Search services, domains, or status..."}
                                    className="pl-11 h-12 rounded-xl bg-card border-border/50 focus:border-primary/50 transition-all font-semibold"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                        </div>

                        {/* Inventory Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
                        >
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Syncing Service Data...</p>
                                </div>
                            ) : filteredServices.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <DataTable columns={columns} data={filteredServices} pagination={true} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                                    <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center text-muted-foreground mb-4">
                                        <Search size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold">No services found</h3>
                                    <p className="text-muted-foreground max-w-xs mt-1 text-sm font-medium">
                                        {searchTerm ? "Adjust your search parameters to find the assets you are looking for." : "You haven't provisioned any services yet. Start by exploring our storefront."}
                                    </p>
                                    {!searchTerm && (
                                        <Button asChild variant="outline" className="mt-6 rounded-xl font-bold bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                                            <Link href="/client/store">Browse Marketplace</Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
