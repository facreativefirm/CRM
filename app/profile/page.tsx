"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TwoFactorSetup } from "@/components/auth/TwoFactor/TwoFactorSetup";
import { Shield, User, Lock, Save } from "lucide-react";

export default function ProfilePage() {
    const { t } = useLanguage();
    const { user } = useAuthStore();
    const [is2FAModalOpen, set2FAModalOpen] = useState(false);

    const { register, handleSubmit } = useForm({
        defaultValues: {
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.email || "",
            currentPassword: "",
            newPassword: "",
        }
    });

    const onSubmit = (data: any) => {
        console.log("Updating profile:", data);
        alert("Profile update simulation success!");
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-20 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("my_profile") || "Account Security"}</h1>
                            <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium">Manage your personal identity, credentials, and authentication preferences.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Col: Personal Info */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-8 border-b border-border pb-5">
                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-extrabold tracking-tight">Identity Details</h2>
                                    </div>

                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</Label>
                                                <Input {...register("firstName")} className="h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary/50 font-semibold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</Label>
                                                <Input {...register("lastName")} className="h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary/50 font-semibold" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered Email</Label>
                                            <Input {...register("email")} disabled className="h-11 rounded-xl bg-secondary/10 border-border/50 opacity-60 font-semibold cursor-not-allowed" />
                                            <p className="text-[10px] text-muted-foreground font-medium">Contact administration to modify your primary email record.</p>
                                        </div>

                                        <div className="pt-2">
                                            <Button type="submit" className="h-11 px-8 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2">
                                                <Save className="w-4 h-4" />
                                                Persist Changes
                                            </Button>
                                        </div>
                                    </form>
                                </div>

                                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-8 border-b border-border pb-5">
                                        <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-extrabold tracking-tight">Security Credentials</h2>
                                    </div>
                                    <form className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Password</Label>
                                            <Input type="password" placeholder="••••••••" className="h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary/50 font-semibold" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Access Key</Label>
                                                <Input type="password" placeholder="Minimum 12 characters" className="h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary/50 font-semibold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Re-verify Key</Label>
                                                <Input type="password" placeholder="Confirm new key" className="h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary/50 font-semibold" />
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <Button type="button" variant="outline" className="h-11 px-8 rounded-xl font-bold border-border hover:bg-secondary/50">Modify Access Key</Button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Right Col: Security */}
                            <div className="space-y-6">
                                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-110">
                                        <Shield size={80} />
                                    </div>
                                    <div className="flex items-center gap-3 mb-6 relative z-10">
                                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-extrabold tracking-tight">Trust Status</h2>
                                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest leading-none mt-1">Health: Nominal</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex items-center justify-between p-4 bg-secondary/30 border border-border/50 rounded-xl transition-colors hover:bg-secondary/50">
                                            <div>
                                                <p className="font-bold text-sm">2FA Protocols</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">Enhanced auth currently inactive</p>
                                            </div>
                                            <Button size="sm" className="h-9 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-sm" onClick={() => set2FAModalOpen(true)}>Enable</Button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-secondary/30 border border-border/50 rounded-xl transition-colors hover:bg-secondary/50">
                                            <div>
                                                <p className="font-bold text-sm">Last Access</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">Session recorded from Dhaka, BD</p>
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase tracking-widest p-0 px-2 opacity-60 hover:opacity-100">Audit</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <TwoFactorSetup isOpen={is2FAModalOpen} onClose={() => set2FAModalOpen(false)} />
                </main>
            </div>
        </AuthGuard>
    );
}
