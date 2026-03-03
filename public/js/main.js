import { loadTodos, loadCategories, addTodo, addCategory, updateCategory, executeDeleteCategory, executeDelete, updateTodo } from './api.js';
import { 
    openModal, 
    closeModal, 
    closeDeleteModal, 
    closeEditCategoryModal, 
    closeDeleteCategoryModal,
    applySortingAndFiltering,
    loadColumnPreferences,
    saveColumnPreferences,
    toggleColumn,
    deleteTodo
} from './ui.js';
import { showError, hideError } from './validation.js';

// ===== GLOBALE VARIABELEN =====
export const globals = {
    API_URL: 'api.php',
    CATEGORY_API_URL: 'categories.php',
    currentTodoId: null,
    todosData: [],
    categoriesData: [],
    todoToDelete: null,
    currentSort: { column: null, direction: 'none' },
    currentEditCategoryId: null,
    categoryToDelete: null,
    visibleColumns: null
};

// ===== EVENT LISTENERS =====
// Als het formulier wordt verstuurd (Enter of knop klik)
document.getElementById('todoForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Voorkom dat de pagina herlaadt

    const input = document.getElementById('todoInput');
    const text = input.value.trim();

    // Controleer of er iets is ingevuld anders geef een waarschuwing
    if (text === '') {
        alert('Voer een todo in');
        return;
    }

    // Voeg de todo toe aan de database
    addTodo(text);

    // Maak het invoerveld leeg
    input.value = '';
});

// Sluit knop in de modal
document.querySelector('.close').onclick = closeModal;

// Annuleren knop in de modal
document.getElementById('cancelBtn').onclick = closeModal;

// Opslaan knop in de modal
document.getElementById('saveBtn').onclick = function () {
    // Haal alle waarden op uit de modal velden
    const text = document.getElementById('modalTodoText').value.trim();
    const description = document.getElementById('modalTodoDescription').value.trim();
    const priority = document.getElementById('modalTodoPriority').value;
    const time = document.getElementById('modalTodoTime').value;
    const deadline = document.getElementById('modalDeadlineContainer').dataset.deadline || '';
    const category_id = document.getElementById('modalTodoCategory').value;

    // Controleer of de todo tekst niet leeg is
    if (text === '') {
        showError('modalTodoText', 'todoTextError', 'Todo tekst mag niet leeg zijn');
        return;
    }
    
    // Verberg eventuele eerdere errors
    hideError('modalTodoText', 'todoTextError');

    // Stuur de update naar de server
    updateTodo(globals.currentTodoId, text, description, priority, time, deadline, category_id);
};

// Verberg error message wanneer gebruiker begint te typen in todo text
document.getElementById('modalTodoText').addEventListener('input', function() {
    hideError('modalTodoText', 'todoTextError');
});

// Verwijder knop in de modal
document.getElementById('deleteBtn').onclick = function () {
    deleteTodo(globals.currentTodoId);
};

// Bevestig knop in delete modal (voer verwijdering uit)
document.getElementById('confirmDeleteBtn').onclick = function () {
    executeDelete();
};

// Annuleer knop in delete modal (sluit zonder te verwijderen)
document.getElementById('cancelDeleteBtn').onclick = function () {
    closeDeleteModal();
};

// Sluit modals als je buiten het scherm klikt
// ===== GLOBALE EVENT LISTENERS =====
window.onclick = function (event) {
    const modal = document.getElementById('todoModal');
    const deleteModal = document.getElementById('deleteConfirmModal');
    const categoryModal = document.getElementById('categoryModal');
    const editCategoryModal = document.getElementById('editCategoryModal');
    const deleteCategoryModal = document.getElementById('deleteCategoryModal');
    const updatePopup = document.getElementById('updatePopup');

    if (event.target === modal) closeModal();
    if (event.target === deleteModal) closeDeleteModal();
    if (event.target === categoryModal) categoryModal.style.display = 'none';
    if (event.target === editCategoryModal) closeEditCategoryModal();
    if (event.target === deleteCategoryModal) closeDeleteCategoryModal();
    if (event.target === updatePopup) {
        updatePopup.style.display = 'none';
        localStorage.setItem('hasSeenTimeUpdate', 'true');
    }
};

