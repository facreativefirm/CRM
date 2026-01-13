"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Wand2, Settings, DollarSign, Package, Server as ServerIcon, Plus } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { getCurrencySymbol } from "@/lib/utils";
import { ServiceSelector } from "@/components/shared/ServiceSelector";

interface ProductFormProps {
    onSuccess?: (product: any) => void;
    onCancel?: () => void;
    className?: string;
    serviceId?: string; // Optional default serviceId
}

export function ProductForm({ onSuccess, onCancel, className, serviceId }: ProductFormProps) {
    const { t } = useLanguage();
    const { settings } = useSettingsStore();
    const currencyCode = settings.defaultCurrency || 'BDT';
    const symbol = getCurrencySymbol(currencyCode);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [features, setFeatures] = useState<string[]>([]);
    const [newFeature, setNewFeature] = useState("");

    const [form, setForm] = useState({
        name: "",
        slug: "",
        serviceId: serviceId || "",
        productType: "HOSTING",
        pricingModel: "RECURRING",
        description: "",
        monthlyPrice: "0.00",
        quarterlyPrice: "0.00",
        semiAnnualPrice: "0.00",
        annualPrice: "0.00",
        setupFee: "0.00",
        stockQuantity: "",
        autoSetup: false
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get("/products/services");
            setCategories(response.data.data.services || []);
        } catch (error) {
            console.error(error);
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

    const generateSlug = () => {
        if (form.name) {
            setForm(prev => ({
                ...prev,
                slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            }));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.serviceId) {
            toast.error("Please select a service group");
            return;
        }

        setLoading(true);

        const payload = {
            ...form,
            serviceId: parseInt(form.serviceId.toString()),
            monthlyPrice: parseFloat(form.monthlyPrice),
            quarterlyPrice: parseFloat(form.quarterlyPrice),
            semiAnnualPrice: parseFloat(form.semiAnnualPrice),
            annualPrice: parseFloat(form.annualPrice),
            setupFee: parseFloat(form.setupFee),
            stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : null,
            features: { list: features }
        };

        try {
            const response = await api.post("/products", payload);
            toast.success("Product created successfully");
            if (onSuccess) {
                onSuccess(response.data.data?.product);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSave} className={`space-y-6 ${className}`}>
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-6 w-full justify-start bg-secondary/10 p-1 rounded-xl h-auto">
                    <TabsTrigger value="general" className="gap-2 px-4 py-2 rounded-lg text-sm">
                        <Package size={14} /> General
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="gap-2 px-4 py-2 rounded-lg text-sm">
                        <DollarSign size={14} /> Pricing
                    </TabsTrigger>
                    <TabsTrigger value="module" className="gap-2 px-4 py-2 rounded-lg text-sm">
                        <ServerIcon size={14} /> Module
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Product Type</Label>
                                <Select
                                    value={form.productType}
                                    onValueChange={(val) => setForm({ ...form, productType: val })}
                                >
                                    <SelectTrigger className="bg-secondary/20 h-10 border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HOSTING">Shared Hosting</SelectItem>
                                        <SelectItem value="VPS">VPS / Server</SelectItem>
                                        <SelectItem value="DOMAIN">Domain Registration</SelectItem>
                                        <SelectItem value="SSL">SSL Cert</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Service Group</Label>
                                <ServiceSelector
                                    value={form.serviceId}
                                    onChange={(val) => setForm({ ...form, serviceId: val })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Product Name</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    className="bg-secondary/20 h-10 border-border"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Slug (URL)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={form.slug}
                                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                        className="bg-secondary/20 h-10 border-border font-mono text-xs"
                                    />
                                    <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={generateSlug}>
                                        <Wand2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Short Description</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="bg-secondary/20 border-border min-h-[80px]"
                            placeholder="HTML supported..."
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-bold">Features</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                placeholder="e.g. 10GB SSD"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                className="bg-secondary/20 h-9 text-sm border-border"
                            />
                            <Button type="button" onClick={handleAddFeature} size="sm">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium">
                                    <span>{feature}</span>
                                    <button type="button" onClick={() => handleRemoveFeature(i)} className="hover:text-destructive">×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex gap-2 p-1 bg-secondary/10 rounded-xl">
                        {["FREE", "RECURRING", "ONETIME"].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setForm({ ...form, pricingModel: m })}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${form.pricingModel === m ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent"
                                    }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    {form.pricingModel !== "FREE" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground font-black">Monthly ({symbol})</Label>
                                <Input type="number" step="0.01" value={form.monthlyPrice} onChange={e => setForm({ ...form, monthlyPrice: e.target.value })} className="bg-secondary/20 h-10 border-border font-mono" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground font-black">Annual ({symbol})</Label>
                                <Input type="number" step="0.01" value={form.annualPrice} onChange={e => setForm({ ...form, annualPrice: e.target.value })} className="bg-secondary/20 h-10 border-border font-mono" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground font-black">Setup Fee ({symbol})</Label>
                                <Input type="number" step="0.01" value={form.setupFee} onChange={e => setForm({ ...form, setupFee: e.target.value })} className="bg-secondary/20 h-10 border-border font-mono" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground font-black">Stock</Label>
                                <Input type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} className="bg-secondary/20 h-10 border-border" placeholder="0 = infinite" />
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="module" className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-4 bg-secondary/10 rounded-xl border border-border flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="font-bold">Auto Setup</Label>
                            <p className="text-xs text-muted-foreground">Provision service automatically after payment.</p>
                        </div>
                        <Checkbox checked={form.autoSetup} onChange={(e) => setForm({ ...form, autoSetup: e.target.checked })} />
                    </div>
                    <div className="p-10 text-center border-2 border-dashed rounded-2xl text-muted-foreground text-sm">
                        Connectors like cPanel, WHM, Plesk will appear here once configured in Servers.
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} className="h-11 px-6 rounded-xl font-bold">
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Create Product
                </Button>
            </div>
        </form>
    );
}
