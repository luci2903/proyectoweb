const API_URL = 'http://localhost:3000/api/todos';


const input = document.getElementById('new-task');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const counter = document.getElementById('counter');
const cardBody = document.getElementById('card-body');
const filterButtons = document.querySelectorAll('[data-filter]');
const markAllBtn = document.querySelector('.mark-all');
const clearCompletedBtn = document.getElementById('clear-completed');

let currentFilter = 'all';


function showLoading() {
  cardBody.innerHTML =
    '<p style="text-align:center;font-weight:bold;">Cargando tareas...</p>';
}

function showEmpty() {
  cardBody.innerHTML = `
    <div style="text-align:center; padding:20px;">
      <p style="font-size:1.2rem;font-weight:800;">¡Agrega tu primera tarea! </p>
      <p style="color:#666;font-size:0.9rem;margin-top:10px;">
        Tu lista está limpia por ahora.
      </p>
    </div>
  `;
}

function showError(msg) {
  cardBody.innerHTML = `
    <p style="color:red;text-align:center;font-weight:bold;">
      Error: ${msg}
    </p>
  `;
}



async function fetchTodos() {
  if (taskList.children.length === 0) showLoading();

  try {
    const res = await fetch(`${API_URL}?status=${currentFilter}`);
    if (!res.ok) throw new Error('No se pudo conectar con la API');

    const { data: todos } = await res.json();

    if (!todos || todos.length === 0) {
      showEmpty();
      counter.textContent = '0 tareas pendientes';
    } else {
      renderTodos(todos);
      updateCounter(todos);
    }
  } catch (err) {
    showError(err.message);
  }
}




function renderTodos(todos) {
  cardBody.innerHTML = '';
  taskList.innerHTML = '';

  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <div class="item-content">
        <input type="checkbox" class="task-check" ${todo.completed ? 'checked' : ''}>
        <span class="task-text">${todo.title}</span>
      </div>
      <div class="item-actions">
        <button class="delete-btn" title="Eliminar tarea">✕</button>
      </div>
    `;

    li.querySelector('.task-check').addEventListener('change', () => {
      updateTodo(todo.id, { completed: todo.completed ? 0 : 1 });
    });

    
    li.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('¿Eliminar tarea?')) deleteTodo(todo.id);
    });

    li.querySelector('.task-text').addEventListener('dblclick', () => {
      enableEdit(li, todo);
    });

    taskList.appendChild(li);
  });

  cardBody.appendChild(taskList);
}


async function addTodo() {
  const title = input.value.trim();
  if (!title) return;

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });

    input.value = '';
    fetchTodos();
  } catch (err) {
    console.error('Error al agregar:', err);
  }
}

addBtn?.addEventListener('click', addTodo);
input?.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});




async function updateTodo(id, data) {
  try {
    await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchTodos();
  } catch (err) {
    console.error('Error al actualizar:', err);
  }
}

async function deleteTodo(id) {
  try {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchTodos();
  } catch (err) {
    console.error('Error al eliminar:', err);
  }
}




function enableEdit(li, todo) {
  const span = li.querySelector('.task-text');
  const inputEdit = document.createElement('input');

  inputEdit.type = 'text';
  inputEdit.className = 'edit-input';
  inputEdit.value = todo.title;

  li.querySelector('.item-content').replaceChild(inputEdit, span);
  inputEdit.focus();

  const save = async () => {
    const newTitle = inputEdit.value.trim();
    if (newTitle && newTitle !== todo.title) {
      await updateTodo(todo.id, { title: newTitle });
    } else {
      fetchTodos();
    }
  };

  inputEdit.addEventListener('keydown', e => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') fetchTodos();
  });

  inputEdit.addEventListener('blur', save);
}




filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.sidebar button.active')?.classList.remove('active');
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    fetchTodos();
  });
});




function updateCounter(todos) {
  const remaining = todos.filter(t => !t.completed).length;
  counter.textContent = `${remaining} tareas pendientes`;
}




async function markAllDone() {
  try {
    await fetch(`${API_URL}/mark-all`, { method: 'PUT' });
    fetchTodos();
  } catch (err) {
    console.error('Error al marcar todas:', err);
  }
}

if (markAllBtn) {
  markAllBtn.addEventListener('click', markAllDone);
}



async function clearCompleted() {
    if (!confirm("¿Borrar todas las tareas terminadas?")) return;

    try {
        const res = await fetch(`${API_URL}/clear/completed`, { method: 'DELETE' });
        if (res.ok) {
            fetchTodos(); 
        }
    } catch (err) {
        console.error("Error al limpiar:", err);
    }
}

document.getElementById('clear-completed').addEventListener('click', clearCompleted);


fetchTodos();