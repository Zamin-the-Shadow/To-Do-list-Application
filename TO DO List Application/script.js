/**
 * TO DO LIST APPLICATION — script.js
 * Features: Add / Delete / Complete / Filter / LocalStorage
 */

// ─── State ───────────────────────────────────────────────────────────────────
let tasks = [];           // Array<{ id, text, completed }>
let currentFilter = 'all'; // 'all' | 'active' | 'completed'

// ─── LocalStorage Helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = 'nexsoft_todo_tasks';

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }
}

// ─── DOM References ───────────────────────────────────────────────────────────
const taskInput        = document.getElementById('task-input');
const addBtn           = document.getElementById('add-btn');
const taskList         = document.getElementById('task-list');
const filterBtns       = document.querySelectorAll('.filter-btn');
const clearCompletedBtn= document.getElementById('clear-completed-btn');
const statTotal        = document.getElementById('stat-total');
const statActive       = document.getElementById('stat-active');
const statDone         = document.getElementById('stat-done');
const itemsLeftLabel   = document.getElementById('items-left-label');

// ─── Render ───────────────────────────────────────────────────────────────────
function getFilteredTasks() {
  if (currentFilter === 'active')    return tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') return tasks.filter(t =>  t.completed);
  return tasks;
}

function renderTasks() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    taskList.innerHTML = buildEmptyState();
    return;
  }

  filtered.forEach(task => {
    const li = buildTaskElement(task);
    taskList.appendChild(li);
  });

  updateStats();
}

function buildEmptyState() {
  const msgs = {
    all:       ['No tasks yet!',      'Add your first task above to get started.'],
    active:    ['All caught up!',     'You have no active tasks right now.'],
    completed: ['Nothing completed.', 'Start checking off your tasks!'],
  };
  const [title, sub] = msgs[currentFilter];
  return `
    <li class="empty-state" aria-live="polite">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="12" y="8" width="40" height="48" rx="5"/>
        <line x1="22" y1="22" x2="42" y2="22"/>
        <line x1="22" y1="32" x2="38" y2="32"/>
        <line x1="22" y1="42" x2="34" y2="42"/>
      </svg>
      <p>${title}</p>
      <span>${sub}</span>
    </li>
  `;
}

function buildTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item${task.completed ? ' completed' : ''}`;
  li.dataset.id = task.id;
  li.setAttribute('role', 'listitem');

  li.innerHTML = `
    <label class="task-checkbox" aria-label="Mark "${escapeHtml(task.text)}" as ${task.completed ? 'active' : 'completed'}">
      <input type="checkbox" id="cb-${task.id}" ${task.completed ? 'checked' : ''} aria-checked="${task.completed}">
      <span class="checkmark" aria-hidden="true"></span>
    </label>
    <span class="task-text" id="text-${task.id}">${escapeHtml(task.text)}</span>
    <button class="delete-btn" aria-label="Delete task: ${escapeHtml(task.text)}" title="Delete task">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4h6v2"/>
      </svg>
    </button>
  `;

  // Checkbox — toggle complete
  const cb = li.querySelector('input[type="checkbox"]');
  cb.addEventListener('change', () => toggleTask(task.id));

  // Delete button
  const delBtn = li.querySelector('.delete-btn');
  delBtn.addEventListener('click', () => deleteTask(task.id, li));

  return li;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function updateStats() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active    = total - completed;

  statTotal.textContent  = total;
  statActive.textContent = active;
  statDone.textContent   = completed;

  itemsLeftLabel.textContent = `${active} item${active !== 1 ? 's' : ''} left`;

  clearCompletedBtn.disabled = completed === 0;
}

// ─── Actions ──────────────────────────────────────────────────────────────────
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    shakeinput();
    return;
  }

  const task = {
    id:        `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    completed: false,
  };

  tasks.unshift(task);  // newest first
  saveTasks();
  taskInput.value = '';
  taskInput.focus();
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

function deleteTask(id, liEl) {
  liEl.classList.add('removing');
  liEl.addEventListener('animationend', () => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }, { once: true });
}

function clearCompleted() {
  if (tasks.every(t => !t.completed)) return;
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}

// ─── Filter ───────────────────────────────────────────────────────────────────
function setFilter(filter) {
  currentFilter = filter;
  filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
    btn.setAttribute('aria-pressed', btn.dataset.filter === filter ? 'true' : 'false');
  });
  renderTasks();
}

// ─── UX Helpers ───────────────────────────────────────────────────────────────
function shakeinput() {
  taskInput.style.borderColor = 'var(--danger)';
  taskInput.style.boxShadow   = '0 0 0 4px rgba(239,68,68,.15)';
  taskInput.style.animation   = 'none';

  // trigger reflow
  void taskInput.offsetWidth;
  taskInput.style.animation = 'shake .35s cubic-bezier(.36,.07,.19,.97) both';

  setTimeout(() => {
    taskInput.style.borderColor = '';
    taskInput.style.boxShadow   = '';
    taskInput.style.animation   = '';
  }, 500);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
loadTasks();
setFilter('all');   // also calls renderTasks
