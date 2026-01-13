"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Download, Loader2, Zap, Cog, ShieldCheck, CheckCircle2, AlertCircle, MoreHorizontal, CheckCircle, Trash2, XCircle, RefreshCcw, History } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useSearchParams, useRouter } from "next/navigation";
import { RefundQueue } from "@/components/admin/billing/RefundQueue";

export default function AdminBillingPage() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { formatPrice } = useSettingsStore();

    const [currentTab, setCurrentTab] = useState(searchParams.get("tab") || "invoices");
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ overdue: 0, paidThisMonth: 0 });
    const [automationLoading, setAutomationLoading] = useState<string | null>(null);
    const [automationLog, setAutomationLog] = useState<string[]>([]);

    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab) setCurrentTab(tab);
    }, [searchParams]);

    useEffect(() => {
        fetchInvoices();
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await api.get("/finance/transactions");
            if (response.data.status === 'success') {
                setTransactions(response.data.data.transactions);
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
        }
    };

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await api.get("/invoices");
            const invoiceData = response.data.data.invoices || [];
            setInvoices(invoiceData);

            // Calculate stats
            const now = new Date();
            const thisMonth = invoiceData.filter((inv: any) => {
                const invDate = new Date(inv.createdAt);
                return inv.status === 'PAID' &&
                    invDate.getMonth() === now.getMonth() &&
                    invDate.getFullYear() === now.getFullYear();
            });

            const overdueCount = invoiceData.filter((inv: any) => {
                const dueDate = new Date(inv.dueDate);
                return inv.status === 'UNPAID' && dueDate < now;
            }).length;

            const paidTotal = thisMonth.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0);

            setStats({
                overdue: overdueCount,
                paidThisMonth: paidTotal
            });
        } catch (err) {
            console.error("Error fetching invoices:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInvoices = async () => {
        setAutomationLoading('generate');
        try {
            const response = await api.post("/invoices/generate-due");
            toast.success(response.data.message);
            setAutomationLog(prev => [`[${new Date().toLocaleTimeString()}] ${response.data.message}`, ...prev]);
            fetchInvoices();
        } catch (err) {
            toast.error("Failed to generate invoices");
        } finally {
            setAutomationLoading(null);
        }
    };

    const handleAttemptCapture = async () => {
        setAutomationLoading('capture');
        try {
            const response = await api.post("/finance/attempt-cc-capture");
            const { results } = response.data.data;
            toast.success(`Processed ${results.processed} invoices. ${results.succeeded} succeeded.`);
            setAutomationLog(prev => [
                `[${new Date().toLocaleTimeString()}] CC Capture: ${results.succeeded} Succeeded, ${results.failed} Failed.`,
                ...results.logs.map((l: string) => ` - ${l}`),
                ...prev
            ]);
            fetchInvoices();
        } catch (err) {
            toast.error("Failed to process CC captures");
        } finally {
            setAutomationLoading(null);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await api.patch(`/invoices/${id}/status`, { status });
            toast.success(`Invoice marked as ${status.toLowerCase()}`);
            fetchInvoices();
            fetchTransactions();
        } catch (err: any) {
            toast.error("Operation Failed", {
                description: err.response?.data?.message || "Failed to update invoice status"
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this invoice? This will hide it from the list.")) return;
        try {
            await api.delete(`/invoices/${id}`);
            toast.success("Invoice deleted successfully");
            fetchInvoices();
        } catch (err) {
            toast.error("Failed to delete invoice");
        }
    };

    const handleVerifyTransaction = async (id: number, action: 'APPROVE' | 'REJECT') => {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this transaction?`)) return;
        try {
            await api.post(`/finance/transactions/${id}/verify`, { action });
            toast.success(`Transaction ${action.toLowerCase()}d successfully`);
            fetchTransactions();
            fetchInvoices(); // Refresh invoices too as status changes
        } catch (err) {
            toast.error("Failed to verify transaction");
            console.error(err);
        }
    };

    const handleRefundRequest = async (transaction: any) => {
        const refundedAmount = transaction.refunds
            ?.filter((r: any) => r.status !== 'REJECTED')
            .reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0) || 0;

        const maxRefundable = parseFloat(transaction.amount) - refundedAmount;

        if (maxRefundable <= 0) {
            toast.error("Transaction is already fully refunded");
            return;
        }

        const amount = prompt(`Enter amount to refund (Max: ${maxRefundable}):`, maxRefundable.toString());
        if (!amount) return;

        if (parseFloat(amount) > maxRefundable) {
            toast.error(`Amount exceeds refundable balance of ${maxRefundable}`);
            return;
        }

        const reason = prompt("Enter reason for refund (min 5 chars):");
        if (!reason || reason.length < 5) {
            toast.error("Valid reason is required");
            return;
        }

        try {
            await api.post("/finance/refunds", {
                transactionId: transaction.id,
                amount: parseFloat(amount),
                reason
            });
            toast.success("Refund request initiated");
            router.push("/admin/billing/refunds");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to initiate refund");
        }
    };

    const invoiceColumns = [
        {
            header: t("invoice_num"),
            accessorKey: "id" as any,
            cell: (item: any) => <span className="font-bold">#{item.invoiceNumber || item.id}</span>
        },
        {
            header: t("client"),
            accessorKey: "client" as any,
            cell: (item: any) => {
                const user = item.client?.user;
                return user ? `${user.firstName} ${user.lastName}` : (item.client?.companyName || 'N/A');
            }
        },
        {
            header: t("date"),
            accessorKey: "invoiceDate" as any,
            cell: (item: any) => {
                const date = item.invoiceDate || item.createdAt;
                return date ? new Date(date).toLocaleDateString() : 'N/A';
            }
        },
        {
            header: t("due_date"),
            accessorKey: "dueDate" as any,
            cell: (item: any) => item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'
        },
        {
            header: t("total"),
            accessorKey: "totalAmount" as any,
            cell: (item: any) => <span className="font-bold">{formatPrice(item.totalAmount || 0)}</span>
        },
        {
            header: t("status"),
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge variant={item.status === 'PAID' ? 'success' : item.status === 'UNPAID' ? 'destructive' : 'default'}>
                    {item.status}
                </Badge>
            )
        },
        {
            header: t("actions"),
            accessorKey: "id" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <Link href={`/admin/billing/${item.id}`}>
                        <Button variant="ghost" size="sm">{t("manage")}</Button>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-card border-white/5">
                            {item.status !== 'PAID' && (
                                <DropdownMenuItem
                                    className="gap-2 cursor-pointer text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10"
                                    onClick={() => handleUpdateStatus(item.id, 'PAID')}
                                >
                                    <CheckCircle size={14} />
                                    Mark as Paid
                                </DropdownMenuItem>
                            )}
                            {item.status === 'PAID' && (
                                <DropdownMenuItem
                                    className="small gap-2 cursor-pointer text-amber-500 focus:text-amber-500 focus:bg-amber-500/10"
                                    onClick={() => handleUpdateStatus(item.id, 'UNPAID')}
                                >
                                    <XCircle size={14} />
                                    Mark as Unpaid
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => handleDelete(item.id)}
                            >
                                <Trash2 size={14} />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        title="Quick Refund"
                        onClick={async () => {
                            const transactions = await api.get(`/finance/transactions?invoiceId=${item.id}`);
                            const lastSuccess = transactions.data.data.transactions.find((t: any) => (t.status === 'SUCCESS' || t.status === 'COMPLETED') && parseFloat(t.amount) > 0);
                            if (lastSuccess) handleRefundRequest(lastSuccess);
                            else toast.error("No refundable transaction found");
                        }}
                    >
                        <RefreshCcw size={14} />
                    </Button>
                </div>
            )
        }
    ];

    const transactionColumns = [
        {
            header: "Transaction ID",
            accessorKey: "transactionId" as any,
            cell: (item: any) => <span className="font-mono text-xs">{item.transactionId || '-'}</span>
        },
        {
            header: "Invoice",
            accessorKey: "invoiceNumber" as any,
            cell: (item: any) => (
                <Link href={`/admin/billing/${item.invoiceId}`} className="text-primary hover:underline">
                    #{item.invoice?.invoiceNumber}
                </Link>
            )
        },
        {
            header: "Client",
            accessorKey: "clientName" as any,
            cell: (item: any) => item.clientName || 'N/A'
        },
        {
            header: "Payment Details",
            accessorKey: "gateway" as any,
            cell: (item: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{item.gateway}</span>
                    {item.gatewayResponse?.senderNumber && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                            From: {item.gatewayResponse.senderNumber}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: "Amount",
            accessorKey: "amount" as any,
            cell: (item: any) => <span className="font-bold">{formatPrice(item.amount)}</span>
        },
        {
            header: "Date",
            accessorKey: "createdAt" as any,
            cell: (item: any) => new Date(item.createdAt).toLocaleString()
        },
        {
            header: "Status",
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge variant={item.status === 'COMPLETED' || item.status === 'succeeded' || item.status === 'SUCCESS' ? 'success' : item.status === 'PENDING' ? 'warning' : 'default'}>
                    {item.status}
                </Badge>
            )
        },
        {
            header: "Actions",
            accessorKey: "id" as any,
            cell: (item: any) => (
                item.status === 'PENDING' ? (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => handleVerifyTransaction(item.id, 'APPROVE')}
                            title="Approve Payment"
                        >
                            <CheckCircle size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleVerifyTransaction(item.id, 'REJECT')}
                            title="Reject Payment"
                        >
                            <XCircle size={16} />
                        </Button>
                    </div>
                ) : (
                    (() => {
                        const refundedAmount = item.refunds
                            ?.filter((r: any) => r.status !== 'REJECTED')
                            .reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0) || 0;
                        const isFullyRefunded = refundedAmount >= parseFloat(item.amount);

                        return (
                            <Button
                                variant="ghost"
                                size="icon"
                                className={
                                    cn(
                                        "h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10",
                                        isFullyRefunded && "opacity-30 cursor-not-allowed text-muted-foreground"
                                    )
                                }
                                title={isFullyRefunded ? "Fully Refunded" : "Request Refund"}
                                onClick={() => !isFullyRefunded && handleRefundRequest(item)
                                }
                                disabled={item.amount <= 0 || item.status !== 'SUCCESS' || isFullyRefunded}
                            >
                                <RefreshCcw size={14} />
                            </Button >
                        );
                    })()
                )
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
                        <h1 className="text-3xl font-bold">{t("billing")}</h1>
                        <p className="text-muted-foreground">{t("admin_billing_desc")}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/admin/billing/refunds">
                            <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
                                <History className="w-4 h-4" />
                                Refund Queue
                            </Button>
                        </Link>
                        <Link href="/admin/billing/create">
                            <Button className="gap-2 shadow-lg shadow-primary/20">
                                <Plus className="w-4 h-4" />
                                {t("create_invoice")}
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="glass rounded-[2rem] p-6">
                    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                        <TabsList className="mb-6 bg-secondary/30 p-1 rounded-xl w-full justify-start h-auto">
                            <TabsTrigger value="invoices" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                {t("invoices")}
                            </TabsTrigger>
                            <TabsTrigger value="transactions" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                {t("transactions")}
                            </TabsTrigger>
                            <TabsTrigger value="automation" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                {t("automation")}
                            </TabsTrigger>
                            <TabsTrigger value="refunds" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                {t("refunds") || "Refunds"}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="invoices" className="space-y-4">
                            <div className="flex gap-4 mb-4">
                                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex-1">
                                    <h3 className="font-bold text-lg">{t("overdue_invoices")}</h3>
                                    <p className="text-sm opacity-80">{t("immediate_attention")}</p>
                                    <p className="text-2xl font-bold mt-2">{stats.overdue}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex-1">
                                    <h3 className="font-bold text-lg">{t("paid_this_month")}</h3>
                                    <p className="text-sm opacity-80">{t("revenue_collected")}</p>
                                    <p className="text-2xl font-bold mt-2">{formatPrice(stats.paidThisMonth)}</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : invoices.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>{t("no_invoices_found")}</p>
                                </div>
                            ) : (
                                <DataTable columns={invoiceColumns} data={invoices} />
                            )}
                        </TabsContent>

                        <TabsContent value="transactions" className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>{t("no_transactions_found") || "No transactions found"}</p>
                                </div>
                            ) : (
                                <DataTable columns={transactionColumns} data={transactions} />
                            )}
                        </TabsContent>

                        <TabsContent value="automation" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-secondary/20 border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-primary/10">
                                            <Zap className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{t("invoice_generation")}</h3>
                                            <p className="text-sm text-muted-foreground">{t("process_recurring")}</p>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full h-12 rounded-xl"
                                        onClick={handleGenerateInvoices}
                                        disabled={automationLoading !== null}
                                    >
                                        {automationLoading === 'generate' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Cog className="w-4 h-4 mr-2" />}
                                        {t("generate_due_invoices")}
                                    </Button>
                                </div>

                                <div className="p-6 rounded-2xl bg-secondary/20 border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-destructive/10">
                                            <ShieldCheck className="w-6 h-6 text-destructive" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{t("cc_capture")}</h3>
                                            <p className="text-sm text-muted-foreground">{t("attempt_capture_desc")}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
                                        onClick={handleAttemptCapture}
                                        disabled={automationLoading !== null}
                                    >
                                        {automationLoading === 'capture' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                        {t("attempt_cc_capture")}
                                    </Button>
                                </div>
                            </div>

                            {automationLog.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 font-bold text-sm opacity-60">
                                        <AlertCircle className="w-4 h-4" />
                                        {t("process_log")}
                                    </h4>
                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] space-y-1 max-h-60 overflow-y-auto">
                                        {automationLog.map((log, i) => (
                                            <div key={i} className={cn(log.startsWith(' -') ? "text-muted-foreground ml-4" : "text-emerald-500 font-bold")}>
                                                {log}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="refunds" className="pt-2">
                            <RefundQueue />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}

