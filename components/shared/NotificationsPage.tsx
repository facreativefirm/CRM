
"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuthStore } from "@/lib/store/authStore";
import { CheckCircle, AlertTriangle, X, Info, ExternalLink, Calendar, Search, CheckCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";


interface Notification {
    id: number;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    title: string;
    message: string;
    link?: string;
    createdAt: string;
    isRead: boolean;
}

export default function NotificationsPage() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        fetchNotifications(page);
    }, [page, user]);

    const fetchNotifications = async (currentPage: number) => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get(`/notifications?all=true&limit=20&page=${currentPage}`);
            const data = res.data.data;
            setNotifications(data.notifications);
            setTotalPages(data.totalPages);
            setTotalItems(data.total);
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Failed to mark as read");
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark all as read");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="w-6 h-6 text-emerald-500" />;
            case 'WARNING': return <AlertTriangle className="w-6 h-6 text-amber-500" />;
            case 'ERROR': return <X className="w-6 h-6 text-rose-500" />;
            default: return <Info className="w-6 h-6 text-blue-500" />;
        }
    };

    if (!user) return null;

    return (
        <AuthGuard allowedRoles={["CLIENT", "RESELLER", "ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8">
                    <div className="container mx-auto max-w-5xl py-8 px-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                                <p className="text-muted-foreground mt-1">
                                    Total {totalItems} notifications • Page {page} of {totalPages}
                                </p>
                            </div>
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-secondary/50 hover:bg-secondary rounded-lg transition-colors border border-border/50"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Mark all as read
                            </button>
                        </div>

                        <div className="space-y-4">
                            {loading && notifications.length === 0 ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-24 bg-card rounded-2xl border border-dashed">
                                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Info className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium">No notifications found</h3>
                                    <p className="text-muted-foreground">You're all caught up!</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "group relative overflow-hidden rounded-xl border p-5 transition-all duration-200",
                                            notification.isRead
                                                ? "bg-card border-border/40 hover:border-border/80"
                                                : "bg-card border-l-4 border-l-primary shadow-sm hover:shadow-md border-y-border/60 border-r-border/60"
                                        )}
                                    >
                                        <div className="flex gap-4 sm:gap-6">
                                            <div className="mt-1 shrink-0">
                                                <div className={cn(
                                                    "p-3 rounded-full shadow-inner",
                                                    notification.isRead ? "bg-muted" : "bg-background border border-border"
                                                )}>
                                                    {getIcon(notification.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 py-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                    <h3 className={cn("text-lg", notification.isRead ? "font-semibold" : "font-bold text-primary")}>
                                                        {notification.title}
                                                    </h3>
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-muted-foreground leading-relaxed mb-4">
                                                    {notification.message}
                                                </p>

                                                <div className="flex gap-4 pt-2">
                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                                        >
                                                            View Details
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-10 gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-4 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1 px-2">
                                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                                        // Simple logic to show a few pages around current, simplified for now
                                        let p = idx + 1;
                                        if (page > 3 && totalPages > 5) p = page - 2 + idx;
                                        if (p > totalPages) return null;

                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={cn(
                                                    "w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                                                    page === p ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-4 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
