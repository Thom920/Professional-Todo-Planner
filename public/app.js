// ===== GLOBALE VARIABELEN =====
const API_URL = 'api.php'; // De URL van de API
const CATEGORY_API_URL = 'categories.php'; // De URL van de Category API
let currentTodoId = null; // Welke todo is open in de modal
let todosData = []; // Alle todo's die zijn opgehaald
let categoriesData = []; // Alle categorieën die zijn opgehaald
let todoToDelete = null; // Welke todo moet verwijderd worden (voor bevestiging)

// Houdt bij hoe er gesorteerd wordt
let currentSort = { column: null, direction: 'none' }; // 'asc', 'desc', 'none'

// ===== HELPER FUNCTIES =====
// Toon een error message bij een input veld
function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const errorDiv = document.getElementById(errorId);
    input.classList.add('input-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Verberg error message bij een input veld
function hideError(inputId, errorId) {
    const input = document.getElementById(inputId);
    const errorDiv = document.getElementById(errorId);
    input.classList.remove('input-error');
    errorDiv.style.display = 'none';
}

// Truncate text met ellipsis
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Maak een gekleurde badge (wordt gebruikt voor priority en category)
function createColorBadge(color) {
    const badge = document.createElement('span');
    badge.style.backgroundColor = color;
    badge.style.width = '12px';
    badge.style.height = '12px';
    badge.style.borderRadius = '50%';
    badge.style.display = 'inline-block';
    badge.style.flexShrink = '0';
    return badge;
}

// ===== DATUM EN TIJD FUNCTIES =====
// Kijkt of datum vandaag is
function isToday(dateString) {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
}

// Format datum van YYYY-MM-DD naar "D Mmm" (bijv. "5 okt")
function formatDeadline(dateString) {
    if (!dateString || dateString === '' || dateString === null || dateString === 'undefined') return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${day} ${month}`;
}

// ===== API COMMUNICATIE =====
// Haal alle todo's op van de server
function loadTodos() {
    fetch(API_URL)
        .then(response => response.json())
        .then(todos => {
            todosData = todos;
            applySortingAndFiltering();
        })
        .catch(error => {
            console.error('Error bij laden todos:', error);
        });
}

// ===== CATEGORY API COMMUNICATIE =====
// Haal alle categorieën op van de server
function loadCategories() {
    fetch(CATEGORY_API_URL)
        .then(response => response.json())
        .then(categories => {
            categoriesData = categories;
            // Update alle category dropdowns met de nieuwe data
            updateCategorySelects();
            // Herrender de todo lijst met de nieuwe categorieën
            if (todosData.length > 0) {
                applySortingAndFiltering();
            }
        })
        .catch(error => {
            console.error('Error bij laden categorieën:', error);
        });
}

// Voeg een nieuwe categorie toe
function addCategory(name, color) {
    // Validatie
    if (!name || name.trim() === '') {
        showError('newCategoryName', 'categoryAddError', 'Categorie naam is verplicht');
        return;
    }
    
    // Verberg eventuele eerdere errors
    hideError('newCategoryName', 'categoryAddError');
    
    fetch(CATEGORY_API_URL, {
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
function updateCategory(id, name, color) {
    // Validatie
    if (!name || name.trim() === '') {
        showError('editCategoryName', 'categoryEditError', 'Categorie naam is verplicht');
        return;
    }
    
    // Verberg eventuele eerdere errors
    hideError('editCategoryName', 'categoryEditError');
    
    fetch(CATEGORY_API_URL, {
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

// Open de edit modal voor een categorie
let currentEditCategoryId = null;

function openEditCategoryModal(id, name, color) {
    currentEditCategoryId = id;
    document.getElementById('editCategoryName').value = name;
    document.getElementById('editCategoryColor').value = color;
    document.getElementById('editCategoryModal').style.display = 'block';
}

// Sluit de edit modal
function closeEditCategoryModal() {
    document.getElementById('editCategoryModal').style.display = 'none';
    currentEditCategoryId = null;
    // Verberg eventuele error messages
    hideError('editCategoryName', 'categoryEditError');
}

// Open de delete confirmatie modal
let categoryToDelete = null;

function openDeleteCategoryModal(id) {
    categoryToDelete = id;
    document.getElementById('deleteCategoryModal').style.display = 'block';
}

// Sluit de delete modal
function closeDeleteCategoryModal() {
    document.getElementById('deleteCategoryModal').style.display = 'none';
    categoryToDelete = null;
}

// Voer de verwijdering uit
function executeDeleteCategory() {
    if (!categoryToDelete) return;

    fetch(CATEGORY_API_URL, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: categoryToDelete })
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

// Update alle category select dropdowns (in tabel en modal)
function updateCategorySelects() {
    // Update de modal category select
    const modalCategorySelect = document.getElementById('modalTodoCategory');
    if (modalCategorySelect) {
        // Bewaar de huidige selectie
        const currentValue = modalCategorySelect.value;

        // Leeg de select en voeg de default optie toe
        modalCategorySelect.innerHTML = '<option value="">Geen categorie</option>';

        // Voeg alle categorieën toe (met truncated names voor lange categorieën)
        categoriesData.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = truncateText(category.name, 30);
            modalCategorySelect.appendChild(option);
        });

        // Herstel de selectie als die er nog is
        if (currentValue) {
            modalCategorySelect.value = currentValue;
        }
    }

    // Update de category management lijst
    updateCategoryList();
}

// Update de lijst met categorieën in de category modal
function updateCategoryList() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;

    if (categoriesData.length === 0) {
        categoryList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Nog geen categorieën</p>';
        return;
    }

    categoryList.innerHTML = '';
    categoriesData.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';

        // Category info
        const categoryInfo = document.createElement('div');
        categoryInfo.className = 'category-info';

        const colorBadge = document.createElement('span');
        colorBadge.className = 'category-color-badge';
        colorBadge.style.backgroundColor = category.color;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-name';
        nameSpan.textContent = category.name; // Veilig tegen XSS

        categoryInfo.appendChild(colorBadge);
        categoryInfo.appendChild(nameSpan);

        // Category actions
        const categoryActions = document.createElement('div');
        categoryActions.className = 'category-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'category-edit-btn';
        editBtn.onclick = () => openEditCategoryModal(category.id, category.name, category.color);
        const editImg = document.createElement('img');
        editImg.src = '../img/pencil.png';
        editImg.alt = 'Bewerken';
        editBtn.appendChild(editImg);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'category-delete-btn';
        deleteBtn.onclick = () => openDeleteCategoryModal(category.id);
        const deleteImg = document.createElement('img');
        deleteImg.src = '../img/bin.png';
        deleteImg.alt = 'Verwijderen';
        deleteBtn.appendChild(deleteImg);

        categoryActions.appendChild(editBtn);
        categoryActions.appendChild(deleteBtn);

        categoryItem.appendChild(categoryInfo);
        categoryItem.appendChild(categoryActions);
        categoryList.appendChild(categoryItem);
    });
}

// ==== TODOS API COMMUNICATIE ====

// ==== Voeg een nieuwe todo toe ====
function addTodo(text) {
    // Stuur een POST request naar de API om een nieuwe todo aan te maken
    fetch(API_URL, {
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
function updateTodo(id, text, description, priority, time, deadline, category_id) {
    // Deze functie wordt aangeroepen als je op de 'Opslaan' knop klikt in de modal
    fetch(API_URL, {
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
function updateTodoField(id, fieldName, value) {
    // Zoek de todo in de lijst (todosData) zodat we de andere velden kunnen behouden
    const todo = todosData.find(t => t.id == id);
    if (!todo) return; // Als de todo niet gevonden is, doe niks

    // Stuur alle todo gegevens mee, maar vervang alleen het veld dat is veranderd
    fetch(API_URL, {
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
function updateTodoDeadline(id, deadline) {
    updateTodoField(id, 'deadline', deadline);
}

function updateTodoTime(id, time) {
    updateTodoField(id, 'time', time);
}

function updateTodoPriority(id, priority) {
    updateTodoField(id, 'priority', priority);
}

function updateTodoCategory(id, category_id) {
    updateTodoField(id, 'category_id', category_id);
}

// Verwijder een todo
function deleteTodo(id) {
    // Onthoud welke todo verwijderd moet worden
    todoToDelete = id;

    // Toon de bevestigings modal
    const deleteModal = document.getElementById('deleteConfirmModal');
    deleteModal.style.display = 'block';
}

// Voer de verwijdering uit
function executeDelete() {
    // Check of er een todo is om te verwijderen
    if (todoToDelete === null) return;

    // Stuur DELETE request naar de API
    fetch(API_URL, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: todoToDelete }) // Stuur het ID mee van de todo die verwijderd moet worden
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

// Sluit de delete bevestigings modal
function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteConfirmModal');
    deleteModal.style.display = 'none';
    todoToDelete = null; // Reset de variabele
}

// Vink een todo af of haal vinkje weg
function toggleTodo(id) {
    fetch(API_URL, {
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

// ===== DISPLAY FUNCTIES =====
// ==== Alle todos tonen in een tabel ====
function displayTodos(todos) {
    const tableBody = document.getElementById('todoTableBody');
    const emptyMessage = document.getElementById('emptyMessage');
    const table = document.getElementById('todoTable');

    // Maak de tabel leeg voordat er nieuwe rijen worden toegevoegd
    tableBody.innerHTML = '';

    // Als er geen todo's zijn, toon een bericht
    if (todosData.length === 0) {
        table.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    } else {
        table.style.display = 'table';
        emptyMessage.style.display = 'none';
    }

    // Loop door alle todo's en maak een rij voor elk
    todos.forEach(todo => {
        const row = document.createElement('tr');
        // Als de todo is afgevinkt, geef het de 'completed' class (voor afvinken)
        row.className = todo.completed == 1 ? 'completed' : '';

        // Checkbox cel
        const checkboxCell = document.createElement('td');
        checkboxCell.className = 'col-checkbox';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = todo.completed == 1;
        checkbox.onclick = (e) => {
            e.stopPropagation();
            toggleTodo(todo.id);
        };
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        // Tekst cel (klikbaar om modal te openen)
        const textCell = document.createElement('td');
        textCell.className = 'col-text';
        textCell.textContent = todo.text;
        textCell.onclick = () => openModal(todo);
        row.appendChild(textCell);

        // Helper functie om een cel met inhoud toe te voegen
        const addCell = (columnName, createFunction, value) => {
            const cell = document.createElement('td');
            cell.className = `col-${columnName}`;
            cell.style.display = visibleColumns[columnName] ? 'table-cell' : 'none';
            const content = createFunction(value, todo.id);
            cell.appendChild(content);
            row.appendChild(cell);
        };

        // Voeg alle drie de cellen toe met de helper functie
        addCell('priority', createPriorityDropdown, todo.priority);
        addCell('time', createTimeInput, todo.time);
        addCell('deadline', createDeadlineInput, todo.deadline);
        addCell('category', createCategoryDropdown, todo.category_id);

        tableBody.appendChild(row);
    });
}

// ==== Dropdown voor prioriteit selectie ====
function createPriorityDropdown(currentPriority, todoId) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '8px';

    // Lijst met alle prioriteit opties met kleur
    const options = [
        { value: '', label: 'Geen', color: null },
        { value: 'laag', label: 'Laag', color: '#4caf50' },
        { value: 'medium', label: 'Medium', color: '#ff9800' },
        { value: 'hoog', label: 'Hoog', color: '#f44336' },
        { value: 'ASAP', label: 'ASAP', color: '#ff5252' }
    ];

    // Voeg gekleurde badge toe (of placeholder ruimte)
    const currentOption = options.find(opt => opt.value === currentPriority);
    if (currentOption && currentOption.color) {
        const badge = createColorBadge(currentOption.color);
        badge.className = 'priority-color-badge';
        container.appendChild(badge);
    } else {
        // Placeholder voor alignment
        const placeholder = document.createElement('span');
        placeholder.style.width = '12px';
        placeholder.style.height = '12px';
        placeholder.style.display = 'inline-block';
        placeholder.style.flexShrink = '0';
        container.appendChild(placeholder);
    }

    const select = document.createElement('select');
    select.className = 'priority-cell-select';
    select.style.flex = '1';

    // Voeg alle opties toe aan de dropdown
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (currentPriority === opt.value) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    // Voorkom dat klikken op dropdown de modal opent
    select.onclick = (e) => e.stopPropagation();

    // Als de gebruiker een andere prioriteit kiest, update de todo
    select.onchange = (e) => updateTodoPriority(todoId, e.target.value);

    container.appendChild(select);
    return container;
}

// ==== Dropdown voor tijd selectie ====
function createTimeInput(currentTime, todoId) {
    const select = document.createElement('select');
    select.className = 'time-cell-select';

    // Lijst met alle tijd opties (geschatte duur)
    const options = [
        { value: '', label: 'Geen' },
        { value: '10 min', label: '  10 min' },
        { value: '30 min', label: '  30 min' },
        { value: '1 uur', label: '  1 uur' },
        { value: '2 uur', label: '  2 uur' },
        { value: '3 uur', label: '  3 uur' },
        { value: '4 uur', label: '  4 uur' },
        { value: '5+ uur', label: '  5+ uur' }
    ];

    // Voeg elke optie toe aan het dropdown menu
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        // Markeer de huidige tijd als geselecteerd
        if (currentTime === opt.value) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    // Voorkom dat klikken op dropdown de modal opent
    select.onclick = (e) => {
        e.stopPropagation();
    };

    // Als de gebruiker een andere tijd kiest, update de database
    select.onchange = (e) => {
        updateTodoTime(todoId, e.target.value);
    };

    return select;
}

// Maak een datum kiezer voor de deadline
function createDeadlineInput(currentDeadline, todoId) {
    const container = document.createElement('div');
    container.style.display = 'inline-block';

    // Functie die de deadline laat zien (of '-' als er geen is)
    const showDisplay = (deadline) => {
        const display = document.createElement('span');
        display.className = 'deadline-display';

        if (deadline) {
            // Format de datum mooi (bijv. "5 mrt")
            display.textContent = formatDeadline(deadline);
            // Als de deadline vandaag is, geef het een ornaje kleur
            if (isToday(deadline)) {
                display.classList.add('today');
            }
        } else {
            display.textContent = '-';
            display.style.color = '#ccc';
        }

        // Als je op de deadline klikt, open een datum kiezer
        display.onclick = (e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'date';
            input.className = 'deadline-cell-input';
            input.value = deadline || '';

            // Als er een nieuwe datum wordt gekozen, update de todo
            input.onchange = (e) => {
                updateTodoDeadline(todoId, e.target.value);
            };

            // Als de datum kiezer focus verliest, toon weer de normale weergave
            input.onblur = () => {
                const newDeadline = input.value;
                container.innerHTML = '';
                container.appendChild(showDisplay(newDeadline));
            };

            container.innerHTML = '';
            container.appendChild(input);
            input.focus();
            // Probeer de datum picker automatisch te openen
            try {
                input.showPicker();
            } catch (e) {
                // Werkt blijkbaar niet altijd
            }
        };

        return display;
    };

    container.appendChild(showDisplay(currentDeadline));
    return container;
}

// ==== Dropdown voor categorie selectie ====
function createCategoryDropdown(currentCategoryId, todoId) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '8px';

    // Voeg gekleurde badge toe (of placeholder ruimte)
    if (currentCategoryId) {
        const category = categoriesData.find(c => c.id == currentCategoryId);
        if (category) {
            const badge = createColorBadge(category.color);
            badge.className = 'category-color-badge';
            container.appendChild(badge);
        }
    } else {
        // Placeholder voor alignment
        const placeholder = document.createElement('span');
        placeholder.style.width = '12px';
        placeholder.style.height = '12px';
        placeholder.style.display = 'inline-block';
        placeholder.style.flexShrink = '0';
        container.appendChild(placeholder);
    }

    const select = document.createElement('select');
    select.className = 'category-cell-select';
    select.value = currentCategoryId || '';
    select.style.flex = '1';

    // Voeg de default optie toe
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-';
    select.appendChild(defaultOption);

    // Voeg alle categorieën toe (met truncated names voor lange categorieën)
    categoriesData.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = truncateText(category.name, 25);
        select.appendChild(option);
    });

    // Stel de huidige waarde in
    if (currentCategoryId) {
        select.value = currentCategoryId;
    }

    // Event listeners
    select.onchange = (e) => {
        e.stopPropagation();
        updateTodoCategory(todoId, e.target.value);
    };
    select.onclick = (e) => e.stopPropagation();
    container.onclick = (e) => e.stopPropagation();

    container.appendChild(select);
    return container;
}

// ===== SORTEER EN FILTER FUNCTIES =====
// Sorteer de todo's op basis van een kolom (text, priority, time, deadline)
function sortTodos(todos, column, direction) {
    // Als er geen sortering actief is, geef de lijst gewoon terug
    if (!column || direction === 'none' || direction === null) return todos;

    // Maak een kopie van de array zodat het origineel niet wordt verandert
    const sorted = [...todos];
    // Multiplier: 1 voor oplopend (asc), -1 voor aflopend (desc)
    const multiplier = direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
        let valA, valB;

        switch (column) {
            case 'text':
                // Sorteer alfabetisch
                valA = (a.text || '').toLowerCase();
                valB = (b.text || '').toLowerCase();
                return valA.localeCompare(valB) * multiplier;

            case 'priority':
                // Geef elke prioriteit een nummer (hoger = belangrijker)
                const priorityOrder = { '': 0, 'laag': 1, 'medium': 2, 'hoog': 3, 'ASAP': 4 };
                valA = priorityOrder[a.priority || ''];
                valB = priorityOrder[b.priority || ''];
                return (valA - valB) * multiplier;

            case 'time':
                // Zet tijd om naar minuten voor sortering
                const timeOrder = { '': 0, '10 min': 10, '30 min': 30, '1 uur': 60, '2 uur': 120, '3 uur': 180, '4 uur': 240, '5+ uur': 300 };
                valA = timeOrder[a.time || ''];
                valB = timeOrder[b.time || ''];
                return (valA - valB) * multiplier;

            case 'deadline':
                // Zet datum om naar milliseconden voor vergelijking
                const dateA = new Date(a.deadline);
                const dateB = new Date(b.deadline);
                // Check op lege, invalid of 0000-00-00 datums
                valA = isNaN(dateA.getTime()) || !a.deadline || a.deadline === '0000-00-00' ? 0 : dateA.getTime();
                valB = isNaN(dateB.getTime()) || !b.deadline || b.deadline === '0000-00-00' ? 0 : dateB.getTime();
                // Items zonder deadline komen altijd achteraan
                if (valA === 0 && valB === 0) return 0;
                if (valA === 0) return 1;
                if (valB === 0) return -1;
                return (valA - valB) * multiplier;

            case 'category':
                // Sorteer op categorie naam (alfabetisch)
                valA = (a.category_name || '').toLowerCase();
                valB = (b.category_name || '').toLowerCase();
                // Items zonder categorie komen achteraan
                if (!valA && !valB) return 0;
                if (!valA) return 1;
                if (!valB) return -1;
                return valA.localeCompare(valB) * multiplier;

            default:
                return 0;
        }
    });

    return sorted;
}

// Pas sortering toe en toon het resultaat
function applySortingAndFiltering() {
    let sorted = sortTodos(todosData, currentSort.column, currentSort.direction);
    displayTodos(sorted);
    updateSortUI();
}

// Update de pijltjes in de tabel headers om te laten zien hoe er gesorteerd is
function updateSortUI() {
    // Verwijder alle sort classes
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });

    // Voeg de juiste class toe aan de actieve kolom (voor pijltje)
    if (currentSort.column && currentSort.direction !== 'none') {
        const activeHeader = document.querySelector(`[data-sort="${currentSort.column}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sort-${currentSort.direction}`);
        }
    }
}

