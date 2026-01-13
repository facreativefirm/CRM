"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Tag, Bookmark, MessageSquare } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface PredefinedReplyFormProps {
    initialData?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PredefinedReplyForm({ initialData, onSuccess, onCancel }: PredefinedReplyFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        category: initialData?.category || "",
        message: initialData?.message || "",
        tags: initialData?.tags || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData?.id) {
                await api.patch(`/support/predefined-replies/${initialData.id}`, formData);
                toast.success("Macro updated successfully");
            } else {
                await api.post("/support/predefined-replies", formData);
                toast.success("Macro registered successfully");
            }
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save macro");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Macro Title</Label>
                    <div className="relative">
                        <Bookmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            className="pl-12 h-12 rounded-xl bg-secondary/30 border-none font-bold"
                            placeholder="e.g. Greeting / Welcome"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Category</Label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                className="pl-12 h-12 rounded-xl bg-secondary/30 border-none font-bold"
                                placeholder="General"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Tags (Comma separated)</Label>
                        <Input
                            className="h-12 rounded-xl bg-secondary/30 border-none font-bold"
                            placeholder="welcome, greeting, initial"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Macro Response Body</Label>
                    <Textarea
                        className="min-h-[200px] rounded-2xl p-6 bg-secondary/30 border-none font-medium text-base resize-none"
                        placeholder="Type the message that will be inserted..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                    />
                    <p className="text-[10px] text-muted-foreground italic px-1">Use Markdown formatting for cinematic ticket presentation.</p>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-6 rounded-xl font-bold">
                        Cancel
                    </Button>
                )}
                <Button disabled={loading} className="h-12 px-8 rounded-xl font-black gap-2 shadow-xl shadow-primary/20 bg-primary text-primary-foreground">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {initialData?.id ? "Update Macro" : "Register Macro"}
                </Button>
            </div>
        </form>
    );
}
