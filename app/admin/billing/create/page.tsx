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
import { ArrowLeft, Loader2, Plus, Trash2, FileText, Save } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSettingsStore } from "@/lib/store/settingsStore";

import { ClientSelector } from "@/components/shared/ClientSelector";
import { ProductSelector } from "@/components/shared/ProductSelector";

export default function CreateInvoicePage() {
    const { t } = useLanguage();
    const { formatPrice, fetchSettings } = useSettingsStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        clientId: 0,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: "",
        adminNotes: ""
    });

    React.useEffect(() => {
        fetchSettings();
    }, []);

    const [items, setItems] = useState([
        { description: "", amount: "" }
    ]);

    const addItem = () => {
        setItems([...items, { description: "", amount: "" }]);
    };

    const addProductItem = (prodId: number, product?: any) => {
        if (!product) return;
        setItems([...items, {
            description: product.name + (product.productType ? ` (${product.productType})` : ""),
            amount: (product.monthlyPrice || 0).toString()
        }]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                clientId: formData.clientId,
                date: new Date(formData.date),
                dueDate: new Date(formData.dueDate),
                notes: formData.notes,
                adminNotes: formData.adminNotes,
                items: items.map(item => ({
                    description: item.description,
                    amount: parseFloat(item.amount)
                }))
            };

            await api.post("/invoices", payload);
            toast.success("Invoice created successfully");
            router.push("/admin/billing");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to create invoice");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8 flex justify-center">
                    <div className="w-full max-w-4xl space-y-8">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/billing">
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <ArrowLeft size={20} />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold">{t("create_invoice") || "Create Invoice"}</h1>
                                <p className="text-muted-foreground">{t("admin_billing_desc") || "Generate a custom invoice for a client."}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 space-y-8">
                            {/* Invoice Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="clientId">Client</Label>
                                    <ClientSelector
                                        value={formData.clientId}
                                        onChange={(val) => setFormData({ ...formData, clientId: val })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Invoice Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        required
                                        className="bg-background/50"
                                    />
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-lg">Line Items</Label>
                                    <div className="flex gap-2">
                                        <div className="w-[200px]">
                                            <ProductSelector
                                                onChange={addProductItem}
                                                className="w-full"
                                            />
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                                            <Plus size={14} /> Add Empty Row
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex gap-4 items-start">
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Description"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    required
                                                    className="bg-background/50"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={item.amount}
                                                    onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                                    required
                                                    className="bg-background/50 text-right"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeItem(index)}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4 border-t border-border/50">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">{t("total") || "Total"}</p>
                                        <p className="text-2xl font-bold">{formatPrice(calculateTotal())}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Client Notes (Visible on Invoice)</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="bg-background/50 min-h-[80px]"
                                        placeholder="Enter terms, payment instructions, etc."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminNotes">Admin Notes (Hidden from Client)</Label>
                                    <Textarea
                                        id="adminNotes"
                                        value={formData.adminNotes}
                                        onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                                        className="bg-background/50 min-h-[80px]"
                                        placeholder="Internal notes about this invoice."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" disabled={isLoading} className="gap-2 px-8 h-12 text-base shadow-lg shadow-primary/25">
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                    Create Invoice
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
