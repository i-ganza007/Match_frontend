import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    getAuthToken,
    getUserData,
    storeAuthToken,
    storeUserData,
    clearAllData,
} from '../services/secureStorage';

export interface AuthUser {
    userId: string;
    name: string;
    email?: string;
    phone_number?: string;
    district?: string;
    sector?: string;
    village?: string;
    cell?: string;
    sex?: string;
    profile_url?: string;
    latitude?: number;
    longitude?: number;
}

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    isLoaded: boolean;
    /** Call after successful signup/login to update in-memory state */
    signIn: (token: string | null, user: AuthUser) => Promise<void>;
    /** Clears all auth data and resets state */
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    token: null,
    isLoaded: false,
    signIn: async () => {},
    signOut: async () => {},
});

// Sessions are permanent until the user explicitly logs out.
// 401s on API calls are handled per-feature (show error/retry) — never auto-logout.

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser]       = useState<AuthUser | null>(null);
    const [token, setToken]     = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load persisted auth on mount
    useEffect(() => {
        (async () => {
            const [storedToken, storedUser] = await Promise.all([
                getAuthToken(),
                getUserData(),
            ]);
            setToken(storedToken);
            setUser(storedUser);
            setIsLoaded(true);
        })();
    }, []);

    const signIn = useCallback(async (newToken: string | null, newUser: AuthUser) => {
        if (newToken) {
            await storeAuthToken(newToken);
            setToken(newToken);
        }
        await storeUserData(newUser);
        setUser(newUser);
    }, []);

    const signOut = useCallback(async () => {
        await clearAllData();
        setToken(null);
        setUser(null);
    }, []);

    // NOTE: _globalSignOut is kept as a no-op bridge in case other code calls it,
    // but the axios interceptor no longer uses it (we don't auto-logout on 401).
    useEffect(() => {
        _globalSignOut = signOut;
        return () => { _globalSignOut = null; };
    }, [signOut]);

    return (
        <AuthContext.Provider value={{ user, token, isLoaded, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

// ── Global bridge (for use outside React, e.g. axios interceptor) ────────────
let _globalSignOut: (() => Promise<void>) | null = null;
export const triggerGlobalSignOut = async () => {
    if (_globalSignOut) await _globalSignOut();
};
