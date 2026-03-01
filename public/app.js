// ===== GLOBALE VARIABELEN =====
const API_URL = 'api.php'; // De URL van de API
let currentTodoId = null; // Welke todo is open in de modal
let todosData = []; // Alle todo's die zijn opgehaald
let todoToDelete = null; // Welke todo moet verwijderd worden (voor bevestiging)

// Houdt bij hoe er gesorteerd wordt
let currentSort = { column: null, direction: 'none' }; // 'asc', 'desc', 'none'

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
function updateTodo(id, text, description, priority, time, deadline) {
    // Deze functie wordt aangeroepen als je op de 'Opslaan' knop klikt in de modal
    fetch(API_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        // Stuur alle velden mee, gebruik '' (leeg) als een veld niet is ingevuld
        body: JSON.stringify({ id: id, text: text, description: description, priority: priority || '', time: time || '', deadline: deadline || '' })
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
            deadline: fieldName === 'deadline' ? (value || '') : (todo.deadline || '')
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

        tableBody.appendChild(row);
    });
}

// ==== Dropdown voor prioriteit selectie ====
function createPriorityDropdown(currentPriority, todoId) {
    const select = document.createElement('select');
    select.className = 'priority-cell-select';

    // Lijst met alle prioriteit opties
    const options = [
        { value: '', label: 'Geen' },
        { value: 'laag', label: '🟢Laag' },
        { value: 'medium', label: '🟡Medium' },
        { value: 'hoog', label: '🔴Hoog' },
        { value: 'ASAP', label: '⚠️ASAP' }
    ];

    // Voeg alle opties toe aan de dropdown
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        // Markeer de huidige prioriteit als geselecteerd
        if (currentPriority === opt.value) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    // Voorkom dat klikken op dropdown de modal opent
    select.onclick = (e) => {
        e.stopPropagation();
    };

    // Als de gebruiker een andere prioriteit kiest, update de todo
    select.onchange = (e) => {
        updateTodoPriority(todoId, e.target.value);
    };

    return select;
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
                valA = a.deadline ? new Date(a.deadline).getTime() : 0;
                valB = b.deadline ? new Date(b.deadline).getTime() : 0;
                if (valA === 0 && valB === 0) return 0;
                if (valA === 0) return 1; // Geen deadline komt achteraan
                if (valB === 0) return -1;
                return (valA - valB) * multiplier;

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
    const modalDeadlineDisplay = document.getElementById('modalDeadlineDisplay');
    const modalDeadlineContainer = document.getElementById('modalDeadlineContainer');

    // Onthoud welke todo bewerkt wordt
    currentTodoId = todo.id;

    // Vul alle velden in met de huidige waarden van de todo
    modalInput.value = todo.text;
    modalDescription.value = todo.description || '';
    modalPriority.value = todo.priority || '';
    modalTime.value = todo.time || '';

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
        return JSON.parse(saved);
    }
    // Standaard zijn alle kolommen zichtbaar
    return { priority: true, time: true, deadline: true };
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

    // Controleer of de todo tekst niet leeg is anders geef een waarschuwing
    if (text === '') {
        alert('Todo tekst mag niet leeg zijn');
        return;
    }

    // Stuur de update naar de server
    updateTodo(currentTodoId, text, description, priority, time, deadline);
};

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
window.onclick = function (event) {
    const modal = document.getElementById('todoModal');
    const deleteModal = document.getElementById('deleteConfirmModal');

    // Sluit todo bewerk modal
    if (event.target === modal) {
        closeModal();
    }

    // Sluit delete bevestigings modal
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
};

// Druk op ESC om modals te sluiten
window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
        const modal = document.getElementById('todoModal');
        const deleteModal = document.getElementById('deleteConfirmModal');

        // Sluit todo bewerk modal
        if (modal.style.display === 'block') {
            closeModal();
        }

        // Sluit delete bevestigings modal
        if (deleteModal.style.display === 'block') {
            closeDeleteModal();
        }
    }
});

// ===== PAGINA LADEN =====
// Als de pagina klaar is met laden, start alles op
window.addEventListener('load', function () {
    // Laad alle todo's van de server
    loadTodos();

    // Haal alle elementen op voor de kolom toggle functionaliteit
    const addColumnBtn = document.getElementById('addColumnBtn');
    const columnDropdown = document.getElementById('columnDropdown');
    const priorityToggle = document.getElementById('priorityToggle');
    const timeToggle = document.getElementById('timeToggle');
    const deadlineToggle = document.getElementById('deadlineToggle');

    // Zet de checkboxes op basis van opgeslagen voorkeuren
    priorityToggle.checked = visibleColumns.priority;
    timeToggle.checked = visibleColumns.time;
    deadlineToggle.checked = visibleColumns.deadline;

    // Pas de kolom zichtbaarheid toe
    toggleColumn('priority', visibleColumns.priority);
    toggleColumn('time', visibleColumns.time);
    toggleColumn('deadline', visibleColumns.deadline);

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

        // Sluit popup als je buiten het scherm klikt
        window.onclick = function (event) {
            if (event.target === popup) {
                popup.style.display = 'none';
                localStorage.setItem('hasSeenTimeUpdate', 'true');
            }
        };
    }
}