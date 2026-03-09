import { globals } from './main.js?v=1';
import { showError, hideError } from './validation.js?v=1';
import { updateCategorySelects, applySortingAndFiltering, closeEditCategoryModal, closeModal, closeDeleteModal, closeDeleteCategoryModal } from './ui.js?v=20260308b';

// ===== API COMMUNICATIE =====
// Haal alle todo's op van de server
export function loadTodos() {
    fetch(globals.API_URL)
        .then(response => response.json())
        .then(todos => {
            globals.todosData = todos;
            applySortingAndFiltering();
        })
        .catch(error => {
            console.error('Error bij laden todos:', error);
        });
}

// ===== CATEGORY API COMMUNICATIE =====
// Haal alle categorieën op van de server
export function loadCategories() {
    fetch(globals.CATEGORY_API_URL)
        .then(response => response.json())
        .then(categories => {
            globals.categoriesData = categories;
            // Update alle category dropdowns met de nieuwe data
            updateCategorySelects();
            // Herrender de todo lijst met de nieuwe categorieën
            if (globals.todosData.length > 0) {
                applySortingAndFiltering();
            }
        })
        .catch(error => {
            console.error('Error bij laden categorieën:', error);
        });
}

// Voeg een nieuwe categorie toe
export function addCategory(name, color) {
    // Validatie
    if (!name || name.trim() === '') {
        showError('newCategoryName', 'categoryAddError', 'Categorie naam is verplicht');
        return;
    }

    // Verberg eventuele eerdere errors
    hideError('newCategoryName', 'categoryAddError');

    fetch(globals.CATEGORY_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name, color: color })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Categorie succesvol toegevoegd, herlaad de lijst
                loadCategories();
                loadTodos(); // Herlaad ook de todos zodat de nieuwe/gewijzigde categorie er staat
                // Leeg het invoerveld
                document.getElementById('newCategoryName').value = '';
                document.getElementById('newCategoryColor').value = '#3498db';
            } else {
                // Toon foutmelding visueel
                showError('newCategoryName', 'categoryAddError', result.message);
            }
        })
        .catch(error => {
            console.error('Error bij toevoegen categorie:', error);
            showError('newCategoryName', 'categoryAddError', 'Er ging iets mis bij het toevoegen');
        });
}

// Werk een bestaande categorie bij
export function updateCategory(id, name, color) {
    // Validatie
    if (!name || name.trim() === '') {
        showError('editCategoryName', 'categoryEditError', 'Categorie naam is verplicht');
        return;
    }

    // Verberg eventuele eerdere errors
    hideError('editCategoryName', 'categoryEditError');

    fetch(globals.CATEGORY_API_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id, name: name, color: color })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Categorie succesvol bijgewerkt
                loadCategories();
                loadTodos(); // Herlaad de todos om gewijzigde categorie te tonen
                closeEditCategoryModal();
            } else {
                // Toon foutmelding visueel
                showError('editCategoryName', 'categoryEditError', result.message);
            }
        })
        .catch(error => {
            console.error('Error bij bijwerken categorie:', error);
            showError('editCategoryName', 'categoryEditError', 'Er ging iets mis bij het bijwerken');
        });
}

// Voer de verwijdering uit
export function executeDeleteCategory() {
    if (!globals.categoryToDelete) return;

    fetch(globals.CATEGORY_API_URL, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: globals.categoryToDelete })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Categorie succesvol verwijderd
                loadCategories();
                loadTodos(); // Herlaad de todos zodat verwijderde categorie verdwijnt
                closeDeleteCategoryModal();
            } else {
                console.error('Error bij verwijderen:', result.message);
                closeDeleteCategoryModal();
            }
        })
        .catch(error => {
            console.error('Error bij verwijderen categorie:', error);
            closeDeleteCategoryModal();
        });
}

// ==== TODOS API COMMUNICATIE ====

