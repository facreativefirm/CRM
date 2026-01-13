"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";
import { DataTable } from "@/components/shared/DataTable";
import { Navbar } from "@/components/layout/Navbar";
import {
    Search,
    Globe,
    Settings,
    Clock,
    User,
    ArrowUpRight,
    ExternalLink,
    Shield,
    Calendar,
    LayoutGrid
} from "lucide-react";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSettingsStore } from "@/lib/store/settingsStore";
import Link from "next/link";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { DomainForm } from "@/components/admin/domains/DomainForm";
import { Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
// import { format } from "date-fns";

export default function DomainListPage() {
    const { t } = useLanguage();
    const { formatPrice } = useSettingsStore();
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [domainSheetOpen, setDomainSheetOpen] = useState(false);
    const [editingDomain, setEditingDomain] = useState<any>(null);

    const fetchDomains = async () => {
        setLoading(true);
        try {
            const response = await api.get("/domains");
            setDomains(response.data.data.domains);
        } catch (error) {
            toast.error("Failed to load domains");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, []);

    const handleEdit = (domain: any) => {
        setEditingDomain(domain);
        setDomainSheetOpen(true);
    };

    const handleAdd = () => {
        setEditingDomain(null);
        setDomainSheetOpen(true);
    };

    const filteredDomains = domains.filter((d: any) =>
        d.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.client?.user?.firstName + " " + d.client?.user?.lastName).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'EXPIRED': return 'destructive';
            case 'PENDING': return 'warning';
            default: return 'secondary';
        }
    };

    const columns = [
        {
            header: "Domain Name",
            accessorKey: "domainName",
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                        <Globe size={18} />
                    </div>
                    <div>
                        <span className="font-mono font-black text-base tracking-tight">{item.domainName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{item.registrar || "Manual"}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: "Owner",
            accessorKey: "client",
            cell: (item: any) => (
                <Link href={`/admin/clients/${item.clientId}`} className="group inline-flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-secondary/30 group-hover:bg-primary/20 transition-colors">
                        <User size={12} />
                    </div>
                    <div className="text-sm">
                        <p className="font-bold tracking-tight leading-none group-hover:text-primary transition-colors">
                            {item.client?.user?.firstName} {item.client?.user?.lastName}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-black tracking-widest">{item.client?.companyName || "Personal"}</p>
                    </div>
                </Link>
            )
        },
        {
            header: "Expiry Date",
            accessorKey: "expiryDate",
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    <div>
                        <span className="text-xs font-bold font-mono">
                            {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            {new Date(item.expiryDate) < new Date() ? "OVERDUE" : "DUE IN 2 MONTHS"}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (item: any) => (
                <Badge variant={getStatusVariant(item.status)} className="font-black text-[10px] tracking-[0.1em] uppercase py-1 px-3">
                    {item.status}
                </Badge>
            )
        },
        {
            header: "Actions",
            accessorKey: "id",
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => handleEdit(item)}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-primary/20 hover:text-primary transition-all"
                    >
                        <Settings size={16} />
                    </Button>
                    <a href={`http://${item.domainName}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary/40 transition-all">
                            <ArrowUpRight size={16} />
                        </Button>
                    </a>
                </div>
            )
        }
    ];

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8 space-y-8">
                    {/* Header section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold">Domain Registry</h1>
                            <p className="text-muted-foreground">Oversee and manage your global domain assets, renewal tracking, and registrar status.</p>
                        </div>

                        <div className="flex gap-2">
                            <Link href="/admin/domains/tlds">
                                <Button variant="outline" className="gap-2">
                                    <Settings size={16} />
                                    Extensions
                                </Button>
                            </Link>
                            <Button
                                onClick={handleAdd}
                                className="gap-2 shadow-lg shadow-primary/20"
                            >
                                <Globe size={16} />
                                Register Portfolio
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: "Total Assets", value: domains.length, icon: Globe, color: "text-blue-500" },
                            { label: "Expiring 30d", value: domains.filter((d: any) => d.status === 'EXPIRED').length, icon: Clock, color: "text-amber-500" },
                            { label: "Pending Setup", value: domains.filter((d: any) => d.status === 'PENDING').length, icon: Calendar, color: "text-purple-500" },
                            { label: "Revenue Share", value: formatPrice(1240), icon: ArrowUpRight, color: "text-emerald-500" },
                        ].map((stat, i) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                key={stat.label}
                                className="bg-card/40 border border-white/5 p-8 rounded-[2rem] backdrop-blur-md relative overflow-hidden group hover:bg-card/60 transition-colors"
                            >
                                <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
                                    <stat.icon size={112} />
                                </div>
                                <div className="space-y-1 relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">{stat.label}</p>
                                    <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Data Table section */}
                    <div className="glass rounded-[2rem] p-6 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="relative flex-1 max-w-xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                                <Input
                                    placeholder="Search by domain, client or registrar..."
                                    className="pl-12 h-12 bg-secondary/20 border-border/50 rounded-xl font-bold focus-visible:ring-primary/40 focus-visible:bg-secondary/40 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <select className="h-12 px-4 rounded-xl bg-secondary/20 border-border/50 font-bold text-xs outline-none focus:ring-2 ring-primary/20">
                                    <option>All Statuses</option>
                                    <option>Active</option>
                                    <option>Expired</option>
                                    <option>Pending</option>
                                </select>
                                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-border/50">
                                    <ExternalLink size={18} className="opacity-50" />
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
                                title="No domain records"
                                description="Your domain registry is currently empty. Start by registering your first domain."
                                actionLabel="Register Domain"
                                onAction={handleAdd}
                            />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredDomains}
                            />
                        )}
                    </div>

                    <Sheet open={domainSheetOpen} onOpenChange={setDomainSheetOpen}>
                        <SheetContent side="right" className="sm:max-w-4xl overflow-y-auto">
                            <SheetHeader className="mb-8">
                                <SheetTitle className="text-3xl font-black">
                                    {editingDomain ? "Manage Domain Asset" : "Register Domain Portfolio"}
                                </SheetTitle>
                                <SheetDescription className="text-lg">
                                    {editingDomain ? `Updating configuration for ${editingDomain.domainName}` : "Provision new domain assets for your clients efficiently."}
                                </SheetDescription>
                            </SheetHeader>
                            <DomainForm
                                initialData={editingDomain}
                                onSuccess={() => {
                                    setDomainSheetOpen(false);
                                    fetchDomains();
                                }}
                                onCancel={() => setDomainSheetOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>
                </main>
            </div >
        </AuthGuard >
    );
}
