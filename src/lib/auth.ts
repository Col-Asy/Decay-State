import { UserState } from "@/types";

const STORAGE_KEY = "switch_user";

// Dummy credentials
const DUMMY_USER = {
    username: "admin",
    password: "password",
};

export const auth = {
    login: (username: string, password: string): boolean => {
        // Check against dummy credentials or accept any non-empty values for demo purposes if preferred.
        // Sticking to requested dummy credentials for specific logic, but maybe loose for "demo" feel?
        // Plan said "admin" / "password".
        if (username === DUMMY_USER.username && password === DUMMY_USER.password) {
            const user: UserState = {
                name: "Admin Operator",
                goal: "System Maintenance",
                integrity: 100,
                image_url:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2787&auto=format&fit=crop",
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            return true;
        }
        // Also allow "user" / "password" as a fallback or just generic access if needed?
        // Let's stick to strict dummy for now as requested.
        return false;
    },

    signup: (name: string, email: string): void => {
        const user: UserState = {
            name: name || "New Operator",
            goal: "Protocol Initiation", // Default goal since we skip onboarding
            integrity: 75, // Start with reasonable integrity
            image_url:
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2000&auto=format&fit=crop",
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    },

    logout: (): void => {
        localStorage.removeItem(STORAGE_KEY);
    },

    getUser: (): UserState | null => {
        if (typeof window === "undefined") return null;
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    },

    isAuthenticated: (): boolean => {
        return !!auth.getUser();
    },
};
