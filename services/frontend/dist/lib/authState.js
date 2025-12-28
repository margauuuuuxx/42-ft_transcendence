// AuthState - Single source of truth for authentication
// Manages token storage and notifies subscribers of changes
class AuthState {
    constructor() {
        this.listeners = new Set();
    }
    // --- Token Management ---
    getAccessToken() {
        return sessionStorage.getItem('access_token');
    }
    setAccessToken(token) {
        sessionStorage.setItem('access_token', token);
    }
    clearAccessToken() {
        sessionStorage.removeItem('access_token');
    }
    // --- User Management (persisted in sessionStorage) ---
    getUser() {
        const stored = sessionStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    }
    setUser(user) {
        sessionStorage.setItem('user', JSON.stringify(user));
        this.notifyListeners();
    }
    // --- Auth State ---
    setAuth(token, user) {
        this.setAccessToken(token);
        sessionStorage.setItem('user', JSON.stringify(user));
        this.notifyListeners();
    }
    clearAuth() {
        this.clearAccessToken();
        sessionStorage.removeItem('user');
        this.notifyListeners();
    }
    isAuthenticated() {
        return this.getAccessToken() !== null;
    }
    // --- Subscriptions (for Navbar, etc.) ---
    subscribe(callback) {
        this.listeners.add(callback);
        // Return unsubscribe function
        return () => this.listeners.delete(callback);
    }
    notifyListeners() {
        this.listeners.forEach(callback => callback());
    }
}
// Export singleton instance
export const authState = new AuthState();
