"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Folder, Loader2, Trash2, CornerDownRight } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";

export default function ServicesPage() {
    const { t } = useLanguage();
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await api.get("/products/services");

            // Flatten the tree for display
            const flatten = (cats: any[], depth = 0): any[] => {
                let flat: any[] = [];
                cats.forEach(cat => {
                    flat.push({ ...cat, depth });
                    if (cat.subServices && cat.subServices.length > 0) {
                        flat = [...flat, ...flatten(cat.subServices, depth + 1)];
                    }
                });
                return flat;
            };

            setServices(flatten(response.data.data.services || []));
        } catch (error) {
            console.error("Error fetching services:", error);
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this service? Any assigned products will be automatically moved to a 'General' service group.")) {
            return;
        }

        try {
            await api.delete(`/products/services/${id}`);
            toast.success("Service deleted");
            fetchServices();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to delete service");
        }
    };

    const columns = [
        {
            header: t("service_name") || "Service Name",
            accessorKey: "name",
            cell: (item: any) => (
                <div className="flex items-center gap-3" style={{ paddingLeft: `${(item.depth || 0) * 32}px` }}>
                    {item.depth > 0 && <CornerDownRight size={16} className="text-muted-foreground/40 -ml-4" />}
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Folder size={16} />
                    </div>
                    <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.slug}</p>
                    </div>
                </div>
            )
        },
        {
            header: "Product Count",

            accessorKey: "products",
            cell: (item: any) => (
                <span className="font-medium text-muted-foreground">
                    {item?.products?.length || 0} Products
                </span>
            )
        },
        {
            header: t("actions") || "Actions",
            accessorKey: "id",
            cell: (item: any) => (
                <div className="flex gap-2">
                    <Link href={`/admin/products/services/${item.id}`}>
                        <Button variant="ghost" size="sm">{t("manage") || "Manage"}</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 size={16} />
                    </Button>
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">{t("services") || "Services"}</h1>
                            <p className="text-muted-foreground">{t("service_description") || "Manage your product service groups."}</p>
                        </div>
                        <Link href="/admin/products/services/add">
                            <Button className="gap-2 shadow-lg shadow-primary/20">
                                <Plus className="w-4 h-4" />
                                {t("add_service") || "Add Service"}
                            </Button>
                        </Link>
                    </div>

                    <div className="glass rounded-[2rem] p-6 space-y-6">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-4 p-4 items-center bg-white/5 rounded-2xl border border-white/5">
                                        <Skeleton className="w-12 h-12 rounded-xl" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-1/4" />
                                            <Skeleton className="h-3 w-1/6" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : services.length === 0 ? (
                            <EmptyState
                                icon={Folder}
                                title="No Services Found"
                                description="Start by creating your first service group."
                                actionLabel={t("add_service") || "Add Service"}
                                onAction={() => window.location.href = '/admin/products/services/add'}
                            />
                        ) : (
                            <DataTable columns={columns} data={services} />
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
