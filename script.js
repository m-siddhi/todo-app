// returns todays date
const todayStr = () => new Date().toISOString().slice(0, 10);
// return current time in ms
const now = () => Date.now();
// shortcut for document.querySelector()
const qs = (sel) => document.querySelector(sel);
// saves data to localStorage
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));
// loads from localStorage or uses default def if nothing is found
const load = (key, def) =>
  JSON.parse(localStorage.getItem(key) || JSON.stringify(def));

// categories for sidebar and dropdown
const fixedLists = [
  "To-Do",
  "Groceries",
  "Work",
  "Movies to Watch",
  "Family",
  "Travel",
];

// main to do list loaded from localStprage
let tasks = load("tasks", []);

// user currently working at
let currentView = "To-Do";

// dom selection
const sidebar = qs("#sidebar");
const categorySelect = qs("#categorySelect");
const taskInput = qs("#taskInput");
const dueDateInput = qs("#dueDateInput");
const addBtn = qs("#addBtn");
const taskContainer = qs("#taskContainer");
const viewTitle = qs("#viewTitle");

// renders your list categories in sidebar and updates the view title and tasks when clicked
function renderSidebar() {
  sidebar.innerHTML = "";
  fixedLists.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    li.dataset.name = name;
    if (name === currentView) li.classList.add("active");
    li.onclick = () => {
      currentView = name;
      viewTitle.textContent = name;
      renderSidebar();
      renderTasks();
    };
    sidebar.appendChild(li);
  });
}

// remove old completed tasks (auto-cleanuup after 1 hour) and shows only relevant task based on current view
function renderTasks() {
  // Auto-remove tasks completed over 1 hour ago
  const oneHour = 3600000; // ms
  const nowTime = now();
  tasks = tasks.filter(
    (t) => !t.completedAt || nowTime - t.completedAt < oneHour
  );
  save("tasks", tasks);

  taskContainer.innerHTML = "";
  let filtered = [];

  if (currentView === "My Day") {
    filtered = tasks.filter((t) => t.date === todayStr());
  } else if (currentView === "To-Do") {
    filtered = tasks;
  } else {
    filtered = tasks.filter((t) => t.list === currentView);
  }

  if (filtered.length === 0) {
    taskContainer.innerHTML = '<p style="color:#777">No tasks here yet 🙂</p>';
    return;
  }

  filtered.forEach((t) => {
    const d = document.createElement("div");
    d.className = "task" + (t.completed ? " completed" : "");
    d.innerHTML = `
        <div class="task-header">
          <input type="checkbox" ${t.completed ? "checked" : ""} data-id="${
      t.id
    }">
          <span class="text">${t.text}</span>
        </div>
        <div class="category">
          ${
            currentView === "To-Do"
              ? `${t.list} • ${t.date}`
              : currentView === "My Day"
              ? `${t.list}`
              : ``
          }
        </div>
      `;
    taskContainer.appendChild(d);
  });
}

// add new task to correct category and refreshes if needed
addBtn.onclick = () => {
  const text = taskInput.value.trim();
  const list = categorySelect.value;
  const date = dueDateInput.value || todayStr();

  if (!text) return;

  const newTask = {
    id: Date.now(),
    text,
    list,
    date,
    completed: false,
    completedAt: null,
  };

  tasks.push(newTask);
  save("tasks", tasks);

  taskInput.value = "";
  dueDateInput.value = "";

  const shouldShow =
    currentView === "To-Do" ||
    currentView === list ||
    (currentView === "My Day" && date === todayStr());

  if (shouldShow) renderTasks();
};

// marks a task as completed and saves it
taskContainer.addEventListener("change", (e) => {
  if (e.target.matches('input[type="checkbox"]')) {
    const id = +e.target.dataset.id;
    tasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: true, completedAt: now() } : t
    );
    save("tasks", tasks);
    renderTasks();
  }
});

// lets user press enter instead of clicking add
taskInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") addBtn.click();
});

renderSidebar();
renderTasks();

setInterval(() => {
  renderTasks();
}, 60000);
