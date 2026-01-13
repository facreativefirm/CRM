"use client";

import React, { useState, useEffect, use } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Play, ExternalLink, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ServiceForm } from "@/components/admin/services/ServiceForm";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/shared/Badge";

export default function EditServicePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const { id } = params;

    const { t } = useLanguage();
    const router = useRouter();
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [performingAction, setPerformingAction] = useState(false);

    useEffect(() => {
        fetchService();
    }, [id]);

    const fetchService = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/services/${id}`);
            setService(response.data.data.service);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load service details");
            router.push("/admin/services");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string) => {
        try {
            setPerformingAction(true);
            await api.post(`/services/${id}/action`, { action });
            toast.success(`Action '${action}' executed successfully`);
            fetchService();
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to execute ${action}`);
        } finally {
            setPerformingAction(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!service) return null;

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-0 md:pl-75 pt-20 p-8 flex justify-center">
                    <div className="w-full max-w-5xl space-y-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <Link href="/admin/services">
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/50">
                                        <ArrowLeft size={20} />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                                        Manage Service
                                        <Badge variant={service.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                            {service.status}
                                        </Badge>
                                    </h1>
                                    <p className="text-muted-foreground flex items-center gap-2">
                                        {service.product?.name} &bull; <span className="font-mono text-xs">{service.domain || "no-domain"}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => handleAction('activate')}
                                    disabled={performingAction || service.status === 'ACTIVE'}
                                    className="gap-2 rounded-xl h-11 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
                                >
                                    <Play size={16} /> Activate
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleAction('suspend')}
                                    disabled={performingAction || service.status === 'SUSPENDED'}
                                    className="gap-2 rounded-xl h-11 border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
                                >
                                    <Trash2 size={16} /> Suspend
                                </Button>
                                <Link href={`/admin/clients/${service.clientId}`}>
                                    <Button variant="secondary" className="gap-2 rounded-xl h-11">
                                        <ExternalLink size={16} /> View Client
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <div className="glass rounded-[3rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
                                    <ServiceForm
                                        initialData={service}
                                        onSuccess={fetchService}
                                        onCancel={() => router.push("/admin/services")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="glass rounded-[2rem] p-8 border border-white/5 space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-primary">
                                        <Settings size={18} />
                                        System Stats
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Provisioned On</p>
                                            <p className="font-bold">{new Date(service.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Last Update</p>
                                            <p className="font-bold">{new Date(service.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Infrastructure Node</p>
                                            <p className="font-bold">{service.server?.serverName || "Internal / None"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
