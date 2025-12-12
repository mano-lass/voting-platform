// Authentication Logic
const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault();
    
    const voterId = document.getElementById('voter-id').value.trim();
    const password = document.getElementById('password').value;
    
    // Clear previous messages
    hideMessage('error');
    hideMessage('success');
    
    // Validate input
    if (!voterId || !password) {
        showMessage('error', 'Please enter both Voter ID and Password');
        return;
    }
    
    // Disable submit button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                voterId,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store authentication token
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('voterId', voterId);
            localStorage.setItem('voterName', data.voterName);
            
            showMessage('success', 'Login successful! Redirecting...');
            
            // Redirect to voting page after 1 second
            setTimeout(() => {
                window.location.href = 'vote.html';
            }, 1000);
        } else {
            showMessage('error', data.message || 'Invalid credentials. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('error', 'Connection error. Please check your network and try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

function showMessage(type, message) {
    const messageElement = document.getElementById(`${type}-message`);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
    }
}

function hideMessage(type) {
    const messageElement = document.getElementById(`${type}-message`);
    if (messageElement) {
        messageElement.style.display = 'none';
    }
}

// Logout function (used on other pages)
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('voterId');
    localStorage.removeItem('voterName');
    window.location.href = 'login.html';
}

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
}

// Get authentication token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Get voter information
function getVoterInfo() {
    return {
        voterId: localStorage.getItem('voterId'),
        voterName: localStorage.getItem('voterName')
    };
}
