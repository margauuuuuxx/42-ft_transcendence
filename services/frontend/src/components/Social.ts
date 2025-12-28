import { friendsService, type Friendship } from '../services/friends.js';
import { authState } from '../lib/authState.js';

export class SocialPage {
  private friendships: Friendship[] = [];
  private frameRate = 1000;

  async init() {
    await this.loadFriendships();
    this.setupEventListeners();
    setInterval(() => {
      // Only fetch friendships if user is authenticated
      if (authState.isAuthenticated()) {
        this.loadFriendships();
      }
    }, this.frameRate);
  }

  private async loadFriendships() {
    try {
      this.friendships = await friendsService.getFriendships();
      this.renderFriendships();
    } catch (error) {
      console.log('Failed to load friendships:', error);
      this.showError('Failed to load friends list');
    }
  }

  private setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const searchEmail = document.getElementById('searchEmail') as HTMLInputElement;

    if (searchBtn && searchEmail) {
      searchBtn.addEventListener('click', () => this.handleSearch());
      searchEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch();
        }
      });
    }
  }

  private async handleSearch() {
    const searchEmail = document.getElementById('searchEmail') as HTMLInputElement;
    const searchResult = document.getElementById('searchResult');
    
    if (!searchEmail || !searchResult) return;

    const email = searchEmail.value.trim();
    if (!email) {
      this.showSearchResult('Please enter an email address', 'error');
      return;
    }

    try {
      const user = await friendsService.searchUserByEmail(email);
      this.renderSearchResult(user);
    } catch (error) {
      console.error('Search failed:', error);
      this.showSearchResult('User not found', 'error');
    }
  }

  private renderSearchResult(user: any) {
    const searchResult = document.getElementById('searchResult');
    if (!searchResult) return;

    // Check if already friends or pending request exists
    const existingFriendship = this.friendships.find(f => f.friend_id === user.id);
    
    let statusText = '';
    let buttonHtml = '';

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        statusText = 'Already friends';
      } else if (existingFriendship.is_requester) {
        statusText = 'Request sent';
      } else {
        statusText = 'Pending your response';
      }
    } else {
      buttonHtml = `
        <button 
          onclick="window.socialPage.sendFriendRequest(${user.id})" 
          class="px-4 py-2 bg-black text-white font-mono hover:bg-gray-800"
        >
          ADD FRIEND
        </button>
      `;
    }

    searchResult.innerHTML = `
      <div class="p-4 border border-gray-300 bg-white">
        <div class="flex justify-between items-center">
          <div>
            <p class="font-mono font-bold">${user.username}</p>
            <p class="mono-text text-sm text-gray-600">${user.email}</p>
            ${statusText ? `<p class="mono-text text-sm text-blue-600">${statusText}</p>` : ''}
          </div>
          <div>
            ${buttonHtml}
          </div>
        </div>
      </div>
    `;
  }

  private showSearchResult(message: string, type: 'error' | 'success' = 'error') {
    const searchResult = document.getElementById('searchResult');
    if (!searchResult) return;

    const bgColor = type === 'error' ? 'bg-red-100 border-red-300' : 'bg-white border-black';
    const textColor = type === 'error' ? 'text-red-700' : 'text-black';

    searchResult.innerHTML = `
      <div class="p-3 border-2 ${bgColor} ${textColor} font-mono">
        ${message}
      </div>
    `;
  }

  async sendFriendRequest(userId: number) {
    try {
      await friendsService.sendFriendRequest(userId);
      this.showSearchResult('Friend request sent!', 'success');
      await this.loadFriendships(); // Refresh the lists
      
      // Clear search
      const searchEmail = document.getElementById('searchEmail') as HTMLInputElement;
      if (searchEmail) searchEmail.value = '';
      
      setTimeout(() => {
        const searchResult = document.getElementById('searchResult');
        if (searchResult) searchResult.innerHTML = '';
      }, 3000);
    } catch (error) {
      console.error('Failed to send friend request:', error);
      this.showSearchResult('Failed to send friend request', 'error');
    }
  }

  async respondToFriendRequest(userId: number, accept: boolean) {
    try {
      await friendsService.respondToFriendRequest(userId, accept);
      await this.loadFriendships(); // Refresh the lists
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
      this.showError('Failed to respond to friend request');
    }
  }

  private renderFriendships() {
    const pendingRequests = this.friendships.filter(f => 
      f.status === 'pending' && !f.is_requester
    );
    const sentRequests = this.friendships.filter(f => 
      f.status === 'pending' && f.is_requester
    );
    const friends = this.friendships.filter(f => f.status === 'accepted');

    this.renderPendingRequests(pendingRequests);
    this.renderSentRequests(sentRequests);
    this.renderFriends(friends);
  }

  private renderPendingRequests(requests: Friendship[]) {
    const container = document.getElementById('pendingRequests');
    if (!container) return;

    if (requests.length === 0) {
      container.innerHTML = '<p class="mono-text text-gray-500">No pending requests</p>';
      return;
    }

    container.innerHTML = requests.map(request => `
      <div class="p-4 border-2 border-black mb-3 bg-white">
        <div class="flex justify-between items-center">
          <div>
            <p class="font-mono font-bold">User ID: ${request.friend_id}</p>
            <p class="mono-text text-sm text-gray-600">Sent: ${new Date(request.created_at).toLocaleDateString()}</p>
          </div>
          <div class="flex gap-2">
            <button 
              onclick="window.socialPage.respondToFriendRequest(${request.friend_id}, true)"
              class="px-3 py-2 bg-black text-white font-mono text-sm hover:bg-gray-800 border-2 border-black uppercase"
            >
              ACCEPT
            </button>
            <button 
              onclick="window.socialPage.respondToFriendRequest(${request.friend_id}, false)"
              class="px-3 py-2 bg-white text-black font-mono text-sm hover:bg-gray-200 border-2 border-black uppercase"
            >
              REJECT
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  private renderSentRequests(requests: Friendship[]) {
    const container = document.getElementById('sentRequests');
    if (!container) return;

    if (requests.length === 0) {
      container.innerHTML = '<p class="mono-text text-gray-500">No sent requests</p>';
      return;
    }

    container.innerHTML = requests.map(request => `
      <div class="p-4 border-2 border-black mb-3 bg-white">
        <div class="flex justify-between items-center">
          <div>
            <p class="font-mono font-bold">User ID: ${request.friend_id}</p>
            <p class="mono-text text-sm text-gray-600">Sent: ${new Date(request.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <span class="px-3 py-2 bg-gray-200 text-black font-mono text-sm border-2 border-black uppercase">WAITING</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  private isFriendOnline(friend: Friendship): boolean {
    if (!friend.friend_last_active_at) {
      return false
    };
    const last = new Date(friend.friend_last_active_at).getTime();
    if (Number.isNaN(last)) {
      return false
    };
    const now = Date.now();
    const diff = (now - last) / 1000;
    return diff < 6;
  }

  private renderFriends(friends: Friendship[]) {
    const container = document.getElementById('friendsList');
    if (!container) return;

    if (friends.length === 0) {
      container.innerHTML = '<p class="mono-text text-gray-500">No friends yet</p>';
      return;
    }

    container.innerHTML = friends.map(friend => {
      return `
        <div class="p-4 border-2 border-black mb-3 bg-white">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-mono font-bold">User ID: ${friend.friend_id}</p>
              <p class="font-mono font-bold">${friend.friend_username}</p>
              <p class="mono-text text-sm text-gray-600">Friends since: ${new Date(friend.updated_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span class="px-3 py-2 bg-black text-white font-mono text-sm border-2 border-black uppercase">FRIEND</span>
              ${
                this.isFriendOnline(friend)
                ? '<span class="px-3 py-2 bg-black text-white font-mono text-sm border-2 border-black uppercase">ONLINE</span>'
                : '<span class="px-3 py-2 bg-white text-black font-mono text-sm border-2 border-black uppercase">OFFLINE</span>'
              }
            </div>
          </div>
        </div>`;
    }).join('');
  }

  private showError(message: string) {
    // You can implement a global error display mechanism here
    console.error(message);
  }
}

// Make it globally available for onclick handlers
declare global {
  interface Window {
    socialPage: SocialPage;
  }
}