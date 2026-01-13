"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/store/settingsStore";

export function SettingsBootstrap({ children }: { children: React.ReactNode }) {
    const fetchSettings = useSettingsStore((state) => state.fetchSettings);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return <>{children}</>;
}
