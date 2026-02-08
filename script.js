let db;
const request = indexedDB.open("TodoWidgetDB", 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = (e) => {
    db = e.target.result;
    renderTasks();
};

// Configuração da Data
function setupDate() {
    const today = new Date();
    const options = { weekday: 'long', month: 'long' };
    
    document.getElementById("dayName").textContent = today.toLocaleDateString('pt-BR', { weekday: 'long' });
    document.getElementById("dayNumber").textContent = today.getDate();
    document.getElementById("monthName").textContent = today.toLocaleDateString('pt-BR', { month: 'long' });
}

// Adicionar Tarefa ao IndexedDB
document.getElementById("addBtn").addEventListener("click", (e) => {
    e.preventDefault();
    const input = document.getElementById("newTask");
    const taskText = input.value.trim();

    if (taskText !== "") {
        const transaction = db.transaction(["tasks"], "readwrite");
        const store = transaction.objectStore("tasks");
        store.add({ text: taskText, completed: false });
        
        transaction.oncomplete = () => {
            input.value = "";
            renderTasks();
        };
    }
});

// Atualizar Progresso
function updateProgress() {
    const checkboxes = document.querySelectorAll('.task input[type="checkbox"]');
    const total = checkboxes.length;
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    const progressPercent = total === 0 ? 0 : (checked / total) * 100;
    document.querySelector('.progress-fill').style.width = `${progressPercent}%`;
    document.getElementById("progress-label").textContent = `${checked} / ${total} tarefas realizadas`;
}

// Renderizar tarefas do Banco de Dados
function renderTasks() {
    const container = document.getElementById("tasks-container");
    container.innerHTML = "";
    
    const store = db.transaction("tasks").objectStore("tasks");
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            const taskData = cursor.value;
            const taskDiv = document.createElement("div");
            taskDiv.className = "task";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = taskData.completed;
            checkbox.onclick = () => toggleTask(taskData.id, checkbox.checked);

            const span = document.createElement("span");
            span.className = "taskText";
            span.textContent = taskData.text;

            const removeBtn = document.createElement("button");
            removeBtn.className = "removeBtn";
            removeBtn.textContent = "×";
            removeBtn.onclick = () => deleteTask(taskData.id);

            taskDiv.appendChild(checkbox);
            taskDiv.appendChild(span);
            taskDiv.appendChild(removeBtn);
            container.appendChild(taskDiv);
            
            cursor.continue();
        }
        updateProgress();
    };
}

function toggleTask(id, completed) {
    const transaction = db.transaction(["tasks"], "readwrite");
    const store = transaction.objectStore("tasks");
    store.get(id).onsuccess = (e) => {
        const data = e.target.result;
        data.completed = completed;
        store.put(data);
    };
    transaction.oncomplete = renderTasks;
}

function deleteTask(id) {
    const transaction = db.transaction(["tasks"], "readwrite");
    transaction.objectStore("tasks").delete(id);
    transaction.oncomplete = renderTasks;
}

setupDate();