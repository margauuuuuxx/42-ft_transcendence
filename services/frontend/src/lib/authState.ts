// AuthState - Single source of truth for authentication
// Manages token storage and notifies subscribers of changes

type AuthUser = {
    id: number;
    email: string;
    username?: string;
};

type AuthListener = () => void;

class AuthState {
    private listeners: Set<AuthListener> = new Set();

    // --- Token Management ---

    getAccessToken(): string | null {
        return sessionStorage.getItem('access_token');
    }

    setAccessToken(token: string): void {
        sessionStorage.setItem('access_token', token);
    }

    clearAccessToken(): void {
        sessionStorage.removeItem('access_token');
    }

    // --- User Management (persisted in sessionStorage) ---

    getUser(): AuthUser | null {
        const stored = sessionStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    }

    setUser(user: AuthUser): void {
        sessionStorage.setItem('user', JSON.stringify(user));
        this.notifyListeners();
    }

    // --- Auth State ---

    setAuth(token: string, user: AuthUser): void {
        this.setAccessToken(token);
        sessionStorage.setItem('user', JSON.stringify(user));
        this.notifyListeners();
    }

    clearAuth(): void {
        this.clearAccessToken();
        sessionStorage.removeItem('user');
        this.notifyListeners();
    }

    isAuthenticated(): boolean {
        return this.getAccessToken() !== null;
    }

    // --- Subscriptions (for Navbar, etc.) ---

    subscribe(callback: AuthListener): () => void {
        this.listeners.add(callback);
        // Return unsubscribe function
        return () => this.listeners.delete(callback);
    }

    private notifyListeners(): void {
        this.listeners.forEach(callback => callback());
    }
}

// Export singleton instance
export const authState = new AuthState();
