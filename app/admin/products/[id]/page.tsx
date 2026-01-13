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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Save, Wand2, Settings, DollarSign, Package, Server as ServerIcon, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { ServiceSelector } from "@/components/shared/ServiceSelector";

export default function EditProductPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [services, setServices] = useState<any[]>([]);
    const [features, setFeatures] = useState<string[]>([]);
    const [newFeature, setNewFeature] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        serviceId: "",
        productType: "HOSTING",
        pricingModel: "RECURRING",
        description: "",
        monthlyPrice: "0.00",
        quarterlyPrice: "0.00",
        semiAnnualPrice: "0.00",
        annualPrice: "0.00",
        setupFee: "0.00",
        stockQuantity: "",
        autoSetup: false,
        status: "ACTIVE"
    });

    useEffect(() => {
        const loadData = async () => {
            setIsFetching(true);
            await Promise.all([fetchServices(), fetchProduct()]);
            setIsFetching(false);
        };
        loadData();
    }, [params.id]);

    const fetchServices = async () => {
        try {
            const response = await api.get("/products/services");
            setServices(response.data.data.services || []);
        } catch (error) {
            console.error("Error fetching services:", error);
            toast.error("Failed to load services");
        }
    };

    const fetchProduct = async () => {
        try {
            const response = await api.get(`/products/${params.id}`);
            const product = response.data.data.product;

            setFormData({
                name: product.name,
                slug: product.slug,
                serviceId: product.serviceId.toString(),
                productType: product.productType,
                pricingModel: product.pricingModel,
                description: product.description || "",
                monthlyPrice: product.monthlyPrice,
                quarterlyPrice: product.quarterlyPrice || "0.00",
                semiAnnualPrice: product.semiAnnualPrice || "0.00",
                annualPrice: product.annualPrice,
                setupFee: product.setupFee,
                stockQuantity: product.stockQuantity ? product.stockQuantity.toString() : "",
                autoSetup: product.autoSetup,
                status: product.status
            });

            if (product.features && typeof product.features === 'object' && Array.isArray((product.features as any).list)) {
                setFeatures((product.features as any).list);
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            toast.error("Failed to load product details");
            router.push("/admin/products");
        }
    };

    const handleAddFeature = () => {
        if (newFeature.trim()) {
            setFeatures([...features, newFeature.trim()]);
            setNewFeature("");
        }
    };

    const handleRemoveFeature = (index: number) => {
        setFeatures(features.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            ...formData,
            serviceId: parseInt(formData.serviceId),
            monthlyPrice: parseFloat(formData.monthlyPrice),
            quarterlyPrice: parseFloat(formData.quarterlyPrice),
            semiAnnualPrice: parseFloat(formData.semiAnnualPrice),
            annualPrice: parseFloat(formData.annualPrice),
            setupFee: parseFloat(formData.setupFee),
            stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : null,
            features: { list: features }
        };

        try {
            await api.patch(`/products/${params.id}`, payload);
            toast.success("Product updated successfully");
            router.refresh(); // Refresh server components if any
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update product");
        } finally {
            setIsLoading(false);
        }
    };

    const generateSlug = () => {
        if (formData.name) {
            setFormData(prev => ({
                ...prev,
                slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            }));
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone and will fail if any active customer services are using it.")) {
            return;
        }

        try {
            setIsLoading(true);
            await api.delete(`/products/${params.id}`);
            toast.success("Product deleted successfully");
            router.push("/admin/products");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to delete product");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
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
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/admin/products">
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/50">
                                        <ArrowLeft size={20} />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-bold flex items-center gap-2">
                                        Edit Product
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${formData.status === 'ACTIVE'
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : 'bg-muted text-muted-foreground border-border'
                                            }`}>
                                            {formData.status}
                                        </span>
                                    </h1>
                                    <p className="text-muted-foreground">Manage pricing, details, and automation settings.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 border-destructive/20 transition-all h-12 px-6">
                                    <Trash2 size={18} className="mr-2" />
                                    Delete
                                </Button>
                                <Button type="button" onClick={handleSubmit} disabled={isLoading} className="gap-2 shadow-lg shadow-primary/20 h-12 px-8">
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>

                        <div className="glass rounded-[2rem] p-8 border border-white/5">
                            <Tabs defaultValue="general" className="w-full">
                                <TabsList className="mb-8 w-full justify-start bg-secondary/20 p-1 rounded-xl h-auto">
                                    <TabsTrigger value="general" className="gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Package size={16} /> General
                                    </TabsTrigger>
                                    <TabsTrigger value="pricing" className="gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <DollarSign size={16} /> Pricing
                                    </TabsTrigger>
                                    <TabsTrigger value="module" className="gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <ServerIcon size={16} /> Module Settings
                                    </TabsTrigger>
                                    <TabsTrigger value="advanced" className="gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Settings size={16} /> Advanced
                                    </TabsTrigger>
                                </TabsList>

                                <form onSubmit={handleSubmit}>
                                    {/* General Tab */}
                                    <TabsContent value="general" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="productType">Product Type</Label>
                                                    <Select
                                                        value={formData.productType}
                                                        onValueChange={(val) => setFormData({ ...formData, productType: val })}
                                                    >
                                                        <SelectTrigger className="bg-background/50 h-12">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="HOSTING">Shared Hosting</SelectItem>
                                                            <SelectItem value="VPS">VPS / Server</SelectItem>
                                                            <SelectItem value="DOMAIN">Domain Registration</SelectItem>
                                                            <SelectItem value="SSL">SSL Certificate</SelectItem>
                                                            <SelectItem value="ADDON">Product Addon</SelectItem>
                                                            <SelectItem value="OTHER">Other Service</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="service">Product Group / Service</Label>
                                                    <ServiceSelector
                                                        value={formData.serviceId}
                                                        onChange={(val) => setFormData({ ...formData, serviceId: val })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Product Name</Label>
                                                    <Input
                                                        id="name"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        required
                                                        className="bg-background/50 h-12"
                                                        placeholder="e.g. Starter Plan"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="slug">Product Slug (URL)</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="slug"
                                                            value={formData.slug}
                                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                            required
                                                            className="bg-background/50 h-12 font-mono text-sm"
                                                        />
                                                        <Button type="button" variant="outline" size="icon" className="h-12 w-12" onClick={generateSlug} title="Auto Generate">
                                                            <Wand2 size={18} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Product Description</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="bg-background/50 min-h-[150px] font-mono text-sm leading-relaxed"
                                                placeholder="HTML allowed. Enter features list..."
                                            />
                                            <p className="text-xs text-muted-foreground">You can use HTML tags to format the description.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <Label>Features List</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newFeature}
                                                    onChange={(e) => setNewFeature(e.target.value)}
                                                    placeholder="Add a feature (e.g. '10GB SSD')"
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                                    className="bg-background/50 h-10"
                                                />
                                                <Button type="button" onClick={handleAddFeature}>Add</Button>
                                            </div>
                                            <div className="space-y-2">
                                                {features.map((feature, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-white/5">
                                                        <span>{feature}</span>
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFeature(i)} className="text-destructive hover:text-destructive/80 hover:bg-destructive/10">Remove</Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-6 bg-secondary/10 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h4 className="font-medium">Product Status</h4>
                                                <p className="text-sm text-muted-foreground">Hidden products are not visible in the store</p>
                                            </div>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                                            >
                                                <SelectTrigger className="w-[180px] bg-background">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                                    <SelectItem value="INACTIVE">Hidden / Inactive</SelectItem>
                                                    <SelectItem value="DISCONTINUED">Retired</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TabsContent>

                                    {/* Pricing Tab */}
                                    <TabsContent value="pricing" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-6">
                                            <div className="flex flex-col gap-2">
                                                <Label>Payment Type</Label>
                                                <div className="flex gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, pricingModel: "FREE" })}
                                                        className={`flex-1 p-4 rounded-xl border transition-all ${formData.pricingModel === "FREE" ? "bg-primary/20 border-primary" : "bg-background/30 border-border opacity-60 hover:opacity-100"
                                                            }`}
                                                    >
                                                        <span className="block font-bold">Free</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, pricingModel: "ONETIME" })}
                                                        className={`flex-1 p-4 rounded-xl border transition-all ${formData.pricingModel === "ONETIME" ? "bg-primary/20 border-primary" : "bg-background/30 border-border opacity-60 hover:opacity-100"
                                                            }`}
                                                    >
                                                        <span className="block font-bold">One Time</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, pricingModel: "RECURRING" })}
                                                        className={`flex-1 p-4 rounded-xl border transition-all ${formData.pricingModel === "RECURRING" ? "bg-primary/20 border-primary" : "bg-background/30 border-border opacity-60 hover:opacity-100"
                                                            }`}
                                                    >
                                                        <span className="block font-bold">Recurring</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {formData.pricingModel !== "FREE" && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div className="space-y-2">
                                                        <Label>Monthly Price</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={formData.monthlyPrice}
                                                                onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                                                                className="pl-7 bg-background/50 h-12 font-mono text-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Quarterly Price</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={formData.quarterlyPrice}
                                                                onChange={(e) => setFormData({ ...formData, quarterlyPrice: e.target.value })}
                                                                className="pl-7 bg-background/50 h-12 font-mono text-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Semi-Annual Price</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={formData.semiAnnualPrice}
                                                                onChange={(e) => setFormData({ ...formData, semiAnnualPrice: e.target.value })}
                                                                className="pl-7 bg-background/50 h-12 font-mono text-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Annual Price</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={formData.annualPrice}
                                                                onChange={(e) => setFormData({ ...formData, annualPrice: e.target.value })}
                                                                className="pl-7 bg-background/50 h-12 font-mono text-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Setup Fee</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={formData.setupFee}
                                                                onChange={(e) => setFormData({ ...formData, setupFee: e.target.value })}
                                                                className="pl-7 bg-background/50 h-12 font-mono text-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* Module Settings Tab - Placeholder/Basic */}
                                    <TabsContent value="module" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-6">
                                            <div className="p-6 bg-secondary/10 rounded-xl border border-white/5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-lg">Automation Settings</h3>
                                                        <p className="text-sm text-muted-foreground">Configure how this service is provisioned.</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="autoSetup"
                                                            checked={formData.autoSetup}
                                                            onChange={(e) => setFormData({ ...formData, autoSetup: e.target.checked })}
                                                        />
                                                        <Label htmlFor="autoSetup" className="font-medium cursor-pointer">Auto-setup on payment</Label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2 opacity-60">
                                                    <Label>Module Name (Coming Soon)</Label>
                                                    <Select disabled>
                                                        <SelectTrigger><SelectValue placeholder="cPanel" /></SelectTrigger>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2 opacity-60">
                                                    <Label>Server Group (Coming Soon)</Label>
                                                    <Select disabled>
                                                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Advanced Tab */}
                                    <TabsContent value="advanced" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Stock Control</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0 for unlimited"
                                                    value={formData.stockQuantity}
                                                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                                                    className="bg-background/50 max-w-sm"
                                                />
                                                <p className="text-xs text-muted-foreground">Leave blank or 0 for unlimited stock.</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </form>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div >
        </AuthGuard >
    );
}