// ===== MODAL FUNCTIES =====
// Open het bewerk scherm (modal) voor een todo
function openModal(todo) {
    const modal = document.getElementById('todoModal');
    const modalInput = document.getElementById('modalTodoText');
    const modalDescription = document.getElementById('modalTodoDescription');
    const modalPriority = document.getElementById('modalTodoPriority');
    const modalTime = document.getElementById('modalTodoTime');
    const modalCategory = document.getElementById('modalTodoCategory');
    const modalDeadlineDisplay = document.getElementById('modalDeadlineDisplay');
    const modalDeadlineContainer = document.getElementById('modalDeadlineContainer');

    // Onthoud welke todo bewerkt wordt
    currentTodoId = todo.id;

    // Vul alle velden in met de huidige waarden van de todo
    modalInput.value = todo.text;
    modalDescription.value = todo.description || '';
    modalPriority.value = todo.priority || '';
    modalTime.value = todo.time || '';
    modalCategory.value = todo.category_id || '';

    // Bewaar de deadline in het container element
    modalDeadlineContainer.dataset.deadline = todo.deadline || '';

    // Toon de deadline netjes geformatteerd
    updateModalDeadlineDisplay(todo.deadline);

    // Maak de deadline klikbaar om te bewerken
    setupModalDeadlineClick();

    // Toon de modal
    modal.style.display = 'block';
}

