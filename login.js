document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Check if the user is already authenticated via SWA
    fetch('/.auth/me')
        .then(response => response.json())
        .then(data => {
            if (data && data.clientPrincipal) {
                // User is already logged in via SWA
                sessionStorage.setItem('isAuthenticated', 'true'); // Optional: for immediate client-side checks
                sessionStorage.setItem('userId', data.clientPrincipal.userId);
                sessionStorage.setItem('userDetails', data.clientPrincipal.userDetails);
                window.location.href = 'consulter.html'; // Redirect to a protected page
            } else {
                // User is not logged in via SWA, login form can remain visible
                // or automatically redirect to AAD login.
                // For this example, we'll let the user click a button.
                sessionStorage.removeItem('isAuthenticated');
                sessionStorage.removeItem('userId');
                sessionStorage.removeItem('userDetails');
            }
        })
        .catch(error => {
            console.error('Error fetching /.auth/me:', error);
            // Proceed as if not logged in, allow login form interaction
        });

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Instead of custom validation, redirect to Azure AD login
            // The username/password fields in the form are now effectively unused by this logic
            // but can be kept for user familiarity or removed.
            errorMessage.textContent = 'Redirection vers la page de connexion Azure...';
            window.location.href = '/.auth/login/aad';
        });
    }

    // Optional: Add a direct login button if the form is confusing
    const azureLoginButton = document.getElementById('azureLoginButton'); // Assume a button with this ID exists or can be added
    if (azureLoginButton) {
        azureLoginButton.addEventListener('click', () => {
            errorMessage.textContent = 'Redirection vers la page de connexion Azure...';
            window.location.href = '/.auth/login/aad';
        });
    }
});
