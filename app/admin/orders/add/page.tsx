"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ShoppingCart,
    User,
    Package,
    CreditCard,
    Save,
    ArrowLeft,
    Loader2,
    Search
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { ClientSelector } from "@/components/shared/ClientSelector";
import { ProductSelector } from "@/components/shared/ProductSelector";

export default function AddOrderPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        clientId: 0,
        productId: 0,
        paymentMethod: "CREDIT_CARD",
        status: "PENDING",
        promoCode: "",
        domainName: "",
        billingCycle: "MONTHLY"
    });

    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId || !form.productId) {
            toast.error("Please select both a client and a product");
            return;
        }
        setLoading(true);
        try {
            await api.post("/orders", {
                clientId: form.clientId,
                items: [{
                    productId: form.productId,
                    quantity: 1,
                    billingCycle: form.billingCycle,
                    domainName: form.domainName || undefined
                }],
                paymentMethod: form.paymentMethod
            });
            toast.success("Order created successfully");
            router.push("/admin/orders");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create order");
        } finally {
            setLoading(false);
        }
    };

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
                                <Link href="/admin/orders">
                                    <Button variant="ghost" size="icon" className="rounded-xl">
                                        <ArrowLeft size={20} />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-bold">{t("add_new_order") || "Add New Order"}</h1>
                                    <p className="text-muted-foreground mt-1">{t("manual_order_desc") || "Place a manual order on behalf of a client."}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                            >
                                {/* Client & Product Selection */}
                                <div className="glass rounded-[2rem] p-8 space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Package className="text-primary" size={20} />
                                        {t("order_items") || "Order Items"}
                                    </h3>

                                    <div className="space-y-2">
                                        <Label>{t("select_client") || "Select Client"}</Label>
                                        <ClientSelector
                                            value={form.clientId}
                                            onChange={val => setForm({ ...form, clientId: val })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t("select_product") || "Select Product"}</Label>
                                        <ProductSelector
                                            value={form.productId}
                                            onChange={(val, prod) => {
                                                setForm({ ...form, productId: val });
                                                setSelectedProduct(prod);
                                            }}
                                        />
                                    </div>

                                    {form.productId > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="space-y-4 pt-4 border-t border-white/5"
                                        >
                                            <div className="space-y-2">
                                                <Label>{t("domain_name") || "Domain Name (Optional)"}</Label>
                                                <Input
                                                    value={form.domainName}
                                                    onChange={e => setForm({ ...form, domainName: e.target.value })}
                                                    placeholder="example.com"
                                                    className="h-12 rounded-xl bg-background/50 border-border/50"
                                                />
                                                {selectedProduct?.productType === 'DOMAIN' && (
                                                    <p className="text-xs text-amber-500 font-medium">* Required for Domain Registration</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>{t("billing_cycle") || "Billing Cycle"}</Label>
                                                <Select
                                                    value={form.billingCycle}
                                                    onValueChange={val => setForm({ ...form, billingCycle: val })}
                                                >
                                                    <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                        <SelectItem value="ANNUALLY">Annually</SelectItem>
                                                        <SelectItem value="BIENNIALLY">Biennially</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Payment & Status */}
                                <div className="glass rounded-[2rem] p-8 space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <CreditCard className="text-primary" size={20} />
                                        {t("payment_billing") || "Payment & Billing"}
                                    </h3>

                                    <div className="space-y-2">
                                        <Label>{t("payment_method") || "Payment Method"}</Label>
                                        <Select
                                            value={form.paymentMethod}
                                            onValueChange={val => setForm({ ...form, paymentMethod: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CREDIT_CARD">Credit Card / Gateway</SelectItem>
                                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                                <SelectItem value="BKASH">bKash (Direct)</SelectItem>
                                                <SelectItem value="NAGAD">Nagad (Direct)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t("promo_code") || "Promo Code"}</Label>
                                        <Input
                                            value={form.promoCode}
                                            onChange={e => setForm({ ...form, promoCode: e.target.value })}
                                            className="h-12 rounded-xl bg-background/50 border-border/50"
                                            placeholder="GIFT2025"
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            <div className="flex justify-end gap-3">
                                <Link href="/admin/orders">
                                    <Button type="button" variant="outline" className="h-12 px-6 rounded-xl font-medium">
                                        {t("cancel")}
                                    </Button>
                                </Link>
                                <Button
                                    disabled={loading}
                                    className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <ShoppingCart size={18} />}
                                    {t("place_order") || "Place Order"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
