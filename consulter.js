// Vérification de l'authentification using SWA's /.auth/me endpoint
async function checkAuth() {
    try {
        const response = await fetch('/.auth/me');
        if (!response.ok) { // Handle cases where the fetch itself fails or returns non-2xx
            window.location.href = 'login.html';
            return false;
        }
        const data = await response.json();
        if (data && data.clientPrincipal) {
            // User is authenticated
            sessionStorage.setItem('isAuthenticated', 'true'); // Keep for compatibility if other scripts use it directly
            sessionStorage.setItem('userId', data.clientPrincipal.userId);
            sessionStorage.setItem('userDetails', data.clientPrincipal.userDetails);
            return true;
        } else {
            // User is not authenticated
            sessionStorage.removeItem('isAuthenticated');
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('userDetails');
            window.location.href = 'login.html';
            return false;
        }
    } catch (error) {
        console.error('Error during auth check:', error);
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userDetails');
        window.location.href = 'login.html';
        return false;
    }
}

// Fonction pour se déconnecter
function logout() {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userDetails');
    // Redirect to SWA logout, then to login page or home page
    window.location.href = `/.auth/logout?post_logout_redirect_uri=${window.location.origin}/login.html`;
}

// Client-side encryption functions (encryptData, decryptData) removed as their necessity is unclear
// and the feature they supported (local IndexedDB search) was broken and is currently disabled.
// If client-side encryption of local data is required, it needs a more robust implementation
// and key management strategy. HTTPS handles transit security for API data.

// Unused/mismatched validateData function removed.
// Frontend validation for forms should be specific to each form's data model and requirements.

// Fonction pour charger les questionnaires
async function loadQuestionnaires() {
    // checkAuth is async now, so we need to await it.
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    const userId = sessionStorage.getItem('userId');
    // This check might be redundant if checkAuth properly redirects, but good for safety.
    if (!userId) {
        console.warn('User ID not found in session storage after auth check.');
        // Consider displaying a user-friendly error message here instead of just alert
        displayError('Utilisateur non identifié. Impossible de charger les questionnaires.');
        // window.location.href = 'login.html'; // checkAuth should handle redirection
        return;
    }

    try {
        const apiUrl = `${window.APP_CONFIG.apiBaseUrl}${window.APP_CONFIG.endpoints.questionnaires}?userId=${userId}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            // More specific error based on status code if possible
            const errorText = await response.text();
            console.error(`Erreur ${response.status} lors de la récupération des questionnaires: ${errorText}`);
            throw new Error(`Échec du chargement des questionnaires (statut: ${response.status})`);
        }

        const questionnaires = await response.json();
        displayQuestionnaires(questionnaires);
        clearError(); // Clear any previous errors if successful
    } catch (error) {
        console.error('Erreur détaillée lors de la récupération des questionnaires:', error);
        displayError('Une erreur est survenue lors de la récupération des questionnaires. Veuillez réessayer plus tard.');
    }
}

// Helper function to display errors in a dedicated element (assumes an element with id="error-message-area" exists)
function displayError(message) {
    const errorArea = document.getElementById('error-message-area');
    if (errorArea) {
        errorArea.textContent = message;
        errorArea.style.display = 'block';
    } else {
        alert(message); // Fallback to alert if the dedicated area isn't found
    }
}

// Helper function to clear errors from the dedicated element
function clearError() {
    const errorArea = document.getElementById('error-message-area');
    if (errorArea) {
        errorArea.textContent = '';
        errorArea.style.display = 'none';
    }
}

// Fonction pour afficher les questionnaires
function displayQuestionnaires(questionnaires) {
    const container = document.getElementById('questionnaires-container');
    container.innerHTML = ''; // Nettoyer le conteneur

    if (questionnaires.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Aucun questionnaire trouvé</div>';
        return;
    }

    questionnaires.forEach(questionnaire => {
        const card = document.createElement('div');
        card.className = 'card mb-3';
        
        const date = new Date(questionnaire.dateCreation).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">Questionnaire du ${date}</h5>
                <div class="card-text">
                    <p><strong>Consommation d'alcool :</strong> ${questionnaire.consommationAlcool.frequence} 
                       (${questionnaire.consommationAlcool.quantite} verres par semaine)</p>
                    <p><strong>Drogues consommées :</strong> ${questionnaire.consommationDrogues.join(', ')}</p>
                    <p><strong>Impact sur la santé :</strong> ${questionnaire.impactSante}</p>
                    <p><strong>Impact social :</strong> ${questionnaire.impactSocial}</p>
                    <p><strong>Demande d'aide :</strong> ${questionnaire.demandeAide ? 'Oui' : 'Non'}</p>
                    ${questionnaire.commentaires ? `<p><strong>Commentaires :</strong> ${questionnaire.commentaires}</p>` : ''}
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Gestionnaire d'événements au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier l'authentification
    if (!checkAuth()) return;

    // Charger les questionnaires
    loadQuestionnaires();

    // Gestionnaire de recherche avec validation et sécurité
    // TODO: This search functionality appears to target IndexedDB (likely 'supportRequests' store from support-form.js).
    // However, the 'db' variable is not initialized in this scope, and 'support-form.js' saves plain data,
    // while this code expects 'encryptedData' and tries to call 'displayResults' which is not defined.
    // This feature needs significant review and correction if it's to be used.
    // For now, fixing STORE_NAME to what it likely should be, if this feature were functional.
    const SEARCH_STORE_NAME = 'supportRequests'; // From support-form.js's initDB

    document.getElementById('searchBtn').addEventListener('click', async () => {
        const email = document.getElementById('searchEmail').value;
        
        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            alert('Veuillez entrer une adresse email valide');
            return;
        }

        try {
            // NOTE: The 'db' variable is not defined here. This would require initializing IndexedDB
            // similar to how it's done in 'support-form.js' (e.g., using an initDB function).
            // Example: const db = await initSupportDB(); // Assuming initSupportDB is available
            alert('La fonctionnalité de recherche locale est actuellement désactivée ou en cours de révision.');
            // const transaction = db.transaction(SEARCH_STORE_NAME, 'readonly');
            // const store = transaction.objectStore(SEARCH_STORE_NAME);
            // const request = store.get(email); // Searching by email; supportRequests store has 'email' index.

            // request.onsuccess = async () => {
            //     const data = request.result; // This data is not encrypted by support-form.js
            //     // If data were encrypted, it would need decryption.
            //     // The displayResults function is also missing.
            //     // await displayResults(data);
            //     console.log('Search result (raw from IndexedDB):', data);
            // };

            // request.onerror = () => {
            //     throw new Error('Erreur lors de la recherche');
            // };
        } catch (error) {
            console.error('Erreur de recherche (désactivée):', error);
            alert('Une erreur est survenue lors de la recherche. Cette fonctionnalité est en cours de révision.');
        }
    });
    // Gestionnaire du bouton retour
    document.getElementById('backToForm').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Gestionnaire du bouton déconnexion
    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
    });

});
