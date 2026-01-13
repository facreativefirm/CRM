"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ClientForm } from "@/components/admin/clients/ClientForm";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";

interface Client {
    id: number;
    user?: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    companyName?: string;
}

interface ClientSelectorProps {
    value?: number;
    onChange: (value: number) => void;
    className?: string;
}

export function ClientSelector({ value, onChange, className }: ClientSelectorProps) {
    const [open, setOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await api.get("/clients");
            setClients(response.data.data.clients || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter((client) => {
        const fullName = `${client.user?.firstName} ${client.user?.lastName}`.toLowerCase();
        const email = (client.user?.email || "").toLowerCase();
        const company = (client.companyName || "").toLowerCase();
        const term = search.toLowerCase();
        return fullName.includes(term) || email.includes(term) || company.includes(term);
    });

    const selectedClient = clients.find((client) => client.id === value);

    const handleClientCreated = (newClient: any) => {
        setSheetOpen(false);
        // Refresh list and select the new client
        fetchClients().then(() => {
            // Assuming fetch finishes fast or we manually append. 
            // Ideally we append for instant feedback but fetch is safer.
            setClients(prev => [...prev, newClient]);
            onChange(newClient.id);
        });
    };

    return (
        <div className={cn("flex gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-12 rounded-xl bg-background border-input font-normal hover:bg-accent hover:text-accent-foreground"
                    >
                        {selectedClient ? (
                            <span className="flex items-center gap-2 truncate">
                                <User size={16} className="text-primary" />
                                <span className="font-semibold">{selectedClient.user?.firstName} {selectedClient.user?.lastName}</span>
                                <span className="text-muted-foreground text-xs">({selectedClient.user?.email})</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">{loading ? "Loading clients..." : "Select client..."}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0 bg-background " align="start">
                    <div className="p-2 border-b">
                        <div className="flex items-center border rounded-md px-3 bg-secondary/20">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                                className="border-0 focus-visible:ring-0 bg-transparent h-9"
                                placeholder="Search clients..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {filteredClients.length === 0 && !loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No clients found.
                            </div>
                        )}
                        {filteredClients.map((client) => (
                            <div
                                key={client.id}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                                    value === client.id && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                    onChange(client.id);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === client.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium">{client.user?.firstName} {client.user?.lastName}</span>
                                    <span className="text-xs text-muted-foreground">{client.user?.email} {client.companyName ? `• ${client.companyName}` : ""}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t bg-secondary/10">
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Button size="sm" className="w-full gap-2" variant="secondary" onClick={() => setSheetOpen(true)}>
                                    <Plus size={14} />
                                    Add New Client
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Add New Client</SheetTitle>
                                    <SheetDescription>
                                        Create a new client profile instantly.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="mt-6">
                                    <ClientForm
                                        onSuccess={handleClientCreated}
                                        onCancel={() => setSheetOpen(false)}
                                        className="space-y-6"
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
