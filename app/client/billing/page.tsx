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
    FileText,
    Download,
    CreditCard,
    TrendingUp,
    Clock,
    RefreshCw,
    Loader2,
    ArrowUpRight,
    Search
} from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClientBillingPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const { formatPrice } = useSettingsStore();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [balance, setBalance] = useState(0.00);

    useEffect(() => {
        fetchInvoices();
    }, []);

    useEffect(() => {
        const filtered = invoices.filter(inv =>
            inv.id.toString().includes(searchTerm) ||
            inv.totalAmount.toString().includes(searchTerm) ||
            inv.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredInvoices(filtered);
    }, [searchTerm, invoices]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await api.get("/invoices");
            const data = response.data.data.invoices || [];
            setInvoices(data);
            setFilteredInvoices(data);
        } catch (err) {
            console.error("Error fetching invoices:", err);
            toast.error("Failed to load billing history");
        } finally {
            setLoading(false);
        }
    };

    const handlePay = (id: number) => {
        // In a real app, this would open a payment modal or redirect to a payment page
        // For now, we'll simulate the redirection to the payment gateway selection
        toast.info(`Initializing secure payment gateway for INV-${id}...`);
        router.push(`/client/checkout?invoiceId=${id}`);
    };

    const columns = [
        {
            header: t("invoice_ref"),
            accessorKey: "id" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                        <FileText size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-sm tracking-tight text-foreground">#INV-{item.id}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Service Balance</p>
                    </div>
                </div>
            )
        },
        {
            header: t("issuance_date"),
            accessorKey: "invoiceDate" as any,
            cell: (item: any) => {
                const date = item.invoiceDate || item.createdAt;
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{date ? new Date(date).toLocaleDateString() : 'N/A'}</span>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase">Automated Bill</span>
                    </div>
                );
            }
        },
        {
            header: t("due"),
            accessorKey: "dueDate" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <Clock size={12} className={cn(item.status === 'UNPAID' ? "text-rose-500" : "text-muted-foreground")} />
                    <span className={cn("font-semibold text-sm", item.status === 'UNPAID' ? "text-rose-500 font-bold" : "text-foreground")}>
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
            )
        },
        {
            header: t("total_amount") || "Total Amount",
            accessorKey: "totalAmount" as any,
            cell: (item: any) => (
                <span className="font-extrabold text-lg tracking-tight">{formatPrice(item.totalAmount)}</span>
            )
        },
        {
            header: t("status"),
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge variant={item.status === 'PAID' ? 'success' : 'destructive'} className="px-3 py-1 rounded-lg font-bold text-[9px] tracking-wider">
                    {item.status}
                </Badge>
            )
        },
        {
            header: t("actions"),
            accessorKey: "id" as any,
            cell: (item: any) => (
                <div className="flex gap-2">
                    {item.status === 'UNPAID' && (
                        <Button onClick={() => handlePay(item.id)} size="sm" className="h-9 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-all">
                            Pay Now
                        </Button>
                    )}
                    <Link href={`/client/invoices/${item.id}`}>
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border hover:bg-secondary/50" title="View Invoice">
                            <FileText size={14} />
                        </Button>
                    </Link>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border hover:bg-secondary/50">
                        <Download size={14} />
                    </Button>
                </div>
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
                        {/* Header & Stats */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                    {t("billing_financials") || "Billing & Financials"}
                                </h1>
                            </div>

                        </div>

                        {/* Search & Refresh Controls */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder={t("search_invoice_placeholder")}
                                    className="pl-11 h-12 rounded-xl bg-card border-border/50 focus:border-primary/50 text-sm font-semibold"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                className="h-8 w-full md:w-auto px-4 rounded-xl border-border hover:bg-secondary/50 gap-2 font-bold text-sm text-muted-foreground"
                                onClick={fetchInvoices}
                            >
                                <RefreshCw className={cn("w-2 h-2", loading && "animate-spin")} />
                                <span>{loading ? "Refreshing..." : "Refresh Records"}</span>
                            </Button>
                        </div>

                        {/* Invoice Table Container */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
                        >
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Accessing Secure Records...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <DataTable columns={columns} data={filteredInvoices} pagination={true} />
                                </div>
                            )}
                        </motion.div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
