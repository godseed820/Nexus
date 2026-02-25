// ============================================
// NEXUSFI - AUTHENTICATION SYSTEM
// ============================================

// Session Management
const SESSION_KEY = 'nexusfi_session';
const USERS_KEY = 'nexusfi_users';
const CURRENT_USER_KEY = 'nexusfi_current_user';

// Check if user is logged in
function checkAuth() {
    const session = getSession();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Public pages that don't require authentication
    const publicPages = ['index.html', 'register.html', ''];
    
    if (session && session.isLoggedIn) {
        // User is logged in
        if (publicPages.includes(currentPage)) {
            // Redirect to dashboard if on login/register page
            window.location.href = 'dashboard.html';
            return false;
        }
        return true;
    } else {
        // User is not logged in
        if (!publicPages.includes(currentPage)) {
            // Redirect to login if on protected page
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}

// Get current session
function getSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
}

// Set session
function setSession(sessionData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

// Clear session (logout)
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
}

// Get all users
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
        return [];
    }
}

// Save users
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Get current user data
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    } catch {
        return null;
    }
}

// Save current user data
function saveCurrentUser(userData) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
}

// Hash password (simple hash for demo - use bcrypt in production)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.toLowerCase().trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me')?.checked || false;
    
    const users = getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
        showToast('Error', 'Account not found. Please check your email or register.', 'error');
        return false;
    }
    
    if (user.password !== hashPassword(password)) {
        showToast('Error', 'Invalid password. Please try again.', 'error');
        return false;
    }
    
    // Create session
    const session = {
        isLoggedIn: true,
        userId: user.id,
        email: user.email,
        loginTime: new Date().toISOString(),
        expiresAt: rememberMe ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    setSession(session);
    
    // Load user data
    const userData = {
        ...user,
        portfolio: user.portfolio || {
            balance: 500.00,
            investments: [],
            transactions: []
        }
    };
    
    saveCurrentUser(userData);
    
    showToast('Success', 'Welcome back, ' + user.firstName + '!', 'success');
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
    
    return false;
}

