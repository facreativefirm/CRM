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
    Calendar,
    Server,
    Mail,
    Clock,
    AlertTriangle,
    Search,
    MessageCircle,
    Filter,
    RefreshCw,
    ExternalLink
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ExpiringServicesPage() {
    const { t } = useLanguage();
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDays, setFilterDays] = useState(30);

    const fetchExpiringServices = async () => {
        setLoading(true);
        try {
            // We fetch all services and filter client-side for "Expiring"
            const response = await api.get("/services");
            const allServices = response.data.data.services || [];

            const now = new Date();
            const threshold = new Date();
            threshold.setDate(now.getDate() + 60); // View up to 60 days ahead

            const expiring = allServices.filter((s: any) => {
                if (!s.nextDueDate) return false;
                const dueDate = new Date(s.nextDueDate);
                return dueDate >= now && dueDate <= threshold && s.status === 'ACTIVE';
            });

            // Sort by due date ASC
            expiring.sort((a: any, b: any) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());

            setServices(expiring);
        } catch (error) {
            console.error("Failed to load services:", error);
            toast.error("Failed to load expiring services");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpiringServices();
    }, []);

    const handleNotify = async (id: number) => {
        try {
            await api.post(`/services/${id}/notify`);
            toast.success("Renewal invoice created and reminder sent!");
        } catch (error) {
            console.error("Failed to send notification:", error);
            toast.error("Failed to send reminder");
        }
    };

    const handleWhatsAppNotify = (item: any) => {
        const clientName = item.client?.user?.firstName || "Customer";
        const serviceName = item.product?.name || "Service";
        const daysLeft = Math.ceil((new Date(item.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const dueAmount = formatPrice(item.amount);
        let phoneNumber = item.client?.user?.phoneNumber || item.client?.phoneNumber || "";

        if (!phoneNumber) {
            toast.error("Client phone number not found");
            return;
        }

        let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
        if (!cleanPhone.startsWith('+')) {
            if (cleanPhone.startsWith('880')) cleanPhone = '+' + cleanPhone;
            else if (cleanPhone.startsWith('0')) cleanPhone = '+88' + cleanPhone;
            else cleanPhone = '+880' + cleanPhone;
        }

        const finalPhone = cleanPhone.replace('+', '');
        const message = `প্রিয় ${clientName}, আপনার ${serviceName} সেবার মেয়াদ শীঘ্রই শেষ হবে। আর মাত্র ${daysLeft} দিন বাকি। বকেয়া পরিমাণ ${dueAmount}। দয়া করে দ্রুত পেমেন্ট করুন।`;

        window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const columns = [
        {
            header: "Product / Service",
            accessorKey: "product.name" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Server size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-tight">{item.product?.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                            {item.domain || "Internal Assets"}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: "Client",
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
            header: "Days Until Due",
            accessorKey: "nextDueDate" as any,
            cell: (item: any) => {
                const daysLeft = Math.ceil((new Date(item.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isCritical = daysLeft < 7;
                const isWarning = daysLeft < 15;

                return (
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={isCritical ? "destructive" : isWarning ? "warning" : "secondary"}
                            className="font-black px-2 py-1 uppercase text-[9px] tracking-widest"
                        >
                            {daysLeft} Days Left
                        </Badge>
                        <p className="text-[10px] text-muted-foreground font-bold">
                            {new Date(item.nextDueDate).toLocaleDateString()}
                        </p>
                    </div>
                );
            }
        },
        {
            header: "Billing",
            accessorKey: "amount" as any,
            cell: (item: any) => (
                <div className="text-right pr-4">
                    <p className="font-black text-sm">{formatPrice(item.amount)}</p>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-muted-foreground/30 text-muted-foreground py-0 h-4">
                        {item.billingCycle}
                    </Badge>
                </div>
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
            header: "Quick Actions",
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
                    <Button
                        onClick={() => handleWhatsAppNotify(item)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-emerald-500 hover:text-white rounded-lg"
                        title="WhatsApp Reminder"
                    >
                        <MessageCircle size={14} />
                    </Button>
                    <Link href={`/admin/services/${item.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-secondary rounded-lg">
                            <ExternalLink size={14} />
                        </Button>
                    </Link>
                </div>
            )
        }
    ];

    const filteredServices = services.filter(service =>
        searchTerm === "" ||
        service.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.client?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.client?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "STAFF"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8 space-y-8">
                    {/* Premium Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                Service <span className="text-amber-500">Expirations</span>
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium">Automatic renewal tracking and notification engine.</p>
                        </div>
                        <Button
                            onClick={fetchExpiringServices}
                            variant="outline"
                            className="h-12 px-6 rounded-xl font-bold bg-secondary/30 hover:bg-secondary/50 shadow-sm gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh List
                        </Button>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                label: "Critical", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", count: services.filter(s => {
                                    const days = Math.ceil((new Date(s.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return days < 7;
                                }).length
                            },
                            {
                                label: "Warning", icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10", count: services.filter(s => {
                                    const days = Math.ceil((new Date(s.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return days >= 7 && days < 15;
                                }).length
                            },
                            { label: "Monthly", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10", count: services.filter(s => s.billingCycle === 'monthly').length },
                            { label: "Annual", icon: RefreshCw, color: "text-emerald-500", bg: "bg-emerald-500/10", count: services.filter(s => s.billingCycle === 'annually').length },
                        ].map((stat, i) => (
                            <div key={i} className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-black">{stat.count}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={18} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-6 shadow-sm overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search expiring services..."
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
                        ) : filteredServices.length === 0 ? (
                            <EmptyState
                                icon={Clock}
                                title="No Expiring Services"
                                description="There are no active services expiring within the next 60 days matching your search."
                                actionLabel="View All Services"
                                onAction={() => window.location.href = '/admin/services'}
                            />
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-auto">
                                <DataTable columns={columns} data={filteredServices} />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
