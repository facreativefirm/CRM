"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2,
    Save,
    Play,
    Globe,
    Server as ServerIcon,
    Settings,
    User,
    Lock,
    DollarSign,
    Calendar,
    Activity
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { ClientSelector } from "@/components/shared/ClientSelector";
import { ProductSelector } from "@/components/shared/ProductSelector";
import { ServerSelector } from "@/components/shared/ServerSelector";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { cn, getCurrencySymbol } from "@/lib/utils";

interface ServiceFormProps {
    initialData?: any;
    onSuccess?: (service: any) => void;
    onCancel?: () => void;
    className?: string;
}

export function ServiceForm({ initialData, onSuccess, onCancel, className }: ServiceFormProps) {
    const { t } = useLanguage();
    const { settings, fetchSettings } = useSettingsStore();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        fetchSettings();
    }, []);

    const [formData, setFormData] = useState({
        clientId: initialData?.clientId || "",
        productId: initialData?.productId || "",
        serverId: initialData?.serverId || "",
        domain: initialData?.domain || "",
        billingCycle: initialData?.billingCycle || "monthly",
        status: initialData?.status || "PENDING",
        amount: initialData?.amount || "0.00",
        nextDueDate: initialData?.nextDueDate ? initialData.nextDueDate.split('T')[0] : "",
        username: initialData?.username || "",
        password: "", // We don't pre-fill passwords for security
        ipAddress: initialData?.ipAddress || "",
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientId) return toast.error("Please select a client");
        if (!formData.productId) return toast.error("Please select a product");

        setLoading(true);
        try {
            const payload = {
                ...formData,
                clientId: parseInt(formData.clientId as string),
                productId: parseInt(formData.productId as string),
                serverId: formData.serverId ? parseInt(formData.serverId as string) : null,
                amount: parseFloat(formData.amount as string),
                nextDueDate: formData.nextDueDate ? new Date(formData.nextDueDate) : null,
            };

            let response;
            if (initialData?.id) {
                response = await api.patch(`/services/${initialData.id}`, payload);
                toast.success("Service updated successfully");
            } else {
                response = await api.post("/services", payload);
                toast.success("Service provisioned successfully");
            }

            if (onSuccess) onSuccess(response.data.data.service);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSave} className={cn("space-y-8", className)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-secondary/20 p-1.5 rounded-2xl border border-white/5 h-auto flex flex-wrap lg:flex-nowrap gap-2">
                    <TabsTrigger value="general" className="gap-2 px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary transition-all">
                        <Activity size={14} /> General Settings
                    </TabsTrigger>
                    <TabsTrigger value="hosting" className="gap-2 px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary transition-all">
                        <ServerIcon size={14} /> Provisioning Info
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="gap-2 px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary transition-all">
                        {getCurrencySymbol(settings.defaultCurrency || 'BDT')} Pricing & Due Dates
                    </TabsTrigger>
                </TabsList>

                <div className="mt-8">
                    {/* General Tab */}
                    <TabsContent value="general" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Client Association</Label>
                                <ClientSelector
                                    value={formData.clientId}
                                    onChange={(val) => setFormData({ ...formData, clientId: val })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Assigned Product</Label>
                                <ProductSelector
                                    value={formData.productId}
                                    onChange={(val) => setFormData({ ...formData, productId: val })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Service Domain</Label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="domain.com"
                                        className="pl-12 h-12 rounded-xl bg-secondary/30 border-none font-bold"
                                        value={formData.domain}
                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Deployment Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger className="h-12 border-none rounded-xl font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background">
                                        <SelectItem value="PENDING">Pending Approval</SelectItem>
                                        <SelectItem value="ACTIVE">Active Service</SelectItem>
                                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Hosting Tab */}
                    <TabsContent value="hosting" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Assigned Node / Server</Label>
                                <ServerSelector
                                    value={formData.serverId}
                                    onChange={(val) => setFormData({ ...formData, serverId: val })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">IP Assignment</Label>
                                <div className="relative">
                                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="127.0.0.1"
                                        className="pl-12 h-12 rounded-xl bg-secondary/30 border-none font-bold"
                                        value={formData.ipAddress}
                                        onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Shell/Control Username</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="john_doe_99"
                                        className="pl-12 h-12 rounded-xl bg-secondary/30 border-none font-bold italic"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Access Protocol Secret</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-12 h-12 rounded-xl bg-secondary/30 border-none font-bold"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Billing Tab */}
                    <TabsContent value="billing" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Recurring Billing Amount</Label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-muted-foreground font-bold italic">
                                        {getCurrencySymbol(settings.defaultCurrency || 'BDT')}
                                    </div>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="pl-12 h-12 rounded-xl bg-secondary/30 border-none font-black text-lg"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Renewal Frequency</Label>
                                <Select
                                    value={formData.billingCycle}
                                    onValueChange={(val) => setFormData({ ...formData, billingCycle: val })}
                                >
                                    <SelectTrigger className="h-12 bg-secondary/30 border-none rounded-xl font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background">
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                                        <SelectItem value="annually">Annually</SelectItem>
                                        <SelectItem value="onetime">One Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Next Invoice Trigger Date</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-12 h-12 rounded-xl bg-secondary/30 border-none font-bold"
                                        value={formData.nextDueDate}
                                        onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            <div className="flex justify-end gap-4 pt-8 border-t border-white/5">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-8 rounded-xl font-bold">
                        Cancel Changes
                    </Button>
                )}
                <Button type="submit" disabled={loading} className="h-12 px-10 rounded-xl font-black shadow-xl shadow-primary/20 gap-2">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : (initialData?.id ? <Save size={18} /> : <Play size={18} />)}
                    {initialData?.id ? "Sync Service Registry" : "Execute Provisioning"}
                </Button>
            </div>
        </form>
    );
}
