"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Globe } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settingsStore";

interface DomainTLDFormProps {
    initialData?: any;
    onSuccess?: (tld: any) => void;
    onCancel?: () => void;
}

export function DomainTLDForm({ initialData, onSuccess, onCancel }: DomainTLDFormProps) {
    const { t } = useLanguage();
    const { settings } = useSettingsStore();
    const currencyCode = settings.defaultCurrency || 'BDT';
    const symbol = getCurrencySymbol(currencyCode);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        tld: initialData?.tld || "",
        registrar: initialData?.registrar || "",
        registrationPrice: initialData?.registrationPrice || 0,
        renewalPrice: initialData?.renewalPrice || 0,
        transferPrice: initialData?.transferPrice || 0,
        dnsManagement: initialData?.dnsManagement || false,
        emailForwarding: initialData?.emailForwarding || false,
        idProtection: initialData?.idProtection || false,
        eppRequired: initialData?.eppRequired || false,
        autoRegistration: initialData?.autoRegistration || false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                registrationPrice: parseFloat(form.registrationPrice.toString()),
                renewalPrice: parseFloat(form.renewalPrice.toString()),
                transferPrice: parseFloat(form.transferPrice.toString()),
            };

            let response;
            if (initialData?.id) {
                response = await api.patch(`/domains/tlds/${initialData.id}`, payload);
                toast.success("TLD updated successfully");
            } else {
                response = await api.post("/domains/tlds", payload);
                toast.success("TLD added successfully");
            }

            if (onSuccess) onSuccess(response.data.data.tld);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save TLD");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TLD (e.g. .com)</Label>
                    <Input
                        required
                        placeholder=".com"
                        value={form.tld}
                        onChange={e => setForm({ ...form, tld: e.target.value })}
                        disabled={!!initialData}
                        className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Registrar Module</Label>
                    <Input
                        placeholder="e.g. Namecheap"
                        value={form.registrar}
                        onChange={e => setForm({ ...form, registrar: e.target.value })}
                        className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Register ({symbol})</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={form.registrationPrice}
                        onChange={e => setForm({ ...form, registrationPrice: parseFloat(e.target.value) })}
                        className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Renew ({symbol})</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={form.renewalPrice}
                        onChange={e => setForm({ ...form, renewalPrice: parseFloat(e.target.value) })}
                        className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Transfer ({symbol})</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={form.transferPrice}
                        onChange={e => setForm({ ...form, transferPrice: parseFloat(e.target.value) })}
                        className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-white/5">
                    <div className="space-y-0.5">
                        <Label className="text-xs font-bold tracking-tight">DNS Management</Label>
                        <p className="text-[10px] text-muted-foreground leading-tight">Enable nameserver management</p>
                    </div>
                    <Switch
                        checked={form.dnsManagement}
                        onCheckedChange={val => setForm({ ...form, dnsManagement: val })}
                    />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-white/5">
                    <div className="space-y-0.5">
                        <Label className="text-xs font-bold tracking-tight">Email Forwarding</Label>
                        <p className="text-[10px] text-muted-foreground leading-tight">Enable free email forwarding</p>
                    </div>
                    <Switch
                        checked={form.emailForwarding}
                        onCheckedChange={val => setForm({ ...form, emailForwarding: val })}
                    />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-white/5">
                    <div className="space-y-0.5">
                        <Label className="text-xs font-bold tracking-tight">ID Protection</Label>
                        <p className="text-[10px] text-muted-foreground leading-tight">Enable WHOIS privacy</p>
                    </div>
                    <Switch
                        checked={form.idProtection}
                        onCheckedChange={val => setForm({ ...form, idProtection: val })}
                    />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-white/5">
                    <div className="space-y-0.5">
                        <Label className="text-xs font-bold tracking-tight">EPP Required</Label>
                        <p className="text-[10px] text-muted-foreground leading-tight">Auth code needed for transfer</p>
                    </div>
                    <Switch
                        checked={form.eppRequired}
                        onCheckedChange={val => setForm({ ...form, eppRequired: val })}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} className="h-12 rounded-xl font-bold">
                        {t("cancel")}
                    </Button>
                )}
                <Button type="submit" disabled={loading} className="h-12 rounded-xl px-8 font-black shadow-lg shadow-primary/20 gap-2">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {initialData ? "Sync Pricing" : "Add Extension"}
                </Button>
            </div>
        </form>
    );
}
