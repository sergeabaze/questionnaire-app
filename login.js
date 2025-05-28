// Configuration de la base de données pour les utilisateurs
const AUTH_DB_NAME = 'AuthDB';
const AUTH_DB_VERSION = 1;
const AUTH_STORE_NAME = 'users';

// Fonction pour initialiser la base de données d'authentification
async function initAuthDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(AUTH_DB_NAME, AUTH_DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(AUTH_STORE_NAME)) {
                const store = db.createObjectStore(AUTH_STORE_NAME, { 
                    keyPath: 'username' 
                });
                // Créer un utilisateur par défaut
                store.add({
                    username: 'admin',
                    // Le mot de passe est "admin123" hashé
                    password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
                });
            }
        };
    });
}

// Fonction pour hasher le mot de passe
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fonction pour vérifier les identifiants
async function verifyCredentials(username, password) {
    const db = await initAuthDB();
    const transaction = db.transaction(AUTH_STORE_NAME, 'readonly');
    const store = transaction.objectStore(AUTH_STORE_NAME);
    const user = await new Promise((resolve) => {
        const request = store.get(username);
        request.onsuccess = () => resolve(request.result);
    });

    if (!user) return false;

    const hashedPassword = await hashPassword(password);
    return user.password === hashedPassword;
}

// Gestionnaire du formulaire de connexion
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const isValid = await verifyCredentials(username, password);
        if (isValid) {
            // Stocker le token de session
            sessionStorage.setItem('isAuthenticated', 'true');
            // Rediriger vers la page de consultation
            window.location.href = 'consulter.html';
        } else {
            errorMessage.textContent = 'Nom d\'utilisateur ou mot de passe incorrect';
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        errorMessage.textContent = 'Une erreur est survenue. Veuillez réessayer.';
    }
});
