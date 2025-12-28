import { apiFetch } from '../services/api.js';
import { authState } from '../lib/authState.js';
const HEARTBEAT_INTERVAL = 5000;
export function startActivityHeartbeat() {
    const tick = async () => {
        if (document.visibilityState !== 'visible')
            return;
        // Only send heartbeat if user is authenticated
        if (!authState.isAuthenticated())
            return;
        try {
            const res = await apiFetch('/users/activity', { method: 'POST' });
        }
        catch (err) {
            console.error('[heartbeat] failed', err);
        }
    };
    tick();
    setInterval(tick, HEARTBEAT_INTERVAL);
}