// Sluit het bewerk scherm
function closeModal() {
    const modal = document.getElementById('todoModal');
    modal.style.display = 'none';
    // Reset de huidige todo ID
    currentTodoId = null;
    // Verberg eventuele error messages
    hideError('modalTodoText', 'todoTextError');
}

// Update hoe de deadline wordt getoond in de modal
function updateModalDeadlineDisplay(deadline) {
    const display = document.getElementById('modalDeadlineDisplay');
    display.className = 'modal-deadline-display';

    if (deadline) {
        // Formatteer de datum mooi (bijv. "5 mrt")
        display.textContent = formatDeadline(deadline);
        // Als de deadline vandaag is, geef het een speciaal kleurtje zelfde kleur oranje als eerder gebruikt
        if (isToday(deadline)) {
            display.classList.add('today');
        }
    } else {
        display.textContent = 'Geen deadline';
        display.style.color = '#999';
    }
}

// Maak de deadline klikbaar in de modal
function setupModalDeadlineClick() {
    const container = document.getElementById('modalDeadlineContainer');
    const display = document.getElementById('modalDeadlineDisplay');

    // Als je op de deadline klikt, toon een datum kiezer
    display.onclick = function () {
        const currentDeadline = container.dataset.deadline || '';
        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'modal-deadline-input';
        input.value = currentDeadline;

        // Als er een datum wordt gekozen, sla het op
        input.onchange = function () {
            container.dataset.deadline = input.value;
            updateModalDeadlineDisplay(input.value);
            container.innerHTML = '';
            container.appendChild(display);
            setupModalDeadlineClick();
        };

        // Als de datum kiezer focus verliest, toon weer de normale weergave
        input.onblur = function () {
            container.innerHTML = '';
            container.appendChild(display);
            setupModalDeadlineClick();
        };

        container.innerHTML = '';
        container.appendChild(input);
        input.focus();
        // Probeer de datum picker automatisch te openen
        try {
            input.showPicker();
        } catch (e) {
            // Werkt niet in alle browsers, geen probleem
        }
    };
}

