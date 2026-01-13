"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    User,
    Building,
    Save,
    Loader2
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface ClientFormProps {
    initialData?: any;
    onSuccess?: (client: any) => void;
    onCancel?: () => void;
    className?: string;
}

export function ClientForm({ initialData, onSuccess, onCancel, className }: ClientFormProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    const primaryContact = initialData?.contacts?.find((c: any) => c.isPrimary) || initialData?.contacts?.[0];

    const [form, setForm] = useState({
        firstName: initialData?.user?.firstName || "",
        lastName: initialData?.user?.lastName || "",
        email: initialData?.user?.email || "",
        companyName: initialData?.companyName || "",
        address1: primaryContact?.address1 || "",
        address2: primaryContact?.address2 || "",
        city: primaryContact?.city || "",
        state: primaryContact?.state || "",
        postcode: primaryContact?.zip || "",
        country: primaryContact?.country || "BD",
        phoneNumber: primaryContact?.phone || "",
        password: "",
        status: initialData?.status || "ACTIVE"
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = {
                ...form,
                phone: form.phoneNumber,
                zip: form.postcode,
            };

            if (!initialData) {
                // Registering new client
                payload.username = form.email.split('@')[0] + Math.floor(Math.random() * 1000);
                const response = await api.post("/clients/register", payload);
                toast.success("Client added successfully");
                if (onSuccess) onSuccess(response.data.data?.client);
            } else {
                // Updating existing client
                const response = await api.patch(`/clients/${initialData.id}`, payload);
                toast.success("Client updated successfully");
                if (onSuccess) onSuccess(response.data.data?.client);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save client");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSave} className={`space-y-8 ${className}`}>
            {/* Personal Information */}
            <div className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2">
                    <User className="text-primary" size={20} />
                    {t("personal_information") || "Personal Information"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("first_name") || "First Name"}</Label>
                        <Input
                            required
                            value={form.firstName}
                            onChange={e => setForm({ ...form, firstName: e.target.value })}
                            className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("last_name") || "Last Name"}</Label>
                        <Input
                            required
                            value={form.lastName}
                            onChange={e => setForm({ ...form, lastName: e.target.value })}
                            className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("email_address") || "Email Address"}</Label>
                    <Input
                        required
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("phone_number") || "Phone Number"}</Label>
                        <Input
                            value={form.phoneNumber}
                            onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                            className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("status") || "Status"}</Label>
                        <select
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value })}
                            className="w-full h-12 rounded-xl bg-secondary/30 border-border font-bold px-3 outline-none appearance-none"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("password") || "Password"}</Label>
                    <Input
                        required={!initialData}
                        type="password"
                        placeholder={initialData ? "Leave blank to keep current" : "Enter secure password"}
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                    />
                </div>
            </div>

            {/* Company & Address */}
            <div className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2">
                    <Building className="text-primary" size={20} />
                    {t("corporate_details") || "Corporate Details"}
                </h3>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("company_name") || "Company Name"}</Label>
                    <Input
                        value={form.companyName}
                        onChange={e => setForm({ ...form, companyName: e.target.value })}
                        className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("address_line_1") || "Address Line 1"}</Label>
                    <Input
                        value={form.address1}
                        onChange={e => setForm({ ...form, address1: e.target.value })}
                        className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("city") || "City"}</Label>
                        <Input
                            value={form.city}
                            onChange={e => setForm({ ...form, city: e.target.value })}
                            className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("state_region") || "State/Region"}</Label>
                        <Input
                            value={form.state}
                            onChange={e => setForm({ ...form, state: e.target.value })}
                            className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("postcode") || "Postcode"}</Label>
                        <Input
                            value={form.postcode}
                            onChange={e => setForm({ ...form, postcode: e.target.value })}
                            className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("country") || "Country"}</Label>
                        <Input
                            value={form.country}
                            onChange={e => setForm({ ...form, country: e.target.value })}
                            className="h-12 rounded-xl bg-secondary/30 border-border font-bold"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} className="h-12 px-6 rounded-xl font-bold">
                        {t("cancel") || "Cancel"}
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {t("save_client") || "Save Client"}
                </Button>
            </div>
        </form>
    );
}
