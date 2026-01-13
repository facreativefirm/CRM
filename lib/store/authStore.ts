import { create } from 'zustand';

interface User {
    id: number;
    username: string;
    email: string;
    userType: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'RESELLER' | 'CLIENT';
    firstName?: string;
    lastName?: string;
    status: string;
}

interface AuthState {
    user: User | null;
    sessionToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, sessionToken: string) => void;
    logout: () => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    sessionToken: null,
    isAuthenticated: false,
    setAuth: (user, sessionToken) => {
        set({ user, sessionToken, isAuthenticated: true });
    },
    logout: () => {
        set({ user: null, sessionToken: null, isAuthenticated: false });
    },
    clearAuth: () => {
        set({ user: null, sessionToken: null, isAuthenticated: false });
    },
}));

// Helper to get session token from cookie
export const getSessionToken = (): string | null => {
    if (typeof window === 'undefined') return null;

    const name = 'sessionToken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
};

// Helper to set session token in cookie
export const setSessionToken = (token: string): void => {
    if (typeof window === 'undefined') return;

    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    // Using SameSite=Lax for better development compatibility
    document.cookie = `sessionToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

// Helper to clear session token from cookie
export const clearSessionToken = (): void => {
    if (typeof window === 'undefined') return;

    document.cookie = 'sessionToken=; path=/; max-age=0';
};
