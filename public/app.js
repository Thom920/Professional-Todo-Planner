const API_URL = 'api.php';
let currentTodoId = null;
let todosData = [];

function loadColumnPreferences() {
    const saved = localStorage.getItem('visibleColumns');
    if (saved) {
        return JSON.parse(saved);
    }
    return { priority: false };
}

function saveColumnPreferences() {
    localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
}

let visibleColumns = loadColumnPreferences();

function loadTodos() {
    fetch(API_URL)
        .then(response => response.json())
        .then(todos => {
            todosData = todos;
            displayTodos(todos);
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

    if (todos.length === 0) {
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
            priority: priority || ''
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

function updateTodo(id, text, description, priority) {
    fetch(API_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id, text: text, description: description, priority: priority || '' })
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

    currentTodoId = todo.id;
    modalInput.value = todo.text;
    modalDescription.value = todo.description || '';
    modalPriority.value = todo.priority || '';

    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('todoModal');
    modal.style.display = 'none';
    currentTodoId = null;
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

    if (text === '') {
        alert('Todo tekst mag niet leeg zijn');
        return;
    }

    updateTodo(currentTodoId, text, description, priority);
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

window.addEventListener('load', function () {
    loadTodos();

    const addColumnBtn = document.getElementById('addColumnBtn');
    const columnDropdown = document.getElementById('columnDropdown');
    const priorityToggle = document.getElementById('priorityToggle');

    priorityToggle.checked = visibleColumns.priority;
    toggleColumn('priority', visibleColumns.priority);

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
});

function toggleColumn(columnName, show) {
    const headerCells = document.querySelectorAll(`.col-${columnName}`);
    headerCells.forEach(cell => {
        cell.style.display = show ? 'table-cell' : 'none';
    });
}
