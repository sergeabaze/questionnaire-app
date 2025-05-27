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

// Fonction pour afficher les résultats
function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    if (!data) {
        resultsDiv.innerHTML = '<p>Aucune réponse trouvée pour cet email.</p>';
        return;
    }

    const formattedDate = new Date(data.timestamp).toLocaleString();
    
    let html = `
        <div class="result-card">
            <h3>Réponse du ${formattedDate}</h3>
            <div class="result-section">
                <h4>Informations personnelles</h4>
                <p><strong>Nom :</strong> ${data.lastName}</p>
                <p><strong>Prénom :</strong> ${data.firstName}</p>
                <p><strong>Email :</strong> ${data.email}</p>
                <p><strong>Âge :</strong> ${data.age}</p>
                <p><strong>Genre :</strong> ${data.gender === 'male' ? 'Masculin' : data.gender === 'female' ? 'Féminin' : 'Autre'}</p>
                <p><strong>Situation professionnelle :</strong> ${
                    data.occupation === 'student' ? 'Étudiant(e)' :
                    data.occupation === 'employed' ? 'Employé(e)' :
                    data.occupation === 'unemployed' ? 'Sans emploi' :
                    data.occupation === 'retired' ? 'Retraité(e)' : 'Autre'
                }</p>
            </div>

            <div class="result-section">
                <h4>Consommation d'alcool</h4>
                <p><strong>Consomme de l'alcool :</strong> ${data.alcohol === 'yes' ? 'Oui' : 'Non'}</p>
                ${data.alcohol === 'yes' ? `
                    <p><strong>Fréquence :</strong> ${data.alcoholFrequency || 'N/A'}</p>
                    <p><strong>Quantité :</strong> ${data.alcoholQuantity || 'N/A'}</p>
                ` : ''}
            </div>

            <div class="result-section">
                <h4>Consommation de drogues</h4>
                <p><strong>Consomme des drogues :</strong> ${data.drugs === 'yes' ? 'Oui' : 'Non'}</p>
                ${data.drugs === 'yes' ? `
                    <p><strong>Types :</strong> ${data.drugTypes.join(', ') || 'N/A'}</p>
                    ${data.otherDrugs ? `<p><strong>Autres drogues :</strong> ${data.otherDrugs}</p>` : ''}
                ` : ''}
            </div>

            <div class="result-section">
                <h4>Impact et contexte</h4>
                <p><strong>Contextes de consommation :</strong> ${data.contexts.join(', ') || 'N/A'}</p>
                <p><strong>Impact :</strong> ${data.impact}</p>
                <p><strong>Domaines affectés :</strong> ${data.impactAreas.join(', ') || 'N/A'}</p>
            </div>

            <div class="result-section">
                <h4>Aide et soutien</h4>
                <p><strong>A cherché de l'aide :</strong> ${data.helpSought === 'yes' ? 'Oui' : 'Non'}</p>
                ${data.helpSought === 'yes' ? `
                    <p><strong>Types d'aide :</strong> ${data.helpTypes.join(', ') || 'N/A'}</p>
                ` : ''}
            </div>
        </div>
    `;

    resultsDiv.innerHTML = html;
}

// Gestionnaire d'événements au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const db = await initDB();

        // Gestionnaire de recherche
        document.getElementById('searchBtn').addEventListener('click', async () => {
            const email = document.getElementById('searchEmail').value;
            if (!email) {
                alert('Veuillez entrer une adresse email');
                return;
            }

            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(email);

            request.onsuccess = () => {
                displayResults(request.result);
            };

            request.onerror = () => {
                console.error('Erreur lors de la recherche:', request.error);
                alert('Erreur lors de la recherche');
            };
        });

        // Gestionnaire du bouton retour
        document.getElementById('backToForm').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        alert('Erreur lors de l\'initialisation de la base de données');
    }
});
