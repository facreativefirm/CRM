"use client";

import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ServiceForm } from "@/components/admin/services/ServiceForm";

export default function AddServicePage() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientId = searchParams.get("clientId") || "";

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-0 md:pl-75 pt-20 p-8 flex justify-center">
                    <div className="w-full max-w-4xl space-y-8">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <Link href="/admin/services">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/50">
                                    <ArrowLeft size={20} />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{t("provision_new") || "Provision New Service"}</h1>
                                <p className="text-muted-foreground">{t("services_hub") || "Manually add a service to a client account."}</p>
                            </div>
                        </div>

                        <div className="glass rounded-[3rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

                            <ServiceForm
                                initialData={{ clientId: clientId }}
                                onSuccess={() => router.push("/admin/services")}
                                onCancel={() => router.push("/admin/services")}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
