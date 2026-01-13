"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import { Plus, Package, Loader2, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { useSettingsStore } from "@/lib/store/settingsStore";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { ServiceForm } from "@/components/admin/products/ServiceForm";
import { Folder } from "lucide-react";

export default function ProductsPage() {
    const { t } = useLanguage();
    const { formatPrice } = useSettingsStore();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [productSheetOpen, setProductSheetOpen] = useState(false);
    const [serviceSheetOpen, setServiceSheetOpen] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/products");
            setProducts(response.data.data.products || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            // toast.error("Failed to load products"); // Optional: suppress if 404/empty is common initial state
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone and will fail if any active customer services are using it.")) {
            return;
        }

        try {
            await api.delete(`/products/${id}`);
            toast.success("Product deleted successfully");
            fetchProducts();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to delete product");
        }
    };

    const columns = [
        {
            header: t("product_name") || "Product Name",
            accessorKey: "name",
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                        <Package size={20} />
                    </div>
                    <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Tag size={10} /> {item.service?.name || "Uncategorized"}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: t("pricing") || "Pricing",
            accessorKey: "monthlyPrice",
            cell: (item: any) => (
                <div className="flex flex-col">
                    <span className="font-bold">{formatPrice(item.monthlyPrice)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{item.pricingModel}</span>
                </div>
            )
        },
        {
            header: t("stock") || "Stock",
            accessorKey: "stockQuantity",
            cell: (item: any) => item.stockQuantity !== null ? item.stockQuantity : <span className="text-muted-foreground italic">∞</span>
        },
        {
            header: t("status") || "Status",
            accessorKey: "status",
            cell: (item: any) => (
                <Badge variant={item.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {item.status}
                </Badge>
            )
        },
        {
            header: t("actions") || "Actions",
            accessorKey: "id",
            cell: (item: any) => (
                <div className="flex gap-2">
                    <Link href={`/admin/products/${item.id}`}>
                        <Button variant="ghost" size="sm" className="font-bold">{t("manage") || "Manage"}</Button>
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
                            <h1 className="text-3xl font-bold">{t("products") || "Products"}</h1>
                            <p className="text-muted-foreground">{t("product_description") || "Manage your product catalog."}</p>
                        </div>
                        <div className="flex gap-2">
                            <Sheet open={serviceSheetOpen} onOpenChange={setServiceSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Folder size={16} />
                                        Services
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
                                    <SheetHeader>
                                        <SheetTitle>Quick Add Service</SheetTitle>
                                        <SheetDescription>Create a new product service group instantly.</SheetDescription>
                                    </SheetHeader>
                                    <div className="mt-6">
                                        <ServiceForm onSuccess={() => { setServiceSheetOpen(false); fetchProducts(); }} onCancel={() => setServiceSheetOpen(false)} />
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <Sheet open={productSheetOpen} onOpenChange={setProductSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button className="gap-2 shadow-lg shadow-primary/20">
                                        <Plus className="w-4 h-4" />
                                        {t("add_new_product") || "Add Product"}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
                                    <SheetHeader>
                                        <SheetTitle>Add New Product</SheetTitle>
                                        <SheetDescription>Create a new catalog item instantly.</SheetDescription>
                                    </SheetHeader>
                                    <div className="mt-6">
                                        <ProductForm onSuccess={() => { setProductSheetOpen(false); fetchProducts(); }} onCancel={() => setProductSheetOpen(false)} />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    <div className="glass rounded-[2rem] p-6 space-y-6">
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
                        ) : products.length === 0 ? (
                            <EmptyState
                                icon={Package}
                                title={t("no_products_found") || "No Products Found"}
                                description="Your catalog is empty. Start by adding a new product."
                                actionLabel={t("add_new_product") || "Add Product"}
                                onAction={() => window.location.href = '/admin/products/add'}
                            />
                        ) : (
                            <DataTable columns={columns} data={products} />
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
