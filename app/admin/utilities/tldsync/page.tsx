"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutGrid, DollarSign, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/shared/Badge";

export default function TldSyncPage() {
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const response = await api.post("/system/sync-tlds");
            toast.success(response.data.message);
            setLastSync(new Date().toLocaleString());
        } catch (err) {
            toast.error("Failed to sync TLD pricing");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <Sidebar />
            <main className="pl-75 pt-6 p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <RefreshCw className="text-emerald-500" />
                            Registrar TLD Sync
                        </h1>
                        <p className="text-muted-foreground">Synchronize TLD pricing and features with your domain registrars.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass rounded-[2rem] p-8 border border-white/10 shadow-xl space-y-6 text-center">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <RefreshCw className={cn("w-10 h-10 text-emerald-500", syncing && "animate-spin")} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Manual Sync</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Trigger an immediate fetch of TLD registration, renewal, and transfer pricing.
                                </p>
                            </div>
                            <Button
                                onClick={handleSync}
                                disabled={syncing}
                                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            >
                                {syncing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                                Sync Prices Now
                            </Button>
                            {lastSync && (
                                <p className="text-[10px] opacity-50 flex items-center justify-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    Last synced: {lastSync}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="glass rounded-[2rem] p-8 border border-white/10 shadow-xl overflow-hidden h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold">Sync Configuration</h3>
                                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20">Automatic Sync: Enabled</Badge>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-6 p-6 rounded-2xl bg-secondary/20 border border-white/5 transition-colors hover:bg-secondary/30">
                                    <div className="p-4 rounded-xl bg-blue-500/10">
                                        <LayoutGrid className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold">Sync Extensions</h4>
                                        <p className="text-sm text-muted-foreground italic">.com, .net, .org, .info, .biz, .us, .io, .me</p>
                                    </div>
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </div>

                                <div className="flex items-center gap-6 p-6 rounded-2xl bg-secondary/20 border border-white/5 transition-colors hover:bg-secondary/30">
                                    <div className="p-4 rounded-xl bg-amber-500/10">
                                        <DollarSign className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold">Profit Margin (Markup)</h4>
                                        <p className="text-sm text-muted-foreground">Current: 15% override on registrar costs.</p>
                                    </div>
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Fixed missing import for 'cn' in this file manually to avoid lint later
import { cn } from "@/lib/utils";
