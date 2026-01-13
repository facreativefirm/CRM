"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Wand2, FolderPlus } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { ServiceSelector } from "@/components/shared/ServiceSelector";

interface ServiceFormProps {
    onSuccess?: (service: any) => void;
    onCancel?: () => void;
    className?: string;
}

export function ServiceForm({ onSuccess, onCancel, className }: ServiceFormProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: "",
        displayOrder: 0,
        iconClass: "",
        parentServiceId: ""
    });

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
        setLoading(true);
        try {
            const payload = {
                ...form,
                parentServiceId: form.parentServiceId ? parseInt(form.parentServiceId) : null
            };
            const response = await api.post("/products/services", payload);
            toast.success("Service created successfully");
            if (onSuccess) {
                onSuccess(response.data.data?.service);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSave} className={`space-y-6 ${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Service Name</Label>
                    <Input
                        id="name"
                        placeholder="e.g. Shared Hosting"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className="h-11 rounded-lg bg-secondary/20 border-border"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL Path)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="slug"
                            placeholder="e.g. shared-hosting"
                            value={form.slug}
                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                            required
                            className="h-11 rounded-lg bg-secondary/20 border-border font-mono text-sm"
                        />
                        <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={generateSlug}>
                            <Wand2 size={16} />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                        id="displayOrder"
                        type="number"
                        value={form.displayOrder}
                        onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                        className="h-11 rounded-lg bg-secondary/20 border-border"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="iconClass">Icon Class (optional)</Label>
                    <Input
                        id="iconClass"
                        value={form.iconClass}
                        onChange={(e) => setForm({ ...form, iconClass: e.target.value })}
                        placeholder="e.g. fas fa-server"
                        className="h-11 rounded-lg bg-secondary/20 border-border"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Parent Service (Optional)</Label>
                    <ServiceSelector
                        value={form.parentServiceId}
                        onChange={(val) => setForm({ ...form, parentServiceId: val })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description (Header HTML)</Label>
                <Textarea
                    id="description"
                    placeholder="Enter descriptive text or HTML..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-secondary/20 border-border min-h-[100px]"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} className="h-11 px-6 rounded-lg">
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-8 rounded-lg font-bold shadow-lg shadow-primary/20 gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <FolderPlus size={18} />}
                    Create Service
                </Button>
            </div>
        </form>
    );
}
