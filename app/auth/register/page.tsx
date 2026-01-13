"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UserPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.post("/auth/register", {
                username: data.username,
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
            });

            // Success - redirect to login
            router.push("/auth/login?registered=true");
        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-background to-background">
            <div className="w-full max-w-xl">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-accent/10 text-accent mb-4 border border-accent/20 shadow-xl shadow-accent/10">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Create Your Account
                    </h1>
                    <p className="text-muted-foreground mt-2">Join the next generation of cloud management</p>
                </div>

                <div className="glass rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-primary to-accent opacity-50"></div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" placeholder="John" {...register("firstName")} />
                                {errors.firstName && <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" placeholder="Doe" {...register("lastName")} />
                                {errors.lastName && <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" placeholder="johndoe" {...register("username")} />
                                {errors.username && <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">{errors.username.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
                                {errors.email && <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">{errors.email.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input id="phoneNumber" placeholder="+8801700000000" {...register("phoneNumber")} />
                            {errors.phoneNumber && <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">{errors.phoneNumber.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                                {errors.password && <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">{errors.password.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} />
                                {errors.confirmPassword && <p className="text-[11px] font-bold text-destructive uppercase tracking-wider">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-accent/20 hover:scale-[1.01] active:scale-[0.99] transition-all bg-accent text-accent-foreground hover:bg-accent/90"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="mr-2 h-5 w-5" />
                                    Create My Account
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-6">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-accent font-bold hover:underline">
                                Sign In Instead
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
