// Game Listener - DOM logic for game page
// Initializes the pong game client and handles connection

import { gameClient } from '../lib/game-client.js';

/**
 * Initialize game page listeners
 * Called when game template is loaded
 */
export function gameListener(): void {
    // Initialize game client
    gameClient.init();

    // Connect to game server if canvas is present
    const connected = gameClient.connectIfCanvasPresent();

    if (!connected) {
        console.error('Failed to initialize game: canvas not found');
    }
}

/**
 * Cleanup function to disconnect from game server
 * Should be called when leaving the game page
 */
export function cleanupGameListener(): void {
    gameClient.disconnect();
}
