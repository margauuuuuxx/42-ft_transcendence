// Register Listener - DOM logic for registration page
// Handles form submission and error display
import { register } from '../services/auth.js';
import { router } from '../lib/router.js';
/**
 * Initialize register form listeners
 * Called when register template is loaded
 */
export function registerListener() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm)
        return;
    registerForm.addEventListener('submit', handleRegisterSubmit);
}
async function handleRegisterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('password_confirm');
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
function showError(message) {
    const errorDiv = document.getElementById('message_display');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}
