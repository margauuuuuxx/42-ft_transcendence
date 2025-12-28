// Auth Service - All authentication API calls
// No DOM manipulation, only API calls and authState updates

import { authState } from '../lib/authState.js';

const AUTH_API = '/auth';

// --- Helper: Decode user ID from JWT ---

function getUserIdFromToken(token: string): number {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub;
    } catch {
        return 0;
    }
}

// --- Helper: Fetch user profile to get username ---

async function fetchUserProfile(token: string): Promise<{ username?: string }> {
    try {
        const response = await fetch('/users/me', {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            return await response.json();
        }
    } catch {
        // Ignore errors, username is optional
    }
    return {};
}

// --- Types ---

export interface LoginResult {
    success: boolean;
    error?: string;
    twoFaRequired?: boolean;
}

export interface RegisterResult {
    success: boolean;
    error?: string;
}

export interface TwoFAResult {
    success: boolean;
    error?: string;
}

// --- Login ---

export async function login(email: string, password: string): Promise<LoginResult> {
    try {
        const response = await fetch(`${AUTH_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important: sends cookies
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return { success: false, error: data.error || 'Login failed' };
        }

        const result = await response.json();

        // Check if 2FA is required
        if (result.twoFa) {
            return { success: true, twoFaRequired: true };
        }

        // Check if we got a token (now using camelCase)
        if (!result.accessToken) {
            return { success: false, error: 'No access token received' };
        }

        // Save token and user (decode ID from JWT, fetch username)
        const userId = getUserIdFromToken(result.accessToken);
        const profile = await fetchUserProfile(result.accessToken);

        authState.setAuth(result.accessToken, {
            id: userId,
            email: email,
            username: profile.username,
        });

        return { success: true, twoFaRequired: false };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Network or server error' };
    }
}

// --- 2FA Verification ---

export async function verify2FA(email: string, code: string): Promise<TwoFAResult> {
    try {
        const response = await fetch(`${AUTH_API}/verify-2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, code }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return { success: false, error: data.error || 'Verification failed' };
        }

        const result = await response.json();

        // Save token after successful 2FA (now using camelCase)
        if (result.accessToken) {
            const userId = getUserIdFromToken(result.accessToken);
            const profile = await fetchUserProfile(result.accessToken);

            authState.setAuth(result.accessToken, {
                id: userId,
                email: email,
                username: profile.username,
            });
        }

        return { success: true };
    } catch (error) {
        console.error('2FA verification error:', error);
        return { success: false, error: 'Network or server error' };
    }
}

// --- Resend 2FA Code ---

export async function resend2FACode(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${AUTH_API}/send-email-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return { success: false, error: data.error || 'Failed to resend code' };
        }

        return { success: true };
    } catch {
        return { success: false, error: 'Network or server error' };
    }
}

// --- Logout ---

export async function logout(): Promise<void> {
    try {
        await fetch(`${AUTH_API}/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch {
        // Ignore logout errors
    } finally {
        // Always clear local state, even if API call fails
        authState.clearAuth();
    }
}

// --- Token Refresh ---

export async function refreshSession(): Promise<boolean> {
    try {
        const response = await fetch(`${AUTH_API}/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            return false;
        }

        const result = await response.json();
        authState.setAccessToken(result.accessToken);
        return true;
    } catch {
        return false;
    }
}

// --- Register ---

export async function register(
    username: string,
    email: string,
    password: string
): Promise<RegisterResult> {
    try {
        const response = await fetch('/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return { success: false, error: data.error || 'Registration failed' };
        }

        return { success: true };
    } catch {
        return { success: false, error: 'Network or server error' };
    }
}
