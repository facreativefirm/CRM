"use client";

import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Globe, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { DomainForm } from "@/components/admin/domains/DomainForm";

export default function RegisterDomainPage() {
    const { t } = useLanguage();

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                        <div>
                            <Link href="/admin/domains">
                                <Button variant="ghost" className="rounded-xl px-4 py-2 text-muted-foreground hover:text-primary transition-all gap-2 -ml-4 mb-4">
                                    <ArrowLeft size={16} />
                                    Back to Registry
                                </Button>
                            </Link>
                            <h1 className="text-3xl font-bold">Register Domain</h1>
                            <p className="text-muted-foreground">Provision new domain assets manually or via integrated registrar APIs for your clients.</p>
                        </div>
                    </div>

                    <div className="bg-card/40 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl">
                        <DomainForm onSuccess={() => window.location.href = '/admin/domains'} />
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
