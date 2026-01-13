"use client";

import React, { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientForm } from "@/components/admin/clients/ClientForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AddClientPage() {
    const { t } = useLanguage();
    const router = useRouter();

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/admin/clients">
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <ArrowLeft size={20} />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight">{t("add_new_client") || "Add New Client"}</h1>
                                    <p className="text-muted-foreground">{t("onboard_new_client_desc") || "Initialize a new client profile in the system."}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card/40 border border-border rounded-[2.5rem] p-8">
                            <ClientForm
                                onSuccess={() => router.push("/admin/clients")}
                                onCancel={() => router.push("/admin/clients")}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
