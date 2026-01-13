"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore, setSessionToken } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const loginSchema = z.object({
    identifier: z.string().min(3, "Username or email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('[Login] Attempting login...');
            const response = await api.post("/auth/login", data);
            console.log('[Login] Login response:', response.data);

            const { user, sessionToken } = response.data.data;
            console.log('[Login] Received user:', user);
            console.log('[Login] Received sessionToken:', sessionToken);

            // Set session token in cookie
            setSessionToken(sessionToken);

            // Set auth state
            setAuth(user, sessionToken);

            console.log('[Login] Auth set, redirecting based on user type:', user.userType);

            // Redirect based on user type
            if (user.userType === "ADMIN" || user.userType === "SUPER_ADMIN") {
                router.push("/");
            } else if (user.userType === "RESELLER") {
                router.push("/reseller");
            } else {
                router.push("/client");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Invalid credentials. Please try again.";
            if (err.response?.status === 401) {
                console.warn('[Login] Authentication failed:', errorMessage);
            } else {
                console.error('[Login] Unexpected login error:', errorMessage, err.response?.data);
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 text-primary mb-4 border border-primary/20 shadow-xl shadow-primary/10">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="text-muted-foreground mt-2">Log in to manage your premium services</p>
                </div>

                <div className="glass rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in zoom-in duration-300">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="identifier">Username or Email</Label>
                            <Input
                                id="identifier"
                                placeholder="john.doe"
                                {...register("identifier")}
                                className={cn(errors.identifier && "border-destructive/50 focus-visible:ring-destructive")}
                            />
                            {errors.identifier && (
                                <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">{errors.identifier.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="/auth/forgot-password" title="Forgot password?" className="text-xs text-primary hover:underline font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register("password")}
                                className={cn(errors.password && "border-destructive/50 focus-visible:ring-destructive")}
                            />
                            {errors.password && (
                                <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <LogIn className="mr-2 h-5 w-5" />
                                    Sign In
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link href="/auth/register" className="text-primary font-bold hover:underline">
                                Create one now
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center mt-8 text-xs text-muted-foreground/50 font-medium">
                    Protected by industry-standard encryption.
                </p>
            </div>
        </div>
    );
}
