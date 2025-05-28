// Variables globales
let currentUserId = sessionStorage.getItem('userId') || 'anonymous';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('survey-form');
    const alcoholRadios = document.querySelectorAll('input[name="alcohol"]');
    const alcoholFrequencyGroup = document.querySelector('.alcohol-frequency-group');
    const alcoholQuantityGroup = document.querySelector('.alcohol-quantity-group');
    const drugsRadios = document.querySelectorAll('input[name="drugs"]');
    const drugsTypesGroup = document.querySelector('.drugs-types-group');
    const otherDrugsCheckbox = document.getElementById('other-drugs');
    const otherDrugsGroup = document.querySelector('.other-drugs-group');
    const helpRadios = document.querySelectorAll('input[name="help-sought"]');
    const helpTypeGroup = document.querySelector('.help-type-group');
    const successMessage = document.getElementById('success-message');
    const exportButton = document.getElementById('export-csv');

    // Gérer l'affichage conditionnel de la fréquence d'alcool et quantité
    alcoholRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const showFields = this.value === 'yes';
            alcoholFrequencyGroup.style.display = showFields ? 'block' : 'none';
            alcoholQuantityGroup.style.display = showFields ? 'block' : 'none';
            if (!showFields) {
                document.getElementById('alcohol-frequency').value = '';
                document.getElementById('alcohol-quantity').value = '';
            }
        });
    });

    // Gérer l'affichage conditionnel des types d'aide
    helpRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            helpTypeGroup.style.display = this.value === 'yes' ? 'block' : 'none';
            if (this.value === 'no') {
                document.querySelectorAll('input[name="help-type"]').forEach(cb => cb.checked = false);
            }
        });
    });

    // Gérer l'affichage conditionnel des types de drogues
    drugsRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            drugsTypesGroup.style.display = this.value === 'yes' ? 'block' : 'none';
            if (this.value === 'no') {
                document.querySelectorAll('input[name="drug-type"]').forEach(cb => cb.checked = false);
                otherDrugsGroup.style.display = 'none';
                document.getElementById('other-drugs-text').value = '';
            }
        });
    });

    // Gérer l'affichage du champ "autres drogues"
    otherDrugsCheckbox.addEventListener('change', function() {
        otherDrugsGroup.style.display = this.checked ? 'block' : 'none';
        if (!this.checked) {
            document.getElementById('other-drugs-text').value = '';
        }
    });

    // Gérer la soumission du formulaire
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Récupérer les données du formulaire
        const formData = new FormData(form);
        
        const questionnaire = {
            id: Date.now().toString(),
            userId: currentUserId,
            consommationDrogues: Array.from(formData.getAll('drugs-types')),
            frequenceConsommation: {},
            consommationAlcool: {
                frequence: formData.get('alcohol-frequency') || 'never',
                quantite: parseInt(formData.get('alcohol-quantity')) || 0
            },
            impactSante: formData.get('health-impact'),
            impactSocial: formData.get('social-impact'),
            demandeAide: formData.get('help-sought') === 'yes',
            commentaires: formData.get('comments')
        };

        try {
            // Envoyer le questionnaire à l'API
            const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}${window.APP_CONFIG.endpoints.questionnaires}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(questionnaire)
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde du questionnaire');
            }

            // Afficher le message de succès
            successMessage.style.display = 'block';
            form.reset();

            // Rediriger vers la page de consultation après 2 secondes
            setTimeout(() => {
                window.location.href = 'consulter.html';
            }, 2000);

        } catch (error) {
            console.error('Erreur:', error);
            alert('Une erreur est survenue lors de la sauvegarde du questionnaire');
        }
    });

    // Réinitialisation du formulaire
    form.addEventListener('reset', function() {
        setTimeout(() => {
            alcoholFrequencyGroup.style.display = 'none';
            alcoholQuantityGroup.style.display = 'none';
            drugsTypesGroup.style.display = 'none';
            otherDrugsGroup.style.display = 'none';
            helpTypeGroup.style.display = 'none';
            successMessage.style.display = 'none';
        }, 0);
    });

    // Gérer l'export CSV
    exportButton.addEventListener('click', async function() {
        try {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const responses = request.result;
                if (responses.length === 0) {
                    alert('Aucune réponse à exporter.');
                    return;
                }
                exportToCSV(responses);
            };

            request.onerror = () => {
                throw request.error;
            };
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            alert('Une erreur est survenue lors de l\'export des données.');
        }
    });
});

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
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// Fonction de sauvegarde des données
function saveFormData(data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Fonction pour convertir les données en CSV
function convertToCSV(data) {
    const headers = [
        'Date',
        'Nom',
        'Prénom',
        'Email',
        'Âge',
        'Genre',
        'Situation professionnelle',
        'Consommation d\'alcool',
        'Fréquence d\'alcool',
        'Quantité d\'alcool',
        'Consommation de drogues',
        'Types de drogues',
        'Autres drogues',
        'Contextes de consommation',
        'Impact',
        'Domaines affectés',
        'Aide recherchée',
        'Types d\'aide'
    ];

    let csvContent = headers.join(';') + '\n';

    data.forEach(item => {
        const row = [
            new Date(item.timestamp).toLocaleString(),
            item.lastName,
            item.firstName,
            item.email,
            item.age,
            item.gender === 'male' ? 'Masculin' : item.gender === 'female' ? 'Féminin' : 'Autre',
            item.occupation === 'student' ? 'Étudiant(e)' : 
                item.occupation === 'employed' ? 'Employé(e)' : 
                item.occupation === 'unemployed' ? 'Sans emploi' : 
                item.occupation === 'retired' ? 'Retraité(e)' : 'Autre',
            item.alcohol === 'yes' ? 'Oui' : 'Non',
            item.alcoholFrequency || 'N/A',
            item.alcoholQuantity || 'N/A',
            item.drugs === 'yes' ? 'Oui' : 'Non',
            item.drugTypes.length > 0 ? item.drugTypes.join(', ') : 'N/A',
            item.otherDrugs || 'N/A',
            item.contexts.length > 0 ? item.contexts.join(', ') : 'N/A',
            item.impact.replace(/[\n\r;]/g, ' '),
            item.impactAreas.length > 0 ? item.impactAreas.join(', ') : 'N/A',
            item.helpSought === 'yes' ? 'Oui' : 'Non',
            item.helpTypes.length > 0 ? item.helpTypes.join(', ') : 'N/A'
        ];
        csvContent += row.join(';') + '\n';
    });

    return csvContent;
}

// Fonction pour exporter les données en CSV
function exportToCSV(data) {
    const csvContent = convertToCSV(data);
    
    // Ajouter BOM pour Excel
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `questionnaire_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
