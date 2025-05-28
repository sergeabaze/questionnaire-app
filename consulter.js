// Vérification de l'authentification
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Fonction pour se déconnecter
function logout() {
    sessionStorage.removeItem('isAuthenticated');
    window.location.href = 'login.html';
}

// Fonction pour chiffrer les données
async function encryptData(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    // Générer une clé de chiffrement
    const key = await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
    
    // Générer un vecteur d'initialisation
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Chiffrer les données
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        dataBuffer
    );
    
    // Convertir la clé pour le stockage
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    
    return {
        encrypted: Array.from(new Uint8Array(encryptedData)),
        iv: Array.from(iv),
        key: Array.from(new Uint8Array(exportedKey))
    };
}

// Fonction pour déchiffrer les données
async function decryptData(encryptedObj) {
    // Reconstituer les données chiffrées
    const encryptedData = new Uint8Array(encryptedObj.encrypted);
    const iv = new Uint8Array(encryptedObj.iv);
    const keyData = new Uint8Array(encryptedObj.key);
    
    // Importer la clé
    const key = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
    
    // Déchiffrer les données
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encryptedData
    );
    
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedBuffer));
}

// Fonction pour valider les données
function validateData(data) {
    if (!data) return false;
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) return false;
    
    // Validation des champs requis
    const requiredFields = ['firstName', 'lastName', 'age', 'gender', 'occupation'];
    for (const field of requiredFields) {
        if (!data[field]) return false;
    }
    
    // Validation de l'âge
    if (isNaN(data.age) || data.age < 0 || data.age > 120) return false;
    
    return true;
}

// Fonction pour charger les questionnaires
async function loadQuestionnaires() {
    if (!checkAuth()) return;

    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        alert('Utilisateur non identifié');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Récupérer les questionnaires depuis l'API
        const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}${window.APP_CONFIG.endpoints.questionnaires}?userId=${userId}`);
        
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des questionnaires');
        }

        const questionnaires = await response.json();
        displayQuestionnaires(questionnaires);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la récupération des questionnaires');
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
    document.getElementById('searchBtn').addEventListener('click', async () => {
        const email = document.getElementById('searchEmail').value;
        
        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            alert('Veuillez entrer une adresse email valide');
            return;
        }

        try {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(email);

            request.onsuccess = async () => {
                const encryptedData = request.result;
                await displayResults(encryptedData);
            };

            request.onerror = () => {
                throw new Error('Erreur lors de la recherche');
            };
        } catch (error) {
            console.error('Erreur sécurisée:', error);
            alert('Une erreur est survenue lors de la recherche. Veuillez réessayer.');
        }
    });        // Gestionnaire du bouton retour
    document.getElementById('backToForm').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Gestionnaire du bouton déconnexion
    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
    });

});
