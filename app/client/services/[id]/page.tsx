"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    Server,
    Globe,
    CreditCard,
    ShieldCheck,
    Key,
    Terminal,
    Activity,
    ArrowLeft,
    ExternalLink,
    Lock,
    Unlock,
    Settings,
    AlertCircle,
    Loader2,
    XCircle,
    Clock,
    Paperclip,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function ClientServiceDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { formatPrice } = useSettingsStore();
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelType, setCancelType] = useState("END_OF_CYCLE");
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [changePassModalOpen, setChangePassModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [renewing, setRenewing] = useState(false);

    useEffect(() => {
        fetchService();
    }, [id]);

    const fetchService = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/services/${id}`);
            setService(response.data.data.service);
        } catch (error) {
            toast.error("Failed to load service details");
            router.push("/client/services");
        } finally {
            setLoading(false);
        }
    };

    const handleRenew = async (period: number) => {
        try {
            setRenewing(true);
            const response = await api.post(`/services/${id}/request-renewal`, { period });

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

    const handleLaunchConsole = () => {
        if (service.status !== 'ACTIVE') {
            toast.error("Console is only available for active services");
            return;
        }

        toast.info("Establishing secure connection to gateway...");
        setTimeout(() => {
            if (service.domain) {
                window.open(`https://${service.domain}`, '_blank');
            } else if (service.ipAddress) {
                window.open(`http://${service.ipAddress}:2083`, '_blank');
            } else {
                toast.success("Redirecting to Management Console");
            }
        }, 1500);
    };

    const handleCancelRequest = async () => {
        if (!cancelReason || cancelReason.length < 10) {
            toast.error("Please provide a detailed reason (at least 10 characters)");
            return;
        }

        try {
            setIsCancelling(true);
            await api.post("/services/cancel", {
                serviceId: parseInt(id as string),
                reason: cancelReason,
                type: cancelType
            });
            toast.success("Cancellation request submitted successfully");
            setCancelModalOpen(false);
        } catch (error) {
            toast.error("Failed to submit cancellation request");
        } finally {
            setIsCancelling(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmNewPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        try {
            setIsChangingPass(true);
            await api.post(`/services/${id}/change-password`, { password: newPassword });
            toast.success("Service access key updated successfully");
            setChangePassModalOpen(false);
            setNewPassword("");
            setConfirmNewPassword("");
            fetchService();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update password");
        } finally {
            setIsChangingPass(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground animate-pulse font-bold tracking-widest text-[10px] uppercase">Mounting Cloud Instance...</p>
        </div>
    );

    if (!service) return null;

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
                                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{service.product?.name}</h1>
                                        <Badge
                                            variant={
                                                service.status === 'ACTIVE' ? 'success' :
                                                    service.status === 'PENDING' ? 'warning' : 'destructive'
                                            }
                                            className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border-none"
                                        >
                                            {service.status}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground font-medium mt-1 text-sm">{service.domain || "Internal Node Connection"}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <Button
                                    disabled={service.status === 'PENDING'}
                                    onClick={handleLaunchConsole}
                                    className="h-12 px-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 w-full md:w-auto transition-all active:scale-95"
                                >
                                    <ExternalLink size={18} />
                                    {service.status === 'PENDING' ? 'Provisioning Assets...' : 'Launch Management Console'}
                                </Button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {service.status === 'PENDING' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 mt-4"
                                >
                                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-amber-600">Action Required: Settlement Pending</p>
                                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                                            Your asset acquisition protocol is currently in the settlement phase. Management consoles and computational resources will be authorized immediately upon invoice clearance.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Info Column */}
                            <div className="lg:col-span-2 space-y-8">
                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="bg-card/50 p-1 rounded-2xl border border-border/50 mb-6">
                                        <TabsTrigger value="overview" className="rounded-xl px-8 font-bold">Overview</TabsTrigger>
                                        <TabsTrigger value="management" className="rounded-xl px-8 font-bold">Management</TabsTrigger>
                                        <TabsTrigger value="billing" className="rounded-xl px-8 font-bold">Billing</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-6 mt-6">
                                        {/* Server Credentials */}
                                        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Terminal className="text-primary" size={20} />
                                                Authentication & Gateway
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1 p-4 rounded-xl bg-secondary/20 border border-border/50">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Username</p>
                                                    <p className="font-mono text-sm font-bold">{service.username || "admin"}</p>
                                                </div>
                                                <div className="space-y-1 p-4 rounded-xl bg-secondary/20 border border-border/50 relative">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Access Key</p>
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-mono text-sm font-bold">
                                                            {showPassword ? (service.passwordHash || service.password || "Not Set") : "••••••••••••"}
                                                        </p>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                                        >
                                                            {showPassword ? <Unlock size={14} /> : <Lock size={14} />}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 p-4 rounded-xl bg-secondary/20 border border-border/50">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Primary IPv4</p>
                                                    <p className="font-mono text-sm font-bold text-primary">{service.ipAddress || "Pending Assignment"}</p>
                                                </div>
                                                <div className="space-y-1 p-4 rounded-xl bg-secondary/20 border border-border/50">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Assigned DNS</p>
                                                    <p className="text-xs font-bold leading-tight uppercase tracking-tight">ns1.company.com<br />ns2.company.com</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Usage Stats (Mock) */}
                                        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Activity className="text-emerald-500" size={20} />
                                                Compute Resources
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                                                        <span className="text-muted-foreground">Network Bandwidth</span>
                                                        <span className="text-primary">45% Usage</span>
                                                    </div>
                                                    <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: "45%" }}
                                                            className="h-full bg-primary"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                                                        <span className="text-muted-foreground">Storage Matrix</span>
                                                        <span className="text-emerald-500">22% Peak</span>
                                                    </div>
                                                    <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: "22%" }}
                                                            className="h-full bg-emerald-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="management" className="space-y-6">
                                        <div className="bg-card/50 border border-border/50 rounded-[2.5rem] p-8">
                                            <h3 className="text-xl font-bold mb-6">Service Management</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                <Dialog open={changePassModalOpen} onOpenChange={setChangePassModalOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" className="h-24 rounded-2xl flex flex-col gap-2 font-bold bg-white/5 border-white/10 hover:border-primary/50">
                                                            <Key size={24} className="text-primary" />
                                                            Change Password
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-card/95 backdrop-blur-3xl border-border rounded-3xl max-w-sm">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-xl font-extrabold tracking-tight">Rotate Access Key</DialogTitle>
                                                            <DialogDescription className="text-muted-foreground font-medium pt-2">
                                                                Update the secret key used to access your service terminal.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Access Key</Label>
                                                                <Input
                                                                    type="password"
                                                                    className="h-12 rounded-xl bg-secondary/30 border-border/50 font-bold"
                                                                    value={newPassword}
                                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirm Key</Label>
                                                                <Input
                                                                    type="password"
                                                                    className="h-12 rounded-xl bg-secondary/30 border-border/50 font-bold"
                                                                    value={confirmNewPassword}
                                                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button
                                                                onClick={handleChangePassword}
                                                                disabled={isChangingPass}
                                                                className="w-full rounded-xl bg-primary text-primary-foreground font-bold h-11"
                                                            >
                                                                {isChangingPass ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                                                Update Credentials
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>

                                                <Button asChild variant="outline" className="h-24 rounded-2xl flex flex-col gap-2 font-bold bg-white/5 border-white/10 hover:border-emerald-500/50">
                                                    <Link href={`/support/new?serviceId=${service.id}&subject=${encodeURIComponent(`Upgrade/Downgrade Request for ${service.product?.name}`)}`}>
                                                        <Settings size={24} className="text-emerald-500" />
                                                        Upgrade/Downgrade
                                                    </Link>
                                                </Button>

                                                <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" className="h-24 rounded-2xl flex flex-col gap-2 font-bold bg-white/5 border-white/10 hover:border-rose-500/50">
                                                            <AlertCircle size={24} className="text-rose-500" />
                                                            Cancellation
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-card/95 backdrop-blur-3xl border-border rounded-3xl max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-xl font-extrabold tracking-tight">Request Cancellation</DialogTitle>
                                                            <DialogDescription className="text-muted-foreground font-medium pt-2">
                                                                We're sorry to see you go. Please specify the type and reason for this de-provisioning request.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-6 py-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cancellation Type</Label>
                                                                <Select value={cancelType} onValueChange={setCancelType}>
                                                                    <SelectTrigger className="h-12 rounded-xl bg-secondary/30 border-border/50">
                                                                        <SelectValue placeholder="Select type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-card border-border">
                                                                        <SelectItem value="IMMEDIATE">Immediate (Permanent Wipe)</SelectItem>
                                                                        <SelectItem value="END_OF_CYCLE">End of Billing Cycle</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reason for Leaving</Label>
                                                                <Textarea
                                                                    placeholder="Tell us what went wrong..."
                                                                    className="min-h-[100px] rounded-xl bg-secondary/30 border-border/50 resize-none font-medium"
                                                                    value={cancelReason}
                                                                    onChange={(e) => setCancelReason(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter className="gap-3">
                                                            <Button variant="ghost" onClick={() => setCancelModalOpen(false)} className="rounded-xl font-bold">Nevermind</Button>
                                                            <Button
                                                                onClick={handleCancelRequest}
                                                                disabled={isCancelling}
                                                                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold px-8 h-11"
                                                            >
                                                                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                                Confirm De-provisioning
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Sidebar Info Column */}
                            <div className="space-y-8">
                                <div className="bg-card/50 border border-border/50 rounded-[2.5rem] p-8 space-y-6">
                                    <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <CreditCard size={16} /> Billing Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b border-border/50 pb-4">
                                            <span className="text-muted-foreground font-medium">Provisioned On</span>
                                            <span className="font-bold">{new Date(service.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-border/50 pb-4">
                                            <span className="text-muted-foreground font-medium">Recurring Amount</span>
                                            <span className="font-bold text-xl text-primary">{formatPrice(service.amount || 0)}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-border/50 pb-4">
                                            <span className="text-muted-foreground font-medium">Billing Cycle</span>
                                            <span className="font-bold uppercase tracking-widest text-[10px]">{service.billingCycle}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">Next Settlement</span>
                                            <span className="font-bold text-amber-500">{service.nextDueDate ? new Date(service.nextDueDate).toLocaleDateString() : 'Pending Authorization'}</span>
                                        </div>
                                    </div>
                                    <RenewalDialog
                                        t={t}
                                        loading={renewing}
                                        onRenew={handleRenew}
                                        billingCycle={service.billingCycle}
                                        status={service.status}
                                    />
                                </div>

                                <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-[2.5rem] p-8">
                                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Dedicated Support</h3>
                                    <p className="text-white/80 font-medium leading-relaxed">
                                        As a {service.product?.name} holder, you have priority access to our support engineers.
                                    </p>
                                    <Button asChild variant="outline" className="mt-6 w-full h-11 rounded-xl font-bold bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                                        <Link href={`/support/new?serviceId=${service.id}&subject=${encodeURIComponent(`Issue with ${service.product?.name}`)}`}>
                                            Open Priority Ticket
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}

function RenewalDialog({ t, loading, onRenew, billingCycle, status }: { t: any, loading: boolean, onRenew: (period: number) => void, billingCycle: string, status: string }) {
    const [period, setPeriod] = useState("1");
    const [open, setOpen] = useState(false);

    const handleConfirm = () => {
        onRenew(parseInt(period));
        setOpen(false);
    };

    const isAnnual = billingCycle?.toLowerCase() === 'annually';
    const cycleLabel = isAnnual ? 'Year' : 'Month';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    disabled={loading || status === 'PENDING'}
                    className="w-full h-12 rounded-2xl font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest text-[10px] gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={14} />}
                    {status === 'PENDING' ? 'Authorize Payment' : 'Renew Service Now'}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-3xl border-border rounded-3xl max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold tracking-tight">Renew Service</DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium pt-2">
                        Choose how many {cycleLabel.toLowerCase()}s you want to extend your service for.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Renewal Term</Label>
                        <Select value={period} onValueChange={setPeriod} defaultValue="1">
                            <SelectTrigger className="h-12 rounded-xl bg-secondary/30 border-border/50 font-bold">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectItem value="1">1 {cycleLabel}</SelectItem>
                                <SelectItem value="2">2 {cycleLabel}s</SelectItem>
                                <SelectItem value="3">3 {cycleLabel}s</SelectItem>
                                <SelectItem value="6">6 {cycleLabel}s</SelectItem>
                                <SelectItem value="12">{isAnnual ? '1 Year' : '12 Months'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full rounded-xl bg-emerald-500 text-white font-bold h-11"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Extension
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
