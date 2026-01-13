"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Loader2,
    Plus,
    ShieldAlert,
    MessageSquare,
    AlertCircle,
    ArrowLeft,
    Send,
    Layers,
    Sparkles
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

export default function NewClientTicketPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        subject: searchParams.get("subject") || "",
        priority: "MEDIUM",
        departmentId: "",
        message: "",
        serviceId: searchParams.get("serviceId") || "",
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/support/departments");
            const depts = response.data.data.departments || [];
            setDepartments(depts);
            if (depts.length > 0) {
                setFormData(prev => ({ ...prev, departmentId: depts[0].id.toString() }));
            }
        } catch (err) {
            console.error("Error fetching departments:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.departmentId) return toast.error("Please select a department");
        if (!formData.subject.trim()) return toast.error("Subject is required");
        if (!formData.message.trim()) return toast.error("Message is required");

        setLoading(true);
        try {
            const payload: any = {
                subject: formData.subject,
                priority: formData.priority,
                departmentId: parseInt(formData.departmentId),
                message: formData.message,
            };

            if (formData.serviceId) {
                payload.serviceId = parseInt(formData.serviceId);
            }

            const response = await api.post("/support/tickets", payload);
            toast.success("Ticket opened successfully. Our team will respond shortly.");
            router.push(`/support/${response.data.data.ticket.id}`);
        } catch (err: any) {
            console.error("Ticket error:", err);
            toast.error(err.response?.data?.message || "Failed to open ticket");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard allowedRoles={["CLIENT", "RESELLER", "ADMIN", "STAFF"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Header */}
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl bg-secondary/30 border-border hover:bg-primary hover:text-white transition-all"
                                    onClick={() => router.push("/support")}
                                >
                                    <ArrowLeft size={18} />
                                </Button>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                            {t("open_new_ticket") || "New Support Inquiry"}
                                        </h1>
                                        <Badge variant="warning" className="font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-lg border-none shadow-sm shadow-amber-500/20">Technical Hub</Badge>
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-xs md:text-sm font-medium">Initialize a secure communication channel with our experts and systems.</p>
                                </div>
                            </div>
                        </header>

                        <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                                <Sparkles size={180} />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Department Selection */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Layers size={14} className="text-primary" /> Select Department
                                        </Label>
                                        <Select
                                            value={formData.departmentId}
                                            onValueChange={(val) => setFormData({ ...formData, departmentId: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-secondary/20 border-border font-semibold focus:ring-primary/20">
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border">
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()} className="rounded-lg">
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Priority */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <ShieldAlert size={14} className="text-primary" /> Priority Level
                                        </Label>
                                        <Select
                                            value={formData.priority}
                                            onValueChange={(val) => setFormData({ ...formData, priority: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-secondary/20 border-border font-semibold focus:ring-primary/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border">
                                                <SelectItem value="LOW" className="rounded-lg">Normal</SelectItem>
                                                <SelectItem value="MEDIUM" className="rounded-lg">Standard</SelectItem>
                                                <SelectItem value="HIGH" className="text-rose-500 font-bold rounded-lg">High Priority</SelectItem>
                                                <SelectItem value="URGENT" className="text-rose-600 font-black rounded-lg uppercase tracking-wider">Critical Response</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Subject */}
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <MessageSquare size={14} className="text-primary" /> Subject Header
                                        </Label>
                                        <Input
                                            placeholder="What can we help you with today?"
                                            className="h-12 rounded-xl bg-secondary/20 border-border font-semibold focus:ring-primary/20"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <AlertCircle size={14} className="text-primary" /> Detailed Inquiry
                                    </Label>
                                    <Textarea
                                        placeholder="Please provide as much detail as possible so our engineeers can assist you quickly..."
                                        className="min-h-[200px] rounded-2xl p-6 bg-secondary/20 border-border resize-none font-semibold focus:ring-primary/20"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground font-medium italic">* Markdown formatting is supported for code snippets and logs.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Average Response: 14 Minutes</span>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="h-14 w-full sm:w-auto px-10 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                        Open Support Ticket
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
