import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    name: string;
    type: 'HOSTING' | 'DOMAIN' | 'SSL' | 'OTHER';
    price: number;
    billingCycle: string;
    domainName?: string;
    quantity: number;
    config?: Record<string, any>;
    // Optional pricing details for cycle switching
    monthlyPrice?: number;
    annualPrice?: number;
}

interface CartState {
    items: CartItem[];
    promoCode: string | null;
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, updates: Partial<CartItem>) => void;
    updateDomainName: (id: string, domainName: string) => void;
    clearCart: () => void;
    setPromoCode: (code: string | null) => void;
    total: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            promoCode: null,
            addItem: (item: CartItem) => set((state) => ({
                items: [...state.items, {
                    ...item,
                    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
                    quantity: item.quantity || 1
                }]
            })),
            removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
            updateItem: (id, updates) => set((state) => ({
                items: state.items.map((i) => {
                    if (i.id === id) {
                        const updated = { ...i, ...updates };
                        // Ensure price is number if updated
                        if (updates.price) {
                            updated.price = typeof updates.price === 'string' ? parseFloat(updates.price as string) : updates.price;
                        }
                        return updated;
                    }
                    return i;
                })
            })),
            updateDomainName: (id: string, domainName: string) => set((state) => ({
                items: state.items.map(i => i.id === id ? { ...i, domainName } : i)
            })),
            clearCart: () => set({ items: [], promoCode: null }),
            setPromoCode: (code) => set({ promoCode: code }),
            total: () => {
                const subtotal = get().items.reduce((acc, item) => {
                    const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
                    return acc + price;
                }, 0);
                // Simple discount logic for demo
                if (get().promoCode === 'SAVE20') return subtotal * 0.8;
                return subtotal;
            },
        }),
        {
            name: 'whmcs-cart',
        }
    )
);
