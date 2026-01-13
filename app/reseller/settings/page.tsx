"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import {
    Palette,
    Globe,
    Upload,
    Save,
    Loader2,
    Monitor,
    Layout,
    Sliders,
    Image as ImageIcon,
    Code,
    BarChart,
    ChevronRight,
    Search,
    Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/shared/Badge";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function ResellerSettingsPage() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [brandName, setBrandName] = useState("Pro Hosting Solutions");
    const [primaryColor, setPrimaryColor] = useState("#3b82f6");
    const [accentColor, setAccentColor] = useState("#10b981");

    const handleSave = async () => {
        try {
            setLoading(true);
            // Simulate saving
            await new Promise(r => setTimeout(r, 1200));
            toast.success("Identity profile updated successfully!");
        } catch (err) {
            toast.error("Protocol error: Failed to save identity.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard allowedRoles={["RESELLER"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header Section */}
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                    White-Label <span className="text-primary">Identity</span>
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium">Engineer your unique storefront identity and portal environment.</p>
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="h-12 px-8 rounded-xl font-bold shadow-md gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 w-full md:w-auto"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save size={20} /> Deploy Protocol</>}
                            </Button>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Main Configuration Tabs */}
                            <div className="lg:col-span-2">
                                <Tabs defaultValue="visuals" className="space-y-8">
                                    <TabsList className="bg-card/40 backdrop-blur-md p-1.5 rounded-2xl border border-border inline-flex h-auto">
                                        <TabsTrigger value="visuals" className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-primary transition-all">
                                            <Palette size={18} className="mr-2" /> {t("visual_identity")}
                                        </TabsTrigger>
                                        <TabsTrigger value="assets" className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-primary transition-all">
                                            <ImageIcon size={18} className="mr-2" /> {t("media_assets")}
                                        </TabsTrigger>
                                        <TabsTrigger value="domain" className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-primary transition-all">
                                            <Globe size={18} className="mr-2" /> {t("domain_seo")}
                                        </TabsTrigger>
                                        <TabsTrigger value="developer" className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-primary transition-all">
                                            <Code size={18} className="mr-2" /> {t("custom_dev")}
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="visuals" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-card border border-border rounded-2xl p-6 md:p-10 space-y-10 shadow-sm">
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-extrabold">Brand Signature</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Market Brand Name</label>
                                                        <Input
                                                            value={brandName}
                                                            onChange={(e) => setBrandName(e.target.value)}
                                                            className="h-12 rounded-xl bg-secondary/20 border-border font-bold focus:ring-primary/20"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Primary Color System</label>
                                                        <div className="flex gap-4">
                                                            <div className="w-12 h-12 rounded-xl border border-border shadow-sm shrink-0" style={{ backgroundColor: primaryColor }}></div>
                                                            <Input
                                                                value={primaryColor}
                                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                                className="h-12 font-mono font-bold uppercase rounded-xl bg-secondary/20 border-border"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6 pt-10 border-t border-border">
                                                <h3 className="text-lg font-extrabold">Theme Preference</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {[
                                                        { id: 'dark', label: 'Dark Protocol', icon: Monitor, active: true },
                                                        { id: 'light', label: 'Light Mode', icon: Monitor, active: false },
                                                        { id: 'system', label: 'OS Adaptive', icon: Monitor, active: false },
                                                    ].map((t) => (
                                                        <button
                                                            key={t.id}
                                                            className={cn(
                                                                "h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
                                                                t.active ? "bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10" : "bg-secondary/20 border-border text-muted-foreground hover:border-primary/50"
                                                            )}
                                                        >
                                                            <t.icon size={18} />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="assets" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-card border border-border rounded-xl p-6 md:p-10 space-y-10 shadow-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Master Portal Logo</label>
                                                    <div className="aspect-video border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-4 bg-secondary/20 group hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative">
                                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <Upload className="text-muted-foreground group-hover:text-primary transition-colors" size={32} />
                                                        <p className="text-sm font-bold">Upload Vector SVG</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Browser Favicon</label>
                                                    <div className="aspect-square w-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 bg-secondary/20 group hover:border-primary/50 transition-all cursor-pointer mx-auto md:mx-0">
                                                        <ImageIcon className="text-muted-foreground group-hover:text-primary transition-colors" size={24} />
                                                        <p className="text-[10px] font-bold">ICO / PNG</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="domain" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-card/40 border border-border rounded-[2.5rem] p-10 space-y-8">
                                            <div className="space-y-3">
                                                <h3 className="text-xl font-black">Custom Client Nexus</h3>
                                                <p className="text-sm text-muted-foreground font-medium">Link your master domain for a fully independent brand experience.</p>
                                                <div className="flex gap-4 mt-6">
                                                    <Input placeholder="portal.yourdomain.com" className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold flex-1" />
                                                    <Button variant="outline" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">Verify DNS</Button>
                                                </div>
                                            </div>

                                            <div className="pt-8 border-t border-white/5 space-y-6">
                                                <h3 className="text-lg font-black">Search Engine Metadata</h3>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-muted-foreground">Global Site Title</label>
                                                        <Input placeholder="Premium Managed Cloud - Powered by..." className="h-12 rounded-xl bg-white/5 border-white/10" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-muted-foreground">Meta Description</label>
                                                        <textarea className="w-full h-24 rounded-2xl bg-white/5 border border-white/10 p-4 text-sm font-medium focus:outline-none focus:border-primary/50" placeholder="Describe your hosting services..." />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Sticky Dynamic Preview */}
                            <div className="lg:col-span-1 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm sticky top-24"
                                >
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <Sliders className="text-primary" size={20} />
                                            <h3 className="text-lg font-black">{t("live_preview")}</h3>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 rounded-full font-black text-[10px]">Real-Time</Badge>
                                    </div>

                                    <div className="aspect-[3/4] bg-[#0A0B0D] rounded-[2rem] border border-white/10 overflow-hidden relative shadow-inner group">
                                        {/* Browser Header Emulator */}
                                        <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                                                <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                                                <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                                            </div>
                                            <div className="flex-1 max-w-[120px] mx-auto h-5 bg-white/5 rounded-full flex items-center px-3 gap-2">
                                                <Lock size={8} className="text-muted-foreground" />
                                                <span className="text-[8px] text-muted-foreground font-bold truncate">portal.nexus.com</span>
                                            </div>
                                        </div>

                                        {/* Simulated UI Contents */}
                                        <div className="p-6 space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl animate-pulse" style={{ backgroundColor: primaryColor }} />
                                                <span className="text-xs font-black truncate">{brandName}</span>
                                            </div>
                                            <div className="space-y-4 pt-4">
                                                <div className="h-3 w-2/3 bg-white/5 rounded-full" />
                                                <div className="h-10 w-full bg-white/5 rounded-xl border border-white/10" />
                                                <div className="h-28 w-full rounded-[1.5rem] relative overflow-hidden" style={{ backgroundColor: `${primaryColor}10` }}>
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent shadow-inner" />
                                                    <div className="p-4 space-y-2">
                                                        <div className="h-2 w-1/3 bg-white/10 rounded-full" />
                                                        <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                                                        <div className="h-8 w-1/3 rounded-lg mt-4" style={{ backgroundColor: primaryColor }} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="h-14 w-full bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                                                        <Layout size={16} className="text-muted-foreground opacity-30" />
                                                    </div>
                                                    <div className="h-14 w-full bg-white/5 rounded-xl border border-white/10 flex items-center justify-center font-black text-[10px] uppercase opacity-20">Stats</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Emulator */}
                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent">
                                            <p className="text-[8px] text-center text-muted-foreground font-bold tracking-tight">© 2025 {brandName} Strategy • Encrypted</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BarChart size={14} className="text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Global Reach</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                                            Once deployed, your brand configuration will be synchronized across our edge network for peak performance.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
