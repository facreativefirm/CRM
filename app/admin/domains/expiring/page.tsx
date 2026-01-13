"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import {
    Bell,
    Globe,
    Mail,
    Clock,
    AlertTriangle,
    Search,
    Filter,
    RefreshCw,
    ExternalLink,
    ShieldCheck
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ExpiringDomainsPage() {
    const { t } = useLanguage();
    const [domains, setDomains] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [notifyingAll, setNotifyingAll] = useState(false);

    const fetchExpiringDomains = async () => {
        setLoading(true);
        try {
            const response = await api.get("/domains/expiring?days=60");
            const data = response.data.data.domains || [];
            // Sort by expiry date ASC
            data.sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
            setDomains(data);
        } catch (error) {
            console.error("Failed to load domains:", error);
            toast.error("Failed to load expiring domains");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpiringDomains();
    }, []);

    const handleNotify = async (id: number) => {
        try {
            await api.post(`/domains/${id}/notify`);
            toast.success("Renewal invoice created and reminder sent!");
        } catch (error) {
            console.error("Failed to send notification:", error);
            toast.error("Failed to send reminder");
        }
    };

    const handleNotifyAll = async () => {
        if (domains.length === 0) return;
        setNotifyingAll(true);
        try {
            await api.post("/domains/notify-all");
            toast.success("Bulk notifications triggered successfully");
        } catch (error) {
            console.error("Failed to send bulk notifications:", error);
            toast.error("Failed to send bulk reminders");
        } finally {
            setNotifyingAll(false);
        }
    };

    const columns = [
        {
            header: "Domain Asset",
            accessorKey: "domainName" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                        <Globe size={18} />
                    </div>
                    <div>
                        <p className="font-mono font-bold text-sm leading-tight text-amber-600 dark:text-amber-400">{item.domainName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                            {item.registrar || "System Registrar"}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: "Owner",
            accessorKey: "client.user.firstName" as any,
            cell: (item: any) => (
                <Link href={`/admin/clients/${item.clientId}`} className="group block">
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">
                        {item.client?.user?.firstName} {item.client?.user?.lastName}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                        {item.client?.user?.email}
                    </p>
                </Link>
            )
        },
        {
            header: "Time Remaining",
            accessorKey: "expiryDate" as any,
            cell: (item: any) => {
                const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isCritical = daysLeft < 7;
                const isWarning = daysLeft < 30;

                return (
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={isCritical ? "destructive" : isWarning ? "warning" : "secondary"}
                            className="font-black px-2 py-1 uppercase text-[9px] tracking-widest"
                        >
                            {daysLeft} Days
                        </Badge>
                        <div className="hidden sm:block">
                            <p className="text-[10px] text-muted-foreground font-bold">
                                {new Date(item.expiryDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Auto-Renew",
            accessorKey: "autoRenew" as any,
            cell: (item: any) => (
                <Badge variant={item.autoRenew ? "success" : "secondary"} className="text-[8px] font-black uppercase tracking-tighter py-0 h-5">
                    {item.autoRenew ? "Enabled" : "Disabled"}
                </Badge>
            )
        },
        {
            header: "Last Notified",
            accessorKey: "expiryNotificationRecords" as any,
            cell: (item: any) => {
                const lastRecord = item.expiryNotificationRecords?.[0];
                if (!lastRecord) return <span className="text-xs text-muted-foreground">-</span>;

                const isManual = lastRecord.notificationType === 'MANUAL_EXPIRY_WARNING';
                return (
                    <div>
                        <p className="text-[10px] font-bold">
                            {new Date(lastRecord.sentAt).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className={`text-[8px] px-1 py-0 h-4 ${isManual ? 'text-blue-500 border-blue-500/30' : 'text-amber-500 border-amber-500/30'}`}>
                            {isManual ? 'MANUAL' : 'AUTO'}
                        </Badge>
                    </div>
                );
            }
        },
        {
            header: "Actions",
            accessorKey: "id" as any,
            cell: (item: any) => (
                <div className="flex gap-2">
                    <Button
                        onClick={() => handleNotify(item.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary hover:text-white rounded-lg"
                        title="Send Renewal Invoice"
                    >
                        <Mail size={14} />
                    </Button>
                    <Link href={`/admin/domains/${item.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-secondary rounded-lg">
                            <ExternalLink size={14} />
                        </Button>
                    </Link>
                </div>
            )
        }
    ];

    const filteredDomains = domains.filter(domain =>
        searchTerm === "" ||
        domain.domainName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.client?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.client?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "STAFF"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8 space-y-8">
                    {/* Header section */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                Domain <span className="text-primary">Expirations</span>
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium">Prevent asset loss with proactive renewal management.</p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Button
                                onClick={handleNotifyAll}
                                disabled={notifyingAll || domains.length === 0}
                                className="h-12 px-6 rounded-xl font-bold bg-primary text-primary-foreground shadow-md gap-2 flex-1 md:flex-none"
                            >
                                {notifyingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Broadcast All
                            </Button>
                        </div>
                    </div>

                    {/* Quick Overview Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                label: "Critical (< 7d)", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", count: domains.filter(d => {
                                    const days = Math.ceil((new Date(d.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return days < 7;
                                }).length
                            },
                            {
                                label: "Pending (< 30d)", icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10", count: domains.filter(d => {
                                    const days = Math.ceil((new Date(d.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return days >= 7 && days < 30;
                                }).length
                            },
                            { label: "Total Assets", icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10", count: domains.length },
                            {
                                label: "Registry Safe", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", count: domains.filter(d => {
                                    const days = Math.ceil((new Date(d.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return days > 30;
                                }).length
                            },
                        ].map((stat, i) => (
                            <div key={i} className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-bold tracking-tight">{stat.count}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={18} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Table Container */}
                    <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-6 shadow-sm overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search domain assets..."
                                    className="pl-12 h-12 bg-secondary/20 border-border rounded-xl font-medium focus:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button variant="outline" className="h-12 rounded-xl bg-secondary/30 border-border font-bold gap-2 flex-1 md:flex-none">
                                    <Filter className="w-4 h-4" />
                                    Filter
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex gap-4 p-4 items-center bg-white/5 rounded-2xl border border-white/5">
                                        <Skeleton className="w-12 h-12 rounded-xl" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-1/4" />
                                            <Skeleton className="h-3 w-1/6" />
                                        </div>
                                        <Skeleton className="h-8 w-24 rounded-lg" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredDomains.length === 0 ? (
                            <EmptyState
                                icon={Globe}
                                title="No Expiring Domains"
                                description="Your domain assets are either all healthy or no results match your current search criteria."
                                actionLabel="View Active Domains"
                                onAction={() => window.location.href = '/admin/domains'}
                            />
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-auto">
                                <DataTable columns={columns} data={filteredDomains} />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
