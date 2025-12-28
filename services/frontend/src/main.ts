// Main entry point
import { router } from './lib/router.js';
import { refreshSession } from './services/auth.js';
import { startActivityHeartbeat } from './services/activity.js';

// Register all web components
import './components/index.js';

// Initialize the application
async function initApp(): Promise<void> {
    console.log('🚀 Initializing Transcendence...');

    // Try to restore session from refresh token cookie
    // This handles page refreshes when user is already logged in
    await refreshSession();
    startActivityHeartbeat();

    // Setup routes
    router.addRoute('/', 'home');
    router.addRoute('/game', 'game');
    router.addRoute('/history', 'history');
    router.addRoute('/leaderboard', 'leaderboard');
    router.addRoute('/social', 'social');
    router.addRoute('/tournament', 'tournament');
    router.addRoute('/design', 'design');
    router.addRoute('/profile', 'profile');
    router.addRoute('/login', 'login');
    router.addRoute('/legal', 'legal');

    // Start the application
    router.start();

    console.log('🚀 Transcendence started!');
}

// Start the app
initApp();
