import { apiFetch } from './api.js';
export class FriendsService {
    // Get all friendships for the current user
    async getFriendships() {
        const response = await apiFetch('/users/friends', {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error(`Failed to get friendships: ${response.status}`);
        }
        const data = await response.json();
        return data.friendships;
    }
    // Send a friend request
    async sendFriendRequest(userId) {
        const response = await apiFetch('/users/friends/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (!response.ok) {
            throw new Error(`Failed to send friend request: ${response.status}`);
        }
        return await response.json();
    }
    // Accept or reject a friend request
    async respondToFriendRequest(userId, accept) {
        const response = await apiFetch('/users/friends/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, accept })
        });
        if (!response.ok) {
            throw new Error(`Failed to respond to friend request: ${response.status}`);
        }
        return await response.json();
    }
    // Search for users by email
    async searchUserByEmail(email) {
        const response = await apiFetch('/users/users/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) {
            throw new Error(`Failed to search user: ${response.status}`);
        }
        return await response.json();
    }
}
export const friendsService = new FriendsService();
