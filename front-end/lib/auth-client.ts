import { createAuthClient } from "better-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
