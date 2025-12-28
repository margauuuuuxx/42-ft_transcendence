import { apiFetch } from './api.js';

export interface Friendship {
  id: number;
  friend_id: number;
  status: 'pending' | 'accepted';
  is_requester: boolean;
  created_at: string;
  updated_at: string;
  friend_username: string;
  friend_last_active_at: string | null;
}

export interface FriendshipsResponse {
  friendships: Friendship[];
}

export class FriendsService {
  // Get all friendships for the current user
  async getFriendships(): Promise<Friendship[]> {
    const response = await apiFetch('/users/friends', {
      method: 'GET'
    });
    if (!response.ok) {
      throw new Error(`Failed to get friendships: ${response.status}`);
    }
    const data: FriendshipsResponse = await response.json();
    return data.friendships;
  }

  // Send a friend request
  async sendFriendRequest(userId: number): Promise<{ message: string }> {
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
  async respondToFriendRequest(userId: number, accept: boolean): Promise<{ message: string }> {
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
  async searchUserByEmail(email: string): Promise<any> {
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