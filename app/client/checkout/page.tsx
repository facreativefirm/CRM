"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import {
    ShoppingBag,
    CreditCard,
    CheckCircle,
    Trash2,
    Tag,
    Loader2,
    ArrowRight,
    ArrowLeft,
    ShieldCheck,
    Lock,
    Smartphone,
    Server,
    Zap,
    Landmark,
    Globe,
    CheckCircle2,
    XCircle,
    Receipt
} from "lucide-react";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/shared/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { Label } from "@/components/ui/label";

export default function CheckoutPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get("invoiceId");

    const { items, removeItem, updateItem, clearCart, total, promoCode, setPromoCode, updateDomainName } = useCartStore();
    const { user } = useAuthStore();
    const { formatPrice } = useSettingsStore();

    const [step, setStep] = useState(invoiceId ? 3 : 1);
    const [loading, setLoading] = useState(false);
    const [promoInput, setPromoInput] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [invoice, setInvoice] = useState<any>(null);
    const [trxId, setTrxId] = useState("");
    const [senderNumber, setSenderNumber] = useState("");

    // Domain Search for missing domain items
    const [domainInputs, setDomainInputs] = useState<Record<string, string>>({});
    const [domainTargetItem, setDomainTargetItem] = useState<string | null>(null);

    const MANUAL_METHODS = [
        {
            id: 'bank', name: 'Bank Transfer', desc: 'Direct Deposit', icon: Landmark, type: 'manual',
            instructions: { en: 'Bank: City Bank\nAcct: 1234567890\nName: Host Ltd\nRef: Your Invoice #', bn: 'ব্যাংক: সিটি ব্যাংক\nঅ্যাকাউন্ট: ১২৩৪৫৬৭৮৯০\nনাম: হোস্ট লিঃ\nরেফারেন্স: আপনার ইনভয়েস নম্বর ব্যবহার করুন' }
        },
        {
            id: 'bkash_manual', name: 'bKash (Send Money)', desc: 'Mobile Banking', icon: Smartphone, type: 'manual',
            instructions: { en: 'bKash Personal: 01700000000\nRef: Your Invoice #', bn: 'বিকাশ পার্সোনাল: ০১৭০০০০০০০০\n(সেন্ড মানি অপশন)\nরেফারেন্স: আপনার ইনভয়েস নম্বর' }
        },
        {
            id: 'nagad_manual', name: 'Nagad (Payment)', desc: 'Merchant Pay', icon: Smartphone, type: 'manual',
            instructions: { en: 'Nagad Merchant: 01800000000\nRef: Your Invoice #', bn: 'নগদ মার্চেন্ট: ০১৮০০০০০০০০\n(পেমেন্ট অপশন)\nরেফারেন্স: আপনার ইনভয়েস নম্বর' }
        }
    ];

    useEffect(() => {
        if (invoiceId) {
            fetchInvoice(parseInt(invoiceId));
        }
    }, [invoiceId]);

    const fetchInvoice = async (id: number) => {
        try {
            setLoading(true);
            const response = await api.get(`/invoices/${id}`);
            setInvoice(response.data.data.invoice);
        } catch (error) {
            toast.error("Error loading invoice");
            router.push("/client/billing");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPromo = () => {
        if (promoInput === "SAVE20") {
            setPromoCode("SAVE20");
            toast.success("Promo code applied!");
        } else {
            toast.error("Invalid promo code");
        }
    };

    const [completedOrder, setCompletedOrder] = useState<any>(null);

    const handleCompleteOrder = async () => {
        // Validation: Check if any domain items are missing domain names
        const missingDomain = items.find(i => i.type === 'DOMAIN' && !i.domainName);
        if (!invoiceId && missingDomain) {
            toast.error(`Please set a domain name for ${missingDomain.name}`);
            setStep(1);
            return;
        }

        try {
            setLoading(true);

            if (invoiceId && invoice) {
                const selectedMethod = MANUAL_METHODS.find(m => m.id === paymentMethod);
                if (selectedMethod) {
                    if (!trxId || !senderNumber) {
                        toast.error("Provide Transaction ID and Sender Phone");
                        setLoading(false);
                        return;
                    }
                    await api.post("/invoices/manual-payment", {
                        invoiceId: invoice.id,
                        gateway: paymentMethod,
                        transactionId: trxId,
                        senderNumber: senderNumber
                    });
                    toast.success("Payment proof sent! We will verify it soon.");
                    router.push("/client/transactions");
                    return;
                }

                const gateway = paymentMethod === 'mobile' ? 'BKASH' : 'STRIPE';
                await api.post("/invoices/pay", {
                    invoiceId: invoice.id,
                    gateway: gateway
                });
                toast.success("Payment successful!");
                router.push("/client/transactions");
                return;
            }

            const response = await api.post("/orders", {
                items: items.map(i => ({
                    productId: i.id.startsWith('dom-') ? i.productId : parseInt(i.id),
                    billingCycle: i.billingCycle,
                    quantity: i.quantity || 1,
                    domainName: i.domainName
                })),
                paymentMethod: paymentMethod,
                promoCode: promoCode || undefined
            });

            setCompletedOrder(response.data.data.order);
            toast.success("Order placed successfully!");
            clearCart();
            setStep(4);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to process order.");
        } finally {
            setLoading(false);
        }
    };

    if (!invoiceId && items.length === 0 && step !== 4) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <Sidebar />
                <main className="lg:pl-75 pt-[15vh] flex flex-col items-center justify-center p-4 text-center">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-10 rounded-full bg-secondary/30 mb-6">
                        <ShoppingBag className="w-16 h-16 text-primary" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                    <p className="text-muted-foreground mb-8 max-w-xs">Look around our store to find the perfect services for you.</p>
                    <Button asChild pill className="px-8 font-bold">
                        <Link href="/client/store">Browse Services</Link>
                    </Button>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <Sidebar />
            <main className="lg:pl-75 pt-20 pb-20 p-4 md:p-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            {step === 4 ? "Success!" : "Complete Purchase"}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {step === 4 ? "Your order is being processed." : "Fill in your details and pay to get started."}
                        </p>
                    </div>

                    {/* Simple Step Indicator */}
                    {step < 4 && (
                        <div className="flex items-center gap-2 mb-8 bg-card border rounded-2xl p-2 w-fit mx-auto sm:mx-0">
                            {[1, 2, 3].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => step > s && setStep(s)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                                        step === s ? "bg-primary text-primary-foreground shadow-sm" : step > s ? "text-primary hover:bg-primary/5" : "text-muted-foreground opacity-50 cursor-default"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[10px] border", step === s ? "bg-primary-foreground text-primary border-transparent" : "border-current")}>
                                        {step > s ? <CheckCircle size={10} strokeWidth={3} /> : s}
                                    </div>
                                    {s === 1 ? "Cart" : s === 2 ? "Account" : "Payment"}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                                        <div className="bg-card border rounded-2xl overflow-hidden">
                                            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                                                <h3 className="text-sm font-bold flex items-center gap-2 px-1">
                                                    <ShoppingBag size={16} className="text-primary" />
                                                    Order Items ({items.length})
                                                </h3>
                                            </div>
                                            <div className="divide-y">
                                                {items.map((item) => (
                                                    <div key={item.id} className="p-4 transition-colors hover:bg-muted/5">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                                    {item.type === 'DOMAIN' ? <Globe size={18} /> : <Server size={18} />}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                                                                    <div className="flex flex-wrap gap-2 items-center mt-1">
                                                                        {(item.monthlyPrice && item.annualPrice) ? (
                                                                            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border">
                                                                                <button
                                                                                    onClick={() => updateItem(item.id, { billingCycle: 'MONTHLY', price: item.monthlyPrice! })}
                                                                                    className={cn(
                                                                                        "px-2 py-0.5 text-[10px] rounded-md font-bold transition-all",
                                                                                        item.billingCycle === 'MONTHLY' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                                                                    )}
                                                                                >
                                                                                    Monthly
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => updateItem(item.id, { billingCycle: 'ANNUALLY', price: item.annualPrice! })}
                                                                                    className={cn(
                                                                                        "px-2 py-0.5 text-[10px] rounded-md font-bold transition-all",
                                                                                        item.billingCycle === 'ANNUALLY' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                                                                    )}
                                                                                >
                                                                                    Annually
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <Badge variant="secondary" className="text-[10px] h-5">{item.billingCycle}</Badge>
                                                                        )}
                                                                        {item.type === 'DOMAIN' && (
                                                                            item.domainName ? (
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[11px] text-emerald-600 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10 flex items-center gap-1">
                                                                                        <CheckCircle size={10} /> {item.domainName}
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() => setDomainTargetItem(domainTargetItem === item.id ? null : item.id)}
                                                                                        className="text-[10px] text-primary font-bold hover:underline"
                                                                                    >
                                                                                        Change
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                                                                                    <Zap size={10} /> Action Required
                                                                                </span>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-sm">{formatPrice(item.price)}</p>
                                                                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors mt-1">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Inline Domain Config */}
                                                        <AnimatePresence>
                                                            {(domainTargetItem === item.id || (item.type === 'DOMAIN' && !item.domainName)) && (
                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 pt-4 border-t border-dashed overflow-hidden">
                                                                    <Label className="text-xs font-bold mb-2 block">Choose your domain name</Label>
                                                                    <div className="flex gap-2">
                                                                        <div className="relative flex-1">
                                                                            <Input
                                                                                placeholder="mysite.com"
                                                                                className="h-10 rounded-xl"
                                                                                value={domainInputs[item.id] || ""}
                                                                                onChange={(e) => setDomainInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                            />
                                                                        </div>
                                                                        <Button size="sm" onClick={() => {
                                                                            const val = domainInputs[item.id];
                                                                            if (val && val.length > 3) {
                                                                                const finalName = val.includes(".") ? val : `${val}.com`;
                                                                                updateDomainName(item.id, finalName);
                                                                                toast.success(`Domain ${finalName} selected!`);
                                                                                setDomainTargetItem(null);
                                                                            } else {
                                                                                toast.error("Please enter a valid domain name");
                                                                            }
                                                                        }}>Set Domain</Button>
                                                                        {item.domainName && <Button variant="ghost" size="sm" onClick={() => setDomainTargetItem(null)}>Cancel</Button>}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center bg-card border rounded-2xl p-4">
                                            <Button variant="ghost" size="sm" asChild className="font-bold text-muted-foreground">
                                                <Link href="/client/store"><ArrowLeft size={16} className="mr-2" /> Back to Store</Link>
                                            </Button>
                                            <Button onClick={() => setStep(2)} pill className="px-10 font-bold group">
                                                Continue
                                                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                                        <div className="bg-card border rounded-2xl p-6 space-y-6">
                                            <div className="flex items-center gap-3 border-b pb-4">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <Lock size={16} />
                                                </div>
                                                <h3 className="text-sm font-bold">Personal Details</h3>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                                                    <div className="p-2.5 rounded-xl bg-muted/30 border text-sm font-semibold">
                                                        {user?.firstName} {user?.lastName}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">Email Address</Label>
                                                    <div className="p-2.5 rounded-xl bg-muted/30 border text-sm font-semibold">
                                                        {user?.email}
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-2 space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">Billing Address</Label>
                                                    <Input placeholder="Enter your full address" className="rounded-xl h-11" />
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 text-primary border border-primary/10">
                                                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                                                <p className="text-[11px] font-medium leading-relaxed">
                                                    We use these details for your legal invoices and service registration.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center bg-card border rounded-2xl p-4">
                                            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="font-bold text-muted-foreground">
                                                <ArrowLeft size={16} className="mr-2" /> Review Cart
                                            </Button>
                                            <Button onClick={() => setStep(3)} pill className="px-10 font-bold group">
                                                Choose Payment
                                                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div key="step3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                                        <div className="bg-card border rounded-2xl p-6 space-y-6">
                                            <h3 className="text-sm font-bold flex items-center gap-2">
                                                <CreditCard size={16} className="text-primary" />
                                                Select Payment Method
                                            </h3>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {[
                                                    { id: 'card', name: 'Card / Global', desc: 'Secure Checkout', icon: CreditCard },
                                                    ...MANUAL_METHODS
                                                ].map((method) => (
                                                    <button
                                                        key={method.id}
                                                        onClick={() => setPaymentMethod(method.id)}
                                                        className={cn(
                                                            "p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                                                            paymentMethod === method.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className={cn("p-2 rounded-lg", paymentMethod === method.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                                                <method.icon size={18} />
                                                            </div>
                                                            {paymentMethod === method.id && <CheckCircle2 size={16} className="text-primary" />}
                                                        </div>
                                                        <p className="text-xs font-bold">{method.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{method.desc}</p>
                                                    </button>
                                                ))}
                                            </div>

                                            {MANUAL_METHODS.find(m => m.id === paymentMethod) && (
                                                <div className="p-4 rounded-xl bg-muted/40 border space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">How to Pay:</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] leading-relaxed">
                                                            {(() => {
                                                                const method = MANUAL_METHODS.find(m => m.id === paymentMethod);
                                                                if (!method) return null;

                                                                const refValue = invoice?.invoiceNumber || (invoiceId ? `#${invoiceId}` : 'Your Invoice #');

                                                                const enInstructions = method.instructions.en.replace('Your Invoice #', refValue);
                                                                const bnInstructions = method.instructions.bn.replace('আপনার ইনভয়েস নম্বর ব্যবহার করুন', refValue).replace('আপনার ইনভয়েস নম্বর', refValue);

                                                                return (
                                                                    <>
                                                                        <div className="bg-card p-3 rounded-lg border whitespace-pre-line">{enInstructions}</div>
                                                                        <div className="bg-card p-3 rounded-lg border text-primary font-sans whitespace-pre-line">{bnInstructions}</div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {invoiceId && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transaction ID / TXNID</Label>
                                                                <Input
                                                                    placeholder="Enter proof ID"
                                                                    className="h-10 rounded-xl font-bold uppercase"
                                                                    value={trxId}
                                                                    onChange={(e) => setTrxId(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sender Account / Phone</Label>
                                                                <Input
                                                                    placeholder="e.g. 017XXXXXXXX"
                                                                    className="h-10 rounded-xl"
                                                                    value={senderNumber}
                                                                    onChange={(e) => setSenderNumber(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-card border rounded-2xl p-6 text-center space-y-4">
                                            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                                                By clicking below, you agree to our terms. Services will be activated {paymentMethod === 'card' ? 'instantly' : 'after we verify your payment manualy'}.
                                            </p>
                                            <Button
                                                onClick={handleCompleteOrder}
                                                className="w-full h-12 rounded-xl font-bold gap-2 text-md shadow-lg shadow-primary/20"
                                                disabled={loading}
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                    <>
                                                        <Zap size={18} />
                                                        {invoiceId ? "Confirm Payment" : "Place Order Now"}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 4 && (
                                    <motion.div key="step4" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-12 bg-card border rounded-3xl text-center flex flex-col items-center">
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 text-emerald-500">
                                            <CheckCircle className="w-10 h-10" />
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">Order Success!</h2>
                                        <p className="text-muted-foreground mb-1">Your order number is <span className="text-foreground font-bold">#{completedOrder?.orderNumber}</span></p>
                                        <p className="text-xs text-muted-foreground mb-10 max-w-xs">We've sent a confirmation email to you. Your services are being set up now.</p>

                                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm px-6">
                                            <Button asChild className="flex-1 rounded-xl h-11 font-bold">
                                                <Link href={`/client/checkout?invoiceId=${completedOrder?.id}`}>
                                                    Make The Payment
                                                </Link>
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary Sidebar */}
                        {step !== 4 && (
                            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
                                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                        <Receipt size={14} /> Price Summary
                                    </h4>

                                    <div className="space-y-3 pb-4 border-b">
                                        {(() => {
                                            const subtotal = invoiceId && invoice ? parseFloat(invoice.subtotal) : items.reduce((acc, i) => acc + (typeof i.price === 'string' ? parseFloat(i.price) : (i.price || 0)), 0);
                                            const discount = promoCode === 'SAVE20' ? subtotal * 0.2 : 0;
                                            const discountedSubtotal = subtotal - discount;
                                            const tax = invoiceId && invoice ? parseFloat(invoice.taxAmount) : discountedSubtotal * 0.05;
                                            const finalTotal = invoiceId && invoice ? parseFloat(invoice.totalAmount) : discountedSubtotal + tax;

                                            return (
                                                <>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">Original Price</span>
                                                        <span className="font-bold">{formatPrice(subtotal)}</span>
                                                    </div>

                                                    {promoCode && (
                                                        <div className="flex justify-between items-center text-xs text-emerald-600 font-bold bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                                                            <span className="flex items-center gap-1"><Tag size={10} /> SAVED 20%</span>
                                                            <span>-{formatPrice(discount)}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground text-xs">Tax ({invoiceId && invoice ? "Included" : "5%"})</span>
                                                        <span className="font-bold">{formatPrice(tax)}</span>
                                                    </div>

                                                    <div className="pt-4 mb-0 flex justify-between items-end">
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Grand Total</p>
                                                            <p className="text-xs text-muted-foreground font-medium">Final amount to pay</p>
                                                        </div>
                                                        <span className="text-2xl font-black text-primary tracking-tighter">
                                                            {formatPrice(finalTotal)}
                                                        </span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {!invoiceId && (
                                        <div className="pt-4 space-y-3">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Promo Code</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Enter code"
                                                    value={promoInput}
                                                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                                                    className="h-9 rounded-xl text-xs font-bold"
                                                />
                                                <Button size="sm" onClick={handleApplyPromo} variant="secondary" className="font-bold">Apply</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3 items-start">
                                    <ShieldCheck className="text-primary mt-1 shrink-0" size={16} />
                                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                                        Your payment is secured with 256-bit encryption. Activation is usually immediate for card payments.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

