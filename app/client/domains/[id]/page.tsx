"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    Globe,
    ShieldCheck,
    CreditCard,
    ArrowLeft,
    Loader2,
    Settings,
    RefreshCw,
    Lock,
    Unlock,
    Shield,
    ExternalLink,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function ClientDomainDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { formatPrice } = useSettingsStore();
    const [domain, setDomain] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [renewing, setRenewing] = useState(false);

    useEffect(() => {
        fetchDomain();
    }, [id]);

    const fetchDomain = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/domains/${id}`);
            setDomain(response.data.data.domain);
        } catch (error) {
            toast.error("Failed to load domain details");
            router.push("/client/domains");
        } finally {
            setLoading(false);
        }
    };

    const handleRenew = async (period: number) => {
        try {
            setRenewing(true);
            const response = await api.post(`/domains/${id}/request-renewal`, { period });

            if (response.data.status === 'success') {
                toast.success("Renewal invoice generated");
                router.push(`/client/invoices/${response.data.data.invoiceId}`);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to initiate renewal");
        } finally {
            setRenewing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!domain) return null;

    return (
        <AuthGuard allowedRoles={["CLIENT", "RESELLER", "ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Header & Status */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-6">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => router.back()}
                                    className="h-10 w-10 rounded-xl bg-secondary/30 border-border hover:bg-primary hover:text-white transition-all"
                                >
                                    <ArrowLeft size={18} />
                                </Button>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{domain.domainName}</h1>
                                        <Badge
                                            variant={domain.status === 'ACTIVE' ? 'success' : 'warning'}
                                            className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border-none"
                                        >
                                            {domain.status}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground font-medium mt-1 text-sm">
                                        Registered via {domain.registrar || "Secure Registrar"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <RenewalDialog
                                    t={t}
                                    loading={renewing}
                                    onRenew={handleRenew}
                                />
                            </div>
                        </div>

                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="bg-card/50 p-1 rounded-2xl border border-border/50 mb-6">
                                <TabsTrigger value="overview" className="rounded-xl px-8 font-bold">
                                    {t("overview") || "Overview"}
                                </TabsTrigger>
                                <TabsTrigger value="dns" className="rounded-xl px-8 font-bold">
                                    {t("nameservers") || "Nameservers"}
                                </TabsTrigger>
                                <TabsTrigger value="tools" className="rounded-xl px-8 font-bold">
                                    {t("management") || "Management"}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="mt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                                        <div className="flex items-center gap-3 text-primary">
                                            <Clock className="w-5 h-5" />
                                            <h3 className="font-bold uppercase tracking-widest text-[10px]">{t("registration") || "Registration"}</h3>
                                        </div>
                                        <p className="text-2xl font-black">{new Date(domain.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                                        <div className="flex items-center gap-3 text-warning">
                                            <Activity className="w-5 h-5" />
                                            <h3 className="font-bold uppercase tracking-widest text-[10px]">{t("expiry_date") || "Expiry Date"}</h3>
                                        </div>
                                        <p className="text-2xl font-black">{new Date(domain.expiryDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                                        <div className="flex items-center gap-3 text-success">
                                            <ShieldCheck className="w-5 h-5" />
                                            <h3 className="font-bold uppercase tracking-widest text-[10px]">{t("auto_renewal") || "Auto Renewal"}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-2xl font-black">{domain.autoRenew ? "Enabled" : "Disabled"}</p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="dns" className="mt-6 space-y-6">
                                <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold">{t("nameserver_management") || "Nameserver Management"}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">Configure where your domain points to.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4">
                                        {[1, 2, 3, 4].map(idx => (
                                            <div key={idx} className="flex flex-col space-y-1.5 font-mono text-sm border-b border-border pb-4 last:border-0 last:pb-0">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Nameserver {idx}</span>
                                                <span className="text-foreground">ns{idx}.fusionhosting.com</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="tools" className="mt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between group hover:border-primary/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                                <Lock className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Registrar Lock</h4>
                                                <p className="text-xs text-muted-foreground">Prevent unauthorized transfers</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-lg font-bold uppercase text-[9px] tracking-widest">
                                            Enabled
                                        </Button>
                                    </div>

                                    <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between group hover:border-primary/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">WHOIS Privacy</h4>
                                                <p className="text-xs text-muted-foreground">Hide your personal information</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-lg font-bold uppercase text-[9px] tracking-widest text-primary border-primary/30">
                                            Manage
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}

// Helper icons that were missing
function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

function RenewalDialog({ t, loading, onRenew }: { t: any, loading: boolean, onRenew: (period: number) => void }) {
    const [period, setPeriod] = useState("1");
    const [open, setOpen] = useState(false);

    const handleConfirm = () => {
        onRenew(parseInt(period));
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    disabled={loading}
                    className="h-12 px-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 w-full md:w-auto transition-all active:scale-95"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={18} />}
                    {t("renew_now") || "Renew Domain"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Renew Domain</DialogTitle>
                    <DialogDescription>
                        Choose how long you want to renew your domain for.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="period" className="text-right">
                            Period
                        </Label>
                        <Select value={period} onValueChange={setPeriod} defaultValue="1">
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Year</SelectItem>
                                <SelectItem value="2">2 Years</SelectItem>
                                <SelectItem value="3">3 Years</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleConfirm} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Renewal
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