// ===== KOLOM VOORKEUREN =====
// Laad welke kolommen de gebruiker wil zien (opgeslagen in browser)
function loadColumnPreferences() {
    const saved = localStorage.getItem('visibleColumns');
    if (saved) {
        // Zet de opgeslagen JSON string terug naar een object
        const prefs = JSON.parse(saved);
        // Als category nog niet bestaat in de opgeslagen voorkeuren, voeg het toe (default true)
        if (prefs.category === undefined) {
            prefs.category = true;
        }
        return prefs;
    }
    // Standaard zijn alle kolommen zichtbaar
    return { priority: true, time: true, deadline: true, category: true };
}

// Sla de huidige kolom voorkeuren op in de browser
function saveColumnPreferences() {
    localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
}

let visibleColumns = loadColumnPreferences();

// Toon of verberg een kolom (priority, time, of deadline)
function toggleColumn(columnName, show) {
    // Vind alle cellen met deze kolom naam
    const headerCells = document.querySelectorAll(`.col-${columnName}`);
    // Toon of verberg ze allemaal
    headerCells.forEach(cell => {
        cell.style.display = show ? 'table-cell' : 'none';
    });
}

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
    updateTodo(currentTodoId, text, description, priority, time, deadline, category_id);
};

// Verberg error message wanneer gebruiker begint te typen in todo text
document.getElementById('modalTodoText').addEventListener('input', function() {
    hideError('modalTodoText', 'todoTextError');
});