// Druk op ESC om modals te sluiten
window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
        const modal = document.getElementById('todoModal');
        const deleteModal = document.getElementById('deleteConfirmModal');
        const categoryModal = document.getElementById('categoryModal');
        const editCategoryModal = document.getElementById('editCategoryModal');
        const deleteCategoryModal = document.getElementById('deleteCategoryModal');

        if (modal && modal.style.display === 'block') closeModal();
        if (deleteModal && deleteModal.style.display === 'block') closeDeleteModal();
        if (categoryModal && categoryModal.style.display === 'block') categoryModal.style.display = 'none';
        if (editCategoryModal && editCategoryModal.style.display === 'block') closeEditCategoryModal();
        if (deleteCategoryModal && deleteCategoryModal.style.display === 'block') closeDeleteCategoryModal();
    }
});

// ===== PAGINA LADEN =====
// Als de pagina klaar is met laden, start alles op
window.addEventListener('load', function () {
    // Laad alle todo's en categorieën van de server
    loadTodos();
    loadCategories();

    // Haal alle elementen op voor de kolom toggle functionaliteit
    const addColumnBtn = document.getElementById('addColumnBtn');
    const columnDropdown = document.getElementById('columnDropdown');
    const priorityToggle = document.getElementById('priorityToggle');
    const timeToggle = document.getElementById('timeToggle');
    const deadlineToggle = document.getElementById('deadlineToggle');
    const categoryToggle = document.getElementById('categoryToggle');

    // Laad kolom voorkeuren
    globals.visibleColumns = loadColumnPreferences();

    // Zet de checkboxes op basis van opgeslagen voorkeuren
    priorityToggle.checked = globals.visibleColumns.priority;
    timeToggle.checked = globals.visibleColumns.time;
    deadlineToggle.checked = globals.visibleColumns.deadline;
    categoryToggle.checked = globals.visibleColumns.category;

    // Pas de kolom zichtbaarheid toe
    toggleColumn('priority', globals.visibleColumns.priority);
    toggleColumn('time', globals.visibleColumns.time);
    toggleColumn('deadline', globals.visibleColumns.deadline);
    toggleColumn('category', globals.visibleColumns.category);

    // Als je op de kolom knop klikt, toon/verberg het menu
    addColumnBtn.onclick = function (e) {
        e.stopPropagation();
        columnDropdown.style.display = columnDropdown.style.display === 'none' ? 'block' : 'none';
    };

    // Sluit het kolom menu als je ergens anders klikt
    document.addEventListener('click', function (e) {
        if (!addColumnBtn.contains(e.target) && !columnDropdown.contains(e.target)) {
            columnDropdown.style.display = 'none';
        }
    });

    // Als de prioriteit checkbox verandert, toon/verberg de kolom
    priorityToggle.onchange = function () {
        globals.visibleColumns.priority = this.checked;
        toggleColumn('priority', this.checked);
        saveColumnPreferences();
    };

    // Als de tijd checkbox verandert, toon/verberg de kolom
    timeToggle.onchange = function () {
        globals.visibleColumns.time = this.checked;
        toggleColumn('time', this.checked);
        saveColumnPreferences();
    };

    // Als de deadline checkbox verandert, toon/verberg de kolom
    deadlineToggle.onchange = function () {
        globals.visibleColumns.deadline = this.checked;
        toggleColumn('deadline', this.checked);
        saveColumnPreferences();
    };

    // Als de category checkbox verandert, toon/verberg de kolom
    categoryToggle.onchange = function () {
        globals.visibleColumns.category = this.checked;
        toggleColumn('category', this.checked);
        saveColumnPreferences();
    };

    // ===== CATEGORY MODAL EVENT LISTENERS =====
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
    const categoryModal = document.getElementById('categoryModal');
    const closeCategoryBtn = document.querySelector('.close-category');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const editCategoryModal = document.getElementById('editCategoryModal');
    const closeEditCategoryBtn = editCategoryModal.querySelector('.close');
    const saveEditCategoryBtn = document.getElementById('saveEditCategoryBtn');
    const cancelEditCategoryBtn = document.getElementById('cancelEditCategoryBtn');
    const deleteCategoryModal = document.getElementById('deleteCategoryModal');
    const confirmDeleteCategoryBtn = document.getElementById('confirmDeleteCategoryBtn');
    const cancelDeleteCategoryBtn = document.getElementById('cancelDeleteCategoryBtn');

    // Open de category modal als je op "Beheer categorieën" klikt
    manageCategoriesBtn.onclick = function (e) {
        e.stopPropagation();
        columnDropdown.style.display = 'none'; // Sluit de dropdown
        categoryModal.style.display = 'block';
    };

    // Sluit de category modal
    closeCategoryBtn.onclick = function () {
        categoryModal.style.display = 'none';
    };

    // Voeg een nieuwe categorie toe
    addCategoryBtn.onclick = function () {
        const name = document.getElementById('newCategoryName').value.trim();
        const color = document.getElementById('newCategoryColor').value;

        addCategory(name, color);
    };

    // Enter toets in het naam veld voegt ook een categorie toe
    document.getElementById('newCategoryName').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCategoryBtn.click();
        }
    });

    // Verberg error message wanneer gebruiker begint te typen in category name
    document.getElementById('newCategoryName').addEventListener('input', function() {
        hideError('newCategoryName', 'categoryAddError');
    });

    // Edit category modal event listeners
    closeEditCategoryBtn.onclick = closeEditCategoryModal;
    cancelEditCategoryBtn.onclick = closeEditCategoryModal;

    saveEditCategoryBtn.onclick = function () {
        const name = document.getElementById('editCategoryName').value.trim();
        const color = document.getElementById('editCategoryColor').value;

        // Check alleen of er een ID is, laat updateCategory() de naam valideren
        if (!globals.currentEditCategoryId) {
            return;
        }

        updateCategory(globals.currentEditCategoryId, name, color);
    };

    // Verberg error message wanneer gebruiker begint te typen in edit category name
    document.getElementById('editCategoryName').addEventListener('input', function() {
        hideError('editCategoryName', 'categoryEditError');
    });

    // Delete category modal event listeners
    confirmDeleteCategoryBtn.onclick = executeDeleteCategory;
    cancelDeleteCategoryBtn.onclick = closeDeleteCategoryModal;

    // Klik op kolom headers om te sorteren
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function () {
            const column = this.dataset.sort;

            // Sorteer cyclus: geen -> oplopend -> aflopend -> geen
            if (globals.currentSort.column === column) {
                // Als er al op deze kolom wordt gesorteerd, ga naar de volgende sortering in de cyclus
                if (globals.currentSort.direction === 'none' || globals.currentSort.direction === null) {
                    globals.currentSort.direction = 'asc'; // Oplopend
                } else if (globals.currentSort.direction === 'asc') {
                    globals.currentSort.direction = 'desc'; // Aflopend
                } else {
                    globals.currentSort.direction = 'none'; // Geen sortering
                    globals.currentSort.column = null;
                }
            } else {
                // Als er op een nieuwe kolom wordt geklikt, begin met oplopend sorteren
                globals.currentSort.column = column;
                globals.currentSort.direction = 'asc';
            }

            applySortingAndFiltering();
        });
    });

    showUpdatePopupIfNeeded();
});

// Laat een popup zien als de gebruiker de app voor het eerste gebruikt
function showUpdatePopupIfNeeded() {
    const hasSeenUpdate = localStorage.getItem('hasSeenTimeUpdate');

    // Als de gebruiker de popup nog niet heeft gezien
    if (!hasSeenUpdate) {
        const popup = document.getElementById('updatePopup');
        const closeBtn = document.querySelector('.update-close');
        const okBtn = document.getElementById('updatePopupBtn');

        // Wacht 800ms voordat de popup verschijnt
        setTimeout(() => {
            popup.style.display = 'block';
        }, 800);

        // Sluit knop: sluit popup en onthoud dat die is gezien
        closeBtn.onclick = function () {
            popup.style.display = 'none';
            localStorage.setItem('hasSeenTimeUpdate', 'true');
        };

        // OK knop: zelfde als sluit knop
        okBtn.onclick = function () {
            popup.style.display = 'none';
            localStorage.setItem('hasSeenTimeUpdate', 'true');
        };
    }
}
