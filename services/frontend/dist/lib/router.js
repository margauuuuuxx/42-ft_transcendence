// SPA Router using History API
// Loads HTML templates dynamically and handles navigation
// Includes route guards for protected pages
import { refreshSession } from '../services/auth.js';
import { authState } from './authState.js';
import { loginListener, profileListener, gameListener, tournamentListener, leaderboardListener, socialListener } from '../listeners/index.js';
const listenerMap = {
    'login': loginListener,
    'profile': profileListener,
    'game': gameListener,
    'tournament': tournamentListener,
    'leaderboard': leaderboardListener,
    'social': socialListener,
};
// Routes that require authentication
const protectedRoutes = new Set(['profile', 'social']);
// Routes that should redirect to home if already logged in
const guestOnlyRoutes = new Set(['login']);
class Router {
    constructor() {
        this.routes = new Map();
        this.templateCache = new Map();
        this.appElement = document.getElementById('app');
    }
    addRoute(path, templateName) {
        this.routes.set(path, templateName);
    }
    async navigate(path) {
        window.history.pushState({}, '', path);
        await this.render();
    }
    async loadTemplate(templateName) {
        // Check cache first
        let html = this.templateCache.get(templateName);
        if (!html) {
            const response = await fetch(`/src/templates/${templateName}.html`);
            if (!response.ok) {
                throw new Error(`Template not found: ${templateName}`);
            }
            html = await response.text();
            this.templateCache.set(templateName, html);
        }
        return html;
    }
    async render() {
        if (!this.appElement) {
            console.error('App element not found');
            return;
        }
        const path = window.location.pathname;
        const templateName = this.routes.get(path);
        if (!templateName) {
            console.error('Route not found:', path);
            // Fallback to home
            this.navigate('/');
            return;
        }
        // --- Route Guards ---
        // Check if this is a protected route
        if (protectedRoutes.has(templateName)) {
            // Check if authenticated, try refresh if not
            let isAuth = authState.isAuthenticated();
            if (!isAuth) {
                isAuth = await refreshSession();
            }
            if (!isAuth) {
                console.log(`Protected route "${templateName}" - redirecting to login`);
                // Save the intended destination
                sessionStorage.setItem('redirectAfterLogin', path);
                window.history.replaceState({}, '', '/login');
                await this.renderTemplate('login');
                return;
            }
        }
        // Check if this is a guest-only route (login/register)
        if (guestOnlyRoutes.has(templateName)) {
            if (authState.isAuthenticated()) {
                console.log(`Guest-only route "${templateName}" - redirecting to home`);
                window.history.replaceState({}, '', '/');
                await this.renderTemplate('home');
                return;
            }
        }
        await this.renderTemplate(templateName);
    }
    async renderTemplate(templateName) {
        try {
            const html = await this.loadTemplate(templateName);
            // Find page container or use app element
            const pageContainer = document.getElementById('page-container');
            const target = pageContainer || this.appElement;
            target.innerHTML = html;
            // Update active link in navbar
            const navbar = document.querySelector('app-navbar');
            if (navbar && typeof navbar.updateActiveLink === 'function') {
                navbar.updateActiveLink();
            }
            // Call the appropriate listener for this template (if any)
            const listener = listenerMap[templateName];
            if (listener) {
                await listener();
            }
        }
        catch (error) {
            console.error('Failed to load template:', error);
        }
    }
    start() {
        // Handle back/forward navigation
        window.addEventListener('popstate', () => this.render());
        // Handle navigation via data-navigate attribute
        document.addEventListener('click', (e) => {
            const target = e.target;
            const link = target.closest('[data-navigate]');
            if (link) {
                e.preventDefault();
                const path = link.getAttribute('data-navigate');
                if (path) {
                    this.navigate(path);
                }
            }
        });
        // Initial render
        this.render();
    }
}
export const router = new Router();
