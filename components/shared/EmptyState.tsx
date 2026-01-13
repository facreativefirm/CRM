import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Illustration } from "./Illustration";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
            <Illustration icon={Icon} />
            <h3 className="text-xl font-black mb-2 tracking-tight">{title}</h3>
            <p className="text-muted-foreground max-w-sm font-medium mb-8 leading-relaxed">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
