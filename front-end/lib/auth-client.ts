import { createAuthClient } from 'better-auth/react';

function normalizeBaseUrl(rawValue?: string): string {
    const value = (rawValue || '').trim();
    if (!value) return 'http://localhost:3000';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return `https://${value}`;
}

const API_BASE_URL =
    typeof window !== 'undefined'
        ? '/api/backend'
        : normalizeBaseUrl(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL);

export const authClient = createAuthClient({
    baseURL: API_BASE_URL, // Use environment variable
    fetchOptions: {
        credentials: 'include', // Ensure cookies are included
    },
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

// Enhanced auth helpers
export async function requireAuth() {
    const { data } = await getSession();
    if (!data?.user) {
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        throw new Error('Authentication required');
    }
    return data;
}

// Check if user is authenticated (non-throwing)
export async function isAuthenticated(): Promise<boolean> {
    try {
        const { data } = await getSession();
        return !!data?.user;
    } catch {
        return false;
    }
}
