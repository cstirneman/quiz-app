document.addEventListener('DOMContentLoaded', () => {
    const showRegisterButton = document.getElementById('show-register');
    const showLoginButton = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginContainer = document.querySelector('.login-container');
    const registerContainer = document.querySelector('.register-container');

    // Switch to register form
    showRegisterButton.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });

    // Switch back to login form
    showLoginButton.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    // Login form submission
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            window.location.href = '/index.html';
        } else {
            const result = await response.json();
            alert(result.message);
        }
    });

    // Register form submission
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            window.location.href = '/index.html';
        } else {
            const result = await response.json();
            alert(result.message);
        }
    });
});
