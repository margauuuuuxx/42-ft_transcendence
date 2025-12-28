// Register Listener - DOM logic for registration page
// Handles form submission and error display

import { register } from '../services/auth.js';
import { router } from '../lib/router.js';

/**
 * Initialize register form listeners
 * Called when register template is loaded
 */
export function registerListener(): void {
    const registerForm = document.getElementById('registerForm') as HTMLFormElement | null;
    if (!registerForm) return;

    registerForm.addEventListener('submit', handleRegisterSubmit);
}

async function handleRegisterSubmit(e: Event): Promise<void> {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('password_confirm') as string;

    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    // Validate password strength (optional)
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    const result = await register(username, email, password);

    if (!result.success) {
        showError(result.error || 'Registration failed');
        return;
    }

    // Success! Redirect to login
    console.log('Registration successful');
    router.navigate('/login');
}

function showError(message: string): void {
    const errorDiv = document.getElementById('message_display');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}
