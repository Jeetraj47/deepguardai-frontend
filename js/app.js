// DeepGuardAI - Main JavaScript

const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Set token in localStorage
function setToken(token) {
  localStorage.setItem('token', token);
}

// Get user from localStorage
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Set user in localStorage
function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// Clear auth data
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Check if user is authenticated
function isAuthenticated() {
  return !!getToken();
}

// Check if user is admin
function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Show alert message
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} fade-in`;
  alertDiv.textContent = message;

  const container = document.querySelector('.container');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Update navbar based on auth status
function updateNavbar() {
  const navMenu = document.querySelector('.navbar-menu');
  if (!navMenu) return;

  if (isAuthenticated()) {
    const user = getUser();
    navMenu.innerHTML = `
      <li><a href="dashboard.html">Dashboard</a></li>
      <li><a href="upload.html">Upload</a></li>
      ${isAdmin() ? '<li><a href="admin/dashboard.html">Admin</a></li>' : ''}
      <li><a href="#" onclick="logout()">Logout (${user.name})</a></li>
    `;
  } else {
    navMenu.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="login.html">Login</a></li>
      <li><a href="register.html">Register</a></li>
    `;
  }
}

// Logout function
function logout() {
  clearAuth();
  window.location.href = 'index.html';
}

// Protect page (require authentication)
function protectPage() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

// Protect admin page
function protectAdminPage() {
  if (!isAuthenticated() || !isAdmin()) {
    window.location.href = '../index.html';
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  initChatbot();
});

// Chatbot functionality
function initChatbot() {
  const chatbotButton = document.getElementById('chatbot-button');
  const chatbotWindow = document.getElementById('chatbot-window');
  const chatbotClose = document.getElementById('chatbot-close');
  const chatbotForm = document.getElementById('chatbot-form');
  const chatbotInput = document.getElementById('chatbot-input');
  const chatbotMessages = document.getElementById('chatbot-messages');

  if (!chatbotButton) return;

  chatbotButton.addEventListener('click', () => {
    chatbotWindow.classList.toggle('active');
  });

  if (chatbotClose) {
    chatbotClose.addEventListener('click', () => {
      chatbotWindow.classList.remove('active');
    });
  }

  if (chatbotForm) {
    chatbotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = chatbotInput.value.trim();
      
      if (!message) return;

      // Add user message
      addChatMessage(message, 'user');
      chatbotInput.value = '';

      // Show typing indicator
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message message-bot';
      typingDiv.textContent = 'Typing...';
      typingDiv.id = 'typing-indicator';
      chatbotMessages.appendChild(typingDiv);
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

      try {
        const response = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        });

        const data = await response.json();
        
        // Remove typing indicator
        document.getElementById('typing-indicator')?.remove();

        // Add bot response
        addChatMessage(data.response, 'bot');
      } catch (error) {
        document.getElementById('typing-indicator')?.remove();
        addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
      }
    });
  }
}

function addChatMessage(text, sender) {
  const chatbotMessages = document.getElementById('chatbot-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${sender}`;
  messageDiv.textContent = text;
  chatbotMessages.appendChild(messageDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}
