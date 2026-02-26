const API_URL = 'api.php';

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
        const li = document.createElement('li');
        li.textContent = todo.text;
        todoList.appendChild(li);
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

window.addEventListener('load', function () {
    loadTodos();
});
