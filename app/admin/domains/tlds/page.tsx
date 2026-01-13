"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";
import { DataTable } from "@/components/shared/DataTable";
import {
    Plus,
    Search,
    Globe,
    Settings,
    Trash2,
    DollarSign,
    ExternalLink,
    Clock,
    ShieldCheck
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { DomainTLDForm } from "@/components/admin/domains/DomainTLDForm";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useSettingsStore } from "@/lib/store/settingsStore";

export default function TLDManagementPage() {
    const { t } = useLanguage();
    const { formatPrice } = useSettingsStore();
    const [tlds, setTlds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTLD, setEditingTLD] = useState<any>(null);

    const fetchTLDs = async () => {
        setLoading(true);
        try {
            const response = await api.get("/domains/tlds");
            setTlds(response.data.data.tlds);
        } catch (error) {
            toast.error("Failed to load TLDs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTLDs();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this TLD?")) return;
        try {
            await api.delete(`/domains/tlds/${id}`);
            toast.success("TLD deleted");
            fetchTLDs();
        } catch (error) {
            toast.error("Failed to delete TLD");
        }
    };

    const handleEdit = (tld: any) => {
        setEditingTLD(tld);
        setIsSheetOpen(true);
    };

    const filteredTLDs = tlds.filter((t: any) =>
        t.tld.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        {
            header: "Extension",
            accessorKey: "tld",
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Globe size={16} />
                    </div>
                    <div>
                        <span className="font-black text-lg tracking-tighter uppercase">{item.tld}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Pricing",
            accessorKey: "registrationPrice",
            cell: (item: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20">REG: {formatPrice(item.registrationPrice)}</Badge>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">RO: {formatPrice(item.renewalPrice)}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">TR: {formatPrice(item.transferPrice)}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Features",
            accessorKey: "dnsManagement",
            cell: (item: any) => (
                <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                    {item.dnsManagement && <Badge variant="secondary" className="text-[8px] uppercase tracking-tighter">DNS</Badge>}
                    {item.emailForwarding && <Badge variant="secondary" className="text-[8px] uppercase tracking-tighter">Email</Badge>}
                    {item.idProtection && <Badge variant="secondary" className="text-[8px] uppercase tracking-tighter">Privacy</Badge>}
                    {item.eppRequired && <Badge variant="destructive" className="text-[8px] uppercase tracking-tighter">EPP</Badge>}
                </div>
            )
        },
        {
            header: "Registrar",
            accessorKey: "registrar",
            cell: (item: any) => (
                <span className="text-xs font-mono font-bold text-muted-foreground">{item.registrar || "MANUAL"}</span>
            )
        },
        {
            header: "Actions",
            accessorKey: "id",
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors">
                        <Settings size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive transition-colors">
                        <Trash2 size={14} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                        <div>
                            <h1 className="text-3xl font-bold">TLD Pricing & Extensions</h1>
                            <p className="text-muted-foreground">Configure domain extension pricing, registrar modules, and tech features.</p>
                        </div>

                        <div className="flex flex-wrap gap-4 relative z-10">
                            <Sheet open={isSheetOpen} onOpenChange={(open) => {
                                setIsSheetOpen(open);
                                if (!open) setEditingTLD(null);
                            }}>
                                <SheetTrigger asChild>
                                    <Button className="h-14 px-8 rounded-2xl font-black shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all gap-2 group">
                                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                        Add Extension
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-full sm:max-w-xl bg-background/95 backdrop-blur-2xl border-l border-white/5">
                                    <SheetHeader className="mb-8">
                                        <SheetTitle className="text-2xl font-black uppercase tracking-tighter">
                                            {editingTLD ? "Edit Extension" : "New Domain pricing"}
                                        </SheetTitle>
                                        <SheetDescription>
                                            Configure pricing and technical parameters for the domain extension.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <DomainTLDForm
                                        initialData={editingTLD}
                                        onSuccess={() => {
                                            setIsSheetOpen(false);
                                            fetchTLDs();
                                        }}
                                        onCancel={() => setIsSheetOpen(false)}
                                    />
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: "Active TLDs", value: tlds.length, icon: Globe, color: "text-blue-500" },
                            { label: "Providers", value: new Set(tlds.map((t: any) => t.registrar)).size, icon: Settings, color: "text-purple-500" },
                            { label: "Average Profit", value: formatPrice(4.50), icon: DollarSign, color: "text-emerald-500" },
                        ].map((stat, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={stat.label}
                                className="bg-card/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden group"
                            >
                                <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
                                    <stat.icon size={64} />
                                </div>
                                <div className="space-y-1 relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="bg-card/40 border border-white/5 rounded-[2.5rem] backdrop-blur-xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by extension (e.g. .com)..."
                                    className="pl-12 h-12 bg-secondary/30 border-none rounded-xl font-medium focus-visible:ring-primary/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <DataTable
                            columns={columns}
                            data={filteredTLDs}
                            loading={loading}
                        />

                        {!loading && filteredTLDs.length === 0 && (
                            <div className="p-20 text-center space-y-4">
                                <div className="inline-flex p-6 rounded-full bg-secondary/20 text-muted-foreground mb-4">
                                    <Globe size={48} className="opacity-20" />
                                </div>
                                <h3 className="text-xl font-bold">No Extensions Found</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    Start by adding your first domain extension and configure its registration pricing.
                                </p>
                                <Button variant="outline" onClick={() => setIsSheetOpen(true)} className="rounded-xl font-bold">
                                    Add Extension Now
                                </Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
