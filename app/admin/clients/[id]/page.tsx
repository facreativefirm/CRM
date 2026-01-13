"use client";

import React, { useState, useEffect, use } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import {
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Package,
    Globe,
    Ticket,
    Shield,
    History,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    Settings,
    ArrowUpRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";
import { DataTable } from "@/components/shared/DataTable";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ClientProfilePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const { id } = params;
    const { t } = useLanguage();
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
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
    if (!client) return <div className="flex items-center justify-center h-screen">Client not found</div>;

    const primaryContact = client.contacts?.find((c: any) => c.isPrimary) || client.contacts?.[0];

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Client Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card/50 backdrop-blur-xl border border-border/50 p-8 rounded-[2.5rem]">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold border border-primary/30">
                                    {client.user?.firstName?.[0] || '?'}{client.user?.lastName?.[0] || '?'}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-extrabold tracking-tight">{client.user?.firstName} {client.user?.lastName}</h1>
                                        <Badge variant={client.status === 'ACTIVE' ? 'success' : 'secondary'}>{t(client.status?.toLowerCase()) || client.status}</Badge>
                                    </div>
                                    <p className="text-muted-foreground flex items-center gap-2 font-medium">
                                        <Mail size={14} /> {client.user?.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground/80 font-mono italic">
                                        {t("client_id") || "ID"}: {client.id} • {t("registered") || "Registered"}: {new Date(client.clientSince || client.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="rounded-xl px-6 h-12 font-bold hover:bg-primary/5 border-primary/20 text-primary">Login as Client</Button>
                                <Link href={`/admin/clients/${id}/edit`}>
                                    <Button className="rounded-xl px-6 h-12 font-bold shadow-lg shadow-primary/20">Edit Profile</Button>
                                </Link>
                                <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 border border-border/50">
                                    <MoreVertical size={20} />
                                </Button>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <Tabs defaultValue="summary" className="space-y-8">
                            <TabsList className="bg-card/30 backdrop-blur-md p-1.5 rounded-2xl border border-border/50 self-start h-auto flex-wrap">
                                <TabsTrigger value="summary" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                    <History size={16} className="mr-2" /> {t("summary") || "Summary"}
                                </TabsTrigger>
                                <TabsTrigger value="services" className="rounded-xl px-6 py-2.5 font-bold transition-all">
                                    <Package size={16} className="mr-2" /> {t("services") || "Services"}
                                </TabsTrigger>
                                <TabsTrigger value="domains" className="rounded-xl px-6 py-2.5 font-bold transition-all">
                                    <Globe size={16} className="mr-2" /> {t("domains") || "Domains"}
                                </TabsTrigger>
                                <TabsTrigger value="billing" className="rounded-xl px-6 py-2.5 font-bold transition-all">
                                    <CreditCard size={16} className="mr-2" /> {t("billing") || "Billing"}
                                </TabsTrigger>
                                <TabsTrigger value="support" className="rounded-xl px-6 py-2.5 font-bold transition-all">
                                    <Ticket size={16} className="mr-2" /> {t("support") || "Support"}
                                </TabsTrigger>
                                <TabsTrigger value="security" className="rounded-xl px-6 py-2.5 font-bold transition-all">
                                    <Shield size={16} className="mr-2" /> {t("security") || "Security"}
                                </TabsTrigger>
                            </TabsList>

                            {/* Summary Tab */}
                            <TabsContent value="summary" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Stats Cards */}
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="bg-card/50 border border-border/50 p-6 rounded-3xl space-y-2 hover:border-primary/50 transition-colors">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("active_services") || "Active Services"}</p>
                                            <p className="text-3xl font-black">{client.services?.length || 0}</p>
                                        </div>
                                        <div className="bg-card/50 border border-border/50 p-6 rounded-3xl space-y-2 hover:border-rose-500/50 transition-colors">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("unpaid_invoices") || "Unpaid Invoices"}</p>
                                            <p className="text-3xl font-black text-rose-500">{client.invoices?.filter((i: any) => i.status === 'UNPAID').length || 0}</p>
                                        </div>
                                        <div className="bg-card/50 border border-border/50 p-6 rounded-3xl space-y-2 hover:border-emerald-500/50 transition-colors">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("total_revenue") || "Total Revenue"}</p>
                                            <p className="text-3xl font-black text-emerald-500">
                                                ${client.invoices?.filter((i: any) => i.status === 'PAID').reduce((sum: number, i: any) => sum + (Number(i.totalAmount) || 0), 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl space-y-4">
                                        <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Quick Actions</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" className="justify-start font-bold bg-background/50 border-primary/20 hover:bg-primary/10">Add Order</Button>
                                            <Button variant="outline" className="justify-start font-bold bg-background/50 border-primary/20 hover:bg-primary/10">Add Credit</Button>
                                            <Button variant="outline" className="justify-start font-bold bg-background/50 border-primary/20 hover:bg-primary/10">New Ticket</Button>
                                            <Button variant="outline" className="justify-start font-bold bg-background/50 border-primary/20 hover:bg-primary/10">Manage IP</Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Client Details */}
                                    <div className="bg-card/50 border border-border/50 rounded-3xl overflow-hidden">
                                        <div className="p-6 border-b border-border/50 bg-white/5">
                                            <h3 className="font-black text-lg">Contact Information</h3>
                                        </div>
                                        <div className="p-8 space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500"><Mail size={20} /></div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t("email_address") || "Email Address"}</p>
                                                    <p className="font-bold">{client.user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500"><Phone size={20} /></div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t("phone_number") || "Phone Number"}</p>
                                                    <p className="font-bold">{primaryContact?.phone || 'Not provided'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500"><MapPin size={20} /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Address</p>
                                                    <p className="font-bold">{primaryContact?.address1 || 'No address'}</p>
                                                    <p className="text-sm text-muted-foreground">{primaryContact?.city}, {primaryContact?.state}, {primaryContact?.zip}</p>
                                                    <p className="text-sm text-muted-foreground">{primaryContact?.country}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="bg-card/50 border border-border/50 rounded-3xl overflow-hidden">
                                        <div className="p-6 border-b border-border/50 bg-white/5">
                                            <h3 className="font-black text-lg">Recent Feedback & Activities</h3>
                                        </div>
                                        <div className="p-8">
                                            <div className="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-border/50">
                                                {[
                                                    { title: "Invoice Paid", desc: "Payment for Invoice #10293 received via Stripe", time: "2 hours ago", icon: CheckCircle2, color: "text-emerald-500" },
                                                    { title: "Service Suspended", desc: "cPanel - primary (domain.com) suspended for overusage", time: "Yesterday", icon: XCircle, color: "text-rose-500" },
                                                    { title: "Support Ticket", desc: "New response to 'Site is down' ticket", time: "3 days ago", icon: Ticket, color: "text-blue-500" },
                                                ].map((act, i) => (
                                                    <div key={i} className="relative pl-12">
                                                        <div className={`absolute left-4 top-0 -translate-x-1/2 p-2 rounded-full bg-background border border-border/50 ${act.color}`}>
                                                            <act.icon size={16} />
                                                        </div>
                                                        <p className="text-sm font-black">{act.title}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">{act.desc}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-widest">{act.time}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Services Tab */}
                            <TabsContent value="services" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-card/50 border border-border/50 rounded-3xl overflow-hidden p-6">
                                    <DataTable
                                        columns={[
                                            {
                                                header: t("product_service") || "Product/Service",
                                                accessorKey: "id" as any,
                                                cell: (item: any) => (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{item.product?.name || "Generic Service"}</span>
                                                        <span className="text-[10px] font-mono text-muted-foreground">{item.domain || "no-domain"}</span>
                                                    </div>
                                                )
                                            },
                                            { header: t("pricing") || "Pricing", accessorKey: "amount" as any, cell: (item: any) => `$${item.amount}` },
                                            {
                                                header: t("next_due_date") || "Next Due Date",
                                                accessorKey: "nextDueDate" as any,
                                                cell: (item: any) => item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : "N/A"
                                            },
                                            {
                                                header: t("status") || "Status",
                                                accessorKey: "status" as any,
                                                cell: (item: any) => (
                                                    <Badge variant={item.status === 'ACTIVE' ? 'success' : item.status === 'PENDING' ? 'warning' : 'secondary'}>
                                                        {t(item.status?.toLowerCase()) || item.status}
                                                    </Badge>
                                                )
                                            },
                                            {
                                                header: t("actions") || "Actions",
                                                accessorKey: "id" as any,
                                                cell: (item: any) => (
                                                    <div className="flex gap-2">
                                                        <Link href={`/admin/services/${item.id}`}>
                                                            <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 font-bold">
                                                                <Settings size={14} /> {t("manage") || "Manage"}
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                )
                                            }
                                        ]}
                                        data={client.services || []}
                                    />
                                </div>
                            </TabsContent>

                            {/* Billing Tab */}
                            <TabsContent value="billing" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-card/50 border border-border/50 rounded-3xl overflow-hidden p-6">
                                    <DataTable
                                        columns={[
                                            { header: t("invoice_num") || "Invoice #", accessorKey: "invoiceNumber" as any },
                                            {
                                                header: t("date") || "Date",
                                                accessorKey: "createdAt" as any,
                                                cell: (item: any) => new Date(item.createdAt).toLocaleDateString()
                                            },
                                            {
                                                header: t("total") || "Total",
                                                accessorKey: "totalAmount" as any,
                                                cell: (item: any) => (
                                                    <span className="font-bold text-foreground">
                                                        {item.currency || "$"} {item.totalAmount}
                                                    </span>
                                                )
                                            },
                                            {
                                                header: t("status") || "Status",
                                                accessorKey: "status" as any,
                                                cell: (item: any) => (
                                                    <Badge variant={item.status === 'PAID' ? 'success' : item.status === 'UNPAID' ? 'destructive' : 'secondary'}>
                                                        {t(item.status?.toLowerCase()) || item.status}
                                                    </Badge>
                                                )
                                            },
                                            {
                                                header: t("actions") || "Actions",
                                                accessorKey: "id" as any,
                                                cell: (item: any) => (
                                                    <div className="flex gap-2">
                                                        <Link href={`/admin/billing/${item.id}`}>
                                                            <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 font-bold">
                                                                <ArrowUpRight size={14} /> {t("view") || "View"}
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                )
                                            }
                                        ]}
                                        data={client.invoices || []}
                                    />
                                </div>
                            </TabsContent>

                            {/* Domains Tab */}
                            <TabsContent value="domains" className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-card/50 border border-border/50 rounded-3xl overflow-hidden p-6">
                                    <DataTable
                                        columns={[
                                            { header: "Domain Name", accessorKey: "domain" as any, cell: (item: any) => <span className="font-mono font-bold">{item.domain || "no-domain"}</span> },
                                            { header: "Linked Service", accessorKey: "product" as any, cell: (item: any) => item.product?.name || "Hosting" },
                                            { header: "Status", accessorKey: "status" as any, cell: (item: any) => <Badge variant={item.status === 'ACTIVE' ? 'success' : 'secondary'}>{item.status}</Badge> },
                                            {
                                                header: "Actions",
                                                accessorKey: "id" as any,
                                                cell: (item: any) => (
                                                    <Link href={`/admin/services/${item.id}`}>
                                                        <Button variant="ghost" size="sm" className="font-bold gap-2">
                                                            <Settings size={14} /> Configure
                                                        </Button>
                                                    </Link>
                                                )
                                            }
                                        ]}
                                        data={client.services?.filter((s: any) => s.domain) || []}
                                    />
                                    {(!client.services || client.services.filter((s: any) => s.domain).length === 0) && (
                                        <div className="p-12 text-center text-muted-foreground italic">
                                            No active service domains found for this client.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="support" className="animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-card/50 border border-border/50 rounded-3xl p-12 text-center text-muted-foreground">
                                    No support history found.
                                </div>
                            </TabsContent>
                            <TabsContent value="security" className="animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-card/50 border border-border/50 rounded-3xl p-12 text-center text-muted-foreground">
                                    Security logs and preferences.
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
