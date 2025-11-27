// --- DONNÉES ---
const defaultCategories = ['Pro', 'Perso', 'Santé', 'Business'];
let data = JSON.parse(localStorage.getItem('slimTaskV1')) || {
    tasks: [],
    categories: defaultCategories,
    theme: 'dark',
    language: 'fr'
};
let activeTab = 'Tout';
let openDetailId = null;
let selectedTasks = new Set();
let currentLanguage = data.language || 'fr';
let draggedTaskElement = null;
let draggedTaskId = null;
let googleAccessToken = null;
let googleUser = null;

// Fonction de traduction avec fallback - PRIORITÉ À LA LANGUE CHOISIE
function t(key) {
    // Priorité 1 : Utiliser la langue choisie par l'utilisateur
    if (fallbackTranslations[currentLanguage] && fallbackTranslations[currentLanguage][key]) {
        return fallbackTranslations[currentLanguage][key];
    }
    
    // Priorité 2 : Essayer chrome.i18n (mais seulement si la langue correspond)
    try {
        const msg = chrome.i18n.getMessage(key);
        if (msg) return msg;
    } catch(e) {
        console.warn('chrome.i18n not available');
    }
    
    // Priorité 3 : Fallback sur français
    return fallbackTranslations['fr']?.[key] || key;
}

