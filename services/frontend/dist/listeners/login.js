// Login Listener - DOM logic for login page
// Handles both login and register form submissions, error display, and 2FA popup
import { login, verify2FA, resend2FACode, register } from '../services/auth.js';
import { router } from '../lib/router.js';
// Helper to manage pending 2FA email in sessionStorage
const PENDING_EMAIL_KEY = 'pending2FAEmail';
function getPendingEmail() {
    return sessionStorage.getItem(PENDING_EMAIL_KEY) || '';
}
function setPendingEmail(email) {
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
}
function clearPendingEmail() {
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
}
// --- Error Display Functions ---
function showError(message) {
    const errorDiv = document.getElementById('login_message_display');
    if (errorDiv) {
        errorDiv.innerHTML = '';
        const alert = document.createElement('app-alert');
        alert.setAttribute('variant', 'error');
        alert.setAttribute('dismissible', '');
        alert.textContent = message;
        errorDiv.appendChild(alert);
        errorDiv.classList.remove('hidden');
    }
}
function showRegisterError(message) {
    const errorDiv = document.getElementById('register_message_display');
    if (errorDiv) {
        errorDiv.innerHTML = '';
        const alert = document.createElement('app-alert');
        alert.setAttribute('variant', 'error');
        alert.setAttribute('dismissible', '');
        alert.textContent = message;
        errorDiv.appendChild(alert);
        errorDiv.classList.remove('hidden');
    }
}
function showRegisterSuccess(message) {
    const errorDiv = document.getElementById('register_message_display');
    if (errorDiv) {
        errorDiv.innerHTML = '';
        const alert = document.createElement('app-alert');
        alert.setAttribute('variant', 'success');
        alert.setAttribute('dismissible', '');
        alert.textContent = message;
        errorDiv.appendChild(alert);
        errorDiv.classList.remove('hidden');
    }
}
function showVerificationError(message) {
    const errorDiv = document.getElementById('verification_message');
    if (errorDiv) {
        errorDiv.innerHTML = '';
        const alert = document.createElement('app-alert');
        alert.setAttribute('variant', 'error');
        alert.setAttribute('dismissible', '');
        alert.textContent = message;
        errorDiv.appendChild(alert);
        errorDiv.classList.remove('hidden');
    }
}
function clearVerificationError() {
    const errorDiv = document.getElementById('verification_message');
    if (errorDiv) {
        errorDiv.innerHTML = '';
        errorDiv.classList.add('hidden');
    }
}
/**
 * Initialize login and register form listeners
 * Called when login template is loaded
 */
export function loginListener() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    // Setup 2FA popup listeners
    setupVerificationPopup();
    setupCancelButton();
    setupResendButton();
    // Check if there's a pending 2FA (e.g., page was refreshed)
    if (getPendingEmail()) {
        show2FAPopup();
    }
}
// --- Login Form ---
async function handleLoginSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    // Store email for potential 2FA
    setPendingEmail(email);
    const result = await login(email, password);
    if (!result.success) {
        clearPendingEmail();
        showError(result.error || 'Login failed');
        return;
    }
    if (result.twoFaRequired) {
        show2FAPopup();
    }
    else {
        // Success! Clear pending and navigate
        clearPendingEmail();
        const redirect = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        router.navigate(redirect);
    }
}
// --- Register Form ---
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
        showRegisterError('Passwords do not match');
        return;
    }
    // Validate password strength
    if (password.length < 6) {
        showRegisterError('Password must be at least 6 characters');
        return;
    }
    const result = await register(username, email, password);
    if (!result.success) {
        showRegisterError(result.error || 'Registration failed');
        return;
    }
    // Success! Show success message and clear form
    console.log('Registration successful');
    showRegisterSuccess('Account created successfully! Please login.');
    form.reset();
}
// --- 2FA Popup ---
function show2FAPopup() {
    const popup = document.getElementById('emailVerificationPopup');
    if (popup && typeof popup.open === 'function') {
        popup.open();
    }
}
function hide2FAPopup() {
    const popup = document.getElementById('emailVerificationPopup');
    if (popup && typeof popup.close === 'function') {
        popup.close();
    }
    // Clear the verification input - find the app-input component
    const form = document.getElementById('verificationForm');
    if (form) {
        const input = form.querySelector('app-input[name="verification_code"]');
        if (input)
            input.value = '';
    }
    // Clear any error message
    clearVerificationError();
}
function setupVerificationPopup() {
    const verificationForm = document.getElementById('verificationForm');
    if (!verificationForm)
        return;
    verificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(verificationForm);
        const code = formData.get('verification_code');
        const email = getPendingEmail();
        if (!email) {
            showVerificationError('Session expired. Please login again.');
            hide2FAPopup();
            return;
        }
        const result = await verify2FA(email, code);
        if (!result.success) {
            showVerificationError(result.error || 'Verification failed');
            return;
        }
        // Success! Clear pending, hide popup and navigate
        clearPendingEmail();
        hide2FAPopup();
        const redirect = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        router.navigate(redirect);
    });
}
function setupCancelButton() {
    const cancelBtn = document.getElementById('cancelVerification');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            hide2FAPopup();
            clearPendingEmail();
        });
    }
}
function setupResendButton() {
    const resendBtn = document.getElementById('resendCode');
    if (!resendBtn)
        return;
    resendBtn.addEventListener('click', async () => {
        const email = getPendingEmail();
        if (!email)
            return;
        const result = await resend2FACode(email);
        if (!result.success) {
            showVerificationError(result.error || 'Failed to resend code');
        }
    });
}
