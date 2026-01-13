"use client";

import React, { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save, FolderPlus, Wand2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ServiceSelector } from "@/components/shared/ServiceSelector";

export default function AddServicePage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        displayOrder: 0,
        iconClass: "",
        parentServiceId: ""
    });

    const generateSlug = () => {
        if (formData.name) {
            setFormData(prev => ({
                ...prev,
                slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            }));
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
            await api.post("/products/services", payload);
            toast.success("Service created successfully");
            router.push("/admin/products/services");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to create service");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-0 md:pl-75 pt-20 p-8 flex justify-center">
                    <div className="w-full max-w-3xl space-y-6">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/products/services">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/50">
                                    <ArrowLeft size={20} />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    <FolderPlus className="text-primary" />
                                    Add New Service
                                </h1>
                                <p className="text-muted-foreground">Group your products into services for better organization.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-10 space-y-8 border border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Service Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Shared Hosting"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="bg-background/50 h-12"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug (URL Path)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="slug"
                                            placeholder="e.g. shared-hosting"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            required
                                            className="bg-background/50 h-12 font-mono text-sm"
                                        />
                                        <Button type="button" variant="outline" size="icon" className="h-12 w-12" onClick={generateSlug}>
                                            <Wand2 size={18} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="displayOrder">Display Order</Label>
                                    <Input
                                        id="displayOrder"
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                                        className="bg-background/50 h-12"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="iconClass">Icon Class (optional)</Label>
                                    <Input
                                        id="iconClass"
                                        value={formData.iconClass}
                                        onChange={(e) => setFormData({ ...formData, iconClass: e.target.value })}
                                        placeholder="e.g. fas fa-server"
                                        className="bg-background/50 h-12"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Parent Service (Optional)</Label>
                                    <ServiceSelector
                                        value={formData.parentServiceId}
                                        onChange={(val) => setFormData({ ...formData, parentServiceId: val })}
                                    />
                                    <p className="text-xs text-muted-foreground">Select a parent if this is a sub-service.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Header HTML)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Enter descriptive text or HTML for the service header..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-background/50 min-h-[150px]"
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" disabled={isLoading} className="shadow-lg shadow-primary/20 h-12 px-10 text-base">
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                    Create Service
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