// Traductions de secours si chrome.i18n ne fonctionne pas
const fallbackTranslations = {
    fr: {
        extensionName: 'SlimTask',
        allTasks: 'Tout',
        btnImport: 'Importer',
        btnExport: 'Exporter',
        btnNewTask: 'Nouvelle tâche',
        copySelection: 'Copier la sélection',
        labelTitle: 'Titre',
        labelCategory: 'Catégorie',
        labelPriority: 'Priorité',
        labelStatus: 'Statut',
        labelComment: 'Commentaire',
        labelStructure: 'Structure',
        structureTip: 'Cette tâche peut avoir des sous-tâches',
        moveToRootBtn: 'Déplacer à la racine',
        btnCancel: 'Annuler',
        btnDelete: 'Supprimer',
        btnSave: 'Enregistrer',
        btnConfirm: 'Confirmer',
        themeDark: 'Sombre',
        themeSpring: 'Printemps',
        themeSummer: 'Été',
        themeAutumn: 'Automne',
        themeWinter: 'Hiver',
        priorityNormal: 'Normal',
        priorityMedium: 'Moyen',
        priorityUrgent: 'Urgent',
        statusTodo: 'À faire',
        statusInprogress: 'En cours',
        statusWaiting: 'En attente',
        statusDone: 'Terminée',
        statusMonitor: 'À surveiller',
        taskNotesLabel: 'Notes',
        taskNotesNone: 'Aucune note',
        badgePriority: 'Priorité',
        taskDragTip: 'Glisser pour réorganiser',
        modalTitleCreate: 'Créer une tâche',
        modalTitleEdit: 'Modifier la tâche',
        placeholderAddNote: 'Ajouter une note...',
        placeholderNewCategory: 'Nouvelle catégorie',
        noRootTasks: 'Aucune tâche',
        alertParentChild: 'Impossible: cela créerait une boucle',
        alertTitleMissing: 'Le titre est obligatoire',
        confirmDeleteTitle: 'Confirmer la suppression',
        alertConfirmDelete: 'Voulez-vous vraiment supprimer cette tâche et toutes ses sous-tâches?',
        confirmDeleteCategoryTitle: 'Supprimer la catégorie',
        confirmDeleteCategoryMessage: 'Voulez-vous vraiment supprimer cette catégorie?',
        alertCopyError: 'Erreur lors de la copie: ',
        alertImportSuccess: 'Données importées avec succès!',
        alertInvalidFile: 'Fichier invalide',
        selectAllTip: 'Tout sélectionner',
        confirmDeleteSelected: 'Voulez-vous vraiment supprimer les tâches sélectionnées?',
        tooltipImport: 'Importer des données',
        tooltipExport: 'Exporter des données',
        tooltipNewTask: 'Créer une nouvelle tâche',
        tooltipDelete: 'Supprimer',
        tooltipEdit: 'Modifier',
        tooltipView: 'Voir les détails',
        googleSignIn: 'Se connecter',
        googleSignOut: 'Se déconnecter',
        googleSyncSuccess: 'Données synchronisées avec Google Drive!',
        googleSyncError: 'Erreur de synchronisation'
    },
    en: {
        extensionName: 'SlimTask',
        allTasks: 'All',
        btnImport: 'Import',
        btnExport: 'Export',
        btnNewTask: 'New Task',
        copySelection: 'Copy selection',
        labelTitle: 'Title',
        labelCategory: 'Category',
        labelPriority: 'Priority',
        labelStatus: 'Status',
        labelComment: 'Comment',
        labelStructure: 'Structure',
        structureTip: 'This task can have subtasks',
        moveToRootBtn: 'Move to root',
        btnCancel: 'Cancel',
        btnDelete: 'Delete',
        btnSave: 'Save',
        btnConfirm: 'Confirm',
        themeDark: 'Dark',
        themeSpring: 'Spring',
        themeSummer: 'Summer',
        themeAutumn: 'Autumn',
        themeWinter: 'Winter',
        priorityNormal: 'Normal',
        priorityMedium: 'Medium',
        priorityUrgent: 'Urgent',
        statusTodo: 'To do',
        statusInprogress: 'In progress',
        statusWaiting: 'Waiting',
        statusDone: 'Done',
        statusMonitor: 'Monitor',
        taskNotesLabel: 'Notes',
        taskNotesNone: 'No notes',
        badgePriority: 'Priority',
        taskDragTip: 'Drag to reorganize',
        modalTitleCreate: 'Create task',
        modalTitleEdit: 'Edit task',
        placeholderAddNote: 'Add a note...',
        placeholderNewCategory: 'New category',
        noRootTasks: 'No tasks',
        alertParentChild: 'Impossible: this would create a loop',
        alertTitleMissing: 'Title is required',
        confirmDeleteTitle: 'Confirm deletion',
        alertConfirmDelete: 'Do you really want to delete this task and all its subtasks?',
        confirmDeleteCategoryTitle: 'Delete category',
        confirmDeleteCategoryMessage: 'Do you really want to delete this category?',
        alertCopyError: 'Copy error: ',
        alertImportSuccess: 'Data imported successfully!',
        alertInvalidFile: 'Invalid file',
        selectAllTip: 'Select all',
        confirmDeleteSelected: 'Do you really want to delete the selected tasks?',
        tooltipImport: 'Import data',
        tooltipExport: 'Export data',
        tooltipNewTask: 'Create a new task',
        tooltipDelete: 'Delete',
        tooltipEdit: 'Edit',
        tooltipView: 'View details',
        googleSignIn: 'Sign in',
        googleSignOut: 'Sign out',
        googleSyncSuccess: 'Data synced with Google Drive!',
        googleSyncError: 'Sync error'
    },
    es: {
        extensionName: 'SlimTask',
        allTasks: 'Todas',
        btnImport: 'Importar',
        btnExport: 'Exportar',
        btnNewTask: 'Nueva tarea',
        copySelection: 'Copiar selección',
        labelTitle: 'Título',
        labelCategory: 'Categoría',
        labelPriority: 'Prioridad',
        labelStatus: 'Estado',
        labelComment: 'Comentario',
        labelStructure: 'Estructura',
        structureTip: 'Esta tarea puede tener subtareas',
        moveToRootBtn: 'Mover a raíz',
        btnCancel: 'Cancelar',
        btnDelete: 'Eliminar',
        btnSave: 'Guardar',
        btnConfirm: 'Confirmar',
        themeDark: 'Oscuro',
        themeSpring: 'Primavera',
        themeSummer: 'Verano',
        themeAutumn: 'Otoño',
        themeWinter: 'Invierno',
        priorityNormal: 'Normal',
        priorityMedium: 'Medio',
        priorityUrgent: 'Urgente',
        statusTodo: 'Por hacer',
        statusInprogress: 'En progreso',
        statusWaiting: 'Esperando',
        statusDone: 'Terminada',
        statusMonitor: 'Supervisar',
        taskNotesLabel: 'Notas',
        taskNotesNone: 'Sin notas',
        badgePriority: 'Prioridad',
        taskDragTip: 'Arrastra para reorganizar',
        modalTitleCreate: 'Crear tarea',
        modalTitleEdit: 'Editar tarea',
        placeholderAddNote: 'Añadir una nota...',
        placeholderNewCategory: 'Nueva categoría',
        noRootTasks: 'Sin tareas',
        alertParentChild: 'Imposible: esto crearía un bucle',
        alertTitleMissing: 'El título es obligatorio',
        confirmDeleteTitle: 'Confirmar eliminación',
        alertConfirmDelete: '¿Realmente desea eliminar esta tarea y todas sus subtareas?',
        confirmDeleteCategoryTitle: 'Eliminar categoría',
        confirmDeleteCategoryMessage: '¿Realmente desea eliminar esta categoría?',
        alertCopyError: 'Error al copiar: ',
        alertImportSuccess: '¡Datos importados correctamente!',
        alertInvalidFile: 'Archivo inválido',
        selectAllTip: 'Seleccionar todo',
        confirmDeleteSelected: '¿Realmente desea eliminar las tareas seleccionadas?',
        tooltipImport: 'Importar datos',
        tooltipExport: 'Exportar datos',
        tooltipNewTask: 'Crear una nueva tarea',
        tooltipDelete: 'Eliminar',
        tooltipEdit: 'Editar',
        tooltipView: 'Ver detalles',
        googleSignIn: 'Iniciar sesión',
        googleSignOut: 'Cerrar sesión',
        googleSyncSuccess: '¡Datos sincronizados con Google Drive!',
        googleSyncError: 'Error de sincronización'
    },
    de: {
        extensionName: 'SlimTask',
        allTasks: 'Alle',
        btnImport: 'Importieren',
        btnExport: 'Exportieren',
        btnNewTask: 'Neue Aufgabe',
        copySelection: 'Auswahl kopieren',
        labelTitle: 'Titel',
        labelCategory: 'Kategorie',
        labelPriority: 'Priorität',
        labelStatus: 'Status',
        labelComment: 'Kommentar',
        labelStructure: 'Struktur',
        structureTip: 'Diese Aufgabe kann Unteraufgaben haben',
        moveToRootBtn: 'Zur Wurzel verschieben',
        btnCancel: 'Abbrechen',
        btnDelete: 'Löschen',
        btnSave: 'Speichern',
        btnConfirm: 'Bestätigen',
        themeDark: 'Dunkel',
        themeSpring: 'Frühling',
        themeSummer: 'Sommer',
        themeAutumn: 'Herbst',
        themeWinter: 'Winter',
        priorityNormal: 'Normal',
        priorityMedium: 'Mittel',
        priorityUrgent: 'Dringend',
        statusTodo: 'Zu erledigen',
        statusInprogress: 'In Bearbeitung',
        statusWaiting: 'Wartend',
        statusDone: 'Erledigt',
        statusMonitor: 'Überwachen',
        taskNotesLabel: 'Notizen',
        taskNotesNone: 'Keine Notizen',
        badgePriority: 'Priorität',
        taskDragTip: 'Ziehen zum Neuorganisieren',
        modalTitleCreate: 'Aufgabe erstellen',
        modalTitleEdit: 'Aufgabe bearbeiten',
        placeholderAddNote: 'Notiz hinzufügen...',
        placeholderNewCategory: 'Neue Kategorie',
        noRootTasks: 'Keine Aufgaben',
        alertParentChild: 'Unmöglich: dies würde eine Schleife erstellen',
        alertTitleMissing: 'Titel ist erforderlich',
        confirmDeleteTitle: 'Löschen bestätigen',
        alertConfirmDelete: 'Möchten Sie diese Aufgabe und alle Unteraufgaben wirklich löschen?',
        confirmDeleteCategoryTitle: 'Kategorie löschen',
        confirmDeleteCategoryMessage: 'Möchten Sie diese Kategorie wirklich löschen?',
        alertCopyError: 'Kopierfehler: ',
        alertImportSuccess: 'Daten erfolgreich importiert!',
        alertInvalidFile: 'Ungültige Datei',
        selectAllTip: 'Alles auswählen',
        confirmDeleteSelected: 'Möchten Sie die ausgewählten Aufgaben wirklich löschen?',
        tooltipImport: 'Daten importieren',
        tooltipExport: 'Daten exportieren',
        tooltipNewTask: 'Neue Aufgabe erstellen',
        tooltipDelete: 'Löschen',
        tooltipEdit: 'Bearbeiten',
        tooltipView: 'Details anzeigen',
        googleSignIn: 'Anmelden',
        googleSignOut: 'Abmelden',
        googleSyncSuccess: 'Daten mit Google Drive synchronisiert!',
        googleSyncError: 'Synchronisierungsfehler'
    }
};
// Données du changelog
const changelogData = {
    fr: {
        title: 'Historique des versions',
        versions: [
            {
                version: '1.0.1',
                date: '27 novembre 2025',
                changes: [
                    'Croix de suppression repositionnée en haut à droite des catégories et tâches',
                    'Ajout de la fonction "Tout sélectionner" par catégorie (clic sur l\'icône)',
                    'Support de la touche Suppr pour supprimer les tâches sélectionnées',
                    'Amélioration de l\'alignement des boutons dans le header',
                    'Traduction complète de l\'interface lors du changement de langue',
                    'Ajout du système de changelog avec affichage modal',
                    'Catégorie par défaut basée sur l\'onglet actif',
                    'Drag & drop amélioré avec visualisation de destination',
                    'Déparentage instantané en sortant du conteneur vers la gauche',
                    'Groupement des tâches par statut',
                    'Synchronisation avec Google Drive',
                    'Tooltips traduits dans toutes les langues'
                ]
            },
            {
                version: '1.0.0',
                date: '27 novembre 2025',
                changes: [
                    'Version initiale de SlimTask',
                    'Gestion des tâches avec hiérarchie (parent/enfant)',
                    'Catégories personnalisables',
                    '5 statuts : À faire, En cours, En attente, Terminée, À surveiller',
                    '3 niveaux de priorité : Normal, Moyen, Urgent',
                    'Notes avec horodatage sur chaque tâche',
                    'Drag & drop pour réorganiser les tâches',
                    'Thèmes saisonniers et décorations d\'événements',
                    'Export/Import des données',
                    'Support multilingue (FR, EN, ES, DE)',
                    'Sélection multiple et copie de tâches'
                ]
            }
        ]
    },
    en: {
        title: 'Version History',
        versions: [
            {
                version: '1.0.1',
                date: 'November 27, 2025',
                changes: [
                    'Delete cross repositioned to top right of categories and tasks',
                    'Added "Select All" function per category (click on icon)',
                    'Delete key support to remove selected tasks',
                    'Improved header buttons alignment',
                    'Complete interface translation when changing language',
                    'Added changelog system with modal display',
                    'Default category based on active tab',
                    'Improved drag & drop with destination preview',
                    'Instant unparenting when leaving container to the left',
                    'Tasks grouped by status',
                    'Google Drive synchronization',
                    'Translated tooltips in all languages'
                ]
            },
            {
                version: '1.0.0',
                date: 'November 27, 2025',
                changes: [
                    'Initial version of SlimTask',
                    'Task management with hierarchy (parent/child)',
                    'Customizable categories',
                    '5 statuses: To do, In progress, Waiting, Done, Monitor',
                    '3 priority levels: Normal, Medium, Urgent',
                    'Timestamped notes on each task',
                    'Drag & drop to reorganize tasks',
                    'Seasonal themes and event decorations',
                    'Data export/import',
                    'Multilingual support (FR, EN, ES, DE)',
                    'Multiple selection and task copy'
                ]
            }
        ]
    },
    es: {
        title: 'Historial de versiones',
        versions: [
            {
                version: '1.0.1',
                date: '27 de noviembre de 2025',
                changes: [
                    'Cruz de eliminación reposicionada en la parte superior derecha de categorías y tareas',
                    'Función "Seleccionar todo" agregada por categoría (clic en el icono)',
                    'Soporte de tecla Supr para eliminar tareas seleccionadas',
                    'Mejora de la alineación de botones en el encabezado',
                    'Traducción completa de la interfaz al cambiar de idioma',
                    'Sistema de registro de cambios agregado con visualización modal',
                    'Categoría predeterminada basada en la pestaña activa',
                    'Arrastrar y soltar mejorado con vista previa del destino',
                    'Desvinculación instantánea al salir del contenedor hacia la izquierda',
                    'Tareas agrupadas por estado',
                    'Sincronización con Google Drive',
                    'Tooltips traducidos en todos los idiomas'
                ]
            },
            {
                version: '1.0.0',
                date: '27 de noviembre de 2025',
                changes: [
                    'Versión inicial de SlimTask',
                    'Gestión de tareas con jerarquía (padre/hijo)',
                    'Categorías personalizables',
                    '5 estados: Por hacer, En progreso, Esperando, Terminada, Supervisar',
                    '3 niveles de prioridad: Normal, Media, Urgente',
                    'Notas con marca de tiempo en cada tarea',
                    'Arrastrar y soltar para reorganizar tareas',
                    'Temas estacionales y decoraciones de eventos',
                    'Exportar/Importar datos',
                    'Soporte multilingüe (FR, EN, ES, DE)',
                    'Selección múltiple y copia de tareas'
                ]
            }
        ]
    },
    de: {
        title: 'Versionshistorie',
        versions: [
            {
                version: '1.0.1',
                date: '27. November 2025',
                changes: [
                    'Löschen-Kreuz oben rechts bei Kategorien und Aufgaben neu positioniert',
                    '"Alles auswählen"-Funktion pro Kategorie hinzugefügt (Klick auf Symbol)',
                    'Entf-Taste unterstützt zum Löschen ausgewählter Aufgaben',
                    'Verbesserte Ausrichtung der Header-Schaltflächen',
                    'Vollständige Oberflächenübersetzung beim Sprachwechsel',
                    'Changelog-System mit modaler Anzeige hinzugefügt',
                    'Standardkategorie basierend auf aktivem Tab',
                    'Verbessertes Drag & Drop mit Zielvorschau',
                    'Sofortige Trennung beim Verlassen des Containers nach links',
                    'Aufgaben nach Status gruppiert',
                    'Google Drive-Synchronisierung',
                    'Übersetzte Tooltips in allen Sprachen'
                ]
            },
            {
                version: '1.0.0',
                date: '27. November 2025',
                changes: [
                    'Erste Version von SlimTask',
                    'Aufgabenverwaltung mit Hierarchie (Eltern/Kind)',
                    'Anpassbare Kategorien',
                    '5 Status: Zu erledigen, In Bearbeitung, Wartend, Erledigt, Überwachen',
                    '3 Prioritätsstufen: Normal, Mittel, Dringend',
                    'Zeitgestempelte Notizen bei jeder Aufgabe',
                    'Drag & Drop zum Neuorganisieren von Aufgaben',
                    'Saisonale Themen und Event-Dekorationen',
                    'Datenexport/-import',
                    'Mehrsprachige Unterstützung (FR, EN, ES, DE)',
                    'Mehrfachauswahl und Aufgabenkopie'
                ]
            }
        ]
    }
};

