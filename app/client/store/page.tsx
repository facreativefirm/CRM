"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import {
    Server,
    Globe,
    ShieldCheck,
    ShoppingCart,
    Loader2,
    Filter,
    Search,
    ChevronRight,
    Zap,
    Cpu,
    HardDrive,
    CheckCircle2,
    XCircle,
    Layers,
    ArrowRight
} from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/shared/Badge";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSettingsStore } from "@/lib/store/settingsStore";

interface Product {
    id: string | number;
    name: string;
    category: string;
    productType?: string;
    price?: number | string;
    monthlyPrice?: number | string;
    annualPrice?: number | string;
    description: string;
    specs?: any;
}

interface ProductService {
    id: number;
    name: string;
    description: string;
    slug: string;
    icon?: string;
    products: Product[];
    subServices?: ProductService[];
}

export default function StoreFront() {
    const { t } = useLanguage();
    const [services, setServices] = useState<ProductService[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeServiceId, setActiveServiceId] = useState<number | "all">("all");
    const [searchTerm, setSearchTerm] = useState("");
    const { addItem, items } = useCartStore();
    const { formatPrice, fetchSettings } = useSettingsStore();

    // Domain Search State
    const [domainSearch, setDomainSearch] = useState("");
    const [checkingDomain, setCheckingDomain] = useState(false);
    const [domainResult, setDomainResult] = useState<{ name: string; available: boolean; price: number } | null>(null);

    useEffect(() => {
        fetchSettings();
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get("/products/services");
            setServices(response.data.data.services || []);
        } catch (err) {
            console.error("Error fetching product services:", err);
            // Fallback for demo
            setServices([
                {
                    id: 1,
                    name: "Web Hosting",
                    description: "High-speed hosting solutions for every need.",
                    slug: "web-hosting",
                    products: [
                        { id: "1", name: "LiteSpeed Web Hosting", category: "HOSTING", monthlyPrice: 12.50, description: "Optimized for PHP & WordPress applications.", specs: { cpu: "1 vCPU", ram: "2GB RAM", disk: "20GB NVMe" } },
                        { id: "2", name: "Premium Hosting", category: "HOSTING", monthlyPrice: 25.00, description: "Enhanced resources for business websites.", specs: { cpu: "2 vCPU", ram: "4GB RAM", disk: "50GB NVMe" } },
                    ]
                },
                {
                    id: 2,
                    name: "Cloud Servers",
                    description: "Scalable cloud infrastructure with dedicated resources.",
                    slug: "cloud-vps",
                    products: [
                        { id: "3", name: "Managed Cloud VPS", category: "HOSTING", monthlyPrice: 45.00, annualPrice: 450.00, description: "Scalable cloud instances with isolated resources.", specs: { cpu: "4 vCPU", ram: "8GB RAM", disk: "100GB NVMe" } },
                    ]
                },
                {
                    id: 3,
                    name: "Security & Domains",
                    description: "Protect and register your online identity.",
                    slug: "security-domains",
                    products: [
                        { id: "4", name: ".COM Domain", category: "DOMAIN", monthlyPrice: 12.99, annualPrice: 12.99, description: "Global standard for business websites." },
                        { id: "5", name: "PositiveSSL", category: "SSL", monthlyPrice: 15.00, annualPrice: 15.00, description: "Domain validated certificate for secure data transfer." },
                    ]
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDomainCheck = async () => {
        if (!domainSearch) return;
        setCheckingDomain(true);
        setDomainResult(null);

        // Simulate lookup
        await new Promise(r => setTimeout(r, 1200));

        const isAvailable = !domainSearch.includes("google") && !domainSearch.includes("taken");
        setDomainResult({
            name: domainSearch.includes(".") ? domainSearch : `${domainSearch}.com`,
            available: isAvailable,
            price: 12.99
        });
        setCheckingDomain(false);
    };

    const handleAddToCart = (product: any) => {
        const price = product.monthlyPrice || product.price || 0;
        const item: CartItem = {
            id: product.id.toString(),
            name: product.name,
            type: product.category || product.productType,
            price: typeof price === 'string' ? parseFloat(price) : price,
            billingCycle: "MONTHLY",
            quantity: 1,
            monthlyPrice: product.monthlyPrice,
            annualPrice: product.annualPrice || (product.monthlyPrice * 12)
        };
        addItem(item);
        toast.success(`${product.name} added to cart.`);
    };

    const handleAddDomainToCart = () => {
        if (!domainResult) return;
        const item: CartItem = {
            id: `dom-${Date.now()}`,
            name: `Domain: ${domainResult.name}`,
            domainName: domainResult.name,
            type: "DOMAIN",
            price: domainResult.price,
            billingCycle: "YEARLY",
            quantity: 1
        };
        addItem(item);
        toast.success(`${domainResult.name} added to cart.`);
        setDomainResult(null);
        setDomainSearch("");
    };

    const filteredServices = services
        .map(service => ({
            ...service,
            products: service.products.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                service.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }))
        .filter(service =>
            (activeServiceId === "all" || service.id === activeServiceId) &&
            (service.products.length > 0 || service.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <Sidebar />
            <main className="lg:pl-75 pt-20 p-4 md:p-6">
                <div className="max-w-6xl mx-auto space-y-8 pb-20">

                    {/* Domain Lookup Section */}
                    <section className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                            <Globe size={240} />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Globe className="text-primary" size={20} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 justify-center md:justify-start">Look for your<span className="text-primary tracking-tighter">Domain</span>
                                    </h1>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Input
                                        placeholder="Find your perfect domain name..."
                                        className="h-12 rounded-xl bg-secondary/20 border-border font-bold text-sm pl-5 pr-12 focus:ring-primary/20 transition-all"
                                        value={domainSearch}
                                        onChange={(e) => setDomainSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleDomainCheck()}
                                    />
                                    {checkingDomain && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                                <Button
                                    onClick={handleDomainCheck}
                                    disabled={checkingDomain || !domainSearch}
                                    className="h-12 px-10 rounded-xl font-black uppercase text-[10px] tracking-[0.1em]"
                                >
                                    Scan Availability
                                </Button>
                            </div>

                            <AnimatePresence>
                                {domainResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="pt-2"
                                    >
                                        <div className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                                            domainResult.available
                                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700"
                                                : "bg-rose-500/5 border-rose-500/20 text-rose-700"
                                        )}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-2 rounded-full",
                                                    domainResult.available ? "bg-emerald-500/10" : "bg-rose-500/10"
                                                )}>
                                                    {domainResult.available ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black tracking-tight">{domainResult.name}</p>
                                                    <p className="text-[10px] font-bold uppercase opacity-70">
                                                        {domainResult.available ? `Broadcast available - ${formatPrice(domainResult.price)}/NODE` : 'Signal already mapped - try another'}
                                                    </p>
                                                </div>
                                            </div>
                                            {domainResult.available && (
                                                <Button size="sm" onClick={handleAddDomainToCart} className="h-9 px-6 rounded-lg text-[9px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 transition-transform active:scale-95">
                                                    Secure Access
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* Navigation & Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-6 items-center justify-between py-4 border-b border-border/50">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-2 sm:pb-0">
                            <button
                                onClick={() => setActiveServiceId("all")}
                                className={cn(
                                    "px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeServiceId === "all"
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary border border-transparent"
                                )}
                            >
                                Core Registry
                            </button>
                            {services.map((service) => (
                                <button
                                    key={service.id}
                                    onClick={() => setActiveServiceId(service.id)}
                                    className={cn(
                                        "px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeServiceId === service.id
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary border border-transparent"
                                    )}
                                >
                                    {service.name}
                                </button>
                            ))}
                        </div>

                    </div>

                    {/* Service Sections */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 animate-spin text-primary/40" />
                                <Layers className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 text-primary opacity-60" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Data Modules</span>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {filteredServices.map((service) => (
                                <section key={service.id} className="space-y-6">
                                    <div className="flex flex-col gap-1 border-l-4 border-primary pl-5">
                                        <h2 className="text-xl font-black tracking-tight text-foreground uppercase">{service.name}</h2>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-80">{service.description}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <AnimatePresence mode="popLayout">
                                            {service.products.map((product) => (
                                                <motion.div
                                                    key={product.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="group"
                                                >
                                                    <div className="h-full bg-card border border-border rounded-2xl p-6 flex flex-col transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 group-hover:rotate-6 shadow-inner">
                                                                {product.category === 'HOSTING' && <Server className="w-6 h-6" />}
                                                                {product.category === 'DOMAIN' && <Globe className="w-6 h-6" />}
                                                                {product.category === 'SSL' && <ShieldCheck className="w-6 h-6" />}
                                                            </div>
                                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary px-3 py-1 rounded-full">
                                                                {product.category}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex-1 space-y-3">
                                                            <h3 className="text-base font-black tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">{product.name}</h3>
                                                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed opacity-80">
                                                                {product.description || "Deploy this high-availability node into your operational cluster."}
                                                            </p>

                                                            {product.specs && (
                                                                <div className="grid grid-cols-2 gap-2 pt-4">
                                                                    {Object.entries(product.specs).map(([key, val]: [string, any]) => (
                                                                        <div key={key} className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80 bg-secondary/20 px-3 py-1.5 rounded-lg border border-border/10">
                                                                            {key === 'cpu' && <Cpu size={12} className="text-primary" />}
                                                                            {key === 'ram' && <Zap size={12} className="text-amber-500" />}
                                                                            {key === 'disk' && <HardDrive size={12} className="text-primary" />}
                                                                            <span className="uppercase">{val}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Rate / UNIT</p>
                                                                <p className="text-xl font-black text-foreground">{formatPrice(product.monthlyPrice || product.price || 0)}<span className="text-[11px] text-muted-foreground font-bold ml-1 opacity-60">/mo</span></p>
                                                            </div>
                                                            <Button
                                                                onClick={() => handleAddToCart(product)}
                                                                className="h-7 px-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-90 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                                            >
                                                                Buy Now
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </section>
                            ))}

                            {filteredServices.length === 0 && !loading && (
                                <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-secondary/5">
                                    <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search size={32} className="text-muted-foreground opacity-30" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{searchTerm ? "No specific registry matches" : "The registry is currently offline"}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase">Modify your scan parameters and retry</p>
                                    {searchTerm && (
                                        <Button
                                            variant="link"
                                            className="mt-4 text-[10px] font-black uppercase text-primary"
                                            onClick={() => setSearchTerm("")}
                                        >
                                            Clear Scan
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
