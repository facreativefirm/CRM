"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import {
    RefreshCcw,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    UserCheck,
    AlertCircle,
    Clock,
    History
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useSettingsStore } from "@/lib/store/settingsStore";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";

export function RefundQueue() {
    const { t } = useLanguage();
    const { formatPrice } = useSettingsStore();
    const { user } = useAuthStore();
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRefunds();
    }, []);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const response = await api.get("/finance/refunds");
            if (response.data.status === 'success') {
                setRefunds(response.data.data.refunds);
            }
        } catch (err) {
            toast.error("Failed to load refund queue");
        } finally {
            setLoading(false);
        }
    };

    const handleAuthorize = async (id: number) => {
        try {
            await api.post(`/finance/refunds/${id}/authorize`);
            toast.success("Refund authorized. Pending final approval.");
            fetchRefunds();
        } catch (err) {
            toast.error("Failed to authorize refund");
        }
    };

    const handleApprove = async (id: number, action: 'APPROVE' | 'REJECT') => {
        const reason = action === 'REJECT' ? prompt("Reason for rejection:") : null;
        if (action === 'REJECT' && !reason) return;

        try {
            await api.post(`/finance/refunds/${id}/approve`, { action, rejectionReason: reason });
            toast.success(`Refund ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`);
            fetchRefunds();
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to ${action.toLowerCase()} refund`);
        }
    };

    const columns = [
        {
            header: "ID",
            accessorKey: "id",
            cell: (item: any) => <span className="font-bold">#REF-{item.id}</span>
        },
        {
            header: "Target",
            accessorKey: "transactionId",
            cell: (item: any) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-mono opacity-60">#{item.transaction?.transactionId || item.transaction?.id}</span>
                    <Link href={`/admin/billing/${item.transaction?.invoiceId}`} className="text-primary hover:underline font-medium">
                        INV #{item.transaction?.invoice?.invoiceNumber}
                    </Link>
                </div>
            )
        },
        {
            header: "Client",
            accessorKey: "client",
            cell: (item: any) => {
                const client = item.transaction?.invoice?.client;
                return client?.companyName || `${client?.user?.firstName} ${client?.user?.lastName}`;
            }
        },
        {
            header: "Refund Amount",
            accessorKey: "amount",
            cell: (item: any) => <span className="font-black text-rose-500">{formatPrice(item.amount)}</span>
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (item: any) => (
                <Badge variant={
                    item.status === 'COMPLETED' ? 'success' :
                        item.status === 'REJECTED' ? 'destructive' :
                            item.status === 'PENDING_APPROVAL' ? 'warning' : 'default'
                }
                    className="gap-1"
                >
                    {item.status === 'PENDING_AUTHORIZATION' && <RefreshCcw size={10} className="animate-spin" />}
                    {item.status === 'PENDING_APPROVAL' && <ShieldCheck size={10} />}
                    {item.status === 'COMPLETED' && <CheckCircle2 size={10} />}
                    {item.status === 'REJECTED' && <XCircle size={10} />}
                    {item.status.replace('_', ' ')}
                </Badge>
            )
        },
        {
            header: "Workflow",
            accessorKey: "workflow",
            cell: (item: any) => (
                <div className="flex flex-col gap-1 text-[10px]">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.requestedBy ? 'bg-emerald-500' : 'bg-secondary'}`} />
                        <span className="opacity-60">Req:</span>
                        <span className="font-bold">{item.requestedBy?.username || item.requestedBy?.firstName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.authorizedBy ? 'bg-emerald-500' : 'bg-secondary'}`} />
                        <span className="opacity-60">Auth:</span>
                        <span className="font-bold">{item.authorizedBy?.username || item.authorizedBy?.firstName || 'Pending'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.approvedBy ? 'bg-emerald-500' : 'bg-secondary'}`} />
                        <span className="opacity-60">Appr:</span>
                        <span className="font-bold">{item.approvedBy?.username || item.approvedBy?.firstName || 'Pending'}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Actions",
            accessorKey: "actions",
            cell: (item: any) => {
                const canAuthorize = user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN';
                const canApprove = user?.userType === 'SUPER_ADMIN';

                return (
                    <div className="flex items-center gap-2">
                        {item.status === 'PENDING_AUTHORIZATION' && canAuthorize && (
                            <Button
                                size="sm"
                                onClick={() => handleAuthorize(item.id)}
                                className="h-8 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest gap-2"
                            >
                                <UserCheck size={14} />
                                Authorize
                            </Button>
                        )}
                        {item.status === 'PENDING_APPROVAL' && canApprove && (
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    onClick={() => handleApprove(item.id, 'APPROVE')}
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest gap-2"
                                >
                                    <CheckCircle2 size={14} />
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleApprove(item.id, 'REJECT')}
                                    className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2"
                                >
                                    <XCircle size={14} />
                                    Reject
                                </Button>
                            </div>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-3xl p-6 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">Pending Requests</p>
                        <h3 className="text-2xl font-black">{refunds.filter(r => r.status.includes('PENDING')).length}</h3>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-3xl p-6 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">Processed Today</p>
                        <h3 className="text-2xl font-black">{refunds.filter(r => r.status === 'COMPLETED' && new Date(r.updatedAt).toDateString() === new Date().toDateString()).length}</h3>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-3xl p-6 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                        <History size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">Total Value</p>
                        <h3 className="text-2xl font-black">{formatPrice(refunds.filter(r => r.status === 'COMPLETED').reduce((acc, curr) => acc + parseFloat(curr.amount), 0))}</h3>
                    </div>
                </div>
            </div>

            <div className="glass rounded-[2rem] p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Refund Operations Queue</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchRefunds}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCcw className={loading ? "animate-spin" : ""} size={14} />
                        Sync Registry
                    </Button>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <RefreshCcw className="w-10 h-10 animate-spin text-primary opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Refund Ledger</span>
                    </div>
                ) : refunds.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-secondary/5">
                        <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">The queue is currently empty</h3>
                    </div>
                ) : (
                    <DataTable columns={columns} data={refunds} pagination={true} />
                )}
            </div>
        </div>
    );
}
