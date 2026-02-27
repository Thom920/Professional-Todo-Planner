const API_URL = 'api.php';
let currentTodoId = null;
let todosData = [];

function loadColumnPreferences() {
    const saved = localStorage.getItem('visibleColumns');
    if (saved) {
        return JSON.parse(saved);
    }
    return { priority: true, time: true, deadline: true };
}

function saveColumnPreferences() {
    localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
}

let visibleColumns = loadColumnPreferences();

let currentSort = { column: null, direction: 'none' }; // 'asc', 'desc', 'none'

// Kijkt of datum vandaan is
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

function sortTodos(todos, column, direction) {
    if (!column || direction === 'none' || direction === null) return todos;

    const sorted = [...todos];
    const multiplier = direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
        let valA, valB;

        switch (column) {
            case 'text':
                valA = (a.text || '').toLowerCase();
                valB = (b.text || '').toLowerCase();
                return valA.localeCompare(valB) * multiplier;

            case 'priority':
                const priorityOrder = { '': 0, 'laag': 1, 'medium': 2, 'hoog': 3, 'ASAP': 4 };
                valA = priorityOrder[a.priority || ''];
                valB = priorityOrder[b.priority || ''];
                return (valA - valB) * multiplier;

            case 'time':
                const timeOrder = { '': 0, '10 min': 10, '30 min': 30, '1 uur': 60, '2 uur': 120, '3 uur': 180, '4 uur': 240, '5+ uur': 300 };
                valA = timeOrder[a.time || ''];
                valB = timeOrder[b.time || ''];
                return (valA - valB) * multiplier;

            case 'deadline':
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

function filterByCompleted(todos) {
    return todos;
}

function applySortingAndFiltering() {
    let filtered = filterByCompleted(todosData);
    let sorted = sortTodos(filtered, currentSort.column, currentSort.direction);
    displayTodos(sorted);
    updateSortUI();
}

function updateSortUI() {
    // Verwijder alle sort classes
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });

    // Voeg juiste class toe aan actieve kolom
    if (currentSort.column && currentSort.direction !== 'none') {
        const activeHeader = document.querySelector(`[data-sort="${currentSort.column}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sort-${currentSort.direction}`);
        }
    }
}

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

function displayTodos(todos) {
    const tableBody = document.getElementById('todoTableBody');
    const emptyMessage = document.getElementById('emptyMessage');
    const table = document.getElementById('todoTable');

    tableBody.innerHTML = '';

    if (todosData.length === 0) {
        table.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    } else {
        table.style.display = 'table';
        emptyMessage.style.display = 'none';
    }

    todos.forEach(todo => {
        const row = document.createElement('tr');
        row.className = todo.completed == 1 ? 'completed' : '';

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

        const textCell = document.createElement('td');
        textCell.className = 'col-text';
        textCell.textContent = todo.text;
        textCell.onclick = () => openModal(todo);
        row.appendChild(textCell);

        const priorityCell = document.createElement('td');
        priorityCell.className = 'col-priority';
        priorityCell.style.display = visibleColumns.priority ? 'table-cell' : 'none';

        const prioritySelect = createPriorityDropdown(todo.priority, todo.id);
        priorityCell.appendChild(prioritySelect);
        row.appendChild(priorityCell);

        const timeCell = document.createElement('td');
        timeCell.className = 'col-time';
        timeCell.style.display = visibleColumns.time ? 'table-cell' : 'none';

        const timeInput = createTimeInput(todo.time, todo.id);
        timeCell.appendChild(timeInput);
        row.appendChild(timeCell);

        const deadlineCell = document.createElement('td');
        deadlineCell.className = 'col-deadline';
        deadlineCell.style.display = visibleColumns.deadline ? 'table-cell' : 'none';

        const deadlineDisplay = createDeadlineInput(todo.deadline, todo.id);
        deadlineCell.appendChild(deadlineDisplay);
        row.appendChild(deadlineCell);

        tableBody.appendChild(row);
    });
}

function createPriorityDropdown(currentPriority, todoId) {
    const select = document.createElement('select');
    select.className = 'priority-cell-select';

    const options = [
        { value: '', label: 'Geen' },
        { value: 'laag', label: '🟢Laag' },
        { value: 'medium', label: '🟡Medium' },
        { value: 'hoog', label: '🔴Hoog' },
        { value: 'ASAP', label: '⚠️ASAP' }
    ];

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (currentPriority === opt.value) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.onclick = (e) => {
        e.stopPropagation();
    };

    select.onchange = (e) => {
        updateTodoPriority(todoId, e.target.value);
    };

    return select;
}

function createTimeInput(currentTime, todoId) {
    const select = document.createElement('select');
    select.className = 'time-cell-select';

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

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (currentTime === opt.value) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.onclick = (e) => {
        e.stopPropagation();
    };

    select.onchange = (e) => {
        updateTodoTime(todoId, e.target.value);
    };

    return select;
}

