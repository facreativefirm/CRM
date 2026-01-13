"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
    return (
        <div className="relative flex items-center">
            <input
                type="checkbox"
                className={cn(
                    "peer h-5 w-5 shrink-0 appearance-none rounded-md border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground",
                    className
                )}
                ref={ref}
                {...props}
            />
            <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
    );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
