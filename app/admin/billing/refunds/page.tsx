"use client";

import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import {
    RefreshCcw,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { RefundQueue } from "@/components/admin/billing/RefundQueue";

export default function RefundQueuePage() {
    const { t } = useLanguage();

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "STAFF"]}>
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/billing">
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <ArrowLeft size={20} />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    <RefreshCcw className="text-primary" />
                                    Refund Management
                                </h1>
                                <p className="text-muted-foreground">Approve and track service credit reversals</p>
                            </div>
                        </div>
                    </div>

                    <RefundQueue />
                </main>
            </div>
        </AuthGuard>
    );
}