// Verwijder knop in de modal
document.getElementById('deleteBtn').onclick = function () {
    deleteTodo(currentTodoId);
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

    // Zet de checkboxes op basis van opgeslagen voorkeuren
    priorityToggle.checked = visibleColumns.priority;
    timeToggle.checked = visibleColumns.time;
    deadlineToggle.checked = visibleColumns.deadline;
    categoryToggle.checked = visibleColumns.category;

    // Pas de kolom zichtbaarheid toe
    toggleColumn('priority', visibleColumns.priority);
    toggleColumn('time', visibleColumns.time);
    toggleColumn('deadline', visibleColumns.deadline);
    toggleColumn('category', visibleColumns.category);

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
        visibleColumns.priority = this.checked;
        toggleColumn('priority', this.checked);
        saveColumnPreferences();
    };

    // Als de tijd checkbox verandert, toon/verberg de kolom
    timeToggle.onchange = function () {
        visibleColumns.time = this.checked;
        toggleColumn('time', this.checked);
        saveColumnPreferences();
    };

    // Als de deadline checkbox verandert, toon/verberg de kolom
    deadlineToggle.onchange = function () {
        visibleColumns.deadline = this.checked;
        toggleColumn('deadline', this.checked);
        saveColumnPreferences();
    };

    // Als de category checkbox verandert, toon/verberg de kolom
    categoryToggle.onchange = function () {
        visibleColumns.category = this.checked;
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
        if (!currentEditCategoryId) {
            return;
        }

        updateCategory(currentEditCategoryId, name, color);
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
            if (currentSort.column === column) {
                // Als er al op deze kolom wordt gesorteerd, ga naar de volgende sortering in de cyclus
                if (currentSort.direction === 'none' || currentSort.direction === null) {
                    currentSort.direction = 'asc'; // Oplopend
                } else if (currentSort.direction === 'asc') {
                    currentSort.direction = 'desc'; // Aflopend
                } else {
                    currentSort.direction = 'none'; // Geen sortering
                    currentSort.column = null;
                }
            } else {
                // Als er op een nieuwe kolom wordt geklikt, begin met oplopend sorteren
                currentSort.column = column;
                currentSort.direction = 'asc';
            }

            applySortingAndFiltering();
        });
    });

    showUpdatePopupIfNeeded();
});

// Laat een popup zien als de gebruiker de app voor het eerst gebruikt
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