"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Mail, Users, Activity } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useEffect } from "react";

interface DepartmentFormProps {
    initialData?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function DepartmentForm({ initialData, onSuccess, onCancel }: DepartmentFormProps) {
    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        email: initialData?.email || "",
        autoresponderEnabled: initialData?.autoresponderEnabled ?? false,
        assignedSupportId: initialData?.assignedSupportId ? initialData.assignedSupportId.toString() : "",
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await api.get("/users");
            const allUsers = response.data.data.users || [];
            // Filter only staff, admin, super_admin
            const supportUsers = allUsers.filter((u: any) =>
                ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(u.userType)
            );
            setStaff(supportUsers);
        } catch (err) {
            console.error("Error fetching staff:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                assignedSupportId: formData.assignedSupportId && formData.assignedSupportId !== "none"
                    ? parseInt(formData.assignedSupportId)
                    : null
            };

            if (initialData?.id) {
                await api.patch(`/support/departments/${initialData.id}`, payload);
                toast.success("Department updated successfully");
            } else {
                await api.post("/support/departments", payload);
                toast.success("Department created successfully");
            }
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save department");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Department Name</Label>
                    <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            className="pl-12 h-12 rounded-xl bg-secondary/30 border-none font-bold"
                            placeholder="e.g. Technical Support"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Support Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="email"
                            className="pl-12 h-12 rounded-xl bg-secondary/30 border-none font-bold"
                            placeholder="support@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Assigned Support Responder</Label>
                    <Select
                        value={formData.assignedSupportId}
                        onValueChange={(val) => setFormData({ ...formData, assignedSupportId: val })}
                    >
                        <SelectTrigger className="h-12 border-none rounded-xl font-bold bg-secondary/30">
                            <SelectValue placeholder="Select Staff Member" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                            <SelectItem value="none">Manual Assignment (None)</SelectItem>
                            {staff.map((u) => (
                                <SelectItem key={u.id} value={u.id.toString()}>
                                    {u.firstName} {u.lastName} ({u.userType})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground ml-1 italic">* New tickets will be automatically assigned to this person.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-white/5">
                    <div className="space-y-0.5">
                        <Label className="font-bold">Autoresponder</Label>
                        <p className="text-xs text-muted-foreground">Send an automatic confirmation to clients.</p>
                    </div>
                    <Switch
                        checked={formData.autoresponderEnabled}
                        onCheckedChange={(val) => setFormData({ ...formData, autoresponderEnabled: val })}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-6 rounded-xl font-bold">
                        Cancel
                    </Button>
                )}
                <Button disabled={loading} className="h-12 px-8 rounded-xl font-black gap-2 shadow-xl shadow-primary/20">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {initialData?.id ? "Sync Department" : "Register Sector"}
                </Button>
            </div>
        </form>
    );
}
