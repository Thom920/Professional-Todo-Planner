import { globals } from './main.js';
import { toggleTodo, updateTodoPriority, updateTodoTime, updateTodoDeadline, updateTodoCategory, updateTodo } from './api.js';
import { hideError } from './validation.js';

// ===== HELPER FUNCTIES =====
// Truncate text met ellipsis
export function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Maak een gekleurde badge (wordt gebruikt voor priority en category)
export function createColorBadge(color) {
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
export function isToday(dateString) {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
}

// Format datum van YYYY-MM-DD naar "D Mmm" (bijv. "5 okt")
export function formatDeadline(dateString) {
    if (!dateString || dateString === '' || dateString === null || dateString === 'undefined') return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${day} ${month}`;
}

// ===== CATEGORY UI FUNCTIES =====
// Open de edit modal voor een categorie
export function openEditCategoryModal(id, name, color) {
    globals.currentEditCategoryId = id;
    document.getElementById('editCategoryName').value = name;
    document.getElementById('editCategoryColor').value = color;
    document.getElementById('editCategoryModal').style.display = 'block';
}

// Sluit de edit modal
export function closeEditCategoryModal() {
    document.getElementById('editCategoryModal').style.display = 'none';
    globals.currentEditCategoryId = null;
    // Verberg eventuele error messages
    hideError('editCategoryName', 'categoryEditError');
}

// Open de delete confirmatie modal
export function openDeleteCategoryModal(id) {
    globals.categoryToDelete = id;
    document.getElementById('deleteCategoryModal').style.display = 'block';
}

// Sluit de delete modal
export function closeDeleteCategoryModal() {
    document.getElementById('deleteCategoryModal').style.display = 'none';
    globals.categoryToDelete = null;
}

// Update alle category select dropdowns (in tabel en modal)
export function updateCategorySelects() {
    // Update de modal category select
    const modalCategorySelect = document.getElementById('modalTodoCategory');
    if (modalCategorySelect) {
        // Bewaar de huidige selectie
        const currentValue = modalCategorySelect.value;

        // Leeg de select en voeg de default optie toe
        modalCategorySelect.innerHTML = '<option value="">Geen categorie</option>';

        // Voeg alle categorieën toe (met truncated names voor lange categorieën)
        globals.categoriesData.forEach(category => {
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
export function updateCategoryList() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;

    if (globals.categoriesData.length === 0) {
        categoryList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Nog geen categorieën</p>';
        return;
    }

    categoryList.innerHTML = '';
    globals.categoriesData.forEach(category => {
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
        editImg.src = 'img/pencil.png';
        editImg.alt = 'Bewerken';
        editBtn.appendChild(editImg);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'category-delete-btn';
        deleteBtn.onclick = () => openDeleteCategoryModal(category.id);
        const deleteImg = document.createElement('img');
        deleteImg.src = 'img/bin.png';
        deleteImg.alt = 'Verwijderen';
        deleteBtn.appendChild(deleteImg);

        categoryActions.appendChild(editBtn);
        categoryActions.appendChild(deleteBtn);

        categoryItem.appendChild(categoryInfo);
        categoryItem.appendChild(categoryActions);
        categoryList.appendChild(categoryItem);
    });
}

// ===== DISPLAY FUNCTIES =====
// ==== Alle todos tonen in een tabel ====
export function displayTodos(todos) {
    const tableBody = document.getElementById('todoTableBody');
    const emptyMessage = document.getElementById('emptyMessage');
    const table = document.getElementById('todoTable');

    // Maak de tabel leeg voordat er nieuwe rijen worden toegevoegd
    tableBody.innerHTML = '';

    // Als er geen todo's zijn, toon een bericht
    if (globals.todosData.length === 0) {
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
            cell.style.display = globals.visibleColumns[columnName] ? 'table-cell' : 'none';
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

    // Functie die de deadline laat zien (of een knop als er geen is)
    const showDisplay = (deadline) => {
        const display = document.createElement('span');
        display.className = 'deadline-display';

        // Check of er een geldige deadline is
        if (deadline && deadline !== '' && deadline !== 'null' && deadline !== 'undefined') {
            const formatted = formatDeadline(deadline);
            // Als formatDeadline een "-" teruggeeft, is de deadline ongeldig
            if (formatted !== '-') {
                display.textContent = formatted;
                // Als de deadline vandaag is, geef het een oranje kleur
                if (isToday(deadline)) {
                    display.classList.add('today');
                }
            } else {
                // Ongeldige deadline, toon knop
                display.innerHTML = '+ Datum';
                display.classList.add('no-deadline');
            }
        } else {
            // Geen deadline, toon knop
            display.innerHTML = '+ Datum';
            display.classList.add('no-deadline');
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
        const category = globals.categoriesData.find(c => c.id == currentCategoryId);
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
    globals.categoriesData.forEach(category => {
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
export function sortTodos(todos, column, direction) {
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
export function applySortingAndFiltering() {
    let sorted = sortTodos(globals.todosData, globals.currentSort.column, globals.currentSort.direction);
    displayTodos(sorted);
    updateSortUI();
}

// Update de pijltjes in de tabel headers om te laten zien hoe er gesorteerd is
export function updateSortUI() {
    // Verwijder alle sort classes
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });

    // Voeg de juiste class toe aan de actieve kolom (voor pijltje)
    if (globals.currentSort.column && globals.currentSort.direction !== 'none') {
        const activeHeader = document.querySelector(`[data-sort="${globals.currentSort.column}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sort-${globals.currentSort.direction}`);
        }
    }
}

