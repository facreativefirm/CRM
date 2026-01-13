"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Plus, Trash2, Loader2, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

export default function BannedIpsPage() {
    const { t } = useLanguage();
    const [bans, setBans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [newIp, setNewIp] = useState("");
    const [reason, setReason] = useState("");

    useEffect(() => {
        fetchBans();
    }, []);

    const fetchBans = async () => {
        setLoading(true);
        try {
            const response = await api.get("/security/banned-ips");
            setBans(response.data.data.bans || []);
        } catch (err) {
            console.error("Failed to fetch bans", err);
        } finally {
            setLoading(false);
        }
    };

    const handleBan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIp) return;

        try {
            await api.post("/security/banned-ips", { ipAddress: newIp, reason });
            setNewIp("");
            setReason("");
            fetchBans();
        } catch (err) {
            console.error("Failed to ban IP", err);
        }
    };

    const handleUnban = async (id: number) => {
        setActionLoading(id);
        try {
            await api.delete(`/security/banned-ips/${id}`);
            setBans(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            console.error("Failed to unban IP", err);
        } finally {
            setActionLoading(null);
        }
    };

    const columns = [
        {
            header: "IP Address",
            accessorKey: "ipAddress" as any,
            cell: (item: any) => <span className="font-mono font-bold text-destructive">{item.ipAddress}</span>
        },
        {
            header: "Reason",
            accessorKey: "reason" as any,
        },
        {
            header: "Banned At",
            accessorKey: "bannedAt" as any,
            cell: (item: any) => new Date(item.bannedAt).toLocaleString()
        },
        {
            header: "Expires",
            accessorKey: "expiresAt" as any,
            cell: (item: any) => item.expiresAt ? new Date(item.expiresAt).toLocaleString() : <Badge variant="destructive">Permanent</Badge>
        },
        {
            header: "Actions",
            accessorKey: "id" as any,
            cell: (item: any) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleUnban(item.id)}
                    disabled={actionLoading === item.id}
                >
                    {actionLoading === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
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
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <ShieldAlert className="text-destructive" />
                            IP Ban Manager
                        </h1>
                        <p className="text-muted-foreground">Restrict access to your system from malicious IP addresses.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1">
                        <div className="glass rounded-[2rem] p-6 border border-white/10 shadow-xl">
                            <h3 className="font-bold mb-4">Add New Ban</h3>
                            <form onSubmit={handleBan} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium opacity-70">IP Address</label>
                                    <Input
                                        placeholder="0.0.0.0"
                                        value={newIp}
                                        onChange={(e) => setNewIp(e.target.value)}
                                        className="rounded-xl bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium opacity-70">Reason</label>
                                    <Input
                                        placeholder="e.g. Brute force attempt"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="rounded-xl bg-secondary/30"
                                    />
                                </div>
                                <Button type="submit" className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 bg-destructive hover:bg-destructive/90 text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ban IP
                                </Button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="glass rounded-[2rem] p-6 border border-white/10 shadow-xl overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg">Active Bans</h3>
                                <Button variant="ghost" size="sm" onClick={fetchBans} disabled={loading}>
                                    <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                                    Refresh
                                </Button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                </div>
                            ) : (
                                <DataTable columns={columns} data={bans} />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
