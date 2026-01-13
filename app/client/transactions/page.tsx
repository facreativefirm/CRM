"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { toast } from "sonner";
import Link from "next/link";

export default function TransactionsPage() {
    const { t } = useLanguage();
    const { formatPrice } = useSettingsStore();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await api.get("/invoices/transactions");
            if (response.data.status === 'success') {
                setTransactions(response.data.data.transactions);
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: "Transaction ID",
            accessorKey: "transactionId" as any,
            cell: (item: any) => <span className="font-mono text-xs">{item.transactionId || '-'}</span>
        },
        {
            header: "Invoice",
            accessorKey: "invoiceNumber" as any,
            cell: (item: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold">#{item.invoice?.invoiceNumber || item.invoiceId}</span>
                    <Link href={`/client/invoices/${item.invoiceId}`} className="text-[10px] text-primary hover:underline">
                        View Invoice
                    </Link>
                </div>
            )
        },
        {
            header: "Method",
            accessorKey: "gateway" as any,
            cell: (item: any) => {
                const gateway = item.gateway === 'bank' ? 'Bank Transfer' :
                    item.gateway === 'bkash_manual' ? 'bKash' :
                        item.gateway === 'nagad_manual' ? 'Nagad' : item.gateway;
                return (
                    <div>
                        <span className="font-medium">{gateway}</span>
                        {item.gatewayResponse?.senderNumber && (
                            <p className="text-[10px] text-muted-foreground font-mono">From: {item.gatewayResponse.senderNumber}</p>
                        )}
                    </div>
                );
            }
        },
        {
            header: "Amount",
            accessorKey: "amount" as any,
            cell: (item: any) => <span className="font-bold">{formatPrice(item.amount)}</span>
        },
        {
            header: "Date",
            accessorKey: "createdAt" as any,
            cell: (item: any) => new Date(item.createdAt).toLocaleDateString()
        },
        {
            header: "Status",
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge variant={
                    item.status === 'COMPLETED' || item.status === 'succeeded' || item.status === 'SUCCESS' ? 'success' :
                        item.status === 'PENDING' ? 'warning' :
                            item.status === 'FAILED' ? 'destructive' : 'default'
                }>
                    {item.status}
                </Badge>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <Sidebar />
            <main className="pl-75 pt-6 p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{t("transactions") || "Transaction History"}</h1>
                        <p className="text-muted-foreground">View your recent payments and their status.</p>
                    </div>
                </div>

                <div className="glass rounded-[2rem] p-6 border border-white/5 bg-secondary/10">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
                            <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 opacity-50" />
                            </div>
                            <p>No transactions found</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={transactions} pagination={true} />
                    )}
                </div>
            </main>
        </div>
    );
}
