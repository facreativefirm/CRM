"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Globe, ShieldCheck, Zap, Settings, Calendar } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { ClientSelector } from "@/components/shared/ClientSelector";

export interface DomainFormProps {
    initialData?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function DomainForm({ initialData, onSuccess, onCancel }: DomainFormProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [tlds, setTlds] = useState<any[]>([]);

    const [form, setForm] = useState({
        clientId: initialData?.clientId || 0,
        domainName: initialData?.domainName || "",
        regPeriod: initialData?.regPeriod || 1,
        registrar: initialData?.registrar || "",
        autoRenew: initialData?.autoRenew ?? true,
        dnsManagement: initialData?.dnsManagement ?? false,
        emailForwarding: initialData?.emailForwarding ?? false,
        idProtection: initialData?.idProtection ?? false,
        status: initialData?.status || "ACTIVE",
        expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : "",
    });

    useEffect(() => {
        const fetchTLDs = async () => {
            try {
                const response = await api.get("/domains/tlds");
                setTlds(response.data.data.tlds || []);
                if (!initialData && response.data.data.tlds.length > 0) {
                    setForm(prev => ({ ...prev, registrar: response.data.data.tlds[0].registrar || "" }));
                }
            } catch (error) {
                console.error("Failed to fetch TLDs");
            }
        };
        fetchTLDs();
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId) {
            toast.error("Please select a client");
            return;
        }
        if (!form.domainName.includes(".")) {
            toast.error("Please enter a valid domain name");
            return;
        }

        setLoading(true);
        try {
            const payload = { ...form };
            // If editing, we might want to send expiryDate directly instead of regPeriod
            if (initialData?.id) {
                await api.patch(`/domains/${initialData.id}`, payload);
                toast.success("Domain asset updated");
            } else {
                await api.post("/domains/register", payload);
                toast.success("Domain discovery complete");
            }
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save domain");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-6 w-full justify-start bg-secondary/10 p-1 rounded-xl h-auto">
                    <TabsTrigger value="general" className="gap-2 px-4 py-2 rounded-lg text-sm">
                        <Globe size={14} /> Identity
                    </TabsTrigger>
                    <TabsTrigger value="config" className="gap-2 px-4 py-2 rounded-lg text-sm">
                        <Zap size={14} /> Config
                    </TabsTrigger>
                    <TabsTrigger value="addons" className="gap-2 px-4 py-2 rounded-lg text-sm">
                        <ShieldCheck size={14} /> Add-ons
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground font-black tracking-widest">Assign Ownership</Label>
                                <ClientSelector
                                    value={form.clientId}
                                    onChange={val => setForm({ ...form, clientId: val })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground font-black tracking-widest">Asset Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={val => setForm({ ...form, status: val })}
                                >
                                    <SelectTrigger className="bg-secondary/20 h-11 border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="EXPIRED">Expired</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground font-black tracking-widest">Domain FQDN</Label>
                                <Input
                                    required
                                    placeholder="example.com"
                                    value={form.domainName}
                                    onChange={e => setForm({ ...form, domainName: e.target.value })}
                                    className="h-11 rounded-xl bg-secondary/20 border-border font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground font-black tracking-widest">Registrar Module</Label>
                                <Input
                                    placeholder="Auto-detecting..."
                                    value={form.registrar}
                                    onChange={e => setForm({ ...form, registrar: e.target.value })}
                                    className="h-11 rounded-xl bg-secondary/20 border-border font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="config" className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-muted-foreground font-black tracking-widest">Registration Cycle</Label>
                            <Select
                                value={form.regPeriod.toString()}
                                onValueChange={val => setForm({ ...form, regPeriod: parseInt(val) })}
                            >
                                <SelectTrigger className="h-11 rounded-xl bg-secondary/20 border-border font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 5, 10].map(yr => (
                                        <SelectItem key={yr} value={yr.toString()}>{yr} Year{yr > 1 ? 's' : ''}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-muted-foreground font-black tracking-widest">Next Renewal Date</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={form.expiryDate}
                                    onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                                    className="h-11 rounded-xl bg-secondary/20 border-border font-bold pl-10"
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-secondary/10 border border-white/5 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="font-bold">Auto-Renewal Strategy</Label>
                            <p className="text-xs text-muted-foreground">Automatically generate recurring invoices.</p>
                        </div>
                        <Switch
                            checked={form.autoRenew}
                            onCheckedChange={val => setForm({ ...form, autoRenew: val })}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="addons" className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { id: 'dnsManagement', label: 'DNS Management', desc: 'External nameserver cluster access.', icon: Globe },
                            { id: 'emailForwarding', label: 'Email Forwarding', desc: 'Catch-all and specific redirect rules.', icon: Zap },
                            { id: 'idProtection', label: 'ID Protection / WHOIS Mask', desc: 'Keep personal contact details private.', icon: ShieldCheck },
                        ].map((addon) => (
                            <div key={addon.id} className="p-4 rounded-2xl bg-secondary/10 border border-white/5 flex items-center justify-between group hover:bg-secondary/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                        <addon.icon size={18} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="font-bold cursor-pointer">{addon.label}</Label>
                                        <p className="text-xs text-muted-foreground">{addon.desc}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={(form as any)[addon.id]}
                                    onCheckedChange={val => setForm({ ...form, [addon.id]: val })}
                                />
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-6 rounded-xl font-bold">
                        {t("cancel")}
                    </Button>
                )}
                <Button disabled={loading} className="h-12 px-8 rounded-xl font-black shadow-lg shadow-primary/20 gap-2">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {initialData ? "Update Domain Asset" : "Register Domain Portfolio"}
                </Button>
            </div>
        </form>
    );
}
