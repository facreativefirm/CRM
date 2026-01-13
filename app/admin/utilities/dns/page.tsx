"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Network, Loader2, Activity } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

export default function DnsResolverPage() {
    const { t } = useLanguage();
    const [domain, setDomain] = useState("");
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain) return;

        setLoading(true);
        setError(null);
        try {
            const response = await api.post("/system/domain-resolver", { domain });
            if (response.data.data.error) {
                setError(response.data.data.error);
                setRecords([]);
            } else {
                setRecords(response.data.data.records || []);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to resolve domain");
        } finally {
            setLoading(false);
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
                            <Network className="text-primary" />
                            DNS Resolver
                        </h1>
                        <p className="text-muted-foreground">Perform advanced DNS lookups for any hostname.</p>
                    </div>
                </div>

                <div className="glass rounded-[2rem] p-8 shadow-xl border border-white/10">
                    <form onSubmit={handleResolve} className="flex gap-4 max-w-2xl mx-auto mb-10">
                        <div className="relative flex-1">
                            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="Enter hostname (e.g. cloudflare.com)"
                                className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none text-lg shadow-inner"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                            />
                        </div>
                        <Button type="submit" size="lg" className="h-14 px-8 rounded-2xl shadow-lg shadow-primary/20" disabled={loading}>
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
                            Resolve
                        </Button>
                    </form>

                    {error && (
                        <div className="max-w-2xl mx-auto p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-center font-medium">
                            Error: {error}
                        </div>
                    )}

                    {records.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {records.map((record, idx) => (
                                <div key={idx} className="glass p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all flex flex-col gap-3 group">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                                            {record.type}
                                        </Badge>
                                        <span className="text-[10px] opacity-30 font-mono">TTL: {record.ttl || 'N/A'}</span>
                                    </div>
                                    <div className="font-mono text-sm break-all bg-black/20 p-3 rounded-lg group-hover:bg-black/40 transition-colors">
                                        {record.value || record.address || record.ns || record.exchange || JSON.stringify(record)}
                                    </div>
                                    {record.priority && (
                                        <span className="text-xs opacity-50">Priority: {record.priority}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {records.length === 0 && !loading && !error && domain && (
                        <div className="text-center py-20 text-muted-foreground italic">
                            No DNS records found for this hostname.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
