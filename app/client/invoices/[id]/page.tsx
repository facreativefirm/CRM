"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, CreditCard, CheckCircle } from "lucide-react";
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

export default function ClientInvoiceDetailsPage() {
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
            router.push("/client/billing");
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
            const { pdf } = await import('@react-pdf/renderer');
            // Assuming InvoicePDF component is shared and accessible. 
            // If it imports admin-specifc types, this might break, but usually PDF components are generic.
            // Adjust path if necessary.
            const { InvoicePDF } = await import('@/components/pdf/InvoicePDF');

            const blob = await pdf(
                <InvoicePDF invoice={invoice as any} appName={settings.appName || 'WHMCS CRM'} />
            ).toBlob();

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
        <AuthGuard allowedRoles={["CLIENT"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300 print:bg-white print:text-black">
                <div className="print:hidden">
                    <Navbar />
                    <Sidebar />
                </div>

                <main className="pl-0 lg:pl-75 pt-20 p-8 flex justify-center print:p-0 print:pt-0 print:pl-0 print:m-0">
                    <div className="w-full max-w-4xl space-y-8 print:w-full print:max-w-none">

                        {/* Header Actions - Hidden in Print */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                            <div className="flex items-center gap-4">
                                <Link href="/client/billing">
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
                                <Button variant="outline" onClick={handleDownload} className="gap-2">
                                    <Download size={16} />
                                    Download PDF
                                </Button>
                                {invoice.status === 'UNPAID' && (
                                    <Link href={`/client/checkout?invoiceId=${invoice.id}`}>
                                        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
                                            <CreditCard size={16} />
                                            Pay Now
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Invoice Content */}
                        <div
                            ref={componentRef}
                            className="bg-card text-card-foreground rounded-[2rem] p-8 md:p-12 shadow-xl border border-border/50 print:shadow-none print:border-none print:rounded-none print:bg-white print:text-black print:p-8"
                            id="invoice-content"
                        >
                            {/* Invoice Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start border-b border-border/10 pb-8 mb-8 gap-8">
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
                                <div className="text-left md:text-right">
                                    <h1 className="text-4xl font-light text-primary/80 mb-2">INVOICE</h1>
                                    <p className="font-mono text-lg">#{invoice.invoiceNumber || invoice.id}</p>
                                    <p className="text-sm text-muted-foreground mt-1">Date: {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}</p>
                                    <p className="text-sm text-muted-foreground">Due Date: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>

                            {/* Client & Company Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
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
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Payment Method</h3>
                                    <div className="bg-secondary/10 rounded-xl p-4 border border-border/50">
                                        {invoice.status === 'PAID' ? (
                                            <div className="flex items-center gap-3 text-emerald-500">
                                                <CheckCircle size={20} />
                                                <span className="font-bold">Paid with {invoice.paymentMethod || 'Credit Balance'}</span>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">
                                                <p className="mb-2">Payment pending. Please choose a method to complete the transaction.</p>
                                                <Link href={`/client/checkout?invoiceId=${invoice.id}`} className="text-primary hover:underline font-medium">
                                                    Proceed to Payment &rarr;
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="mb-12 overflow-x-auto">
                                <table className="w-full text-left min-w-[500px]">
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
                                        <span>{formatPrice(invoice.tax || 0)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-border flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-primary">{formatPrice(invoice.totalAmount)}</span>
                                    </div>
                                    {invoice.status === 'PAID' && (
                                        <div className="pt-2 text-right">
                                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest border border-emerald-500/20 px-2 py-1 rounded bg-emerald-50/10">
                                                Paid in Full
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes Section */}
                            {invoice.notes && (
                                <div className="mt-12 pt-8 border-t border-border/10">
                                    <h4 className="font-semibold text-sm mb-2 opacity-50 uppercase tracking-widest px-1">Notes</h4>
                                    <div className="text-sm bg-secondary/10 p-4 rounded-2xl border border-white/5 whitespace-pre-wrap">
                                        {invoice.notes}
                                    </div>
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
                }
            `}</style>
        </AuthGuard>
    );
}
