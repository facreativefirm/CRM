"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import {
    Server,
    Search,
    Filter,
    RefreshCw,
    Loader2,
    Globe,
    Database,
    ShieldCheck,
    ArrowUpRight,
    User,
    Settings
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminServicesPage() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const typeParam = searchParams.get('type');

    const [services, setServices] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(typeParam || "all");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (typeParam && categories.length > 0) {
            // Recursive search for the category slug in the tree
            const findNode = (nodes: any[]): any | null => {
                for (const node of nodes) {
                    if (node.slug.toLowerCase() === typeParam.toLowerCase() ||
                        node.slug.toLowerCase().replace(/-/g, '') === typeParam.toLowerCase()) {
                        return node;
                    }
                    if (node.subServices?.length) {
                        const result = findNode(node.subServices);
                        if (result) return result;
                    }
                }
                return null;
            };

            const match = findNode(categories);
            if (match) setFilter(match.slug);
            else setFilter(typeParam);
        } else if (typeParam) {
            setFilter(typeParam);
        }
    }, [typeParam, categories]);

    useEffect(() => {
        fetchData();
    }, []);

    // Memoize the allowed slugs for the current filter (including all descendants)
    const allowedSlugs = React.useMemo(() => {
        if (filter === 'all') return [];

        const findNode = (nodes: any[]): any | null => {
            for (const node of nodes) {
                if (node.slug.toLowerCase() === filter.toLowerCase()) return node;
                if (node.subServices?.length) {
                    const result = findNode(node.subServices);
                    if (result) return result;
                }
            }
            return null;
        };

        const collectSlugs = (node: any, slugs: string[]) => {
            slugs.push(node.slug.toLowerCase());
            node.subServices?.forEach((child: any) => collectSlugs(child, slugs));
        };

        const targetNode = findNode(categories);
        if (!targetNode) return [filter.toLowerCase()];

        const slugs: string[] = [];
        collectSlugs(targetNode, slugs);
        return slugs;
    }, [filter, categories]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [servicesRes, categoriesRes] = await Promise.all([
                api.get("/services"),
                api.get("/products/services")
            ]);
            setServices(servicesRes.data.data.services || []);
            setCategories(categoriesRes.data.data.services || []);
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load global services registry");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: "Product / Domain",
            accessorKey: "domain" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110",
                        item.product?.productType === 'HOSTING' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                            item.product?.productType === 'RESELLER' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                                item.product?.productType === 'VPS' ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                                    "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    )}>
                        {item.product?.productType === 'HOSTING' ? <Globe size={20} /> :
                            item.product?.productType === 'RESELLER' ? <Database size={20} /> :
                                item.product?.productType === 'VPS' ? <Server size={20} /> :
                                    <ShieldCheck size={20} />}
                    </div>
                    <div>
                        <p className="font-black text-foreground text-lg tracking-tight">{item.product?.name}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{item.domain || "no domain"}</p>
                    </div>
                </div>
            )
        },
        {
            header: "Client Entity",
            accessorKey: "client" as any,
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <User size={14} className="text-muted-foreground" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">
                        {item.client?.user?.firstName} {item.client?.user?.lastName}
                    </span>
                </div>
            )
        },
        {
            header: "Renewal Cycle",
            accessorKey: "nextDueDate" as any,
            cell: (item: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-white/80">
                        {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : "N/A"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{item.billingCycle} cycle</span>
                </div>
            )
        },
        {
            header: "Infrastructure Status",
            accessorKey: "status" as any,
            cell: (item: any) => (
                <Badge variant={item.status === 'ACTIVE' ? 'success' : item.status === 'PENDING' ? 'warning' : 'destructive'} className="px-4 py-1.5 rounded-xl font-black text-[10px] tracking-[0.2em]">
                    {item.status}
                </Badge>
            )
        },
        {
            header: "Protocol",
            accessorKey: "id" as any,
            cell: (item: any) => (
                <div className="flex gap-2">
                    <Link href={`/admin/services/${item.id}`}>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border-white/10 hover:bg-primary hover:text-white transition-all">
                            <Settings size={16} />
                        </Button>
                    </Link>
                    <Link href={`/admin/clients/${item.clientId}`}>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border-white/10 hover:bg-white/10">
                            <ArrowUpRight size={16} />
                        </Button>
                    </Link>
                </div>
            )
        }
    ];

    const filteredServices = services.filter(s => {
        const domainMatch = (s.domain || "").toLowerCase().includes(searchTerm.toLowerCase());
        const clientMatch = `${s.client?.user?.firstName} ${s.client?.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = domainMatch || clientMatch;

        // Match by ProductService slug hierarchy or productType
        const matchesType = filter === 'all' ||
            allowedSlugs.includes(s.product?.service?.slug?.toLowerCase()) ||
            s.product?.productType === filter;
        return matchesSearch && matchesType;
    });

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "STAFF"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8">
                    <div className="max-w-7xl mx-auto space-y-12">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic">
                                    {t("infrastructure") || "Infrastructure"}
                                </h1>
                                <p className="text-muted-foreground mt-1 text-lg font-medium">Master command for all active hosting, VPS, and reseller deployments.</p>
                            </div>
                            <Link href="/admin/services/add">
                                <Button className="h-16 px-10 rounded-[2rem] font-black text-lg gap-3 shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Server size={24} /> {t("provision_new") || "Provision New"}
                                </Button>
                            </Link>
                        </div>

                        {/* Controls & Tabs */}
                        <div className="flex flex-col space-y-8">
                            <Tabs value={filter} className="w-full" onValueChange={setFilter}>
                                <TabsList className="bg-card/40 backdrop-blur-md p-1.5 rounded-[2rem] border border-border h-16 inline-flex gap-2">
                                    <TabsTrigger
                                        value="all"
                                        className="rounded-[1.5rem] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-full"
                                    >
                                        {t("all")} {t("services")}
                                    </TabsTrigger>
                                    {categories.map((cat) => (
                                        <TabsTrigger
                                            key={cat.id}
                                            value={cat.slug}
                                            className="rounded-[1.5rem] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-full"
                                        >
                                            {cat.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>

                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by Domain or Client..."
                                        className="pl-12 h-14 rounded-2xl bg-card/40 border-border/50 focus:border-primary/50 text-sm font-bold"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-14 w-14 rounded-2xl bg-card/40 border-white/5 hover:bg-card"
                                    onClick={fetchData}
                                >
                                    <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
                                </Button>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden p-8"
                        >
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                    <p className="text-muted-foreground font-black uppercase tracking-widest text-xs animate-pulse tracking-[0.3em]">Querying Core Node Registry...</p>
                                </div>
                            ) : (
                                <DataTable columns={columns} data={filteredServices} />
                            )}
                        </motion.div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
