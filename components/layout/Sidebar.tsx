"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import {
    LayoutDashboard,
    Users,
    Server,
    CreditCard,
    LifeBuoy,
    Share2,
    Settings,
    LogOut,
    ShoppingCart,
    Wallet,
    Globe,
    ChevronDown,
    ChevronRight,
    Wrench,
    ShieldCheck,
    BarChart3,
    FileText,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/store/uiStore";

interface MenuItem {
    name: string;
    icon: any;
    href?: string;
    children?: { name: string; href: string }[];
}

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLanguage();
    const { user, logout } = useAuthStore();
    const { isSidebarOpen, setSidebarOpen } = useUIStore();
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    const toggleMenu = (name: string) => {
        setOpenMenus(prev =>
            prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
        );
    };

    const handleLogout = () => {
        logout();
        router.push("/auth/login");
    };

    const getMenuItems = (): MenuItem[] => {
        const role = user?.userType;

        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
            return [
                { name: t("dashboard"), icon: LayoutDashboard, href: "/admin" },
                {
                    name: t("clients"),
                    icon: Users,
                    children: [
                        { name: t("view_all_clients"), href: "/admin/clients" },
                        { name: t("add_new_client"), href: "/admin/clients/add" },
                        { name: t("client_groups"), href: "/admin/clients/groups" }
                    ]
                },
                {
                    name: t("orders"),
                    icon: ShoppingCart,
                    children: [
                        { name: t("list_all_orders"), href: "/admin/orders" },
                        { name: t("pending_orders"), href: "/admin/orders?status=Pending" },
                        { name: t("add_new_order"), href: "/admin/orders/add" }
                    ]
                },
                {
                    name: t("products"),
                    icon: ShoppingCart,
                    children: [
                        { name: t("view_all_products"), href: "/admin/products" },
                        { name: t("add_new_product"), href: "/admin/products/add" },
                        { name: t("services") || "Services", href: "/admin/products/services" },
                        { name: t("add_service") || "Add Service", href: "/admin/products/services/add" }
                    ]
                },
                {
                    name: t("domains"),
                    icon: Globe,
                    children: [
                        { name: t("list_all_domains"), href: "/admin/domains" },
                        { name: t("register_domain"), href: "/admin/domains/register" },
                        { name: t("expiring_domains"), href: "/admin/domains/expiring" },
                        { name: t("tld_pricing"), href: "/admin/domains/tlds" },
                        { name: t("whois_lookup"), href: "/admin/utilities/whois" }
                    ]
                },
                {
                    name: t("billing"),
                    icon: CreditCard,
                    children: [
                        { name: t("invoices"), href: "/admin/billing" },
                        { name: t("transactions"), href: "/admin/billing?tab=transactions" },
                        { name: t("refunds") || "Refunds", href: "/admin/billing/refunds" },
                        { name: t("create_invoice"), href: "/admin/billing/create" },
                    ]
                },
                {
                    name: t("services"),
                    icon: Server,
                    children: [
                        { name: t("list_all_services") || "All Services", href: "/admin/services" },
                        { name: t("expiring_services") || "Expiring Soon", href: "/admin/services/expiring" }
                    ]
                },
                {
                    name: t("support"),
                    icon: LifeBuoy,
                    children: [
                        { name: t("support_tickets"), href: "/admin/support?tab=tickets" },
                        { name: t("network_issues_menu"), href: "/admin/support?tab=network" },
                        { name: t("predefined_replies"), href: "/admin/support?tab=replies" }
                    ]
                },
                {
                    name: t("utilities"),
                    icon: Wrench,
                    children: [
                        { name: t("whois_lookup"), href: "/admin/utilities/whois" },
                        { name: t("dns_resolver"), href: "/admin/utilities/dns" },
                        { name: t("tld_sync"), href: "/admin/utilities/tldsync" },
                    ]
                },
                {
                    name: t("security"),
                    icon: ShieldCheck,
                    children: [
                        { name: t("banned_ips"), href: "/admin/security/banned-ips" },
                        { name: t("security_questions"), href: "/admin/security/questions" }
                    ]
                },
                { name: t("reports"), icon: BarChart3, href: "/admin/reports" },
            ];
        } else if (role === 'RESELLER') {
            return [
                { name: t("dashboard"), icon: LayoutDashboard, href: "/reseller" },
                { name: t("services"), icon: Server, href: "/reseller/services" },
                { name: t("payouts"), icon: Wallet, href: "/reseller/payouts" },
                { name: t("white_label"), icon: Zap, href: "/reseller/settings" },
                { name: t("billing"), icon: CreditCard, href: "/reseller/billing" },
            ];
        } else {
            return [
                { name: t("dashboard"), icon: LayoutDashboard, href: "/client" },
                { name: t("store"), icon: ShoppingCart, href: "/client/store" },
                { name: t("services"), icon: Server, href: "/client/services" },
                { name: t("domains"), icon: Globe, href: "/client/domains" },
                { name: t("billing"), icon: CreditCard, href: "/client/billing" },
                { name: t("transactions") || "Transactions", icon: FileText, href: "/client/transactions" },
                { name: t("support"), icon: LifeBuoy, href: "/support" },
            ];
        }
    };

    const menuItems = getMenuItems();

    return (
        <>
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={cn(
                "w-64 h-[calc(100vh-64px)] fixed left-0 top-16 glass border-r border-white/5 flex flex-col p-4 z-40 overflow-y-auto custom-scrollbar transition-transform duration-300 lg:translate-x-0 lg:flex",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex-1 space-y-1">
                    {menuItems.map((item) => {
                        const hasChildren = item.children && item.children.length > 0;
                        const isOpen = openMenus.includes(item.name);
                        const isActive = item.href ? pathname === item.href : item.children?.some(c => pathname === c.href);

                        return (
                            <div key={item.name} className="space-y-1">
                                {item.href ? (
                                    <Link
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                                            pathname === item.href
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className={cn("w-4 h-4", pathname === item.href ? "" : "group-hover:scale-110 transition-transform")} />
                                        <span>{item.name}</span>
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => toggleMenu(item.name)}
                                        className={cn(
                                            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                                            isActive && !isOpen ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            <span>{item.name}</span>
                                        </div>
                                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                )}

                                {hasChildren && isOpen && (
                                    <div className="ml-9 space-y-1 border-l border-white/5 pl-2 mt-1">
                                        {item.children!.map((child) => (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={cn(
                                                    "block px-4 py-2 rounded-lg text-xs transition-all",
                                                    pathname === child.href
                                                        ? "text-primary font-bold bg-primary/5 shadow-inner shadow-primary/10"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                                )}
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="border-t border-white/5 mt-4 pt-4 space-y-1">
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
                    >
                        <Settings className="w-4 h-4" />
                        <span>{t("settings")}</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{t("logout")}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
