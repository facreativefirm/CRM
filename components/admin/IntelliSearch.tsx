"use client";

import React, { useState, useEffect } from "react";
import { Search, User, FileText, Server, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

interface SearchResult {
    id: string | number;
    title: string;
    subtitle: string;
    type: 'client' | 'invoice' | 'service' | 'ticket';
    url: string;
}

export function IntelliSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { t } = useLanguage();

    // Mock Search Logic
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const mockResults: SearchResult[] = [
            { id: 1, title: "John Doe", subtitle: "Active • john@example.com", type: 'client', url: '/admin/clients/1' },
            { id: 2, title: "Nextjs Hosting", subtitle: "Service • mysite.com", type: 'service', url: '/admin/services/2' },
            { id: 9842, title: "Invoice #9842", subtitle: "$15.00 • Unpaid", type: 'invoice', url: '/admin/billing/invoice/9842' },
        ];

        setResults(mockResults.filter(r => r.title.toLowerCase().includes(query.toLowerCase())));
    }, [query]);

    return (
        <div className="relative w-full max-w-md hidden md:block group">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder={t("search") + " (Clients, Invoices, Services...)"}
                    className="pl-10 h-10 bg-secondary/30 border-white/5 focus-visible:bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-full"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {isOpen && query.length > 0 && (
                <div className="absolute top-12 left-0 w-full bg-card text-card-foreground rounded-2xl p-2 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="text-xs font-bold text-muted-foreground uppercase px-3 py-2">
                        Top Results
                    </div>
                    {results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((res) => (
                                <button
                                    key={`${res.type}-${res.id}`}
                                    onClick={() => router.push(res.url)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group/item"
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                        res.type === 'client' && "bg-blue-500/10 text-blue-500",
                                        res.type === 'invoice' && "bg-emerald-500/10 text-emerald-500",
                                        res.type === 'service' && "bg-purple-500/10 text-purple-500",
                                    )}>
                                        {res.type === 'client' && <User className="w-4 h-4" />}
                                        {res.type === 'invoice' && <FileText className="w-4 h-4" />}
                                        {res.type === 'service' && <Server className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-foreground group-hover/item:text-primary transition-colors">{res.title}</p>
                                        <p className="text-xs text-muted-foreground">{res.subtitle}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity -translate-x-2 group-hover/item:translate-x-0" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No results found for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
