"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ShieldCheck, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/shared/Modal";

const otpSchema = z.object({
    code: z.string().length(6, "Code must be 6 digits"),
});

export function TwoFactorSetup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [step, setStep] = useState<"SETUP" | "VERIFY">("SETUP");
    const [qrCode, setQrCode] = useState<string>("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/WHMCS:Admin?secret=JBSWY3DPEHPK3PXP&issuer=WHMCS"); // Mock
    const [secret, setSecret] = useState<string>("JBSWY3DPEHPK3PXP"); // Mock

    const { register, handleSubmit, formState: { errors } } = useForm<{ code: string }>({
        resolver: zodResolver(otpSchema),
    });

    const onVerify = (data: { code: string }) => {
        console.log("Verifying code:", data.code);
        alert("In a real app, this would verify with backend.");
        onClose();
    };

    return (
        <Modal open={isOpen} onOpenChange={onClose}>
            <ModalContent className="sm:max-w-md">
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Two-Factor Authentication
                    </ModalTitle>
                    <ModalDescription>
                        Secure your account with 2FA.
                    </ModalDescription>
                </ModalHeader>

                {step === "SETUP" && (
                    <div className="flex flex-col items-center gap-6 py-4">
                        <div className="p-4 bg-white rounded-xl">
                            <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />
                        </div>
                        <div className="text-center space-y-2">
                            <Label>Or enter manual code:</Label>
                            <div className="p-2 bg-secondary/30 rounded-lg text-sm font-mono tracking-widest select-all">
                                {secret}
                            </div>
                        </div>
                        <Button onClick={() => setStep("VERIFY")} className="w-full">
                            Scan User & Continue
                        </Button>
                    </div>
                )}

                {step === "VERIFY" && (
                    <form onSubmit={handleSubmit(onVerify)} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Enter 6-digit Code</Label>
                            <Input
                                placeholder="000 000"
                                className="text-center text-2xl tracking-[0.5em] font-mono"
                                maxLength={6}
                                {...register("code")}
                            />
                            {errors.code && <p className="text-destructive text-xs">{errors.code.message}</p>}
                        </div>
                        <Button type="submit" className="w-full">
                            Verify & Enable
                        </Button>
                    </form>
                )}
            </ModalContent>
        </Modal>
    );
}