// ==== Voeg een nieuwe todo toe ====
export function addTodo(text) {
    // Stuur een POST request naar de API om een nieuwe todo aan te maken
    fetch(globals.API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text }) // Zet de todo tekst om naar JSON format
    })
        .then(response => response.json()) // Zet het antwoord van de server om naar een JavaScript object
        .then(result => {
            // Check of het gelukt is
            if (result.success) {
                // gelukt, laad alle todos opnieuw zodat de nieuwste ook zichtbaar is
                loadTodos();
            } else {
                // Mislukt, laat een foutmelding zien
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            // Als er een netwerk fout is
            console.error('Error bij toevoegen todo:', error);
            alert('Er ging iets mis bij het toevoegen van de todo'); //foutmelding
        });
}

// Werk een bestaande todo bij
export function updateTodo(id, text, description, priority, time, deadline, category_id) {
    // Deze functie wordt aangeroepen als je op de 'Opslaan' knop klikt in de modal
    fetch(globals.API_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        // Stuur alle velden mee, gebruik '' (leeg) als een veld niet is ingevuld
        body: JSON.stringify({ id: id, text: text, description: description, priority: priority || '', time: time || '', deadline: deadline || '', category_id: category_id || '' })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Update geslaagd
                loadTodos(); // Laad de lijst opnieuw zodat je de wijzigingen ziet
                closeModal();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error bij updaten todo:', error);
            alert('Er ging iets mis bij het bijwerken van de todo');
        });
}

// Update een enkel veld van een todo
export function updateTodoField(id, fieldName, value) {
    // Zoek de todo in de lijst (todosData) zodat we de andere velden kunnen behouden
    const todo = globals.todosData.find(t => t.id == id);
    if (!todo) return; // Als de todo niet gevonden is, doe niks

    // Stuur alle todo gegevens mee, maar vervang alleen het veld dat is veranderd
    fetch(globals.API_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            text: todo.text, // Behoud de originele tekst
            description: todo.description || '', // Behoud de originele beschrijving
            // Als het het veld is dat we willen updaten, gebruik de nieuwe value, anders behoud de oude waarde
            priority: fieldName === 'priority' ? (value || '') : (todo.priority || ''),
            time: fieldName === 'time' ? (value || '') : (todo.time || ''),
            deadline: fieldName === 'deadline' ? (value || '') : (todo.deadline || ''),
            category_id: fieldName === 'category_id' ? (value || '') : (todo.category_id || '')
        })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Update geslaagd, laad de lijst opnieuw
                loadTodos();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error(`Error bij updaten ${fieldName}:`, error);
        });
}

// Wrapper functies die de algemene functie gebruiken
// Deze functies zorgen ervoor dat we niet steeds 'deadline', 'time' of 'priority' als string hoeven te typen
// Ze roepen gewoon updateTodoField aan met de juiste parameter
export function updateTodoDeadline(id, deadline) {
    updateTodoField(id, 'deadline', deadline);
}

export function updateTodoTime(id, time) {
    updateTodoField(id, 'time', time);
}

export function updateTodoPriority(id, priority) {
    updateTodoField(id, 'priority', priority);
}

export function updateTodoCategory(id, category_id) {
    updateTodoField(id, 'category_id', category_id);
}

// Voer de verwijdering uit
export function executeDelete() {
    // Check of er een todo is om te verwijderen
    if (globals.todoToDelete === null) return;

    // Stuur DELETE request naar de API
    fetch(globals.API_URL, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: globals.todoToDelete }) // Stuur het ID mee van de todo die verwijderd moet worden
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Verwijdering geslaagd!
                loadTodos(); // Laad de lijst opnieuw, de verwijderde todo zal nu weg zijn
                closeModal(); // Sluit het bewerk scherm
                closeDeleteModal(); // Sluit het bevestigingsscherm
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error bij verwijderen todo:', error);
            alert('Er ging iets mis bij het verwijderen van de todo');
        });
}

// Vink een todo af of haal vinkje weg
export function toggleTodo(id) {
    fetch(globals.API_URL, {
        method: 'PATCH', // PATCH = kleine update, alleen 'completed' veld verandert
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Toggle geslaagd, laad de lijst opnieuw en de nieuwe status zal nu zichtbaar zijn
                loadTodos();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error bij toggle todo:', error);
            alert('Er ging iets mis bij het afvinken van de todo');
        });
}
