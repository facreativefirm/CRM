"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LifeBuoy, AlertTriangle, CheckCircle, Clock, Loader2, Search, Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { DepartmentForm } from "@/components/admin/support/DepartmentForm";
import { PredefinedReplyForm } from "@/components/admin/support/PredefinedReplyForm";
import { Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Megaphone, LayoutGrid, FileText, Mail } from "lucide-react";

export default function AdminSupportPage() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get("tab") || "tickets";

    const [tickets, setTickets] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [replies, setReplies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ awaiting: 0, open: 0, onHold: 0, closed: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [deptSheetOpen, setDeptSheetOpen] = useState(false);
    const [replySheetOpen, setReplySheetOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<any>(null);
    const [editingReply, setEditingReply] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ticketsRes, departmentsRes, repliesRes] = await Promise.all([
                api.get("/support/tickets"),
                api.get("/support/departments"),
                api.get("/support/predefined-replies")
            ]);

            const ticketData = ticketsRes.data.data.tickets || [];
            setTickets(ticketData);
            setDepartments(departmentsRes.data.data.departments || []);
            setReplies(repliesRes.data.data.replies || []);

            // Calculate stats
            setStats({
                awaiting: ticketData.filter((t: any) => t.status === 'AWAITING_REPLY').length,
                open: ticketData.filter((t: any) => t.status === 'OPEN').length,
                onHold: ticketData.filter((t: any) => t.status === 'ON_HOLD').length,
                closed: ticketData.filter((t: any) => t.status === 'CLOSED').length,
            });
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load support data");
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (value: string) => {
        router.push(`/admin/support?tab=${value}`);
    };

    const handleDeleteReply = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this macro?")) return;
        try {
            await api.delete(`/support/predefined-replies/${id}`);
            toast.success("Macro deleted");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete macro");
        }
    };

    const handleDeleteDept = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this department?")) return;
        try {
            await api.delete(`/support/departments/${id}`);
            toast.success("Department deleted");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete department");
        }
    };

    const ticketColumns = [
        {
            header: "Ticket #",
            accessorKey: "ticketNumber" as any,
            cell: (item: any) => (
                <Link href={`/admin/support/${item.id}`} className="font-bold text-primary hover:underline">
                    {item.ticketNumber}
                </Link>
            )
        },
        {
            header: "Client",
            accessorKey: "client" as any,
            cell: (item: any) => (
                <Link href={`/admin/clients/${item.clientId}`} className="hover:text-primary">
                    <span className="font-bold">{item.client?.user?.firstName} {item.client?.user?.lastName}</span>
                    <p className="text-[10px] text-muted-foreground">{item.client?.companyName}</p>
                </Link>
            )
        },
        {
            header: "Subject",
            accessorKey: "subject" as any,
            cell: (item: any) => (
                <Link href={`/admin/support/${item.id}`} className="hover:text-primary transition-colors">
                    <span className="font-semibold block max-w-[300px] truncate">{item.subject}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{item.department?.name || 'General Support'}</span>
                </Link>
            )
        },
        {
            header: "Priority",
            accessorKey: "priority" as any,
            cell: (item: any) => (
                <Badge variant={item.priority === 'HIGH' || item.priority === 'URGENT' ? 'destructive' : 'outline'} className="text-[10px] font-black tracking-widest px-3">
                    {item.priority}
                </Badge>
            )
        },
        {
            header: "Status",
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge variant={
                    item.status === 'OPEN' ? 'success' :
                        item.status === 'AWAITING_REPLY' ? 'warning' :
                            item.status === 'ANSWERED' ? 'info' :
                                item.status === 'CLOSED' ? 'secondary' :
                                    'default'
                } className="font-bold text-[10px] rounded-lg">
                    {item.status}
                </Badge>
            )
        },
        {
            header: "Last Update",
            accessorKey: "lastReplyDate" as any,
            cell: (item: any) => {
                const date = new Date(item.lastReplyDate || item.updatedAt);
                const now = new Date();
                const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
                if (diffHours < 1) return 'Just now';
                if (diffHours < 24) return `${diffHours}h ago`;
                return `${Math.floor(diffHours / 24)}d ago`;
            }
        },
        {
            header: t("actions"),
            accessorKey: "id" as any,
            cell: (item: any) => (
                <Link href={`/admin/support/${item.id}`}>
                    <Button variant="outline" size="sm" className="font-black text-[10px] uppercase tracking-widest h-8 rounded-lg">
                        {t("reply")}
                    </Button>
                </Link>
            )
        }
    ];

    const filteredTickets = tickets.filter(t => {
        const matchesSearch =
            t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${t.client?.user?.firstName} ${t.client?.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "STAFF"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">{t("support_center") || "Support Center"}</h1>
                            <p className="text-muted-foreground mt-1 font-medium">{t("support_description") || "Manage and resolve customer inquiries with enterprise velocity."}</p>
                        </div>
                        <Link href="/admin/support/new">
                            <Button className="h-12 px-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2">
                                <Plus size={18} /> {t("open_new_ticket") || "Open New Ticket"}
                            </Button>
                        </Link>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'awaiting_reply', count: stats.awaiting, color: 'text-rose-500', bg: 'bg-rose-500/10', icon: AlertTriangle, status: 'AWAITING_REPLY' },
                            { label: 'open_tickets', count: stats.open, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock, status: 'OPEN' },
                            { label: 'answered', count: stats.onHold, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle, status: 'ANSWERED' },
                            { label: 'on_hold', count: stats.onHold, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: LifeBuoy, status: 'ON_HOLD' }
                        ].map((stat, idx) => (
                            <button
                                key={idx}
                                onClick={() => setStatusFilter(stat.status)}
                                className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between hover:border-primary/30 transition-all group text-left shadow-sm"
                            >
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t(stat.label)}</p>
                                    <h3 className="text-3xl font-extrabold tracking-tight">{stat.count}</h3>
                                </div>
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", stat.bg, stat.color)}>
                                    <stat.icon size={24} />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Controls & List */}
                    <div className="space-y-6">
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                                <TabsList className="bg-secondary/30 p-1 rounded-xl h-auto flex flex-wrap border border-border">
                                    <TabsTrigger value="tickets" className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest">
                                        {t("ticket_queue")}
                                    </TabsTrigger>
                                    <TabsTrigger value="replies" className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest">
                                        {t("predefined_replies")}
                                    </TabsTrigger>
                                    <TabsTrigger value="departments" className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest">
                                        {t("departments")}
                                    </TabsTrigger>
                                    <TabsTrigger value="network" className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest">
                                        {t("network_issues")}
                                    </TabsTrigger>
                                </TabsList>

                                {activeTab === 'tickets' && (
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search tickets..."
                                            className="pl-10 h-10 rounded-xl bg-background/50 border-border/50"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <TabsContent value="tickets" className="mt-0 space-y-6">
                                {/* Sub-Tabs for Ticket Status */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {['all', 'OPEN', 'AWAITING_REPLY', 'ANSWERED', 'ON_HOLD', 'CLOSED'].map((status) => (
                                        <Button
                                            key={status}
                                            variant={statusFilter === status ? "default" : "outline"}
                                            size="sm"
                                            className={cn(
                                                "rounded-lg font-medium text-xs h-8 px-4",
                                                statusFilter === status ? "shadow-md" : "bg-transparent"
                                            )}
                                            onClick={() => setStatusFilter(status)}
                                        >
                                            {status}
                                        </Button>
                                    ))}
                                </div>

                                <div className="glass rounded-[2rem] p-6 space-y-6">
                                    {loading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div key={i} className="flex gap-4 p-4 items-center bg-white/5 rounded-2xl border border-white/5">
                                                    <Skeleton className="w-12 h-12 rounded-xl" />
                                                    <div className="space-y-2 flex-1">
                                                        <Skeleton className="h-4 w-1/4" />
                                                        <Skeleton className="h-3 w-1/6" />
                                                    </div>
                                                    <Skeleton className="h-8 w-24 rounded-lg" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : filteredTickets.length === 0 ? (
                                        <EmptyState
                                            icon={FileText}
                                            title="No tickets found"
                                            description="No tickets match your current filters."
                                            actionLabel={t("open_new_ticket")}
                                            onAction={() => router.push('/admin/support/new')}
                                        />
                                    ) : (
                                        <DataTable columns={ticketColumns} data={filteredTickets} />
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="replies">
                                <div className="glass rounded-[2rem] p-6 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold">Macro Library</h3>
                                            <p className="text-sm text-muted-foreground">Manage pre-written support responses.</p>
                                        </div>
                                        <Button
                                            onClick={() => { setEditingReply(null); setReplySheetOpen(true); }}
                                            className="shadow-lg shadow-primary/20 gap-2"
                                        >
                                            <Plus size={16} /> Add New Reply
                                        </Button>
                                    </div>

                                    {loading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                                        </div>
                                    ) : replies.length === 0 ? (
                                        <EmptyState
                                            icon={FileText}
                                            title="No Macros Found"
                                            description="Capture common responses here to accelerate ticket resolution."
                                            actionLabel="Create First Macro"
                                            onAction={() => { setEditingReply(null); setReplySheetOpen(true); }}
                                        />
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {replies.map((reply) => (
                                                <div key={reply.id} className="p-6 rounded-2xl bg-secondary/10 border border-white/5 hover:border-primary/20 transition-all space-y-4 group">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-base line-clamp-1">{reply.title}</h4>
                                                        <Badge variant="outline" className="text-[10px]">{reply.category}</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed min-h-[60px]">
                                                        {reply.message}
                                                    </p>
                                                    <div className="pt-4 flex justify-between items-center border-t border-white/5">
                                                        <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                                            Used {reply.usedCount || 0} times
                                                        </span>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => { setEditingReply(reply); setReplySheetOpen(true); }}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <FileText size={14} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteReply(reply.id)}
                                                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="departments">
                                <div className="glass rounded-[2rem] p-6 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold">Departments</h3>
                                            <p className="text-sm text-muted-foreground">Manage support sectors.</p>
                                        </div>
                                        <Button
                                            onClick={() => { setEditingDept(null); setDeptSheetOpen(true); }}
                                            className="shadow-lg shadow-emerald-500/10 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                        >
                                            <Plus size={16} /> New Department
                                        </Button>
                                    </div>

                                    {loading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                                        </div>
                                    ) : departments.length === 0 ? (
                                        <EmptyState
                                            icon={LayoutGrid}
                                            title="No Departments Registered"
                                            description="Organize your support team into specialized sectors."
                                            actionLabel="Register First Sector"
                                            onAction={() => { setEditingDept(null); setDeptSheetOpen(true); }}
                                        />
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {departments.map((dept) => (
                                                <div
                                                    key={dept.id}
                                                    className="p-6 rounded-2xl bg-secondary/10 border border-white/5 flex flex-col items-center text-center space-y-4 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
                                                >
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => { setEditingDept(dept); setDeptSheetOpen(true); }}
                                                            className="h-8 w-8"
                                                        >
                                                            <LayoutGrid size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteDept(dept.id)}
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <LifeBuoy size={32} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold">{dept.name}</h4>
                                                        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                                                            <Mail size={10} /> {dept.email}
                                                        </p>
                                                    </div>
                                                    <Badge variant={dept.autoresponderEnabled ? "success" : "outline"}>
                                                        {dept.autoresponderEnabled ? "Auto-Reply On" : "Manual"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="network">
                                <div className="glass rounded-[2rem] p-12 text-center space-y-8">
                                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
                                        <CheckCircle size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                                            All Systems Operational
                                        </h3>
                                        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                                            No reported incidents or planned maintenance.
                                        </p>
                                    </div>
                                    <Button variant="outline" className="gap-2">
                                        <AlertTriangle size={16} /> Declare Network Incident
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>

                {/* Management Sheets */}
                <Sheet open={deptSheetOpen} onOpenChange={setDeptSheetOpen}>
                    <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
                        <SheetHeader className="mb-6">
                            <SheetTitle>
                                {editingDept ? "Edit Department" : "Add New Department"}
                            </SheetTitle>
                            <SheetDescription>
                                Configure a specialized support sector.
                            </SheetDescription>
                        </SheetHeader>
                        <DepartmentForm
                            initialData={editingDept}
                            onSuccess={() => { setDeptSheetOpen(false); fetchData(); }}
                            onCancel={() => setDeptSheetOpen(false)}
                        />
                    </SheetContent>
                </Sheet>

                <Sheet open={replySheetOpen} onOpenChange={setReplySheetOpen}>
                    <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
                        <SheetHeader className="mb-6">
                            <SheetTitle>
                                {editingReply ? "Edit Reply" : "Add Predefined Reply"}
                            </SheetTitle>
                            <SheetDescription>
                                Create a standard response template.
                            </SheetDescription>
                        </SheetHeader>
                        <PredefinedReplyForm
                            initialData={editingReply}
                            onSuccess={() => { setReplySheetOpen(false); fetchData(); }}
                            onCancel={() => setReplySheetOpen(false)}
                        />
                    </SheetContent>
                </Sheet>
            </div>
        </AuthGuard >
    );
}
