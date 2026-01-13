import { create } from 'zustand';
import api from '@/lib/api';

interface SettingsState {
    settings: Record<string, string>;
    loading: boolean;
    fetchSettings: () => Promise<void>;
    formatPrice: (amount: number | string) => string;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: {
        appName: 'WHMCS CRM', // Default
    },
    loading: false,
    fetchSettings: async () => {
        set({ loading: true });
        try {
            const response = await api.get('/settings/public');
            if (response.data.status === 'success') {
                set({ settings: response.data.data.settings });
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            set({ loading: false });
        }
    },
    formatPrice: (amount: number | string) => {
        const settings = get().settings;
        const currencyCode = settings.defaultCurrency || 'BDT';
        const { formatPrice: fp } = require('@/lib/utils');
        return fp(amount, currencyCode);
    }
}));