function createDeadlineInput(currentDeadline, todoId) {
    const container = document.createElement('div');
    container.style.display = 'inline-block';

    const showDisplay = (deadline) => {
        const display = document.createElement('span');
        display.className = 'deadline-display';

        if (deadline) {
            display.textContent = formatDeadline(deadline);
            if (isToday(deadline)) {
                display.classList.add('today');
            }
        } else {
            display.textContent = '-';
            display.style.color = '#ccc';
        }

        display.onclick = (e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'date';
            input.className = 'deadline-cell-input';
            input.value = deadline || '';

            input.onchange = (e) => {
                updateTodoDeadline(todoId, e.target.value);
            };

            input.onblur = () => {
                const newDeadline = input.value;
                container.innerHTML = '';
                container.appendChild(showDisplay(newDeadline));
            };

            container.innerHTML = '';
            container.appendChild(input);
            input.focus();
            try {
                input.showPicker();
            } catch (e) {
            }
        };

        return display;
    };

    container.appendChild(showDisplay(currentDeadline));
    return container;
}

function updateTodoDeadline(id, deadline) {
    const todo = todosData.find(t => t.id == id);
    if (!todo) return;

    fetch(API_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            text: todo.text,
            description: todo.description || '',
            priority: todo.priority || '',
            time: todo.time || '',
            deadline: deadline || ''
        })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                loadTodos();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error bij updaten deadline:', error);
        });
}

function updateTodoTime(id, time) {
    const todo = todosData.find(t => t.id == id);
    if (!todo) return;

    fetch(API_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            text: todo.text,
            description: todo.description || '',
            priority: todo.priority || '',
            time: time || '',
            deadline: todo.deadline || ''
        })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                loadTodos();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error bij updaten time:', error);
        });
}

function updateTodoPriority(id, priority) {
    const todo = todosData.find(t => t.id == id);
    if (!todo) return;

    fetch(API_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            text: todo.text,
            description: todo.description || '',
            priority: priority || '',
            time: todo.time || '',
            deadline: todo.deadline || ''
        })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                loadTodos();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error bij updaten priority:', error);
        });
}

function addTodo(text) {
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                loadTodos();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error bij toevoegen todo:', error);
            alert('Er ging iets mis bij het toevoegen van de todo');
        });
}

function updateTodo(id, text, description, priority, time, deadline) {
    fetch(API_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id, text: text, description: description, priority: priority || '', time: time || '', deadline: deadline || '' })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                loadTodos();
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

function deleteTodo(id) {
    if (!confirm('Weet je zeker dat je deze todo wilt verwijderen?')) {
        return;
    }

    fetch(API_URL, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                loadTodos();
                closeModal();
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error bij verwijderen todo:', error);
            alert('Er ging iets mis bij het verwijderen van de todo');
        });
}

function toggleTodo(id) {
    fetch(API_URL, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
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

function openModal(todo) {
    const modal = document.getElementById('todoModal');
    const modalInput = document.getElementById('modalTodoText');
    const modalDescription = document.getElementById('modalTodoDescription');
    const modalPriority = document.getElementById('modalTodoPriority');
    const modalTime = document.getElementById('modalTodoTime');
    const modalDeadlineDisplay = document.getElementById('modalDeadlineDisplay');
    const modalDeadlineContainer = document.getElementById('modalDeadlineContainer');

    currentTodoId = todo.id;
    modalInput.value = todo.text;
    modalDescription.value = todo.description || '';
    modalPriority.value = todo.priority || '';
    modalTime.value = todo.time || '';

    modalDeadlineContainer.dataset.deadline = todo.deadline || '';

    updateModalDeadlineDisplay(todo.deadline);

    setupModalDeadlineClick();

    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('todoModal');
    modal.style.display = 'none';
    currentTodoId = null;
}

function updateModalDeadlineDisplay(deadline) {
    const display = document.getElementById('modalDeadlineDisplay');
    display.className = 'modal-deadline-display';

    if (deadline) {
        display.textContent = formatDeadline(deadline);
        if (isToday(deadline)) {
            display.classList.add('today');
        }
    } else {
        display.textContent = 'Geen deadline';
        display.style.color = '#999';
    }
}

function setupModalDeadlineClick() {
    const container = document.getElementById('modalDeadlineContainer');
    const display = document.getElementById('modalDeadlineDisplay');

    display.onclick = function () {
        const currentDeadline = container.dataset.deadline || '';
        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'modal-deadline-input';
        input.value = currentDeadline;

        input.onchange = function () {
            container.dataset.deadline = input.value;
            updateModalDeadlineDisplay(input.value);
            container.innerHTML = '';
            container.appendChild(display);
            setupModalDeadlineClick();
        };

        input.onblur = function () {
            container.innerHTML = '';
            container.appendChild(display);
            setupModalDeadlineClick();
        };

        container.innerHTML = '';
        container.appendChild(input);
        input.focus();
        try {
            input.showPicker();
        } catch (e) {
        }
    };
}

document.getElementById('todoForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const input = document.getElementById('todoInput');
    const text = input.value.trim();

    if (text === '') {
        alert('Voer een todo in');
        return;
    }

    addTodo(text);

    input.value = '';
});

// Modal event listeners
document.querySelector('.close').onclick = closeModal;

document.getElementById('saveBtn').onclick = function () {
    const text = document.getElementById('modalTodoText').value.trim();
    const description = document.getElementById('modalTodoDescription').value.trim();
    const priority = document.getElementById('modalTodoPriority').value;
    const time = document.getElementById('modalTodoTime').value;
    const deadline = document.getElementById('modalDeadlineContainer').dataset.deadline || '';

    if (text === '') {
        alert('Todo tekst mag niet leeg zijn');
        return;
    }

    updateTodo(currentTodoId, text, description, priority, time, deadline);
};

document.getElementById('deleteBtn').onclick = function () {
    deleteTodo(currentTodoId);
};

window.onclick = function (event) {
    const modal = document.getElementById('todoModal');
    if (event.target === modal) {
        closeModal();
    }
};

// ESC key om modal te sluiten
window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
        const modal = document.getElementById('todoModal');
        if (modal.style.display === 'block') {
            closeModal();
        }
    }
});

