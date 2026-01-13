"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Eye, CheckCircle, XCircle, Loader2, Filter, ShieldAlert, BadgeDollarSign, Clock, Search, RefreshCw, Plus } from "lucide-react";
import api from "@/lib/api";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/lib/store/settingsStore";
import Link from "next/link";

export default function AdminOrdersPage() {
    const { t } = useLanguage();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { settings, fetchSettings } = useSettingsStore();
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        fetchSettings();
        fetchOrders();
    }, []);


    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get("/orders");
            setOrders(response.data.data.orders || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: number, status: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status });
            toast.success(`Order #${orderId} Updated`, {
                description: `Successfully marked as ${status.toLowerCase()}`
            });
            fetchOrders(); // Refresh list
        } catch (err: any) {
            toast.error(`Update Failed`, {
                description: err.response?.data?.message || `Failed to update order #${orderId}`
            });
        }
    };

    const columns = [
        {
            header: t("order_info"),
            accessorKey: "id" as any,
            cell: (item: any) => (
                <div className="flex flex-col">
                    <span className="font-black text-lg">#{item.orderNumber}</span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                </div>
            )
        },
        {
            header: t("client_service"),
            accessorKey: "client" as any,
            cell: (item: any) => (
                <div className="flex flex-col">
                    <span className="font-bold">{item.client?.user?.firstName} {item.client?.user?.lastName || "Guest"}</span>
                    <span className="text-xs text-muted-foreground">{item.items?.[0]?.product?.name || "Service Purchase"}</span>
                </div>
            )
        },
        {
            header: t("revenue"),
            accessorKey: "total" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-1.5 font-black text-emerald-500">
                    {getCurrencySymbol(settings.defaultCurrency || 'BDT')}
                    {Number(item.totalAmount || 0).toFixed(2)}
                </div>
            )
        },
        {
            header: t("status"),
            accessorKey: "status" as any,
            cell: (item: any) => {
                const hasPaidInvoice = item.invoices?.some((inv: any) => inv.status === 'PAID' && inv.transactions?.some((t: any) => t.status === 'SUCCESS' || t.status === 'COMPLETED'));
                return (
                    <div className="flex flex-col gap-1">
                        <Badge variant={
                            item.status === 'COMPLETED' ? 'success' :
                                item.status === 'PENDING' ? 'warning' :
                                    item.status === 'FRAUD' ? 'destructive' :
                                        'default'
                        } className="px-3 py-1 rounded-lg font-bold w-fit">
                            {item.status}
                        </Badge>
                        {hasPaidInvoice && (
                            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                <CheckCircle size={10} /> PAID
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            header: t("actions"),
            accessorKey: "id" as any,
            cell: (item: any) => (
                <div className="flex gap-2">
                    <Link href={`/admin/orders/${item.id}`}>
                        <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl font-bold bg-white/5 border border-border hover:bg-muted group">
                            <Eye size={14} className="mr-2 opacity-50 group-hover:opacity-100" />
                            {t("details")}
                        </Button>
                    </Link>
                    {item.status === 'PENDING' && (
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className={cn(
                                    "h-9 w-9 rounded-xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10",
                                    !item.invoices?.some((inv: any) => inv.status === 'PAID') && "opacity-50 grayscale hover:grayscale-0"
                                )}
                                onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                                title={!item.invoices?.some((inv: any) => inv.status === 'PAID') ? "Payment required before activation" : "Mark Active & Provision"}
                            >
                                <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-xl border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                                onClick={() => handleUpdateStatus(item.id, 'FRAUD')}
                                title="Mark as Fraud"
                            >
                                <ShieldAlert className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    const filteredOrders = orders.filter(o => {
        if (activeTab === "all") return true;
        return o.status.toLowerCase() === activeTab.toLowerCase();
    });

    const stats = [
        { label: t("pending"), value: orders.filter(o => o.status === 'PENDING').length, color: "text-amber-500" },
        { label: t("active"), value: orders.filter(o => o.status === 'COMPLETED').length, color: "text-emerald-500" },
        { label: t("fraud"), value: orders.filter(o => o.status === 'FRAUD').length, color: "text-rose-500" },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <Sidebar />
            <main className="pl-75 pt-20 p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold">{t("order_management") || "Order Management"}</h1>
                        <p className="text-muted-foreground mt-1">{t("process_orders") || "Review and process new orders."}</p>
                    </div>
                    <Link href="/admin/orders/add">
                        <Button className="shadow-lg shadow-primary/20 gap-2">
                            <Plus size={16} /> {t("add_new_order") || "Add New Order"}
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((s, i) => (
                        <div key={i} className="glass p-6 rounded-[2rem] flex items-center justify-between hover:scale-[1.02] transition-all group">
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                                <h3 className="text-3xl font-bold tracking-tight">{s.value}</h3>
                            </div>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:rotate-12 bg-secondary/20", s.color)}>
                                <BadgeDollarSign size={24} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls & List */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList className="bg-secondary/50 p-1 rounded-xl h-auto">
                                <TabsTrigger value="all" className="rounded-lg px-4 py-2 text-sm font-medium">{t("all_orders")}</TabsTrigger>
                                <TabsTrigger value="pending" className="rounded-lg px-4 py-2 text-sm font-medium">{t("pending")}</TabsTrigger>
                                <TabsTrigger value="completed" className="rounded-lg px-4 py-2 text-sm font-medium">{t("completed")}</TabsTrigger>
                                <TabsTrigger value="fraud" className="rounded-lg px-4 py-2 text-sm font-medium" >{t("fraud")}</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={t("search_orders_placeholder") || "Search orders..."}
                                className="pl-10 h-10 rounded-xl bg-background/50 border-border/50"
                            />
                        </div>
                    </div>

                    <div className="glass rounded-[2rem] p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            </div>
                        ) : (
                            <DataTable columns={columns} data={filteredOrders} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
