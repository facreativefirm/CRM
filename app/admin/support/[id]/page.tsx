"use client";

import React, { useState, useEffect, useRef } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2,
    Send,
    User,
    Clock,
    ShieldAlert,
    MessageSquare,
    Paperclip,
    MoreHorizontal,
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertCircle,
    UserCheck,
    Lock
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function TicketDetailsPage() {
    const { t } = useLanguage();
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sentSound = useRef<HTMLAudioElement | null>(null);
    const receivedSound = useRef<HTMLAudioElement | null>(null);
    const lastMessageIdRef = useRef<string | null>(null);

    useEffect(() => {
        sentSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
        receivedSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    }, []);

    useEffect(() => {
        fetchTicket();

        // Admin Sync Engine (Real-time polling)
        const pollInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                syncTicket();
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

    const syncTicket = async () => {
        try {
            const response = await api.get(`/support/tickets/${id}`);
            const updatedTicket = response.data.data.ticket;

            if (updatedTicket.replies?.length !== ticket?.replies?.length) {
                const lastReply = updatedTicket.replies[updatedTicket.replies.length - 1];

                // Critical: Track message ID to prevent duplicate sounds during polling
                if (lastReply && lastReply.id !== lastMessageIdRef.current) {
                    lastMessageIdRef.current = lastReply.id;

                    if (lastReply.userId !== user?.id && lastReply.user?.id !== user?.id) {
                        if (receivedSound.current) {
                            receivedSound.current.play().catch(() => { });
                        }
                    }
                }
                setTicket(updatedTicket);
            } else if (updatedTicket.status !== ticket?.status) {
                setTicket((prev: any) => ({ ...prev, status: updatedTicket.status }));
            }
        } catch (err) {
            console.error("Sync error:", err);
        }
    };

    useEffect(() => {
        if (!loading && ticket?.replies?.length > 0) {
            scrollToBottom();
        }
    }, [loading, ticket?.replies?.length]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
    };

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/support/tickets/${id}`);
            setTicket(response.data.data.ticket);
        } catch (err) {
            console.error("Error fetching ticket:", err);
            toast.error("Failed to load ticket details");
            router.push("/admin/support");
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async () => {
        if (!replyMessage.trim()) return;

        setSubmitting(true);
        try {
            const response = await api.post(`/support/tickets/${id}/reply`, {
                message: replyMessage,
                isInternalNote: isInternal,
                attachments: selectedImage ? [selectedImage] : []
            });

            // Optimistic update: Add the reply immediately to the list
            setTicket((prev: any) => ({
                ...prev,
                replies: [...(prev?.replies || []), response.data.data.reply]
            }));

            setReplyMessage("");
            setIsInternal(false);
            setSelectedImage(null);
            toast.success(isInternal ? "Internal note added" : "Reply sent successfully");

            if (sentSound.current) {
                sentSound.current.play().catch(() => { });
            }

            scrollToBottom();
        } catch (err) {
            console.error("Error sending reply:", err);
            toast.error("Failed to send reply");
        } finally {
            setSubmitting(false);
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

    const updateStatus = async (status: string) => {
        try {
            await api.patch(`/support/tickets/${id}`, { status });
            toast.success(`Ticket marked as ${status}`);
            fetchTicket();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs animate-pulse">Syncing with Support Node...</p>
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "STAFF"]}>
            <div className="h-screen bg-background text-foreground transition-colors duration-300 flex flex-col overflow-hidden">
                <Navbar />
                <div className="flex-1 flex overflow-hidden">
                    <Sidebar />
                    <main className="lg:pl-75 flex-1 flex flex-col overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">

                            {/* Sidebar - Ticket Info */}
                            <div className="lg:col-span-3 border-r border-border bg-card p-6 overflow-y-auto space-y-8 hidden lg:block">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 h-12 rounded-xl text-muted-foreground hover:text-foreground mb-4 border-border"
                                    onClick={() => router.push("/admin/support")}
                                >
                                    <ArrowLeft size={16} /> Back to Queue
                                </Button>

                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ticket Status</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                ticket.status === 'OPEN' ? 'success' :
                                                    ticket.status === 'AWAITING_REPLY' ? 'warning' :
                                                        ticket.status === 'ANSWERED' ? 'info' :
                                                            ticket.status === 'CLOSED' ? 'secondary' :
                                                                'default'
                                            } className="px-4 py-1.5 rounded-xl font-bold border-none">
                                                {ticket.status}
                                            </Badge>
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Live</span>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg outline-none">
                                                        <MoreHorizontal size={14} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-3xl border-white/10 rounded-2xl w-48 p-2">
                                                    <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest p-2 opacity-50">Change Status</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => updateStatus('OPEN')} className="rounded-xl gap-2 h-10 cursor-pointer">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Open
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateStatus('ON_HOLD')} className="rounded-xl gap-2 h-10 cursor-pointer">
                                                        <div className="w-2 h-2 rounded-full bg-orange-500" /> On Hold
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateStatus('CLOSED')} className="rounded-xl gap-2 h-10 cursor-pointer">
                                                        <div className="w-2 h-2 rounded-full bg-slate-500" /> Closed
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Client Entity</p>
                                            <p className="font-bold text-lg">{ticket.client?.user?.firstName} {ticket.client?.user?.lastName}</p>
                                            <p className="text-sm font-medium text-muted-foreground opacity-70 italic">{ticket.client?.user?.email}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Department</p>
                                            <p className="font-bold flex items-center gap-2">
                                                <ShieldAlert size={14} className="text-primary" />
                                                {ticket.department?.name || 'General Support'}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Priority Level</p>
                                            <Badge variant={ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'destructive' : 'outline'} className="font-black px-4 py-1.5 rounded-xl uppercase text-[10px] tracking-widest">
                                                {ticket.priority}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Assigned Team Member</p>
                                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                                    <UserCheck size={20} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm tracking-tight">{ticket.assignedTo?.firstName || 'Unassigned'}</p>
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground opacity-50">Agent Registry</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Interface */}
                            <div className="lg:col-span-9 flex flex-col overflow-hidden relative bg-card/10">

                                {/* Thread Header */}
                                <div className="bg-card/50 backdrop-blur-xl border-b border-border p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 mt-16 md:mt-0 sticky top-0 z-10">
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => router.push("/admin/support")}
                                            className="h-10 w-10 rounded-xl bg-secondary/30 border-border hover:bg-primary hover:text-white transition-all lg:hidden"
                                        >
                                            <ArrowLeft size={18} />
                                        </Button>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h1 className="text-lg md:text-xl font-extrabold tracking-tight">#{ticket.ticketNumber} - {ticket.subject}</h1>
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
                                                    {ticket.department?.name || 'Technical Support'}
                                                </span>
                                                <span className="text-muted-foreground opacity-30 text-xs mt-[-2px]">•</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Just now'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Button onClick={() => updateStatus('CLOSED')} variant="outline" size="sm" className="h-10 px-4 rounded-xl font-bold border-border hover:bg-emerald-500 hover:text-white transition-all gap-2 text-xs flex-1 md:flex-none">
                                            <CheckCircle size={16} />
                                            Solve Ticket
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border shrink-0">
                                                    <MoreHorizontal size={18} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-3xl border-border rounded-2xl w-48 p-2">
                                                <DropdownMenuItem onClick={() => updateStatus('OPEN')} className="rounded-xl gap-2 h-10 cursor-pointer">
                                                    <AlertCircle className="w-4 h-4 text-emerald-500" /> Open
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus('ON_HOLD')} className="rounded-xl gap-2 h-10 cursor-pointer">
                                                    <Clock className="w-4 h-4 text-orange-500" /> On Hold
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus('CLOSED')} className="rounded-xl gap-2 h-10 cursor-pointer">
                                                    <XCircle className="w-4 h-4 text-slate-500" /> Closed
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-secondary/10">
                                    {ticket.replies?.map((reply: any, index: number) => {
                                        const isMe = reply.userId === user?.id || reply.user?.id === user?.id;
                                        const isInternal = reply.isInternalNote;

                                        return (
                                            <div
                                                key={reply.id}
                                                className={cn(
                                                    "flex w-full animate-in fade-in slide-in-from-bottom-4 duration-500",
                                                    isInternal ? "justify-center px-12" : isMe ? "justify-end" : "justify-start"
                                                )}
                                            >
                                                {isInternal ? (
                                                    /* Internal Note UI */
                                                    <div className="w-full max-w-3xl bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden group shadow-sm">
                                                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                                            <Lock size={80} />
                                                        </div>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                                                                <Lock size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="font-extrabold text-amber-600 text-[10px] uppercase tracking-[0.2em]">Internal Note</p>
                                                                <p className="text-sm font-bold">{reply.user?.firstName || 'Staff'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-amber-600/90 dark:text-amber-200/80 leading-relaxed font-medium text-sm whitespace-pre-wrap">
                                                            {reply.message}
                                                            {reply.attachments && Array.isArray(reply.attachments) && reply.attachments.length > 0 && (
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    {reply.attachments.map((img: string, i: number) => (
                                                                        <img
                                                                            key={i}
                                                                            src={img}
                                                                            alt="Attachment"
                                                                            className="max-h-40 rounded-lg border border-amber-500/20 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform"
                                                                            onClick={() => window.open(img, '_blank')}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] font-bold uppercase text-amber-600/50">
                                                            <Clock size={10} />
                                                            {new Date(reply.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Standard Message UI */
                                                    <div className={cn(
                                                        "flex gap-3 md:gap-4 max-w-[85%] md:max-w-[75%]",
                                                        isMe ? "flex-row-reverse" : "flex-row"
                                                    )}>
                                                        <div className={cn(
                                                            "h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm font-bold text-[10px]",
                                                            isMe
                                                                ? "bg-primary border-primary text-primary-foreground"
                                                                : "bg-card border-border text-primary"
                                                        )}>
                                                            {reply.user?.userType !== 'CLIENT' ? <ShieldAlert size={18} /> :
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
                                                                                className="max-h-60 rounded-lg border border-white/10 shadow-md cursor-pointer hover:scale-[1.02] transition-transform"
                                                                                onClick={() => window.open(img, '_blank')}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={cn("flex items-center gap-2 mt-1.5", isMe ? "justify-end" : "justify-start")}>
                                                                <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">
                                                                    {reply.user?.firstName || (reply.user?.userType !== 'CLIENT' ? 'Staff' : 'Client')} {reply.user?.lastName || ''}
                                                                </span>
                                                                <span className="text-muted-foreground opacity-30 text-[8px]">•</span>
                                                                <span className="text-[9px] text-muted-foreground font-medium">
                                                                    {reply.timestamp ? new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* System Resolution Event */}
                                    {ticket.status === 'CLOSED' && (
                                        <div className="flex flex-col items-center justify-center py-10 opacity-70">
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-10 py-8 flex flex-col items-center gap-4 backdrop-blur-md">
                                                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                                                    <CheckCircle size={32} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-black text-emerald-600 uppercase tracking-widest">Case Resolved</p>
                                                    <p className="text-xs font-medium text-emerald-600/60 mt-1">This ticket has been officially closed by the system or staff.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Reply Box */}
                                <div className="pb-2 pt-8 bg-background/50 backdrop-blur-2xl border-t border-white/5">
                                    <div className="max-w-5xl mx-auto space-y-6">
                                        {ticket.status === 'CLOSED' || ticket.status === 'ON_HOLD' ? (
                                            <div className="flex flex-col items-center justify-center p-8 m-4 bg-amber-500/10 rounded-2xl border border-dashed border-amber-500/30 text-amber-600">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <ShieldAlert size={24} />
                                                    <p className="font-extrabold text-lg uppercase tracking-widest">
                                                        {ticket.status === 'CLOSED' ? "Ticket Closed" : "Ticket On Hold"}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-medium opacity-80">
                                                    This communication channel is currently locked. Change the status to <b>OPEN</b> to send a reply.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between px-2">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-3">
                                                            <Switch
                                                                id="internal-note"
                                                                checked={isInternal}
                                                                onCheckedChange={setIsInternal}
                                                                className="data-[state=checked]:bg-amber-500"
                                                            />
                                                            <Label htmlFor="internal-note" className={cn(
                                                                "text-xs font-bold cursor-pointer transition-colors",
                                                                isInternal ? "text-amber-500" : "text-muted-foreground"
                                                            )}>
                                                                Internal Note
                                                            </Label>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Markdown Supported</p>
                                                </div>

                                                <div className="relative group">

                                                    <Textarea
                                                        placeholder={isInternal ? "Add an internal note..." : "Type your reply..."}
                                                        className={cn(
                                                            "min-h-[160px] rounded-2xl p-6 text-base font-medium transition-all focus:ring-2 resize-none shadow-sm",
                                                            isInternal
                                                                ? "bg-amber-500/5 border-amber-500/20 focus:border-amber-500/50 focus:ring-amber-500/10 placeholder:text-amber-500/30"
                                                                : "bg-background border-input focus:border-primary/50 focus:ring-primary/10"
                                                        )}
                                                        value={replyMessage}
                                                        onChange={(e) => setReplyMessage(e.target.value)}

                                                    />
                                                    <div className="absolute right-6 bottom-6 flex items-center gap-3">
                                                        {selectedImage && (
                                                            <div className="relative group mr-2">
                                                                <img src={selectedImage} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-primary/20 shadow-md" />
                                                                <button
                                                                    onClick={() => setSelectedImage(null)}
                                                                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <XCircle size={10} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            onChange={handleFileChange}
                                                            accept="image/*"
                                                            className="hidden"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="h-10 w-10 rounded-lg hover:bg-secondary/50"
                                                        >
                                                            <Paperclip size={18} className="text-muted-foreground" />
                                                        </Button>
                                                        <Button
                                                            onClick={handleReply}
                                                            disabled={submitting || !replyMessage.trim()}
                                                            className={cn(
                                                                "h-12 px-8 rounded-xl font-bold gap-2 shadow-lg transition-all",
                                                                isInternal ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20" : "bg-primary shadow-primary/20"
                                                            )}
                                                        >
                                                            {submitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                                                            {isInternal ? "Add Note" : "Send Reply"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
