
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Info, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import Link from "next/link";
import { cn } from "@/lib/utils";

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

interface Notification {
    id: number;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    title: string;
    message: string;
    link?: string;
    createdAt: string;
    isRead: boolean;
}

export function FloatingNotifications() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isPulsing, setIsPulsing] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial fetch and poller
    useEffect(() => {
        if (!user) return;

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000); // 5s poll as requested

        return () => clearInterval(interval);
    }, [user]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            // Fetch last 5 items (all=true returns mixed read/unread)
            const res = await api.get("/notifications?limit=5&all=true");
            const data = res.data.data;
            const newNotifications = data.notifications;

            // Unread count is now explicitly returned
            const newUnreadCount = data.unreadCount;

            // Trigger pulse if unread count increased
            if (newUnreadCount > unreadCount && newUnreadCount > 0) {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 3000);
            }

            setNotifications(newNotifications);
            setUnreadCount(newUnreadCount);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/read`);
            // Optimistically update: find item, mark isRead=true
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            // Decrement unread count locally
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read");
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post("/notifications/read-all");
            // Mark all currently visible as read
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read");
        }
    };

    if (!user) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'ERROR': return <X className="w-5 h-5 text-rose-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    // Determine link for "See All" based on user type
    const seeAllLink = (user.userType === 'ADMIN' || user.userType === 'SUPER_ADMIN') ? '/admin/notifications' : '/client/notifications';

    return (
        <div ref={containerRef} className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-80 md:w-96 bg-card/95 backdrop-blur-md border border-border/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[70vh]"
                    >
                        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
                            <h3 className="font-bold text-sm tracking-tight">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-2 scrollbar-hide">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-medium">No notifications</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "relative group border border-border/30 rounded-xl p-3 transition-colors hover:bg-secondary/20",
                                            notification.isRead ? "bg-background/30 opacity-70" : "bg-background/80 shadow-sm"
                                        )}
                                    >
                                        <div className="flex gap-3 items-start">
                                            <div className="mt-1 shrink-0 p-1.5 bg-background rounded-full shadow-sm border border-border/20">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <h4 className="text-sm font-bold truncate pr-6">{notification.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex justify-between items-center mt-2.5">
                                                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                                                        {timeAgo(notification.createdAt)}
                                                    </span>
                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                                                        >
                                                            View Details <ExternalLink className="w-3 h-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="absolute top-2 right-2 p-1 text-primary/80 hover:text-primary transition-colors"
                                                title="Mark as read"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 border-t border-border/50 bg-muted/30 text-center">
                            <Link
                                href={seeAllLink}
                                onClick={() => setIsOpen(false)}
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                See all notifications
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 relative z-50",
                    isPulsing ? "bg-red-500 ring-4 ring-red-500/30" : (unreadCount > 0 ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90")
                )}
            >
                <div className="relative">
                    {isOpen ? (
                        <X className="w-6 h-6 text-white" />
                    ) : (
                        <Bell className={cn("w-6 h-6 text-white", unreadCount > 0 && "animate-swing")} />
                    )}

                    {!isOpen && unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-red-600 text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm px-1 z-10 border-2 border-red-500">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </button>
            <style jsx global>{`
                @keyframes swing {
                    0%, 100% { transform: rotate(0deg); }
                    20% { transform: rotate(15deg); }
                    40% { transform: rotate(-10deg); }
                    60% { transform: rotate(5deg); }
                    80% { transform: rotate(-5deg); }
                }
                .animate-swing {
                    animation: swing 1s ease-in-out infinite;
                    transform-origin: top center;
                }
            `}</style>
        </div>
    );
}
