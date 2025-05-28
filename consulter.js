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

// Configuration de la base de données IndexedDB
const DB_NAME = 'QuestionnaireDB';
const DB_VERSION = 1;
const STORE_NAME = 'responses';

// Initialisation de la base de données
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'email'
                });
                // Création d'index pour la recherche
                store.createIndex('email', 'email', { unique: true });
                store.createIndex('lastName', 'lastName', { unique: false });
                store.createIndex('firstName', 'firstName', { unique: false });
            }
        };
    });
}

// Fonction modifiée pour afficher les résultats avec déchiffrement
async function displayResults(encryptedData) {
    const resultsDiv = document.getElementById('results');
    if (!encryptedData) {
        resultsDiv.innerHTML = '<p>Aucune réponse trouvée pour cet email.</p>';
        return;
    }

    try {
        const data = await decryptData(encryptedData);
        if (!validateData(data)) {
            throw new Error('Données invalides');
        }

        const formattedDate = new Date(data.timestamp).toLocaleString();
        
    let html = `
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h3 class="mb-0">Réponse du ${formattedDate}</h3>
                </div>
                <div class="card-body">
                    <div class="mb-4">
                        <h4 class="text-primary mb-3">Informations personnelles</h4>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Nom :</strong> ${data.lastName}</p>
                                <p><strong>Prénom :</strong> ${data.firstName}</p>
                                <p><strong>Email :</strong> ${data.email}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Âge :</strong> ${data.age}</p>
                                <p><strong>Genre :</strong> ${data.gender === 'male' ? 'Masculin' : data.gender === 'female' ? 'Féminin' : 'Autre'}</p>
                                <p><strong>Situation professionnelle :</strong> ${
                        data.occupation === 'student' ? 'Étudiant(e)' :
                        data.occupation === 'employed' ? 'Employé(e)' :
                        data.occupation === 'unemployed' ? 'Sans emploi' :
                        data.occupation === 'retired' ? 'Retraité(e)' : 'Autre'                }</p>
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-primary mb-3">Consommation d'alcool</h4>
                        <div class="alert ${data.alcohol === 'yes' ? 'alert-info' : 'alert-success'}">
                            <p class="mb-2"><strong>Consomme de l'alcool :</strong> ${data.alcohol === 'yes' ? 'Oui' : 'Non'}</p>
                            ${data.alcohol === 'yes' ? `
                                <p class="mb-2"><strong>Fréquence :</strong> ${data.alcoholFrequency || 'N/A'}</p>
                                <p class="mb-0"><strong>Quantité :</strong> ${data.alcoholQuantity || 'N/A'}</p>
                            ` : ''}                        </div>

                    <div class="mb-4">
                        <h4 class="text-primary mb-3">Consommation de drogues</h4>
                        <div class="alert ${data.drugs === 'yes' ? 'alert-warning' : 'alert-success'}">
                            <p class="mb-2"><strong>Consomme des drogues :</strong> ${data.drugs === 'yes' ? 'Oui' : 'Non'}</p>
                            ${data.drugs === 'yes' ? `
                                <p class="mb-2"><strong>Types :</strong> ${data.drugTypes.join(', ') || 'N/A'}</p>
                                ${data.otherDrugs ? `<p class="mb-0"><strong>Autres drogues :</strong> ${data.otherDrugs}</p>` : ''}
                            ` : ''}
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-primary mb-3">Impact et contexte</h4>
                        <div class="card">
                            <div class="card-body">
                                <p class="mb-2"><strong>Contextes de consommation :</strong> ${data.contexts.join(', ') || 'N/A'}</p>
                                <p class="mb-2"><strong>Impact :</strong> ${data.impact}</p>
                                <p class="mb-0"><strong>Domaines affectés :</strong> ${data.impactAreas.join(', ') || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-primary mb-3">Aide et soutien</h4>
                        <div class="alert ${data.helpSought === 'yes' ? 'alert-info' : 'alert-warning'}">
                            <p class="mb-2"><strong>A cherché de l'aide :</strong> ${data.helpSought === 'yes' ? 'Oui' : 'Non'}</p>
                            ${data.helpSought === 'yes' ? `
                                <p class="mb-0"><strong>Types d'aide :</strong> ${data.helpTypes.join(', ') || 'N/A'}</p>
                            ` : ''}
                </div>
            </div>
        `;

        resultsDiv.innerHTML = html;
    } catch (error) {
        console.error('Erreur lors du déchiffrement:', error);
        resultsDiv.innerHTML = '<p>Erreur lors de la lecture des données.</p>';
    }
}

// Gestionnaire d'événements au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier l'authentification
    if (!checkAuth()) return;

    try {
        const db = await initDB();

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

    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        alert('Erreur lors de l\'initialisation de la base de données');
    }
});
