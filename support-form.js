// Configuration de la base de données IndexedDB
const dbName = 'SupportRequestDB';
const dbVersion = 1;

// Initialisation de la base de données
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = () => {
            reject('Erreur lors de l\'ouverture de la base de données');
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Création du store pour les demandes de soutien
            if (!db.objectStoreNames.contains('supportRequests')) {
                const store = db.createObjectStore('supportRequests', { keyPath: 'id', autoIncrement: true });
                
                // Création des index pour la recherche
                store.createIndex('email', 'email', { unique: false });
                store.createIndex('date', 'date', { unique: false });
                store.createIndex('lastName', 'lastName', { unique: false });
            }
        };
    });
};

// Fonction pour sauvegarder une demande
const saveSupportRequest = async (data) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['supportRequests'], 'readwrite');
            const store = transaction.objectStore('supportRequests');

            // Ajout de la date de création
            data.date = new Date().toISOString();

            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject('Erreur lors de la sauvegarde de la demande');
            };
        });
    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
};

// Gestionnaire du formulaire
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('support-form');
    
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        try {
            // Récupération des données du formulaire
            const formData = {
                lastName: document.getElementById('lastName').value,
                firstName: document.getElementById('firstName').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                supportTypes: {
                    financial: document.getElementById('financial-support').checked,
                    psychological: document.getElementById('psychological-support').checked,
                    medical: document.getElementById('medical-support').checked,
                    social: document.getElementById('social-support').checked,
                    other: document.getElementById('other-support').checked
                },
                situation: document.getElementById('situation').value,
                urgency: document.getElementById('urgency').value,
                income: document.getElementById('income').value,
            };

            // Sauvegarde dans IndexedDB
            await saveSupportRequest(formData);

            // Affichage du message de succès
            document.getElementById('success-message').style.display = 'block';
            form.reset();
            form.classList.remove('was-validated');

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            // Afficher un message d'erreur à l'utilisateur
            alert('Une erreur est survenue lors de la sauvegarde de votre demande. Veuillez réessayer.');
        }
    });
});
