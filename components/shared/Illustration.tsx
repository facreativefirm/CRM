import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IllustrationProps {
    icon: LucideIcon;
    className?: string;
    glowColor?: string;
}

export function Illustration({ icon: Icon, className, glowColor = "bg-primary" }: IllustrationProps) {
    return (
        <div className={cn("relative flex items-center justify-center w-32 h-32 mb-8", className)}>
            {/* Background Glows */}
            <div className={cn(
                "absolute inset-0 rounded-full blur-3xl opacity-20 animate-pulse",
                glowColor
            )} />
            <div className={cn(
                "absolute inset-4 rounded-full blur-2xl opacity-40",
                glowColor
            )} />

            {/* Icon with Glass Container */}
            <div className="relative z-10 w-24 h-24 rounded-[2rem] glass-darker flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Icon
                    size={48}
                    className="text-foreground transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:text-primary"
                />

                {/* Micro-particle effect placeholders */}
                <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-white/40 animate-ping" />
                <div className="absolute bottom-4 left-3 w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce delay-300" />
            </div>
        </div>
    );
}
