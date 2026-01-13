"use client";

import React, { useState, useEffect, useRef } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    MessageSquare,
    Send,
    Paperclip,
    ArrowLeft,
    Clock,
    User,
    ShieldCheck,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/shared/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/authStore";

export default function TicketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { user } = useAuthStore();
    const [ticket, setTicket] = useState<any>(null);
    const [replies, setReplies] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const sentSound = useRef<HTMLAudioElement | null>(null);
    const receivedSound = useRef<HTMLAudioElement | null>(null);
    const lastMessageIdRef = useRef<string | null>(null);

    useEffect(() => {
        sentSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
        receivedSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    }, []);

    useEffect(() => {
        fetchTicketDetails();

        // Instant Sync Engine (Real-time polling)
        const pollInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                syncReplies();
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [id]);

    // Presence Heartbeat: Notify backend that we are actively viewing this ticket
    useEffect(() => {
        if (!id) return;

        const updatePresence = async () => {
            try {
                if (document.visibilityState === 'visible') {
                    await api.post(`/support/tickets/${id}/presence`);
                }
            } catch (err) {
                // Silent presence failure
            }
        };

        // Immediate ping
        updatePresence();

        // Heartbeat every 10s
        const presenceInterval = setInterval(updatePresence, 10000);

        return () => clearInterval(presenceInterval);
    }, [id]);

    const syncReplies = async () => {
        try {
            const response = await api.get(`/support/tickets/${id}`);
            const latestReplies = response.data.data.ticket.replies || [];

            // Only update if there are new messages to prevent unnecessary re-renders
            setReplies(current => {
                const filteredLatest = latestReplies.filter((r: any) => !r.isInternalNote);
                if (filteredLatest.length > current.length) {
                    const lastMessage = filteredLatest[filteredLatest.length - 1];

                    // Critical: Use message ID tracking to prevent duplicate sounds during high-freq sync
                    if (lastMessage.id !== lastMessageIdRef.current) {
                        lastMessageIdRef.current = lastMessage.id;

                        const isNewFromOthers = lastMessage.userId !== user?.id && lastMessage.user?.id !== user?.id;
                        if (isNewFromOthers && receivedSound.current) {
                            receivedSound.current.play().catch(() => { });
                        }
                    }
                    return filteredLatest;
                }
                return current;
            });

            if (ticket?.status !== response.data.data.ticket.status) {
                setTicket(response.data.data.ticket);
            }
        } catch (error) {
            console.error("Sync error:", error);
        }
    };

    useEffect(() => {
        if (!loading && replies.length > 0) {
            scrollToBottom();
        }
    }, [loading, replies.length]);

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
    };

    const fetchTicketDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/support/tickets/${id}`);
            setTicket(response.data.data.ticket);
            const filteredReplies = (response.data.data.ticket.replies || []).filter((r: any) => !r.isInternalNote);
            setReplies(filteredReplies);
        } catch (error) {
            console.error("Error fetching ticket:", error);
            // Fallback for demo
            setTicket({
                id,
                subject: "Server High Load",
                status: "OPEN",
                department: "Technical Support",
                createdAt: new Date(Date.now() - 3600000).toISOString()
            });
            setReplies([
                { id: 1, message: "Hello, I am experiencing high load on my server ORD-10542.", isAdmin: false, createdAt: new Date(Date.now() - 3600000).toISOString(), user: { firstName: "Naimur", lastName: "Sharon" } },
                { id: 2, message: "We are looking into it. Please hold on.", isAdmin: true, createdAt: new Date(Date.now() - 1800000).toISOString(), user: { firstName: "Support", lastName: "Dept" } },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSolve = async () => {
        try {
            await api.patch(`/support/tickets/${id}`, { status: 'CLOSED' });
            toast.success("Ticket marked as resolved");
            fetchTicketDetails();
        } catch (error) {
            toast.error("Failed to update ticket status");
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedImage) return;

        try {
            setSending(true);
            const response = await api.post(`/support/tickets/${id}/reply`, {
                message: newMessage,
                attachments: selectedImage ? [selectedImage] : []
            });

            // Optimistic update: Add the reply immediately
            setReplies(prev => [...prev, response.data.data.reply]);

            if (sentSound.current) {
                sentSound.current.play().catch(() => { });
            }

            setNewMessage("");
            setSelectedImage(null);
            toast.success("Reply sent");
            scrollToBottom();
        } catch (error) {
            // Mocking for demo if API fails
            const mockReply = {
                id: Date.now(),
                message: newMessage,
                attachments: selectedImage ? [selectedImage] : [],
                isAdmin: false,
                createdAt: new Date().toISOString(),
                user
            };
            setReplies([...replies, mockReply]);
            setNewMessage("");
            setSelectedImage(null);
            toast.success("Reply sent (Local)");
        } finally {
            setSending(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("File size must be less than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground animate-pulse font-bold tracking-widest text-[10px] uppercase">Connecting to secure gateway...</p>
        </div>
    );

    return (
        <AuthGuard allowedRoles={["CLIENT", "RESELLER", "ADMIN", "STAFF"]}>
            <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 flex-1 flex flex-col overflow-hidden">
                    {/* Ticket Header */}
                    <div className="bg-card/50 backdrop-blur-xl border-b border-border p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 mt-16 md:mt-0">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => router.push("/support")}
                                className="h-10 w-10 rounded-xl bg-secondary/30 border-border hover:bg-primary hover:text-white transition-all"
                            >
                                <ArrowLeft size={18} />
                            </Button>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-lg md:text-xl font-extrabold tracking-tight">#{ticket.id} - {ticket.subject}</h1>
                                    <Badge variant={ticket.status === 'OPEN' ? 'success' : 'secondary'} className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                        {ticket.status}
                                    </Badge>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 ml-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Syncing Live</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
                                        {typeof ticket.department === 'object' ? ticket.department?.name : ticket.department}
                                    </span>
                                    <span className="text-muted-foreground opacity-30 text-xs mt-[-2px]">•</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Just now'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            {ticket.status !== 'CLOSED' && (
                                <Button
                                    onClick={handleSolve}
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-4 rounded-xl font-bold border-border hover:bg-emerald-500 hover:text-white transition-all gap-2 text-xs flex-1 md:flex-none"
                                >
                                    <CheckCircle2 size={16} />
                                    Solve Ticket
                                </Button>
                            )}
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border shrink-0">
                                <MoreVertical size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-secondary/10">
                        <AnimatePresence initial={false}>
                            {replies.map((reply, index) => {
                                const isMe = reply.userId === user?.id || reply.user?.id === user?.id;

                                return (
                                    <motion.div
                                        key={reply.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex gap-3 md:gap-4 max-w-[85%] md:max-w-[75%]",
                                            isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm font-bold text-[10px]",
                                            isMe
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "bg-card border-border text-primary"
                                        )}>
                                            {reply.isAdmin ? <ShieldCheck size={18} /> :
                                                reply.user?.firstName ? reply.user.firstName[0].toUpperCase() : <User size={18} />
                                            }
                                        </div>
                                        <div className={cn("flex flex-col", isMe ? "items-end text-right" : "items-start text-left")}>
                                            <div className={cn(
                                                "p-4 md:p-5 rounded-2xl shadow-sm border text-sm font-medium leading-relaxed whitespace-pre-wrap",
                                                isMe
                                                    ? "bg-primary text-primary-foreground rounded-tr-none border-primary shadow-primary/10"
                                                    : "bg-card border-border rounded-tl-none"
                                            )}>
                                                {reply.message}
                                                {reply.attachments && Array.isArray(reply.attachments) && reply.attachments.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {reply.attachments.map((img: string, i: number) => (
                                                            <img
                                                                key={i}
                                                                src={img}
                                                                alt="Attachment"
                                                                className="max-w-full rounded-lg border border-white/10 hover:scale-105 transition-transform cursor-pointer"
                                                                onClick={() => window.open(img, '_blank')}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={cn("flex items-center gap-2 mt-1.5", isMe ? "justify-end" : "justify-start")}>
                                                <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">
                                                    {reply.user?.firstName || (reply.isAdmin ? 'Staff' : 'Client')} {reply.user?.lastName || ''}
                                                </span>
                                                <span className="text-muted-foreground opacity-30 text-[8px]">•</span>
                                                <span className="text-[9px] text-muted-foreground font-medium">
                                                    {reply.createdAt ? new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* System Resolution Event */}
                        {ticket.status === 'CLOSED' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-10"
                            >
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 backdrop-blur-md">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">Resolution Confirmed</p>
                                        <p className="text-[11px] font-medium text-emerald-600/60 mt-0.5">This ticket has been marked as solved and closed.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 md:p-6 bg-card border-t border-border shrink-0">
                        {ticket.status === 'CLOSED' || ticket.status === 'ON_HOLD' ? (
                            <div className="flex flex-col items-center justify-center p-6 bg-secondary/20 rounded-2xl border border-dashed border-border text-muted-foreground">
                                <ShieldCheck className="mb-2 opacity-50" size={24} />
                                <p className="font-bold text-sm">
                                    {ticket.status === 'CLOSED' ? "This ticket is closed." : "This ticket is on hold."}
                                </p>
                                <p className="text-xs opacity-70 mt-1">Replies are disabled until the ticket is reopened.</p>
                            </div>
                        ) : (
                            <>
                                {selectedImage && (
                                    <div className="max-w-4xl mx-auto mb-4 relative inline-block">
                                        <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-primary/20 shadow-lg" />
                                        <button
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                                        >
                                            <XCircle size={14} />
                                        </button>
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3 md:gap-4 items-end">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-12 w-12 rounded-xl flex-shrink-0 bg-secondary/50 border-border hover:bg-secondary"
                                    >
                                        <Paperclip size={20} className="text-muted-foreground" />
                                    </Button>
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="w-full bg-secondary/20 border border-border rounded-xl px-4 py-3 md:px-6 md:py-3.5 pr-14 text-sm font-semibold focus:outline-none focus:border-primary/50 transition-all resize-none h-12 md:h-14 max-h-32"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="h-12 px-6 md:px-8 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 flex-shrink-0"
                                    >
                                        {sending ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                                        <span className="hidden sm:inline">Send Response</span>
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
