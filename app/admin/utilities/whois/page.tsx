"use client";

import React, { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Globe, Loader2, History, AlertCircle, Shield, Server, User, Building, Mail, Phone, MapPin, Hash } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

interface WhoisHistoryItem {
    id: number;
    domain: string;
    timestamp: Date;
}

interface ContactInfo {
    name: string;
    organization: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    email: string;
}

interface WhoisData {
    domainInfo: {
        domain: string;
        registeredOn: string;
        expiresOn: string;
        updatedOn: string;
        status: string;
        nameservers: string[];
    };
    registrarInfo: {
        registrar: string;
        ianaId: string;
        email: string;
        abuseEmail: string;
        abusePhone: string;
    };
    registrant: ContactInfo;
    admin: ContactInfo;
    tech: ContactInfo;
}

export default function WhoisLookupPage() {
    const { t } = useLanguage();
    const [domain, setDomain] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<WhoisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<WhoisHistoryItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const getVCardValue = (vcard: any[], type: string): any => {
        if (!vcard) return "";
        const entry = vcard.find((item: any) => item[0] === type);
        if (!entry) return "";
        // Address is a special array: [po_box, ext, street, city, state, zip, country]
        if (type === 'adr') return entry[3];
        // Others are usually text at index 3
        return entry[3];
    };

    const extractContact = (entities: any[], role: string): ContactInfo => {
        const emptyContact = {
            name: "", organization: "", street: "", city: "", state: "", postalCode: "", country: "", phone: "", email: ""
        };

        if (!entities) return emptyContact;

        const entity = entities.find((e: any) => e.roles?.includes(role));
        if (!entity || !entity.vcardArray || !entity.vcardArray[1]) return emptyContact;

        const vcard = entity.vcardArray[1];
        const adr = getVCardValue(vcard, 'adr');

        return {
            name: getVCardValue(vcard, 'fn') || "",
            organization: getVCardValue(vcard, 'org') || "",
            street: Array.isArray(adr) ? adr[2] : "",
            city: Array.isArray(adr) ? adr[3] : "",
            state: Array.isArray(adr) ? adr[4] : "",
            postalCode: Array.isArray(adr) ? adr[5] : "",
            country: Array.isArray(adr) ? adr[6] : "",
            phone: getVCardValue(vcard, 'tel') || "",
            email: getVCardValue(vcard, 'email') || ""
        };
    };

    const parseRdap = (raw: string): WhoisData | null => {
        try {
            const data = JSON.parse(raw);

            // 1. Domain Info
            const domainInfo = {
                domain: data.ldhName || "N/A",
                registeredOn: "",
                expiresOn: "",
                updatedOn: "",
                status: data.status?.[0] || "Active",
                nameservers: data.nameservers?.map((ns: any) => ns.ldhName) || []
            };

            data.events?.forEach((evt: any) => {
                const date = new Date(evt.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
                if (evt.eventAction === "registration") domainInfo.registeredOn = date;
                if (evt.eventAction === "expiration") domainInfo.expiresOn = date;
                if (evt.eventAction === "last changed") domainInfo.updatedOn = date;
            });

            // 2. Registrar Info
            const registrarEntity = data.entities?.find((e: any) => e.roles?.includes("registrar"));
            let registrarInfo = {
                registrar: "",
                ianaId: "",
                email: "",
                abuseEmail: "",
                abusePhone: ""
            };

            if (registrarEntity) {
                const vcard = registrarEntity.vcardArray?.[1];
                registrarInfo.registrar = getVCardValue(vcard, 'fn');
                registrarInfo.ianaId = registrarEntity.publicIds?.[0]?.identifier || "";

                // Abuse contact is often nested
                const abuseEntity = registrarEntity.entities?.find((e: any) => e.roles?.includes("abuse"));
                if (abuseEntity) {
                    const abuseVcard = abuseEntity.vcardArray?.[1];
                    registrarInfo.abuseEmail = getVCardValue(abuseVcard, 'email');
                    registrarInfo.abusePhone = getVCardValue(abuseVcard, 'tel');
                }
            }

            // 3. Contacts
            const registrant = extractContact(data.entities, 'registrant');
            const admin = extractContact(data.entities, 'administrative');
            const tech = extractContact(data.entities, 'technical');

            return { domainInfo, registrarInfo, registrant, admin, tech };
        } catch (e) {
            console.error("Parse error", e);
            return null;
        }
    };

    const handleLookup = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
        if (!cleanDomain) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setParsedData(null);
        try {
            const response = await api.post("/system/whois", { domain: cleanDomain });
            const whoisText = response.data.data.result;
            setResult(whoisText);
            setParsedData(parseRdap(whoisText));

            setHistory((prev) => {
                const filtered = prev.filter((h) => h.domain !== cleanDomain);
                return [{ domain: cleanDomain, timestamp: new Date(), id: Date.now() }, ...filtered].slice(0, 12);
            });
        } catch (err: any) {
            console.error("WHOIS lookup failed", err);
            setError(err.response?.data?.message || "Failed to retrieve WHOIS data.");
        } finally {
            setLoading(false);
        }
    };

    const InfoRow = ({ label, value }: { label: string, value: string }) => (
        <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-border/40 last:border-0 border-dashed">
            <span className="w-40 text-sm font-medium text-muted-foreground">{label}:</span>
            <span className="flex-1 text-sm font-bold truncate">{value || "-"}</span>
        </div>
    );

    const ContactCard = ({ title, data, icon: Icon }: { title: string, data: ContactInfo, icon: any }) => (
        <div className="bg-card/40 backdrop-blur border border-white/5 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                <Icon className="text-primary w-5 h-5" />
                <h3 className="font-bold text-lg">{title}</h3>
            </div>
            <div className="space-y-1">
                <InfoRow label="Name" value={data.name} />
                <InfoRow label="Organization" value={data.organization} />
                <InfoRow label="Street" value={data.street} />
                <InfoRow label="City" value={data.city} />
                <InfoRow label="State" value={data.state} />
                <InfoRow label="Postal Code" value={data.postalCode} />
                <InfoRow label="Country" value={data.country} />
                <InfoRow label="Phone" value={data.phone} />
                <InfoRow label="Email" value={data.email} />
            </div>
        </div>
    );

    return (
        <AuthGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground transition-all duration-300">
                <Navbar />
                <Sidebar />
                <main className="pl-75 pt-20 p-8 space-y-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight">WHOIS Lookup</h1>
                            <p className="text-muted-foreground mt-2 text-lg">Detailed domain intelligence and ownership records.</p>
                        </div>
                    </div>

                    <div className="glass rounded-[2.5rem] p-10 shadow-2xl border-white/5 relative overflow-hidden">
                        <form onSubmit={handleLookup} className="flex gap-4 relative z-20 mb-8 max-w-3xl">
                            <div className="relative flex-1">
                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground z-30" />
                                <Input
                                    placeholder="Enter domain name (e.g. google.com)"
                                    className="pl-16 h-16 rounded-[1.25rem] bg-secondary/30 border-white/5 text-xl font-bold focus-visible:ring-primary/30 relative z-20"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" size="lg" className="h-16 px-8 rounded-[1.25rem] shadow-xl font-black text-lg gap-3" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <Search />} Lookup
                            </Button>
                        </form>

                        {error && (
                            <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 font-bold mb-8">
                                <AlertCircle size={24} />
                                {error}
                            </div>
                        )}

                        {parsedData && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Domain Info Section */}
                                <div className="bg-card/40 backdrop-blur border border-white/5 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                                        <Server className="text-amber-500 w-5 h-5" />
                                        <h3 className="font-bold text-lg text-amber-500">Domain Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 space-y-1">
                                        <InfoRow label="Domain" value={parsedData.domainInfo.domain} />
                                        <InfoRow label="Registered On" value={parsedData.domainInfo.registeredOn} />
                                        <InfoRow label="Expires On" value={parsedData.domainInfo.expiresOn} />
                                        <InfoRow label="Updated On" value={parsedData.domainInfo.updatedOn} />
                                        <InfoRow label="Status" value={parsedData.domainInfo.status} />
                                        <div className="flex flex-col sm:flex-row sm:items-start py-2">
                                            <span className="w-40 text-sm font-medium text-muted-foreground mt-1">Name Servers:</span>
                                            <div className="flex-1 space-y-1">
                                                {parsedData.domainInfo.nameservers.length > 0 ? (
                                                    parsedData.domainInfo.nameservers.map((ns, i) => (
                                                        <div key={i} className="text-sm font-bold bg-secondary/20 inline-block px-2 py-1 rounded mr-2 mb-1">{ns}</div>
                                                    ))
                                                ) : <span>-</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Registrar Info Section */}
                                <div className="bg-card/40 backdrop-blur border border-white/5 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                                        <Building className="text-blue-500 w-5 h-5" />
                                        <h3 className="font-bold text-lg text-blue-500">Registrar Information</h3>
                                    </div>
                                    <div className="space-y-1">
                                        <InfoRow label="Registrar" value={parsedData.registrarInfo.registrar} />
                                        <InfoRow label="IANA ID" value={parsedData.registrarInfo.ianaId} />
                                        <InfoRow label="Email" value={parsedData.registrarInfo.email} />
                                        <InfoRow label="Abuse Email" value={parsedData.registrarInfo.abuseEmail} />
                                        <InfoRow label="Abuse Phone" value={parsedData.registrarInfo.abusePhone} />
                                    </div>
                                </div>

                                {/* Contact Sections */}
                                <ContactCard title="Registrant Contact" data={parsedData.registrant} icon={User} />
                                <ContactCard title="Administrative Contact" data={parsedData.admin} icon={User} />
                                <ContactCard title="Technical Contact" data={parsedData.tech} icon={User} />

                            </div>
                        )}

                        {/* Raw JSON Toggle */}
                        {result && (
                            <div className="mt-12">
                                <div className="p-6 rounded-[2rem] bg-white/40 border border-white/5 overflow-hidden">
                                    <details>
                                        <summary className="cursor-pointer text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Show Raw JSON Response</summary>
                                        <pre className="mt-4 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed">
                                            {result}
                                        </pre>
                                    </details>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
