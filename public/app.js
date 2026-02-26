const API_URL = 'api.php';
let currentTodoId = null;

function loadTodos() {
    fetch(API_URL)
        .then(response => response.json())
        .then(todos => {
            displayTodos(todos);
        })
        .catch(error => {
            console.error('Error bij laden todos:', error);
        });
}

function displayTodos(todos) {
    const todoList = document.getElementById('todoList');
    const emptyMessage = document.getElementById('emptyMessage');

    todoList.innerHTML = '';

    if (todos.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    } else {
        emptyMessage.style.display = 'none';
    }

    todos.forEach(todo => {
        // Container voor checkbox en todo item
        const container = document.createElement('div');
        container.className = 'todo-container';

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = todo.completed == 1;
        checkbox.onclick = (e) => {
            e.stopPropagation();
            toggleTodo(todo.id);
        };

        const li = document.createElement('li');
        li.className = 'todo-item';
        if (todo.completed == 1) {
            li.classList.add('completed');
        }
        li.textContent = todo.text;
        li.onclick = () => openModal(todo);

        container.appendChild(checkbox);
        container.appendChild(li);
        todoList.appendChild(container);
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

function updateTodo(id, text) {
    fetch(API_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id, text: text })
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

    currentTodoId = todo.id;
    modalInput.value = todo.text;

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

    if (text === '') {
        alert('Todo tekst mag niet leeg zijn');
        return;
    }

    updateTodo(currentTodoId, text);
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
});
