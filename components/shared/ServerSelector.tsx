"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Server, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import api from "@/lib/api";

interface ServerSelectorProps {
    value?: string | number;
    onChange: (value: any) => void;
    className?: string;
}

export function ServerSelector({ value, onChange, className }: ServerSelectorProps) {
    const [open, setOpen] = useState(false);
    const [servers, setServers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && servers.length === 0) {
            fetchServers();
        }
    }, [open]);

    const fetchServers = async () => {
        try {
            setLoading(true);
            const response = await api.get("/servers");
            setServers(response.data.data.servers || []);
        } catch (error) {
            console.error("Error fetching servers:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedServer = servers.find((s) => s.id.toString() === value?.toString());

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-background/50 h-12 rounded-xl border-white/10"
                    >
                        {selectedServer ? (
                            <div className="flex items-center gap-2">
                                <Server size={16} className="text-primary" />
                                <span className="font-bold">{selectedServer.serverName}</span>
                                <span className="text-xs text-muted-foreground">({selectedServer.hostname})</span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">Select a server...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-background/95 backdrop-blur-xl border-white/10" align="start">
                    <div className="p-2 space-y-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : servers.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No servers found.
                            </div>
                        ) : (
                            servers.map((server) => (
                                <button
                                    key={server.id}
                                    onClick={() => {
                                        onChange(server.id);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center justify-between w-full p-3 rounded-lg text-left transition-all hover:bg-primary/10",
                                        value?.toString() === server.id.toString() ? "bg-primary/20 text-primary" : "text-foreground"
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">{server.serverName}</span>
                                        <span className="text-[10px] opacity-70 uppercase tracking-wider">{server.hostname} • {server.serverType}</span>
                                    </div>
                                    {value?.toString() === server.id.toString() && <Check size={16} />}
                                </button>
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
