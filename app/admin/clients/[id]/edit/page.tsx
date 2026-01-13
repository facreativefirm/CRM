"use client";

import React, { useState, useEffect, use } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/admin/clients/ClientForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function EditClientPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const { id } = params;
    const { t } = useLanguage();
    const router = useRouter();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClientData();
    }, [id]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/clients/${id}`);
            setClient(response.data.data.client);
        } catch (error) {
            toast.error("Failed to load client data");
            router.push("/admin/clients");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-0 md:pl-75 pt-20 p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href={`/admin/clients/${id}`}>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <ArrowLeft size={20} />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight italic">
                                        {t("edit_client_profile") || "Edit Client Profile"}
                                    </h1>
                                    <p className="text-muted-foreground">
                                        {client?.user?.firstName} {client?.user?.lastName} &bull; {client?.user?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card/40 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />

                            <ClientForm
                                initialData={client}
                                onSuccess={() => router.push(`/admin/clients/${id}`)}
                                onCancel={() => router.push(`/admin/clients/${id}`)}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
