"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useLanguage } from "@/components/language-provider";
import { useAuthStore } from "@/lib/store/authStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  Users,
  Server,
  CreditCard,
  LifeBuoy,
  TrendingUp,
  Package
} from "lucide-react";

export default function Home() {
  const { language, t } = useLanguage();
  const { user } = useAuthStore();
  const { formatPrice } = useSettingsStore();

  const stats = [
    { name: t("active_services"), value: "128", icon: Server, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: t("unpaid_invoices"), value: "12", icon: CreditCard, color: "text-amber-500", bg: "bg-amber-500/10" },
    { name: t("tickets"), value: "5", icon: LifeBuoy, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: t("total_revenue"), value: formatPrice(2450), icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  ];

  return (
    <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <main className="min-h-screen">
        <Navbar />
        <Sidebar />

        <div className="pl-72 pt-6 p-8">
          <header className="mb-8">
            <h2 className="text-3xl font-bold">{t("dashboard")}</h2>
            <p className="text-muted-foreground mt-1">{t("welcome_back")}, {user?.username || 'User'}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.name} className="glass rounded-2xl p-6 flex items-start justify-between group hover:scale-[1.02] transition-all cursor-default">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.name}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{t("new_orders")}</h3>
                <button className="text-primary text-sm font-medium hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-secondary/30 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">Cloud Hosting - Pro Plan</p>
                      <p className="text-xs text-muted-foreground">Order ID: #ORD-100{i} • Client: Mike Ross</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatPrice(45.00)}</p>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase">Paid</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass rounded-3xl p-8 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group">
                  <Users className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">{language === "en" ? "Add Client" : "ক্লায়েন্ট যোগ করুন"}</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all group">
                  <CreditCard className="w-8 h-8 text-accent group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">{language === "en" ? "Create Invoice" : "ইনভয়েস তৈরি করুন"}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
