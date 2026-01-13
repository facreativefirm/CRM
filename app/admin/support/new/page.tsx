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
import { useRouter } from "next/navigation";
import {
    Loader2,
    Plus,
    User,
    ShieldAlert,
    MessageSquare,
    AlertCircle,
    ArrowLeft,
    Send,
    Layers
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { ClientSelector } from "@/components/shared/ClientSelector";
import { cn } from "@/lib/utils";

export default function NewTicketPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        clientId: "",
        subject: "",
        priority: "MEDIUM",
        departmentId: "",
        message: "",
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/support/departments");
            setDepartments(response.data.data.departments || []);
            if (response.data.data.departments?.length > 0) {
                setFormData(prev => ({ ...prev, departmentId: response.data.data.departments[0].id.toString() }));
            }
        } catch (err) {
            console.error("Error fetching departments:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientId) return toast.error("Please select a client");
        if (!formData.departmentId) return toast.error("Please select a department");

        setLoading(true);
        try {
            const response = await api.post("/support/tickets", {
                ...formData,
                clientId: parseInt(formData.clientId),
                departmentId: parseInt(formData.departmentId)
            });
            toast.success("Ticket opened successfully");
            router.push(`/admin/support/${response.data.data.ticket.id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to open ticket");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "STAFF"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-secondary/50"
                                onClick={() => router.push("/admin/support")}
                            >
                                <ArrowLeft size={20} />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold">
                                    {t("open_new_ticket") || "Open New Ticket"}
                                </h1>
                                <p className="text-muted-foreground mt-1">Create a new support request for a client.</p>
                            </div>
                        </div>

                        <div className="glass rounded-[2rem] p-10 border border-white/5 shadow-2xl">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Client Selection */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <User size={14} /> Client
                                        </Label>
                                        <ClientSelector
                                            value={formData.clientId ? parseInt(formData.clientId) : undefined}
                                            onChange={(val: number) => setFormData({ ...formData, clientId: val.toString() })}
                                        />
                                    </div>

                                    {/* Department Selection */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Layers size={14} /> Department
                                        </Label>
                                        <Select
                                            value={formData.departmentId}
                                            onValueChange={(val) => setFormData({ ...formData, departmentId: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-background/50">
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Subject */}
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <MessageSquare size={14} /> Subject
                                        </Label>
                                        <Input
                                            placeholder="Brief summary of the inquiry..."
                                            className="h-12 rounded-xl bg-background/50"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {/* Priority */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <ShieldAlert size={14} /> Priority
                                        </Label>
                                        <Select
                                            value={formData.priority}
                                            onValueChange={(val) => setFormData({ ...formData, priority: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-background/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LOW">Low</SelectItem>
                                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                                <SelectItem value="HIGH" className="text-rose-400 font-bold">High</SelectItem>
                                                <SelectItem value="URGENT" className="text-rose-500 font-black">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <AlertCircle size={14} /> Message
                                    </Label>
                                    <Textarea
                                        placeholder="Detail the issue or inquiry here..."
                                        className="min-h-[220px] rounded-2xl p-6 bg-background/50 resize-none font-medium"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        size="lg"
                                        className="rounded-xl px-8 shadow-lg shadow-primary/20"
                                    >
                                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                                        Open Ticket
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
