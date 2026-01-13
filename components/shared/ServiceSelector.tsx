"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Folder, Search, Plus } from "lucide-react";
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
import { ServiceForm } from "@/components/admin/products/ServiceForm";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";

interface Service {
    id: number;
    name: string;
    slug?: string;
}

interface ServiceSelectorProps {
    value?: string | number;
    onChange: (value: string) => void;
    className?: string;
    excludeId?: string | number;
}

export function ServiceSelector({ value, onChange, className, excludeId }: ServiceSelectorProps) {
    const [open, setOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await api.get("/products/services");
            // Flatten services if they are hierarchical
            const list = response.data.data.services || [];
            let flat: Service[] = [];

            const flatten = (items: any[]) => {
                items.forEach(svc => {
                    flat.push({ id: svc.id, name: svc.name, slug: svc.slug });
                    if (svc.subServices && svc.subServices.length > 0) {
                        flatten(svc.subServices);
                    }
                });
            };

            flatten(list);
            setServices(flat);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter((svc) => {
        const name = (svc.name || "").toLowerCase();
        const term = search.toLowerCase();
        const isExcluded = excludeId && svc.id.toString() === excludeId.toString();
        return name.includes(term) && !isExcluded;
    });

    const selectedService = services.find((svc) => svc.id.toString() === value?.toString());

    const handleServiceCreated = (newService: any) => {
        setSheetOpen(false);
        setServices(prev => [...prev, newService]);
        onChange(newService.id.toString());
        setOpen(false); // Close popover too
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-12 rounded-xl bg-background border-input font-normal hover:bg-accent hover:text-accent-foreground"
                    >
                        {selectedService ? (
                            <span className="flex items-center gap-2 truncate">
                                <Folder size={16} className="text-primary" />
                                <span className="font-semibold">{selectedService.name}</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">{loading ? "Loading services..." : "Select service..."}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-background" align="start">
                    <div className="p-2 border-b">
                        <div className="flex items-center border rounded-md px-3 bg-secondary/20">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                                className="border-0 focus-visible:ring-0 bg-transparent h-9"
                                placeholder="Search services..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {filteredServices.length === 0 && !loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No services found.
                            </div>
                        )}
                        {filteredServices.map((svc) => (
                            <div
                                key={svc.id}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-md px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                    value?.toString() === svc.id.toString() && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                    onChange(svc.id.toString());
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value?.toString() === svc.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <span>{svc.name}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t bg-secondary/10">
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Button size="sm" className="w-full gap-2" variant="secondary">
                                    <Plus size={14} />
                                    Add New Service
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Add New Service</SheetTitle>
                                    <SheetDescription>
                                        Create a new service instantly.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="mt-6">
                                    <ServiceForm
                                        onSuccess={handleServiceCreated}
                                        onCancel={() => setSheetOpen(false)}
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
