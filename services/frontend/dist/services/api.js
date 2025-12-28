// API Service - Generic fetch wrapper with authentication
// Automatically adds auth header and handles token refresh
import { authState } from '../lib/authState.js';
import { refreshSession } from './auth.js';
/**
 * Fetch wrapper that automatically:
 * - Adds Authorization header with access token
 * - Retries with refreshed token on 401
 * - Includes credentials for cookies
 */
export async function apiFetch(url, options = {}) {
    const { skipAuth, ...fetchOptions } = options;
    // Prepare headers
    const headers = new Headers(fetchOptions.headers);
    // Add auth header if we have a token (and not skipped)
    if (!skipAuth) {
        const token = authState.getAccessToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }
    // First attempt
    let response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include',
    });
    // If 401 Unauthorized, try to refresh token and retry
    if (response.status === 401 && !skipAuth) {
        console.log('Got 401, attempting token refresh...');
        const refreshed = await refreshSession();
        if (refreshed) {
            // Update header with new token
            const newToken = authState.getAccessToken();
            if (newToken) {
                headers.set('Authorization', `Bearer ${newToken}`);
            }
            // Retry the request
            response = await fetch(url, {
                ...fetchOptions,
                headers,
                credentials: 'include',
            });
        }
    }
    return response;
}
/**
 * Convenience method for GET requests
 */
export async function apiGet(url) {
    return apiFetch(url, { method: 'GET' });
}
/**
 * Convenience method for POST requests with JSON body
 */
export async function apiPost(url, data) {
    return apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}
/**
 * Convenience method for PATCH requests with JSON body
 */
export async function apiPatch(url, data) {
    return apiFetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}
/**
 * Convenience method for DELETE requests
 */
export async function apiDelete(url) {
    return apiFetch(url, { method: 'DELETE' });
}
