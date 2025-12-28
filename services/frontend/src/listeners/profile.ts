// Profile Listener - DOM logic for profile page
// Handles loading user data, form submission, and logout

import { apiGet, apiPatch } from '../services/api.js';
import { logout } from '../services/auth.js';
import { router } from '../lib/router.js';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    avatar_url: string;
    twoFa: boolean;
}

/**
 * Initialize profile page listeners
 * Called when profile template is loaded
 */
export function profileListener(): void {
    const profileForm = document.getElementById('profile-form') as HTMLFormElement | null;
    const logoutBtn = document.getElementById('logout-btn');
    const fileInput = document.getElementById('profile-image') as HTMLFormElement | null;

    // Load user data
    if (profileForm) {
        loadProfile();
        // Setup form submission
        profileForm.addEventListener('submit', handleProfileSubmit);
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleImageLocalPreview);
    }

    // Setup logout button
    if (logoutBtn) {
        console.log("lgout")
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleImageLocalPreview(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const img = document.querySelector<HTMLImageElement>('#profile-image-preview');
        const placeholder = document.getElementById('profile-image-placeholder');
        if (!img || !placeholder) return;

        img.src = reader.result as string;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

function updateProfileImagePreview(avatarUrl: string | null) {
    const img = document.querySelector<HTMLImageElement>('#profile-image-preview');
    const placeholder = document.getElementById('profile-image-placeholder');

    if (!img || !placeholder) return;

    // Always show the image element and hide placeholder
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');

    if (avatarUrl) {
        const bust = Date.now();
        img.src = `/avatars/${avatarUrl}?t=${bust}`;
        
        // Handle image load error - fallback to default
        img.onerror = () => {
            img.src = '/assets/images/default_pp.png';
            img.onerror = null; // Prevent infinite loop if default also fails
        };
    } else {
        // No avatar URL provided - use default image
        img.src = '/assets/images/default_pp.png';
        img.onerror = null; // Clear any previous error handler
    }
}

async function loadProfile(): Promise<void> {
    try {
        const response = await apiGet('/users/me');

        if (!response.ok) {
            console.error('Failed to load profile');
            return;
        }

        const user: UserProfile = await response.json();
        console.log("user: ", user)

        // Populate display information
        const displayUsername = document.getElementById('display-username');
        const displayEmail = document.getElementById('display-email');
        const display2FA = document.getElementById('display-2fa');

        if (displayUsername) displayUsername.textContent = user.username || '---';
        if (displayEmail) displayEmail.textContent = user.email || '---';
        if (display2FA) display2FA.textContent = user.twoFa ? 'ENABLED' : 'DISABLED';

        // Populate form fields - using app-input components
        const usernameInput = document.querySelector('#profile-username') as any;
        const emailInput = document.querySelector('#profile-email') as any;
        const authCheckbox = document.querySelector('#auth') as any;

        if (usernameInput) usernameInput.value = user.username;
        if (emailInput) emailInput.value = user.email;
        if (authCheckbox) authCheckbox.checked = user.twoFa || false;
        
        console.log("avatar url ", user.avatar_url)
        console.log("2FA enabled ", user.twoFa)

        updateProfileImagePreview(user.avatar_url || null);

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function handleProfileSubmit(e: Event): Promise<void> {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Get values from app-input components
    const usernameInput = document.querySelector('#profile-username') as any;
    const emailInput = document.querySelector('#profile-email') as any;
    const authCheckbox = document.querySelector('#auth') as any;

    const username = usernameInput?.value || formData.get('username') as string;
    const email = emailInput?.value || formData.get('email') as string;
    const profileImage = formData.get('profile_image') as File;
    const twoFA = authCheckbox?.checked || false;

    try {
        // Update profile data (username, email)
        const profileResponse = await apiPatch('/users/me', { username, email, twoFA });

        if (!profileResponse.ok) {
            showMessage('Failed to update profile', 'error');
            return;
        }

        // Upload profile image if one is selected
        if (profileImage && profileImage.size > 0) {
            const imageFormData = new FormData();
            imageFormData.append('image', profileImage);

            const accessToken = sessionStorage.getItem('access_token');

            const imageResponse = await fetch('/users/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: imageFormData,
            });

            if (!imageResponse.ok) {
                showMessage('Profile updated but image upload failed', 'error');
                return;
            }
        }
        await loadProfile();

        showMessage('Profile updated successfully', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('An error occurred', 'error');
    }
}

async function handleLogout(): Promise<void> {
    await logout();
    router.navigate('/');
}

function showMessage(message: string, type: 'success' | 'error'): void {
    const messageDiv = document.getElementById('profile-message');
    if (messageDiv) {
        messageDiv.innerHTML = '';
        const alert = document.createElement('app-alert');
        alert.setAttribute('variant', type === 'error' ? 'error' : 'success');
        alert.setAttribute('dismissible', '');
        alert.textContent = message;
        messageDiv.appendChild(alert);
        messageDiv.classList.remove('hidden');

        // Hide after 3 seconds
        setTimeout(() => {
            messageDiv.innerHTML = '';
            messageDiv.classList.add('hidden');
        }, 3000);
    }
}
