"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, MoreHorizontal, User, Mail, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import Link from "next/link";
import { Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminClientsPage() {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState("");
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchClients();
        console.log(clients);
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await api.get("/clients");
            setClients(response.data.data.clients || []);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching clients:", err);
            setError(err.response?.data?.message || "Failed to load clients");
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client =>
        searchTerm === "" ||
        client.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            header: t("client_name"),
            accessorKey: "user.firstName" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                        {item.user?.firstName?.[0] || '?'}{item.user?.lastName?.[0] || '?'}
                    </div>
                    <div>
                        <p className="font-bold">{item.user?.firstName} {item.user?.lastName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.companyName || 'No company'}</p>
                    </div>
                </div>
            )
        },
        {
            header: t("contact"),
            accessorKey: "user.email" as any,
            cell: (item: any) => (
                <div className="flex flex-col text-sm font-medium">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-primary/50" /> {item.user?.email}
                    </span>
                </div>
            )
        },
        {
            header: t("status"),
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge variant={item.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {t(item.status?.toLowerCase()) || item.status}
                </Badge>
            )
        },
        {
            header: t("created"),
            accessorKey: "createdAt" as any,
            cell: (item: any) => new Date(item.createdAt).toLocaleDateString()
        },
        {
            header: t("actions"),
            accessorKey: "id" as any,
            cell: (item: any) => (
                <div className="flex gap-2">
                    <Link href={`/admin/clients/${item.id}`}>
                        <Button variant="ghost" size="sm" className="font-bold">{t("view_profile")}</Button>
                    </Link>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <Sidebar />
            <main className="lg:pl-75 pt-20 p-4 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Client <span className="text-primary">Directory</span>
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium">{t("client_base_management")}</p>
                    </div>
                    <Link href="/admin/clients/add" className="w-full md:w-auto">
                        <Button className="h-12 px-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 w-full md:w-auto">
                            <Plus className="w-4 h-4" />
                            {t("add_new_client")}
                        </Button>
                    </Link>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={t("search_clients_placeholder")}
                                className="pl-12 h-12 bg-secondary/20 border-border rounded-xl font-medium focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="outline" className="h-12 rounded-xl bg-secondary/30 border-border font-bold gap-2 flex-1 md:flex-none">
                                <Filter className="w-4 h-4" />
                                {t("filter")}
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
                    ) : error ? (
                        <div className="text-center py-12 text-destructive">
                            <p className="font-bold mb-4">{error}</p>
                            <Button onClick={fetchClients} variant="outline" className="rounded-xl border-destructive/50 hover:bg-destructive/10">{t("retry")}</Button>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <EmptyState
                            icon={User}
                            title={t("no_clients_found") || "No clients found."}
                            description={t("client_base_management") || "You don't have any clients registered in the system yet."}
                            actionLabel={t("add_new_client")}
                            onAction={() => window.location.href = '/admin/clients/add'}
                        />
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <DataTable columns={columns} data={filteredClients} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
