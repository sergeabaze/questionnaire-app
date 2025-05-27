let db;
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

    // Initialiser la base de données
    
    initDB().then(database => {
        db = database;
    }).catch(error => {
        console.error('Erreur d\'initialisation de la base de données:', error);
    });

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

    // Validation et soumission du formulaire
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        try {
            // Validation du champ impact
            const impact = document.getElementById('impact').value;
            if (impact.length < 10) {
                alert('Veuillez décrire l\'impact en au moins 10 caractères.');
                return;
            }

            // Récupérer toutes les données du formulaire
            const formData = {
                lastName: document.getElementById('lastName').value,
                firstName: document.getElementById('firstName').value,
                email: document.getElementById('email').value,
                age: document.getElementById('age').value,
                gender: document.getElementById('gender').value,
                occupation: document.getElementById('occupation').value,
                alcohol: document.querySelector('input[name="alcohol"]:checked')?.value || '',
                alcoholFrequency: document.getElementById('alcohol-frequency').value,
                alcoholQuantity: document.getElementById('alcohol-quantity').value,
                drugs: document.querySelector('input[name="drugs"]:checked')?.value || '',
                drugTypes: Array.from(document.querySelectorAll('input[name="drug-type"]:checked')).map(cb => cb.value),
                otherDrugs: document.getElementById('other-drugs-text').value,
                contexts: Array.from(document.querySelectorAll('input[name="context"]:checked')).map(cb => cb.value),
                impact: impact,
                impactAreas: Array.from(document.querySelectorAll('input[name="impact-areas"]:checked')).map(cb => cb.value),
                helpSought: document.querySelector('input[name="help-sought"]:checked')?.value || '',
                helpTypes: Array.from(document.querySelectorAll('input[name="help-type"]:checked')).map(cb => cb.value),
                timestamp: new Date().toISOString()
            };

            // Sauvegarder les données
            await saveFormData(formData);

            // Afficher le message de succès avec le lien de consultation
            successMessage.innerHTML = `
                <p>Votre questionnaire a été enregistré avec succès !</p>
                <button class="secondary-button" onclick="window.location.href='consulter.html?email=${encodeURIComponent(formData.email)}'">
                    Consulter vos réponses
                </button>
            `;
            successMessage.style.display = 'block';

            // Réinitialiser le formulaire
            setTimeout(() => {
                form.reset();
                alcoholFrequencyGroup.style.display = 'none';
                alcoholQuantityGroup.style.display = 'none';
                drugsTypesGroup.style.display = 'none';
                otherDrugsGroup.style.display = 'none';
                helpTypeGroup.style.display = 'none';
                successMessage.style.display = 'none';
            }, 5000);

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Une erreur est survenue lors de la sauvegarde de vos réponses. Veuillez réessayer.');
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
