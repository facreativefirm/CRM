"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Mail, Share2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { cn } from "@/lib/utils";

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface Invoice {
    id: number;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    status: string;
    subtotal: number;
    tax: number;
    totalAmount: number;
    notes?: string;
    client: {
        id: number;
        companyName?: string;
        user: {
            firstName: string;
            lastName: string;
            email: string;
        };
        contacts?: {
            address1?: string;
            city?: string;
            country?: string;
        }[];
    };
    items: InvoiceItem[];
}

export default function InvoiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { settings, fetchSettings, formatPrice } = useSettingsStore();
    const [invoice, setInvoice] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchSettings();
        fetchInvoice();
    }, [params.id]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/invoices/${params.id}`);
            if (response.data.status === 'success') {
                setInvoice(response.data.data.invoice);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load invoice details");
            router.push("/admin/billing");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (!invoice) return;

        try {
            // Dynamically import React PDF
            const { pdf } = await import('@react-pdf/renderer');
            // Import the component we created
            const { InvoicePDF } = await import('@/components/pdf/InvoicePDF');

            // Generate PDF
            const blob = await pdf(
                <InvoicePDF invoice={invoice as any} appName={settings.appName || 'WHMCS CRM'} />
            ).toBlob();

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("PDF downloaded successfully");
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!invoice) return null;

    const clientName = invoice.client.user ? `${invoice.client.user.firstName} ${invoice.client.user.lastName}` : (invoice.client.companyName || 'Valued Client');
    const contact = invoice.client.contacts?.[0];

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300 print:bg-white print:text-black">
                <div className="print:hidden">
                    <Navbar />
                    <Sidebar />
                </div>

                <main className="pl-0 md:pl-75 pt-20 p-8 flex justify-center print:p-0 print:pt-0 print:pl-0 print:m-0">
                    <div className="w-full max-w-4xl space-y-8 print:w-full print:max-w-none">

                        {/* Header Actions - Hidden in Print */}
                        <div className="flex items-center justify-between print:hidden">
                            <div className="flex items-center gap-4">
                                <Link href="/admin/billing">
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <ArrowLeft size={20} />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-bold">Invoice #{invoice.invoiceNumber || invoice.id}</h1>
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                        invoice.status === 'PAID' ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" :
                                            invoice.status === 'UNPAID' ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
                                                "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                                    )}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handlePrint} className="gap-2">
                                    <Printer size={16} />
                                    Print
                                </Button>
                                <Button variant="default" onClick={handleDownload} className="gap-2">
                                    <Download size={16} />
                                    Download PDF
                                </Button>
                            </div>
                        </div>

                        {/* Invoice Content */}
                        <div
                            ref={componentRef}
                            className="bg-card text-card-foreground rounded-[2rem] p-12 shadow-xl border border-border/50 print:shadow-none print:border-none print:rounded-none print:bg-white print:text-black print:p-8"
                            id="invoice-content"
                        >
                            {/* Invoice Header */}
                            <div className="flex justify-between items-start border-b border-border/10 pb-8 mb-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                                            W
                                        </div>
                                        <h2 className="text-2xl font-bold text-primary">{settings.appName || 'WHMCS CRM'}</h2>
                                    </div>
                                    <div className="text-sm text-muted-foreground print:text-gray-600">
                                        <p>123 Hosting Street</p>
                                        <p>Dhaka, Bangladesh</p>
                                        <p>support@whmcscrm.com</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-4xl font-light text-primary/80 mb-2">INVOICE</h1>
                                    <p className="font-mono text-lg">#{invoice.invoiceNumber || invoice.id}</p>
                                    <p className="text-sm text-muted-foreground mt-1">Date: {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}</p>
                                    <p className="text-sm text-muted-foreground">Due Date: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>

                            {/* Client & Company Info */}
                            <div className="grid grid-cols-2 gap-12 mb-12">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Bill To</h3>
                                    <div className="font-medium text-lg mb-1">
                                        {clientName}
                                    </div>
                                    {invoice.client.companyName && (
                                        <div className="text-muted-foreground mb-1">{invoice.client.companyName}</div>
                                    )}
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        {contact ? (
                                            <>
                                                <p>{contact.address1}</p>
                                                <p>{contact.city} {contact.country}</p>
                                            </>
                                        ) : (
                                            <p className="italic opacity-50">No address on file</p>
                                        )}
                                        <p>{invoice.client.user.email}</p>
                                    </div>
                                </div>
                                {/* Could add Payment Method info here if available */}
                            </div>

                            {/* Table */}
                            <div className="mb-12">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            <th className="py-3 font-semibold text-sm text-muted-foreground w-1/2">Description</th>
                                            <th className="py-3 font-semibold text-sm text-muted-foreground text-center">Qty</th>
                                            <th className="py-3 font-semibold text-sm text-muted-foreground text-right">Unit Price</th>
                                            <th className="py-3 font-semibold text-sm text-muted-foreground text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10">
                                        {invoice.items.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="py-4">
                                                    <p className="font-medium">{item.description}</p>
                                                </td>
                                                <td className="py-4 text-center text-muted-foreground">
                                                    {item.quantity}
                                                </td>
                                                <td className="py-4 text-right text-muted-foreground">
                                                    {formatPrice(item.unitPrice)}
                                                </td>
                                                <td className="py-4 text-right font-medium">
                                                    {formatPrice(item.total || (item.quantity * item.unitPrice))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(invoice.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Tax</span>
                                        <span>{formatPrice(invoice.taxAmount || 0)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-border flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-primary">{formatPrice(invoice.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            {(invoice.notes || invoice.adminNotes) && (
                                <div className="mt-12 pt-8 border-t border-border/10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {invoice.notes && (
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 opacity-50 uppercase tracking-widest px-1">Client Notes</h4>
                                            <div className="text-sm bg-secondary/10 p-4 rounded-2xl border border-white/5 whitespace-pre-wrap">
                                                {invoice.notes}
                                            </div>
                                        </div>
                                    )}
                                    {invoice.adminNotes && (
                                        <div className="print:hidden">
                                            <h4 className="font-semibold text-sm mb-2 opacity-50 uppercase tracking-widest px-1 text-amber-500">Internal Admin Notes</h4>
                                            <div className="text-sm bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 text-amber-200/80 whitespace-pre-wrap italic">
                                                {invoice.adminNotes}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-12 text-center text-xs text-muted-foreground print:mt-20">
                                <p>Thank you for your business.</p>
                                <p className="mt-1">Generated by {settings.appName || 'WHMCS CRM'}</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white; color: black; }
                    /* Ensure Bangla fonts work if system has them, generally modern browsers handle this */
                }
            `}</style>
        </AuthGuard>
    );
}
