"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard allowedRoles={["RESELLER"]}>
            {children}
        </AuthGuard>
    );
}