// Handle Registration
function handleRegister(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName = document.getElementById('reg-lastname').value.trim();
    const email = document.getElementById('reg-email').value.toLowerCase().trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const referralCode = document.getElementById('reg-referral').value.trim();
    
    // Validation
    if (password !== confirmPassword) {
        showToast('Error', 'Passwords do not match', 'error');
        return false;
    }
    
    if (password.length < 8) {
        showToast('Error', 'Password must be at least 8 characters', 'error');
        return false;
    }
    
    const users = getUsers();
    
    // Check if email exists
    if (users.some(u => u.email === email)) {
        showToast('Error', 'An account with this email already exists', 'error');
        return false;
    }
    
    // Create new user
    const newUser = {
        id: generateId(),
        firstName,
        lastName,
        email,
        phone,
        password: hashPassword(password),
        referralCode: referralCode || null,
        createdAt: new Date().toISOString(),
        portfolio: {
            balance: 500.00, // Initial $500 bonus
            investments: [],
            transactions: [{
                type: 'Bonus',
                asset: 'USD',
                amount: 500.00,
                description: 'Welcome Bonus',
                time: new Date().toLocaleString()
            }]
        },
        settings: {
            marketingConsent: document.getElementById('marketing-consent')?.checked || false,
            twoFactorEnabled: false
        }
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Auto login
    const session = {
        isLoggedIn: true,
        userId: newUser.id,
        email: newUser.email,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    setSession(session);
    saveCurrentUser(newUser);
    
    showToast('Success', 'Account created successfully! Welcome to NexusFi!', 'success');
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
    
    return false;
}

// Handle Logout
function handleLogout() {
    clearSession();
    showToast('Success', 'Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Toggle password visibility
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Show forgot password modal
function showForgotPassword() {
    document.getElementById('forgot-modal').classList.remove('hidden');
}

function closeForgotPassword() {
    document.getElementById('forgot-modal').classList.add('hidden');
}

function handleForgotPassword(event) {
    event.preventDefault();
    showToast('Success', 'Password reset link sent to your email', 'success');
    closeForgotPassword();
}

// Registration step navigation
let currentStep = 1;

function nextStep(step) {
    // Validate current step
    if (step === 2) {
        const firstName = document.getElementById('reg-firstname').value.trim();
        const lastName = document.getElementById('reg-lastname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        
        if (!firstName || !lastName || !email) {
            showToast('Error', 'Please fill in all required fields', 'error');
            return;
        }
        
        if (!email.includes('@')) {
            showToast('Error', 'Please enter a valid email address', 'error');
            return;
        }
        
        // Update verification email display
        document.getElementById('verify-email-display').textContent = email;
    }
    
    if (step === 3) {
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        
        if (!password || password.length < 8) {
            showToast('Error', 'Please enter a valid password (8+ characters)', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Error', 'Passwords do not match', 'error');
            return;
        }
    }
    
    // Hide all steps
    document.getElementById('step-1').classList.add('hidden');
    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('step-3').classList.add('hidden');
    
    // Show target step
    document.getElementById(`step-${step}`).classList.remove('hidden');
    
    // Update indicators
    updateStepIndicators(step);
    currentStep = step;
}

function prevStep(step) {
    nextStep(step);
}

function updateStepIndicators(activeStep) {
    const indicators = [
        document.getElementById('step-1-indicator'),
        document.getElementById('step-2-indicator'),
        document.getElementById('step-3-indicator')
    ];
    
    indicators.forEach((indicator, index) => {
        const stepNum = index + 1;
        indicator.classList.remove('step-active', 'step-completed');
        
        if (stepNum === activeStep) {
            indicator.classList.add('step-active');
        } else if (stepNum < activeStep) {
            indicator.classList.add('step-completed');
            indicator.innerHTML = '<i class="fas fa-check"></i>';
        } else {
            indicator.classList.add('bg-gray-800', 'text-gray-400');
            indicator.innerHTML = stepNum;
        }
    });
    
    // Update progress bar
    const progress = ((activeStep - 1) / 2) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
}

// Password strength checker
function checkPasswordStrength() {
    const password = document.getElementById('reg-password').value;
    const strengths = [
        document.getElementById('strength-1'),
        document.getElementById('strength-2'),
        document.getElementById('strength-3'),
        document.getElementById('strength-4')
    ];
    
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const colors = ['bg-gray-700', 'bg-danger', 'bg-orange-500', 'bg-yellow-500', 'bg-success'];
    
    strengths.forEach((bar, index) => {
        if (index < score) {
            bar.className = `flex-1 password-strength ${colors[score]}`;
        } else {
            bar.className = 'flex-1 password-strength bg-gray-700';
        }
    });
    
    const hint = document.getElementById('password-hint');
    const hints = [
        'Use 8+ characters with mixed case, numbers & symbols',
        'Weak - Add more variety',
        'Fair - Could be stronger',
        'Good - Almost there',
        'Strong - Great password!'
    ];
    
    hint.textContent = hints[score];
    hint.className = `text-xs mt-1 ${score <= 2 ? 'text-danger' : score === 3 ? 'text-yellow-500' : 'text-success'}`;
}

// Social login simulation
function socialLogin(provider) {
    showToast('Info', `${provider} login coming soon`, 'success');
}

// Toast notification
function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const icon = document.getElementById('toast-icon');
    const titleEl = document.getElementById('toast-title');
    const messageEl = document.getElementById('toast-message');

    titleEl.textContent = title;
    messageEl.textContent = message;
    
    if (type === 'error') {
        icon.className = 'w-8 h-8 rounded-full bg-danger/20 text-danger flex items-center justify-center';
        icon.innerHTML = '<i class="fas fa-exclamation"></i>';
    } else {
        icon.className = 'w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center';
        icon.innerHTML = '<i class="fas fa-check"></i>';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});
