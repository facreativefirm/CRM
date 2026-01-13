"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Save, Trash2, Folder, Package, Settings, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ServiceSelector } from "@/components/shared/ServiceSelector";

export default function EditServicePage() {
    const { t } = useLanguage();
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [category, setCategory] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        displayOrder: 0,
        iconClass: "",
        parentServiceId: ""
    });

    useEffect(() => {
        fetchCategory();
    }, [params.id]);

    const fetchCategory = async () => {
        try {
            setIsFetching(true);
            const response = await api.get(`/products/services/${params.id}`);
            const cat = response.data.data.service;
            setCategory(cat);
            setFormData({
                name: cat.name,
                slug: cat.slug,
                description: cat.description || "",
                displayOrder: cat.displayOrder || 0,
                iconClass: cat.iconClass || "",
                parentServiceId: cat.parentServiceId ? cat.parentServiceId.toString() : ""
            });
        } catch (error) {
            console.error("Error fetching category:", error);
            toast.error("Failed to load service details");
            router.push("/admin/products/services");
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                parentServiceId: formData.parentServiceId ? parseInt(formData.parentServiceId) : null
            };
            await api.patch(`/products/services/${params.id}`, payload);
            toast.success("Service updated successfully");
            fetchCategory(); // Refresh data
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update service");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this service? Any assigned products will be automatically moved to a 'General' service group to preserve your data.")) {
            return;
        }

        try {
            setIsLoading(true);
            await api.delete(`/products/services/${params.id}`);
            toast.success("Service deleted");
            router.push("/admin/products/services");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to delete service");
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }


    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-0 md:pl-75 pt-20 p-8 flex justify-center">
                    <div className="w-full max-w-5xl space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/admin/products/services">
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/50">
                                        <ArrowLeft size={20} />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-bold flex items-center gap-3">
                                        <Folder className="text-primary" />
                                        {category.name}
                                    </h1>
                                    <p className="text-muted-foreground">Service Settings & Products</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 border-destructive/20 h-11 px-6">
                                    <Trash2 size={18} className="mr-2" />
                                    Delete
                                </Button>
                                <Button onClick={handleSubmit} disabled={isLoading} className="shadow-lg shadow-primary/20 h-11 px-8">
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                    Save Service
                                </Button>
                            </div>
                        </div>

                        <div className="glass rounded-[2rem] p-8 border border-white/5">
                            <Tabs defaultValue="details" className="w-full">
                                <TabsList className="mb-8 w-full justify-start bg-secondary/20 p-1 rounded-xl h-auto">
                                    <TabsTrigger value="details" className="gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Settings size={16} /> Details
                                    </TabsTrigger>
                                    <TabsTrigger value="products" className="gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Package size={16} /> Products ({category.products?.length || 0})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="details" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Service Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="bg-background/50 h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="slug">Slug (URL)</Label>
                                            <Input
                                                id="slug"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                required
                                                className="bg-background/50 h-11 font-mono text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="displayOrder">Display Order</Label>
                                            <Input
                                                id="displayOrder"
                                                type="number"
                                                value={formData.displayOrder}
                                                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                                                className="bg-background/50 h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="iconClass">Icon Class (optional)</Label>
                                            <Input
                                                id="iconClass"
                                                value={formData.iconClass}
                                                onChange={(e) => setFormData({ ...formData, iconClass: e.target.value })}
                                                placeholder="e.g. fas fa-server"
                                                className="bg-background/50 h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Parent Service (Optional)</Label>
                                            <ServiceSelector
                                                value={formData.parentServiceId}
                                                onChange={(val) => setFormData({ ...formData, parentServiceId: val })}
                                                excludeId={params.id as string}
                                            />
                                            <p className="text-xs text-muted-foreground">Select a parent if this is a sub-service.</p>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="bg-background/50 min-h-[150px]"
                                                placeholder="Optional HTML allowed for category header..."
                                            />
                                        </div>
                                    </form>
                                </TabsContent>

                                <TabsContent value="products" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold">Assigned Products</h3>
                                            <Link href={`/admin/products/add?serviceId=${params.id}`}>
                                                <Button size="sm" variant="outline" className="gap-2">
                                                    <Plus className="w-4 h-4" />
                                                    New Product in this Service Group
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {(category.products || []).length === 0 ? (
                                                <div className="p-8 text-center border border-dashed rounded-2xl text-muted-foreground">
                                                    No products assigned to this service group yet.
                                                </div>
                                            ) : (
                                                category.products.map((p: any) => (
                                                    <div key={p.id} className="group flex items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-white/5 hover:bg-secondary/20 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                <Package size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold">{p.name}</p>
                                                                <p className="text-xs text-muted-foreground uppercase">{p.pricingModel} • ${p.monthlyPrice}/mo</p>
                                                            </div>
                                                        </div>
                                                        <Link href={`/admin/products/${p.id}`}>
                                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ExternalLink size={18} />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
