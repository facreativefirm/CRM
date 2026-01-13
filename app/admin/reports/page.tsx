"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Download, Loader2, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { getCurrencySymbol } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminReportsPage() {
    const { t } = useLanguage();
    const { settings, fetchSettings } = useSettingsStore(); // Get settings and fetch action
    const currencySymbol = getCurrencySymbol(settings.defaultCurrency || 'USD'); // Dynamic currency

    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [clientStats, setClientStats] = useState<any>(null);

    useEffect(() => {
        fetchSettings(); // Ensure settings are loaded
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const [revenueRes, clientRes] = await Promise.all([
                api.get("/reports/revenue"),
                api.get("/reports/clients")
            ]);

            // Process Revenue Data
            const rawRevenue = revenueRes.data.data.report || [];
            const processedRevenue = {
                paidInvoices: 0,
                pendingRevenue: 0,
                overdueRevenue: 0,
                totalRevenue: 0
            };

            rawRevenue.forEach((item: any) => {
                const amount = parseFloat(item._sum.amountPaid || 0);
                if (item.status === 'PAID' || item.status === 'PARTIALLY_PAID' || item.status === 'REFUNDED') {
                    processedRevenue.paidInvoices += amount;
                    processedRevenue.totalRevenue += amount;
                } else if (item.status === 'UNPAID' || item.status === 'PAYMENT_PENDING') {
                    processedRevenue.pendingRevenue += amount;
                } else if (item.status === 'OVERDUE') {
                    processedRevenue.overdueRevenue += amount;
                }
            });

            setRevenueData(processedRevenue);

            // Client Data - Now comes pre-calculated from backend
            setClientStats(clientRes.data.data);

        } catch (err) {
            console.error("Error fetching reports:", err);
            toast.error("Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <Sidebar />
            <main className="pl-75 pt-20 p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{t("reports") || "Reports"}</h1>
                        <p className="text-muted-foreground">{t("admin_reports_desc") || "View system-wide financial and usage statistics."}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="glass p-8 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("total_revenue") || "Total Revenue"}</p>
                                <h3 className="text-2xl font-bold">
                                    {currencySymbol}{revenueData?.totalRevenue?.toFixed(2) || '0.00'}
                                </h3>
                            </div>
                        </div>
                        <div className="h-32 bg-white/5 rounded-xl flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">Revenue trend visualization</p>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("total_clients") || "Total Clients"}</p>
                                <h3 className="text-2xl font-bold">
                                    {clientStats?.totalClients || 0}
                                </h3>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("active") || "Active"}</span>
                                <span className="font-bold text-emerald-500">
                                    {clientStats?.activeClients || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Inactive</span>
                                <span className="font-bold">
                                    {clientStats?.inactiveClients || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("monthly_growth") || "Monthly Growth"}</p>
                                <h3 className="text-2xl font-bold">
                                    {clientStats?.monthlyGrowth || 0}%
                                </h3>
                            </div>
                        </div>
                        <div className="h-32 flex items-center justify-center text-muted-foreground bg-white/5 rounded-xl">
                            <p className="text-xs">Growth projection</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass rounded-[2rem] p-8">
                        <h3 className="text-xl font-bold mb-6">{t("revenue_breakdown") || "Revenue Breakdown"}</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="text-muted-foreground">{t("paid") || "Paid"}</span>
                                <span className="font-bold text-emerald-500">
                                    {currencySymbol}{revenueData?.paidInvoices?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="text-muted-foreground">{t("pending") || "Pending"}</span>
                                <span className="font-bold text-orange-500">
                                    {currencySymbol}{revenueData?.pendingRevenue?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="text-muted-foreground">{t("unpaid") || "Overdue"}</span>
                                <span className="font-bold text-destructive">
                                    {currencySymbol}{revenueData?.overdueRevenue?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-[2rem] p-8">
                        <h3 className="text-xl font-bold mb-6">{t("client_acquisition") || "Client Acquisition"}</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="text-muted-foreground">{t("this_month") || "This Month"}</span>
                                <span className="font-bold">
                                    {clientStats?.newThisMonth || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="text-muted-foreground">{t("last_month") || "Last Month"}</span>
                                <span className="font-bold">
                                    {clientStats?.newLastMonth || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="text-muted-foreground">{t("avg_month") || "Avg. per Month"}</span>
                                <span className="font-bold">
                                    {clientStats?.averagePerMonth || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
