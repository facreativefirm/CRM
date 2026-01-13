"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, getSessionToken, setSessionToken } from "@/lib/store/authStore";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const router = useRouter();
    const { isAuthenticated, user, setAuth } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {

            // Check if we have a session token in cookie
            const sessionToken = getSessionToken();

            if (!sessionToken) {
                router.push("/auth/login");
                setIsChecking(false);
                return;
            }

            // If we have a token but no user in state, fetch user data
            if (!user) {
                try {
                    console.log('[AuthGuard] No user in state, fetching from /auth/me');
                    const response = await api.get("/auth/me");
                    console.log('[AuthGuard] /auth/me success:', response.data.data.user.username);
                    const userData = response.data.data.user;
                    setAuth(userData, sessionToken);
                } catch (error: any) {
                    console.warn('[AuthGuard] session expired or invalid:', error.response?.status);
                    setAuthError(error.response?.data?.message || 'Session expired');
                    router.push("/auth/login");
                    setIsChecking(false);
                    return;
                }
            } else {
                console.log('[AuthGuard] User already in state:', user.username);
            }

            // Check role permissions
            if (allowedRoles && user && !allowedRoles.includes(user.userType)) {
                // Redirect to appropriate dashboard based on user type
                if (user.userType === "CLIENT") {
                    router.push("/client");
                } else if (user.userType === "RESELLER") {
                    router.push("/reseller");
                } else if (user.userType === "ADMIN" || user.userType === "SUPER_ADMIN") {
                    router.push("/");
                } else {
                    router.push("/unauthorized");
                }
                setIsChecking(false);
                return;
            }

            // All checks passed
            setIsChecking(false);
        };

        checkAuth();
    }, [router, allowedRoles, user, setAuth]);

    // Show loading spinner while checking auth
    if (isChecking) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Authenticating...</p>
                    {authError && <p className="text-xs text-destructive mt-2">{authError}</p>}
                </div>
            </div>
        );
    }

    // If not authenticated or wrong role, don't render (redirect is happening)
    if (!isAuthenticated || !user) {
        return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.userType)) {
        return null;
    }

    return <>{children}</>;
}