// DÉFINITION INITIALE
let statusLabels = { 
    'inprogress': 'En cours', 
    'waiting': 'En attente', 
    'todo': 'À faire', 
    'done': 'Terminée',
    'monitor': 'À surveiller'
};

const priorityColors = {
    'normal': 'var(--priority-normal)',
    'medium': 'var(--priority-medium)',
    'urgent': 'var(--priority-urgent)'
};

// Mois traduits
const monthNames = {
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
};

// Formater date/heure pour les notes
function formatNoteDate(date) {
    const day = date.getDate();
    const month = monthNames[currentLanguage][date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    if (currentLanguage === 'en') {
        return `on ${month} ${day}, ${year} at ${hours}:${minutes}`;
    } else if (currentLanguage === 'de') {
        return `am ${day}. ${month} ${year} um ${hours}:${minutes} Uhr`;
    } else if (currentLanguage === 'es') {
        return `el ${day} de ${month} de ${year} a las ${hours}:${minutes}`;
    } else {
        return `le ${day} ${month} ${year} à ${hours}h${minutes}`;
    }
}

// --- GOOGLE DRIVE SYNC ---
function initGoogleSignIn() {
    const btn = document.getElementById('btnGoogleSignIn');
    updateGoogleButtonText();
    
    btn.addEventListener('click', () => {
        if (googleUser) {
            googleSignOut();
        } else {
            googleSignIn();
        }
    });
}

function googleSignIn() {
    // Pour une vraie implémentation, utilisez Google Identity Services
    // Ici, on simule juste l'interface
    const CLIENT_ID = 'VOTRE_CLIENT_ID.apps.googleusercontent.com';
    
    // Simulation pour l'exemple
    alert('Pour activer la synchronisation Google Drive:\n1. Créez un projet dans Google Cloud Console\n2. Activez Google Drive API\n3. Ajoutez votre CLIENT_ID dans le code');
    
    // Code réel à utiliser avec Google Identity Services:
    /*
    google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
            googleAccessToken = response.access_token;
            googleUser = { name: 'User' };
            updateGoogleButtonText();
            syncToGoogleDrive();
        }
    }).requestAccessToken();
    */
}

function googleSignOut() {
    googleAccessToken = null;
    googleUser = null;
    updateGoogleButtonText();
}

function updateGoogleButtonText() {
    const btn = document.getElementById('googleSignInText');
    if (googleUser) {
        btn.textContent = t('googleSignOut');
    } else {
        btn.textContent = t('googleSignIn');
    }
}

async function syncToGoogleDrive() {
    if (!googleAccessToken) return;
    
    try {
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        // Créer ou mettre à jour le fichier sur Google Drive
        const metadata = {
            name: 'slimtask_data.json',
            mimeType: 'application/json'
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${googleAccessToken}`
            },
            body: form
        });
        
        if (response.ok) {
            alert(t('googleSyncSuccess'));
        } else {
            throw new Error('Sync failed');
        }
    } catch (err) {
        console.error('Google Drive sync error:', err);
        alert(t('googleSyncError'));
    }
}

// Fonction pour afficher le changelog
function showChangelog() {
    const content = changelogData[currentLanguage] || changelogData.fr;
    
    document.getElementById('changelogTitle').textContent = content.title;
    
    let html = '';
    content.versions.forEach(v => {
        html += `
            <div class="changelog-version">
                <h3>Version ${v.version}</h3>
                <div class="changelog-date">${v.date}</div>
                <ul>
                    ${v.changes.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
        `;
    });
    
    document.getElementById('changelogContent').innerHTML = html;
    document.getElementById('changelogModal').classList.add('show');
}

function closeChangelog() {
    document.getElementById('changelogModal').classList.remove('show');
}

// --- INTERNATIONALISATION (i18n) ---
function applyStaticTranslations() {
    // Sauvegarder la valeur actuelle du thème avant de recréer les options
    const currentTheme = document.getElementById('themeSelector').value;
    
    // Correction : utiliser extNameTitle au lieu de extName
    document.getElementById('extNameTitle').textContent = t('extensionName');
    
    // Mise à jour des tooltips des boutons
    document.getElementById('btnImport').title = t('tooltipImport');
    document.getElementById('btnExport').title = t('tooltipExport');
    document.getElementById('btnNewTask').title = t('tooltipNewTask');
    document.getElementById('btnNewTaskText').textContent = t('btnNewTask');
    document.getElementById('copyButtonText').textContent = t('copySelection');
    
    // Bouton Google
    updateGoogleButtonText();

    document.getElementById('labelTitle').textContent = t('labelTitle');
    document.getElementById('labelCategory').textContent = t('labelCategory');
    document.getElementById('labelPriority').textContent = t('labelPriority');
    document.getElementById('labelStatus').textContent = t('labelStatus');
    document.getElementById('labelComment').textContent = t('labelComment');
    document.getElementById('labelStructure').textContent = t('labelStructure');
    document.getElementById('structureTip').textContent = t('structureTip');
    document.getElementById('moveToRootBtn').textContent = t('moveToRootBtn');
    document.getElementById('btnCancel').textContent = t('btnCancel');
    document.getElementById('btnDelete').textContent = t('btnDelete');
    document.getElementById('btnSave').textContent = t('btnSave');
    
    document.getElementById('taskTitle').placeholder = t('labelTitle');
    
    document.getElementById('themeSelector').innerHTML = `
        <option value="dark">${t('themeDark')}</option>
        <option value="spring">${t('themeSpring')}</option>
        <option value="summer">${t('themeSummer')}</option>
        <option value="autumn">${t('themeAutumn')}</option>
        <option value="winter">${t('themeWinter')}</option>
    `;
    
    // Restaurer la valeur du thème
    document.getElementById('themeSelector').value = currentTheme;
    
    document.getElementById('taskPriority').innerHTML = `
        <option value="normal">${t('priorityNormal')}</option>
        <option value="medium">${t('priorityMedium')}</option>
        <option value="urgent">${t('priorityUrgent')}</option>
    `;

    document.getElementById('taskStatus').innerHTML = `
        <option value="todo">${t('statusTodo')}</option>
        <option value="inprogress">${t('statusInprogress')}</option>
        <option value="waiting">${t('statusWaiting')}</option>
        <option value="done">${t('statusDone')}</option>
        <option value="monitor">${t('statusMonitor')}</option>
    `;
    
    // IMPORTANT : Mettre à jour statusLabels pour que les tâches utilisent les bonnes traductions
    statusLabels = { 
        'todo': t('statusTodo'), 
        'inprogress': t('statusInprogress'), 
        'waiting': t('statusWaiting'), 
        'done': t('statusDone'),
        'monitor': t('statusMonitor')
    };
    
    // Réattacher l'event listener du changelog après mise à jour du DOM
    const changelogLink = document.getElementById('changelogLink');
    if (changelogLink) {
        changelogLink.addEventListener('click', (e) => {
            e.preventDefault();
            showChangelog();
        });
    }
}

function init() { 
    applyStaticTranslations();
    data.tasks.forEach(task => { if(task.parentId === undefined) task.parentId = null; });
    
    // Détecter la langue du navigateur si pas définie
    if (!data.language) {
        try {
            const browserLang = chrome.i18n.getUILanguage().split('-')[0];
            data.language = ['fr', 'en', 'es', 'de'].includes(browserLang) ? browserLang : 'fr';
        } catch(e) {
            data.language = 'fr';
        }
        currentLanguage = data.language;
    }
    
    // Si activeTab n'est pas défini ou n'existe plus, utiliser "Tout"
    if (!activeTab || (activeTab !== t('allTasks') && !data.categories.includes(activeTab))) {
        activeTab = t('allTasks');
    }
    
    document.getElementById('languageSelector').value = currentLanguage;
    document.getElementById('themeSelector').value = data.theme || 'dark';
    
    applyTheme();
    initGoogleSignIn();
    renderTabs(); 
    renderTasks(); 
    updateCopyButton();
}

function saveToLocal() { 
    localStorage.setItem('slimTaskV1', JSON.stringify(data)); 
    renderTabs();
    renderTasks(); 
    updateCopyButton();
    
    // Auto-sync si connecté à Google
    if (googleAccessToken) {
        syncToGoogleDrive();
    }
}

// --- LANGUE ---
function changeLanguage() {
    const lang = document.getElementById('languageSelector').value;
    currentLanguage = lang;
    data.language = lang;
    localStorage.setItem('slimTaskV1', JSON.stringify(data));
    
    // Sauvegarder l'onglet actif actuel
    const previousTab = activeTab;
    
    // Réappliquer les traductions sans recharger
    applyStaticTranslations();
    
    // Si l'onglet actif était "Tout", le mettre à jour avec la nouvelle traduction
    if (previousTab === 'Tout' || previousTab === 'All' || previousTab === 'Todas' || previousTab === 'Alle') {
        activeTab = t('allTasks');
    }
    
    // Re-render des onglets et des tâches pour appliquer les nouvelles traductions
    renderTabs();
    renderTasks();
}

// --- THÈME ---
function changeTheme() {
    const theme = document.getElementById('themeSelector').value;
    data.theme = theme;
    localStorage.setItem('slimTaskV1', JSON.stringify(data));
    applyTheme();
}

function applyTheme() {
    const theme = data.theme || 'dark';
    document.getElementById('themeSelector').value = theme;
    
    document.body.className = '';
    if (theme !== 'dark') {
        document.body.classList.add(`theme-${theme}`);
    }
    
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    if (month === 12 && day >= 15) {
        document.body.classList.add('event-christmas');
    }
    else if ((month === 10 && day >= 20) || (month === 11 && day <= 2)) {
        document.body.classList.add('event-halloween');
    }
    else if (month === 4 && day <= 20) {
        document.body.classList.add('event-easter');
    }
}

// --- DRAG & DROP AMÉLIORÉ ---
function shouldUnparent(e, taskElement) {
    if (!taskElement) return false;
    
    const taskCard = taskElement.querySelector('.task-card');
    if (!taskCard) return false;
    
    // Vérifier si la tâche a un parent
    const taskId = parseInt(taskElement.dataset.taskId);
    const task = data.tasks.find(t => t.id === taskId);
    if (!task || task.parentId === null) return false;
    
    const rect = taskCard.getBoundingClientRect();
    const mouseX = e.clientX;
    
    // Si la souris est à gauche du bord gauche de la carte (avec une marge de 50px)
    return mouseX < (rect.left - 20);
}

function updateDragVisual(e) {
    if (!draggedTaskElement) return;
    
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => card.classList.remove('will-unparent'));
    
    if (shouldUnparent(e, draggedTaskElement)) {
        const taskCard = draggedTaskElement.querySelector('.task-card');
        if (taskCard) {
            taskCard.classList.add('will-unparent');
        }
    }
}

document.addEventListener('drag', (e) => {
    if (draggedTaskElement && e.clientX !== 0) {
        updateDragVisual(e);
    }
});

document.addEventListener('dragend', (e) => {
    if (!draggedTaskElement) return;
    
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => card.classList.remove('will-unparent'));
    
    // Si on termine le drag et qu'on doit déparenter
    if (shouldUnparent(e, draggedTaskElement)) {
        const taskId = parseInt(draggedTaskElement.dataset.taskId);
        handleDropToRoot(taskId);
    }
    
    draggedTaskElement = null;
    draggedTaskId = null;
});

// --- ONGLETS ---
function renderTabs() {
    const container = document.getElementById('tabsContainer');
    container.innerHTML = '';

    const createTab = (name, isRemovable) => {
        const tasksInCat = data.tasks.filter(task => name === t('allTasks') || task.category === name);
        const total = tasksInCat.length;
        const done = tasksInCat.filter(task => task.status === 'done').length;
        const remaining = total - done;
        const percent = total === 0 ? 0 : (done / total) * 100;

        const div = document.createElement('div');
        div.className = `tab ${activeTab === name ? 'active' : ''}`;
        
        const colorBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#2d2d2d';
        const colorProg = 'rgba(16, 185, 129, 0.15)';
        div.style.background = `linear-gradient(to right, ${colorProg} ${percent}%, ${colorBg} ${percent}%)`;

        div.innerHTML = `
            <span class="tab-name">${name}</span>
            ${remaining > 0 ? `<span class="tab-badge">${remaining}</span>` : ''}
            <span class="tab-select-all" title="${t('selectAllTip')}" data-category="${name}"><i class="fas fa-check-double"></i></span>
            ${isRemovable ? `<span class="tab-delete" title="${t('tooltipDelete')}"><i class="fas fa-times"></i></span>` : ''}
        `;
        
        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-input') && !e.target.closest('.tab-delete') && !e.target.closest('.tab-select-all')) {
                switchTab(name);
            }
        });

        // Bouton tout sélectionner
        const selectAllBtn = div.querySelector('.tab-select-all');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectAllInCategory(name);
            });
        }

        if(isRemovable) {
            const deleteBtn = div.querySelector('.tab-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTab(name);
                });
            }
            
            div.addEventListener('dblclick', (e) => {
                if (!e.target.classList.contains('tab-input') && !e.target.closest('.tab-delete') && !e.target.closest('.tab-select-all')) {
                    startEditTab(div, name);
                }
            });
        }
        
        return div;
    };

    const allTasksLabel = t('allTasks');
    container.appendChild(createTab(allTasksLabel, false));
    data.categories.forEach(cat => container.appendChild(createTab(cat, true)));
    
    const addBtn = document.createElement('div');
    addBtn.className = 'add-tab-btn';
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addNewTab();
    });
    container.appendChild(addBtn);
    
    document.getElementById('taskCategory').innerHTML = data.categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

// Sélectionner toutes les tâches d'une catégorie
function selectAllInCategory(categoryName) {
    const tasksInCat = data.tasks.filter(task => categoryName === t('allTasks') || task.category === categoryName);
    
    // Si toutes sont déjà sélectionnées, on désélectionne tout
    const allSelected = tasksInCat.every(task => selectedTasks.has(task.id));
    
    if (allSelected) {
        tasksInCat.forEach(task => selectedTasks.delete(task.id));
    } else {
        tasksInCat.forEach(task => selectedTasks.add(task.id));
    }
    
    renderTasks();
    updateCopyButton();
}

function startEditTab(tabDiv, oldName) {
    const nameSpan = tabDiv.querySelector('.tab-name');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldName;
    input.className = 'tab-input';
    
    nameSpan.replaceWith(input);
    input.focus();
    input.select();

    const finishEdit = () => {
        const newName = input.value.trim();
        if (newName && newName !== oldName && !data.categories.includes(newName)) {
            const index = data.categories.indexOf(oldName);
            if (index !== -1) data.categories[index] = newName;
            data.tasks.forEach(task => { if(task.category === oldName) task.category = newName; });
            if (activeTab === oldName) activeTab = newName;
            saveToLocal();
        } else {
            renderTabs();
        }
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finishEdit();
        } else if (e.key === 'Escape') {
            renderTabs();
        }
    });
}

function switchTab(tabName) { 
    activeTab = tabName; 
    renderTabs(); 
    renderTasks(); 
}

function addNewTab() {
    const container = document.getElementById('tabsContainer');
    const addBtn = container.querySelector('.add-tab-btn');
    
    if (container.querySelector('.new-tab-input-wrapper')) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'new-tab-input-wrapper';
    wrapper.innerHTML = `<input type="text" placeholder="${t('placeholderNewCategory')}" id="newTabInput" maxlength="20">`;
    
    container.insertBefore(wrapper, addBtn);
    
    const input = document.getElementById('newTabInput');
    input.focus();
    
    const confirmTab = () => {
        const name = input.value.trim();
        if (name !== '' && !data.categories.includes(name)) { 
            data.categories.push(name); 
            saveToLocal();
        }
        wrapper.remove();
    };
    
    const cancelTab = () => {
        wrapper.remove();
    };
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            confirmTab();
        } else if (e.key === 'Escape') {
            cancelTab();
        }
    });
    
    input.addEventListener('blur', () => {
        setTimeout(confirmTab, 200);
    });
}

function deleteTab(catName) {
    showConfirmDialog(
        t('confirmDeleteCategoryTitle'),
        t('confirmDeleteCategoryMessage'),
        () => {
            data.categories = data.categories.filter(c => c !== catName);
            if (activeTab === catName) activeTab = t('allTasks');
            saveToLocal();
        }
    );
}

// --- RENDU RÉCURSIF AVEC GROUPES PAR STATUT ---
function renderTasks() {
    const list = document.getElementById('taskList');
    list.innerHTML = '';
    
    let rootTasks = data.tasks.filter(task => task.parentId === null);
    if(activeTab !== t('allTasks')) {
        rootTasks = rootTasks.filter(task => task.category === activeTab);
    }

    if (rootTasks.length === 0) { 
        list.innerHTML = `<div style="text-align:center; color:#555; margin-top:40px;">${t('noRootTasks')}</div>`; 
        return; 
    }

    // Grouper par statut
    const statusOrder = ['inprogress', 'monitor', 'waiting', 'todo', 'done'];
    const groupedTasks = {};
    
    statusOrder.forEach(status => {
        groupedTasks[status] = rootTasks.filter(task => task.status === status);
    });

    // Afficher chaque groupe
    statusOrder.forEach(status => {
        const tasksInGroup = groupedTasks[status];
        if (tasksInGroup.length === 0) return;
        
        // Créer le groupe
        const groupDiv = document.createElement('div');
        groupDiv.className = 'status-group';
        
        // Header du groupe
        const headerDiv = document.createElement('div');
        headerDiv.className = 'status-group-header';
        headerDiv.innerHTML = `
            <span>${statusLabels[status]}</span>
            <span class="status-group-badge">${tasksInGroup.length}</span>
        `;
        groupDiv.appendChild(headerDiv);
        
        // Tâches du groupe
        const tasksDiv = document.createElement('div');
        tasksDiv.className = 'status-group-tasks';
        
        tasksInGroup.forEach(task => {
            tasksDiv.appendChild(createTaskElement(task));
        });
        
        groupDiv.appendChild(tasksDiv);
        list.appendChild(groupDiv);
    });
}

function createTaskElement(task) {
    const wrapper = document.createElement('div');
    wrapper.dataset.taskId = task.id;
    
    wrapper.draggable = true;
    wrapper.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        draggedTaskId = task.id;
        draggedTaskElement = wrapper;
        e.stopPropagation();
    };
    
    wrapper.ondrag = (e) => {
        if (e.clientX !== 0) {
            updateDragVisual(e);
        }
    };
    
    wrapper.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.stopPropagation();
        const card = wrapper.querySelector('.task-card');
        if (!shouldUnparent(e, wrapper)) {
            card.classList.add('drag-over');
        }
    };
    
    wrapper.ondragleave = (e) => {
        e.stopPropagation();
        const card = wrapper.querySelector('.task-card');
        card.classList.remove('drag-over');
    };
    
    wrapper.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = wrapper.querySelector('.task-card');
        card.classList.remove('drag-over');
        card.classList.remove('will-unparent');
        
        const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
        
        // Ne pas déparenter sur drop, seulement faire parent/child
        handleDrop(draggedId, task.id);
        
        draggedTaskElement = null;
        draggedTaskId = null;
    };

    const priorityColor = priorityColors[task.priority] || priorityColors.normal;
    const borderLeft = `4px solid ${priorityColor}`;
    
    const isDone = task.status === 'done';
    const isSelected = selectedTasks.has(task.id);
    
    const notesLabel = t('taskNotesLabel');
    const notesNone = t('taskNotesNone');
    const priorityBadgeLabel = t('badgePriority');
    const dragTip = t('taskDragTip');
    const translatedPriority = t(`priority${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`);
    
    // Formater les notes avec date/heure
    let notesHTML = '';
    if (task.comments && task.comments.length) {
        notesHTML = task.comments.map((note, index) => {
            if (typeof note === 'object' && note.text && note.date) {
                const noteDate = new Date(note.date);
                return `<div class="note-item">
                    <i style="color:#aaa"><span class="note-date">${formatNoteDate(noteDate)}:</span> ${note.text}</i>
                    <span class="note-delete" data-task-id="${task.id}" data-note-index="${index}" title="${t('tooltipDelete')}"><i class="fas fa-times"></i></span>
                </div>`;
            } else {
                return `<div class="note-item">
                    <i style="color:#aaa">${note}</i>
                    <span class="note-delete" data-task-id="${task.id}" data-note-index="${index}" title="${t('tooltipDelete')}"><i class="fas fa-times"></i></span>
                </div>`;
            }
        }).join('');
    } else {
        notesHTML = `<i style="color:#aaa">${notesNone}</i>`;
    }
    
    wrapper.innerHTML = `
        <div class="task-card ${isSelected ? 'selected' : ''}" style="border-left:${borderLeft}; opacity:${isDone?0.6:1}">
            <span class="task-delete" data-task-id="${task.id}" title="${t('tooltipDelete')}"><i class="fas fa-times"></i></span>
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" ${isSelected ? 'checked' : ''} data-task-id="${task.id}">
                <span class="drag-handle" title="${dragTip}"><i class="fas fa-grip-vertical"></i></span>
                <div style="flex:1">
                    <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                        <span class="badge-status bs-${task.status}">${statusLabels[task.status]}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted)">${task.category}</span>
                    </div>
                    <div class="task-title ${isDone ? 'task-done-title' : ''}">${task.title}</div>
                </div>
                <div style="display:flex; gap:5px;">
                    <button class="action-btn btn-details" data-task-id="${task.id}" title="${t('tooltipView')}"><i class="fas fa-eye"></i></button>
                    <button class="action-btn btn-edit" data-task-id="${task.id}" title="${t('tooltipEdit')}"><i class="fas fa-edit"></i></button>
                </div>
            </div>

            <div id="details-${task.id}" class="task-details" style="display:${openDetailId === task.id ? 'block' : 'none'}">
                <div style="font-size:0.9rem; margin-bottom:10px;">
                    <strong>${priorityBadgeLabel}:</strong> ${translatedPriority} <br>
                    <strong>${notesLabel}:</strong> <br>
                    ${notesHTML}
                </div>
                <div style="display:flex; gap:5px;">
                    <input type="text" id="note-${task.id}" placeholder="${t('placeholderAddNote')}" style="margin:0; font-size:0.8rem;" class="note-input" data-task-id="${task.id}">
                    <button class="btn btn-sm btn-primary btn-add-note" data-task-id="${task.id}">OK</button>
                </div>
            </div>
        </div>
    `;

    const children = data.tasks.filter(childTask => childTask.parentId === task.id);
    
    if (children.length > 0) {
        const container = document.createElement('div');
        container.className = 'children-container';
        
        const sortOrder = { 'inprogress': 1, 'monitor': 2, 'waiting': 3, 'todo': 4, 'done': 5 };
        children.sort((a, b) => sortOrder[a.status] - sortOrder[b.status]);

        children.forEach(child => {
            container.appendChild(createTaskElement(child));
        });
        wrapper.appendChild(container);
    }

    // Event listeners
    wrapper.querySelector('.task-checkbox').addEventListener('change', function() {
        toggleTaskSelection(task.id, this.checked);
    });

    wrapper.querySelector('.btn-details').addEventListener('click', () => {
        toggleDetails(task.id);
    });

    wrapper.querySelector('.btn-edit').addEventListener('click', () => {
        openModal('edit', task.id);
    });
    
    const taskDeleteBtn = wrapper.querySelector('.task-delete');
    if (taskDeleteBtn) {
        taskDeleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTaskDirectly(task.id);
        });
    }

    const noteInput = wrapper.querySelector('.note-input');
    if (noteInput) {
        noteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addNote(task.id);
        });
    }

    const addNoteBtn = wrapper.querySelector('.btn-add-note');
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => addNote(task.id));
    }

    wrapper.querySelectorAll('.note-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = parseInt(this.dataset.taskId);
            const noteIndex = parseInt(this.dataset.noteIndex);
            deleteNote(taskId, noteIndex);
        });
    });

    return wrapper;
}

// --- DRAG & DROP ---
function handleDrop(draggedId, targetParentId) {
    if (draggedId === targetParentId) return;
    
    if (isChildOf(targetParentId, draggedId)) {
        alert(t('alertParentChild'));
        return;
    }

    const task = data.tasks.find(item => item.id === draggedId);
    if (task) {
        task.parentId = targetParentId;
        saveToLocal();
    }
}

function handleDropToRoot(draggedId) {
    const task = data.tasks.find(item => item.id === draggedId);
    if (task && task.parentId !== null) {
        task.parentId = null;
        saveToLocal();
    }
}

function isChildOf(potentialChildId, potentialParentId) {
    const task = data.tasks.find(item => item.id === potentialChildId);
    if (!task || task.parentId === null) return false;
    if (task.parentId === potentialParentId) return true;
    return isChildOf(task.parentId, potentialParentId);
}

function moveToRoot() {
    const id = document.getElementById('taskId').value;
    if(id) {
        const task = data.tasks.find(x => x.id == id);
        task.parentId = null;
        saveToLocal();
        closeModal();
    }
}

// --- MODAL & TASKS ---
function generateId() {
    return data.tasks.length > 0 ? Math.max(...data.tasks.map(item => item.id)) + 1 : 1;
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('show');
}

function openModal(mode, id = null) {
    const modalTitle = document.getElementById('modalTitle');
    const btnDelete = document.getElementById('btnDelete');
    const taskIdInput = document.getElementById('taskId');
    const taskTitleInput = document.getElementById('taskTitle');
    const taskCategorySelect = document.getElementById('taskCategory');
    const taskPrioritySelect = document.getElementById('taskPriority');
    const taskStatusSelect = document.getElementById('taskStatus');
    const taskCommentTextarea = document.getElementById('taskComment');

    if (mode === 'create') {
        modalTitle.textContent = t('modalTitleCreate');
        btnDelete.style.display = 'none';
        taskIdInput.value = '';
        taskTitleInput.value = '';
        
        // Sélectionner la catégorie active si ce n'est pas "Tout"
        const allTasksLabel = t('allTasks');
        if (activeTab !== allTasksLabel && data.categories.includes(activeTab)) {
            taskCategorySelect.value = activeTab;
        } else {
            taskCategorySelect.value = data.categories[0] || '';
        }
        
        taskPrioritySelect.value = 'normal';
        taskStatusSelect.value = 'todo';
        taskCommentTextarea.value = '';
    } else if (mode === 'edit' && id !== null) {
        const task = data.tasks.find(item => item.id === id);
        if (!task) return;

        modalTitle.textContent = t('modalTitleEdit');
        btnDelete.style.display = 'inline-block';
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskCategorySelect.value = task.category;
        taskPrioritySelect.value = task.priority;
        taskStatusSelect.value = task.status;
        taskCommentTextarea.value = task.comment || '';
    }

    document.getElementById('taskModal').classList.add('show');
}

function saveTask() {
    const id = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const category = document.getElementById('taskCategory').value;
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const comment = document.getElementById('taskComment').value.trim();

    if (!title) {
        alert(t('alertTitleMissing'));
        return;
    }

    if (id) {
        const task = data.tasks.find(item => item.id == id);
        if (task) {
            task.title = title;
            task.category = category;
            task.priority = priority;
            task.status = status;
        }
    } else {
        const newTask = {
            id: generateId(),
            title,
            category,
            priority,
            status,
            parentId: null,
            comments: comment ? [{text: comment, date: new Date().toISOString()}] : [],
            isDone: status === 'done' 
        };
        data.tasks.push(newTask);
    }

    saveToLocal();
    closeModal();
}

function deleteTask() {
    const id = parseInt(document.getElementById('taskId').value);
    
    showConfirmDialog(
        t('confirmDeleteTitle'),
        t('alertConfirmDelete'),
        () => {
            const idsToDelete = [id];
            function findChildren(parentId) {
                data.tasks.filter(item => item.parentId === parentId).forEach(child => {
                    idsToDelete.push(child.id);
                    findChildren(child.id);
                });
            }
            findChildren(id);
            
            data.tasks = data.tasks.filter(item => !idsToDelete.includes(item.id));
            saveToLocal();
            closeModal();
        }
    );
}

function deleteTaskDirectly(id) {
    showConfirmDialog(
        t('confirmDeleteTitle'),
        t('alertConfirmDelete'),
        () => {
            const idsToDelete = [id];
            function findChildren(parentId) {
                data.tasks.filter(item => item.parentId === parentId).forEach(child => {
                    idsToDelete.push(child.id);
                    findChildren(child.id);
                });
            }
            findChildren(id);
            
            data.tasks = data.tasks.filter(item => !idsToDelete.includes(item.id));
            saveToLocal();
        }
    );
}

// Supprimer les tâches sélectionnées
function deleteSelectedTasks() {
    if (selectedTasks.size === 0) return;
    
    showConfirmDialog(
        t('confirmDeleteTitle'),
        t('confirmDeleteSelected'),
        () => {
            const idsToDelete = Array.from(selectedTasks);
            
            idsToDelete.forEach(id => {
                function findChildren(parentId) {
                    data.tasks.filter(item => item.parentId === parentId).forEach(child => {
                        if (!idsToDelete.includes(child.id)) {
                            idsToDelete.push(child.id);
                        }
                        findChildren(child.id);
                    });
                }
                findChildren(id);
            });
            
            data.tasks = data.tasks.filter(item => !idsToDelete.includes(item.id));
            selectedTasks.clear();
            saveToLocal();
        }
    );
}

function toggleDetails(id) {
    const details = document.getElementById(`details-${id}`);
    if (details) {
        if (openDetailId === id) {
            details.style.display = 'none';
            openDetailId = null;
        } else {
            if (openDetailId) {
                const prevDetails = document.getElementById(`details-${openDetailId}`);
                if (prevDetails) prevDetails.style.display = 'none';
            }
            details.style.display = 'block';
            openDetailId = id;
        }
    }
}

function addNote(id) {
    const input = document.getElementById(`note-${id}`);
    const text = input ? input.value.trim() : '';
    if (text) {
        const task = data.tasks.find(item => item.id === id);
        if (task) {
            if (!task.comments) task.comments = [];
            task.comments.push({
                text: text,
                date: new Date().toISOString()
            });
            input.value = '';
            saveToLocal();
        }
    }
}

function deleteNote(taskId, index) {
    const task = data.tasks.find(item => item.id === taskId);
    if (task && task.comments) {
        task.comments.splice(index, 1);
        saveToLocal();
    }
}

function toggleTaskSelection(id, isChecked) {
    if (isChecked) {
        selectedTasks.add(id);
    } else {
        selectedTasks.delete(id);
    }
    updateCopyButton();
}

function updateCopyButton() {
    const copyBtn = document.getElementById('copyButton');
    if (selectedTasks.size > 0) {
        copyBtn.classList.add('visible');
    } else {
        copyBtn.classList.remove('visible');
    }
}

function copySelectedTasks() {
    if (selectedTasks.size === 0) return;

    let output = "";
    let tasksToCopy = data.tasks.filter(item => selectedTasks.has(item.id)).sort((a, b) => a.id - b.id);

    tasksToCopy.forEach(task => {
        const statusText = statusLabels[task.status] || task.status;
        const priorityText = t(`priority${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`);
        let notesText = '';
        
        if (task.comments && task.comments.length > 0) {
            notesText = task.comments.map(c => {
                if (typeof c === 'object' && c.text) {
                    return `\n    - ${c.text}`;
                }
                return `\n    - ${c}`;
            }).join('');
        }

        output += `
[${statusText}] ${task.title}
Catégorie: ${task.category} | Priorité: ${priorityText}${notesText}
---`;
    });
    
    output = output.trim();

    navigator.clipboard.writeText(output)
        .then(() => {
            alert(`📋 ${selectedTasks.size} tâches copiées!`);
            selectedTasks.clear();
            saveToLocal();
        })
        .catch(err => {
            alert(t('alertCopyError') + err);
        });
}

function exportData() {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SlimTask_export_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.tasks && importedData.categories) {
                data = importedData;
                data.tasks.forEach(task => { if(task.parentId === undefined) task.parentId = null; });
                currentLanguage = data.language || 'fr';
                saveToLocal();
                alert(t('alertImportSuccess'));
                init(); 
            } else {
                alert(t('alertInvalidFile'));
            }
        } catch (err) {
            alert(t('alertInvalidFile'));
        }
    };
    reader.readAsText(file);
}

// --- DIALOG DE CONFIRMATION ---
function showConfirmDialog(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmDialog').classList.add('show');
    
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');
    
    confirmOk.textContent = t('btnConfirm');
    confirmCancel.textContent = t('btnCancel');
    
    const handleConfirm = () => {
        document.getElementById('confirmDialog').classList.remove('show');
        onConfirm();
        cleanup();
    };
    
    const handleCancel = () => {
        document.getElementById('confirmDialog').classList.remove('show');
        cleanup();
    };
    
    const cleanup = () => {
        confirmOk.removeEventListener('click', handleConfirm);
        confirmCancel.removeEventListener('click', handleCancel);
    };
    
    confirmOk.addEventListener('click', handleConfirm);
    confirmCancel.addEventListener('click', handleCancel);
}

// --- GESTION TOUCHE SUPPR ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && selectedTasks.size > 0) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        e.preventDefault();
        deleteSelectedTasks();
    }
});

// --- INITIALISATION ---
init();

// Event Listeners
document.getElementById('languageSelector').addEventListener('change', changeLanguage);
document.getElementById('themeSelector').addEventListener('change', changeTheme);
document.getElementById('btnImport').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});
document.getElementById('btnExport').addEventListener('click', exportData);
document.getElementById('btnNewTask').addEventListener('click', () => openModal('create'));
document.getElementById('fileInput').addEventListener('change', function() {
    importData(this);
});

document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('btnDelete').addEventListener('click', deleteTask);
document.getElementById('btnSave').addEventListener('click', saveTask);
document.getElementById('moveToRootBtn').addEventListener('click', moveToRoot);

document.getElementById('copyButton').addEventListener('click', copySelectedTasks);

document.getElementById('taskModal').addEventListener('click', (e) => {
    if (e.target.id === 'taskModal') {
        closeModal();
    }
});

document.getElementById('confirmDialog').addEventListener('click', (e) => {
    if (e.target.id === 'confirmDialog') {
        document.getElementById('confirmDialog').classList.remove('show');
    }
});

// Event listeners pour le changelog
document.getElementById('changelogLink').addEventListener('click', (e) => {
    e.preventDefault();
    showChangelog();
});

document.getElementById('closeChangelog').addEventListener('click', closeChangelog);

document.getElementById('changelogModal').addEventListener('click', (e) => {
    if (e.target.id === 'changelogModal') {
        closeChangelog();
    }
});