// ===== MODAL FUNCTIES =====
// Open het bewerk scherm (modal) voor een todo
export function openModal(todo) {
    const modal = document.getElementById('todoModal');
    const modalInput = document.getElementById('modalTodoText');
    const modalDescription = document.getElementById('modalTodoDescription');
    const modalPriority = document.getElementById('modalTodoPriority');
    const modalTime = document.getElementById('modalTodoTime');
    const modalCategory = document.getElementById('modalTodoCategory');
    const modalDeadlineDisplay = document.getElementById('modalDeadlineDisplay');
    const modalDeadlineContainer = document.getElementById('modalDeadlineContainer');

    // Onthoud welke todo bewerkt wordt
    globals.currentTodoId = todo.id;

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
export function closeModal() {
    const modal = document.getElementById('todoModal');
    modal.style.display = 'none';
    // Reset de huidige todo ID
    globals.currentTodoId = null;
    // Verberg eventuele error messages
    hideError('modalTodoText', 'todoTextError');
}

// Update hoe de deadline wordt getoond in de modal
export function updateModalDeadlineDisplay(deadline) {
    const display = document.getElementById('modalDeadlineDisplay');
    display.className = 'modal-deadline-display';

    if (deadline) {
        // Formatteer de datum mooi (bijv. "5 mrt")
        display.textContent = formatDeadline(deadline);
        display.classList.remove('no-deadline');
        // Als de deadline vandaag is, geef het een speciaal kleurtje zelfde kleur oranje als eerder gebruikt
        if (isToday(deadline)) {
            display.classList.add('today');
        }
    } else {
        display.innerHTML = '<span class="deadline-icon">📅</span> Deadline toevoegen';
        display.classList.add('no-deadline');
        display.style.color = '';
    }
}

// Maak de deadline klikbaar in de modal
export function setupModalDeadlineClick() {
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
            // Werkt niet in alle browsers
        }
    };
}

// Verwijder een todo
export function deleteTodo(id) {
    // Onthoud welke todo verwijderd moet worden
    globals.todoToDelete = id;

    // Toon de bevestigings modal
    const deleteModal = document.getElementById('deleteConfirmModal');
    deleteModal.style.display = 'block';
}

// Sluit de delete bevestigings modal
export function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteConfirmModal');
    deleteModal.style.display = 'none';
    globals.todoToDelete = null; // Reset de variabele
}

// ===== KOLOM VOORKEUREN =====
// Laad welke kolommen de gebruiker wil zien (opgeslagen in browser)
export function loadColumnPreferences() {
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
export function saveColumnPreferences() {
    localStorage.setItem('visibleColumns', JSON.stringify(globals.visibleColumns));
}

// Toon of verberg een kolom (priority, time, of deadline)
export function toggleColumn(columnName, show) {
    // Vind alle cellen met deze kolom naam
    const headerCells = document.querySelectorAll(`.col-${columnName}`);
    // Toon of verberg ze allemaal
    headerCells.forEach(cell => {
        cell.style.display = show ? 'table-cell' : 'none';
    });
}