window.addEventListener('load', function () {
    loadTodos();

    const addColumnBtn = document.getElementById('addColumnBtn');
    const columnDropdown = document.getElementById('columnDropdown');
    const priorityToggle = document.getElementById('priorityToggle');
    const timeToggle = document.getElementById('timeToggle');
    const deadlineToggle = document.getElementById('deadlineToggle');

    priorityToggle.checked = visibleColumns.priority;
    timeToggle.checked = visibleColumns.time;
    deadlineToggle.checked = visibleColumns.deadline;
    toggleColumn('priority', visibleColumns.priority);
    toggleColumn('time', visibleColumns.time);
    toggleColumn('deadline', visibleColumns.deadline);

    addColumnBtn.onclick = function (e) {
        e.stopPropagation();
        columnDropdown.style.display = columnDropdown.style.display === 'none' ? 'block' : 'none';
    };

    document.addEventListener('click', function (e) {
        if (!addColumnBtn.contains(e.target) && !columnDropdown.contains(e.target)) {
            columnDropdown.style.display = 'none';
        }
    });

    priorityToggle.onchange = function () {
        visibleColumns.priority = this.checked;
        toggleColumn('priority', this.checked);
        saveColumnPreferences();
    };

    timeToggle.onchange = function () {
        visibleColumns.time = this.checked;
        toggleColumn('time', this.checked);
        saveColumnPreferences();
    };

    deadlineToggle.onchange = function () {
        visibleColumns.deadline = this.checked;
        toggleColumn('deadline', this.checked);
        saveColumnPreferences();
    };

    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function () {
            const column = this.dataset.sort;

            // Gaat door: none -> asc -> desc -> none...
            if (currentSort.column === column) {
                if (currentSort.direction === 'none' || currentSort.direction === null) {
                    currentSort.direction = 'asc';
                } else if (currentSort.direction === 'asc') {
                    currentSort.direction = 'desc';
                } else {
                    currentSort.direction = 'none';
                    currentSort.column = null;
                }
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }

            applySortingAndFiltering();
        });
    });

    showUpdatePopupIfNeeded();
});

function showUpdatePopupIfNeeded() {
    const hasSeenUpdate = localStorage.getItem('hasSeenTimeUpdate');

    if (!hasSeenUpdate) {
        const popup = document.getElementById('updatePopup');
        const closeBtn = document.querySelector('.update-close');
        const okBtn = document.getElementById('updatePopupBtn');

        setTimeout(() => {
            popup.style.display = 'block';
        }, 800);

        closeBtn.onclick = function () {
            popup.style.display = 'none';
            localStorage.setItem('hasSeenTimeUpdate', 'true');
        };

        okBtn.onclick = function () {
            popup.style.display = 'none';
            localStorage.setItem('hasSeenTimeUpdate', 'true');
        };

        window.onclick = function (event) {
            if (event.target === popup) {
                popup.style.display = 'none';
                localStorage.setItem('hasSeenTimeUpdate', 'true');
            }
        };
    }
}

function toggleColumn(columnName, show) {
    const headerCells = document.querySelectorAll(`.col-${columnName}`);
    headerCells.forEach(cell => {
        cell.style.display = show ? 'table-cell' : 'none';
    });
}
