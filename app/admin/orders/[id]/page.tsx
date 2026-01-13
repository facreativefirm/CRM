"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";
import { ArrowLeft, Loader2, CheckCircle, ShieldAlert, Package, CreditCard, Clock, FileText } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { XCircle, CheckCircle2, History } from "lucide-react";

export default function OrderDetailsPage() {
    const { t } = useLanguage();
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const { settings, fetchSettings } = useSettingsStore();

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/orders/${id}`);
            // Force fetch related invoices with transactions if not included
            setOrder(response.data.data.order);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        try {
            setUpdating(true);
            await api.patch(`/orders/${id}/status`, { status });
            toast.success(`Order status updated to ${status}`);
            fetchOrder();
        } catch (error: any) {
            toast.error("Process Blocked", {
                description: error.response?.data?.message || "Failed to update status"
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleMarkInvoicePaid = async (invoiceId: number) => {
        if (!confirm("Are you sure you want to mark this invoice as paid manually?")) return;
        try {
            setUpdating(true);
            await api.patch(`/invoices/${invoiceId}/status`, { status: 'PAID' });
            toast.success("Invoice marked as paid");
            fetchOrder();
        } catch (err) {
            toast.error("Failed to update invoice status");
        } finally {
            setUpdating(false);
        }
    };

    const handleVerifyTransaction = async (transactionId: number, action: 'APPROVE' | 'REJECT') => {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this transaction?`)) return;
        try {
            setUpdating(true);
            await api.post(`/finance/transactions/${transactionId}/verify`, { action });
            toast.success(`Transaction ${action.toLowerCase()}d successfully`);
            fetchOrder();
        } catch (err) {
            toast.error("Failed to verify transaction");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!order) return null;

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8 flex justify-center">
                    <div className="w-full max-w-6xl space-y-8">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Link href="/admin/orders">
                                    <Button variant="ghost" size="icon" className="rounded-xl">
                                        <ArrowLeft size={20} />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-bold flex items-center gap-3">
                                        Order #{order.orderNumber}
                                        <Badge variant={
                                            order.status === 'COMPLETED' ? 'success' :
                                                order.status === 'PENDING' ? 'warning' :
                                                    order.status === 'FRAUD' ? 'destructive' :
                                                        'default'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </h1>
                                    <p className="text-muted-foreground mt-1">
                                        Placed on {new Date(order.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {order.status === 'PENDING' && (
                                    <>
                                        <Button
                                            onClick={() => handleUpdateStatus('COMPLETED')}
                                            disabled={updating}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20"
                                        >
                                            <CheckCircle size={16} />
                                            Mark Active & Provision
                                        </Button>
                                        <Button
                                            onClick={() => handleUpdateStatus('FRAUD')}
                                            disabled={updating}
                                            variant="destructive"
                                            className="gap-2 shadow-lg shadow-rose-500/20"
                                        >
                                            <ShieldAlert size={16} />
                                            Mark Fraud
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Client Info */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="glass rounded-[2rem] p-8 space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Package className="text-primary" />
                                        Order Items
                                    </h3>
                                    <div className="space-y-4">
                                        {order.items?.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-center p-4 rounded-xl bg-background/50 border border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg">{item.product?.name || "Product"}</span>
                                                    <span className="text-sm text-muted-foreground">{item.billingCycle} - {item.domainName}</span>
                                                </div>
                                                <div className="font-bold text-lg">
                                                    {getCurrencySymbol(settings.defaultCurrency || 'BDT')}{parseFloat(item.amount || item.totalPrice).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                            <span className="text-muted-foreground font-medium">Total Amount</span>
                                            <span className="text-2xl font-bold text-primary">{getCurrencySymbol(settings.defaultCurrency || 'BDT')}{order.totalAmount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Invoices */}
                                {order.invoices && order.invoices.length > 0 && (
                                    <div className="glass rounded-[2rem] p-8 space-y-6">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <FileText className="text-primary" />
                                            Related Invoices
                                        </h3>
                                        <div className="space-y-3">
                                            {order.invoices.map((inv: any) => {
                                                const hasVerifiedTx = inv.transactions?.some((t: any) => t.status === 'SUCCESS' || t.status === 'COMPLETED');
                                                const isPaid = inv.status === 'PAID';

                                                return (
                                                    <div key={inv.id} className="flex flex-col gap-4 p-6 rounded-2xl bg-background/50 border border-white/5 transition-all hover:border-primary/20">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-bold text-lg">Invoice #{inv.invoiceNumber}</span>
                                                                    <Badge variant={isPaid ? 'success' : 'outline'}>{inv.status}</Badge>
                                                                </div>
                                                                <span className="text-sm text-muted-foreground mt-1">
                                                                    Issued: {new Date(inv.createdAt).toLocaleDateString()} | Due: {new Date(inv.dueDate).toLocaleDateString()}
                                                                </span>
                                                                {hasVerifiedTx && (
                                                                    <span className="text-[10px] text-emerald-500 font-bold uppercase mt-2 flex items-center gap-1.5 bg-emerald-500/5 px-2 py-1 rounded-md w-fit border border-emerald-500/10">
                                                                        <CheckCircle size={12} /> Verified Payment Received
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <span className="text-xl font-black text-primary">
                                                                    {getCurrencySymbol(settings.defaultCurrency || 'BDT')}{parseFloat(inv.totalAmount).toFixed(2)}
                                                                </span>
                                                                {isPaid && inv.amountPaid > 0 && (
                                                                    <span className="text-xs text-muted-foreground italic">
                                                                        Paid on {new Date(inv.paidDate).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                                            <Link href={`/admin/billing/${inv.id}`} className="flex-1">
                                                                <Button variant="outline" size="sm" className="w-full text-xs h-9 rounded-xl">
                                                                    <FileText size={14} className="mr-2 opacity-60" />
                                                                    View Details
                                                                </Button>
                                                            </Link>
                                                            {!isPaid && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="flex-1 text-xs h-9 rounded-xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5 hover:text-emerald-400"
                                                                    onClick={() => handleMarkInvoicePaid(inv.id)}
                                                                    disabled={updating}
                                                                >
                                                                    <CheckCircle size={14} className="mr-2" />
                                                                    Mark As Paid
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Transactions */}
                                {order.invoices?.some((inv: any) => inv.transactions?.length > 0) && (
                                    <div className="glass rounded-[2rem] p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <CreditCard className="text-primary" />
                                                Recent Transactions
                                            </h3>
                                            <History size={18} className="text-muted-foreground opacity-50" />
                                        </div>
                                        <div className="space-y-4">
                                            {order.invoices.flatMap((inv: any) =>
                                                (inv.transactions || []).map((tx: any) => (
                                                    <div key={tx.id} className="flex flex-col gap-4 p-5 rounded-2xl bg-background/30 border border-white/5 group hover:border-primary/10 transition-all">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded border border-white/5">#{tx.transactionId || tx.id}</span>
                                                                    <Badge variant={tx.status === 'SUCCESS' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'outline'}>
                                                                        {tx.status}
                                                                    </Badge>
                                                                </div>
                                                                <span className="text-sm font-bold text-foreground/90 mt-1">{tx.gateway} Payment</span>
                                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                                    {new Date(tx.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <span className="text-lg font-black text-emerald-500">
                                                                    {getCurrencySymbol(settings.defaultCurrency || 'BDT')}{parseFloat(tx.amount).toFixed(2)}
                                                                </span>
                                                                {tx.status === 'PENDING' && (
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 px-3 text-[10px] font-bold uppercase tracking-tight rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                                                            onClick={() => handleVerifyTransaction(tx.id, 'APPROVE')}
                                                                            disabled={updating}
                                                                        >
                                                                            <CheckCircle2 size={12} className="mr-1" />
                                                                            Approve
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 px-3 text-[10px] font-bold uppercase tracking-tight rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                                                                            onClick={() => handleVerifyTransaction(tx.id, 'REJECT')}
                                                                            disabled={updating}
                                                                        >
                                                                            <XCircle size={12} className="mr-1" />
                                                                            Reject
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {tx.gatewayResponse?.senderNumber && (
                                                            <div className="text-[10px] font-mono p-2 rounded-lg bg-black/20 text-muted-foreground flex gap-3">
                                                                <span><span className="opacity-50">SENDER:</span> {tx.gatewayResponse.senderNumber}</span>
                                                                {tx.gatewayResponse.trxID && <span><span className="opacity-50">GATEWAY_TRX:</span> {tx.gatewayResponse.trxID}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Info */}
                            <div className="space-y-6">
                                <div className="glass rounded-[2rem] p-8 space-y-4">
                                    <h3 className="text-lg font-bold">Client Information</h3>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-muted-foreground">Name</span>
                                        <span className="font-medium text-lg">{order.client?.user?.firstName} {order.client?.user?.lastName}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-muted-foreground">Email</span>
                                        <span className="font-medium">{order.client?.user?.email}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-muted-foreground">Company</span>
                                        <span className="font-medium">{order.client?.companyName || "N/A"}</span>
                                    </div>
                                    <Link href={`/admin/clients/${order.clientId}`}>
                                        <Button variant="outline" className="w-full mt-4">View Client Profile</Button>
                                    </Link>
                                </div>

                                <div className="glass rounded-[2rem] p-8 space-y-4">
                                    <h3 className="text-lg font-bold">Payment Info</h3>
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="text-muted-foreground" />
                                        <span className="font-medium">{order.paymentMethod || "Manual / None"}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Assuming promo code if exists */}
                                        {order.promoCode && (
                                            <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-sm font-bold">
                                                Using Code: {order.promoCode}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
