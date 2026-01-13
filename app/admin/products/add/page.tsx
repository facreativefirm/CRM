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
import { ProductForm } from "@/components/admin/products/ProductForm";

export default function AddProductPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const serviceId = searchParams.get("serviceId") || undefined;

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-0 md:pl-75 pt-20 p-8 flex justify-center">
                    <div className="w-full max-w-4xl space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <Link href="/admin/products">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/50">
                                    <ArrowLeft size={20} />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold">Add New Product</h1>
                                <p className="text-muted-foreground">Create a new service or plan for your store catalog.</p>
                            </div>
                        </div>

                        <div className="glass rounded-[2rem] p-10 border border-white/5 shadow-2xl">
                            <ProductForm
                                serviceId={serviceId}
                                onSuccess={() => router.push("/admin/products")}
                                onCancel={() => router.push("/admin/products")}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
