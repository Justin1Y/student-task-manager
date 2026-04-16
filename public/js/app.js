document.addEventListener("DOMContentLoaded", () => {
    initializeLoginPage();
    checkLogin();
    displayUser();
    initializeLogout();

    initializeTasksPage();
    initializeCalendarPage();
    initializeDashboardPage();
    initializeThemeToggle();
    initializeSettingsPage();
});

/* =========================
   GLOBAL TASK STORAGE
========================= */

const defaultTasks = [
    {
        id: 1,
        title: "Study for Calculus Exam",
        description: "Review chapters 5–8, practice problems",
        priority: "high",
        status: "pending",
        date: "2026-04-10"
    },
    {
        id: 2,
        title: "Read Biology Chapters",
        description: "Read chapters 10–12 for next week",
        priority: "low",
        status: "pending",
        date: "2026-04-12"
    },
    {
        id: 3,
        title: "Submit English Essay",
        description: "Write a 2000-word essay on Shakespeare",
        priority: "medium",
        status: "pending",
        date: "2026-04-20"
    },
    {
        id: 4,
        title: "Complete React Assignment",
        description: "Build a todo app with React hooks and context API",
        priority: "high",
        status: "in-progress",
        date: "2026-04-15"
    },
    {
        id: 5,
        title: "Group Project Meeting",
        description: "Discuss project timeline and deliverables",
        priority: "medium",
        status: "completed",
        date: "2026-04-08"
    }
];

function getTasks() {
    let tasks = JSON.parse(localStorage.getItem("tasks"));

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        tasks = [...defaultTasks];
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    return tasks;
}

function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* =========================
   LOGIN / USER
========================= */

function initializeLoginPage() {
    const loginBtn = document.getElementById("loginBtn");
    const usernameInput = document.getElementById("usernameInput");

    if (!loginBtn || !usernameInput) {
        return;
    }

    loginBtn.addEventListener("click", () => {
        const username = usernameInput.value.trim();

        if (!username) {
            alert("Please enter your name.");
            return;
        }

        localStorage.setItem("username", username);
        window.location.href = "index.html";
    });
}

function checkLogin() {
    const isLoginPage = window.location.pathname.includes("login.html");
    const username = localStorage.getItem("username");

    if (!isLoginPage && !username) {
        window.location.href = "login.html";
    }

    if (isLoginPage && username) {
        window.location.href = "index.html";
    }
}

function displayUser() {
    const username = localStorage.getItem("username");
    const displayElements = document.querySelectorAll(".user-name, #displayUsername");

    if (!username || displayElements.length === 0) {
        return;
    }

    displayElements.forEach((element) => {
        element.textContent = username;
    });
}

function initializeLogout() {
    const logoutBtn = document.querySelector(".logout-section a");

    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("username");
        window.location.href = "login.html";
    });
}

/* =========================
   TASKS PAGE
========================= */

function initializeTasksPage() {
    const tasksGrid = document.getElementById("tasksGrid");

    if (!tasksGrid) {
        return;
    }

    const statusFilter = document.getElementById("statusFilter");
    const priorityFilter = document.getElementById("priorityFilter");
    const sortBy = document.getElementById("sortBy");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");

    const openTaskModalBtn = document.getElementById("openTaskModalBtn");
    const taskModal = document.getElementById("taskModal");
    const saveTaskBtn = document.getElementById("saveTaskBtn");
    const cancelTaskBtn = document.getElementById("cancelTaskBtn");

    const taskTitleInput = document.getElementById("taskTitleInput");
    const taskDescInput = document.getElementById("taskDescInput");
    const taskPriorityInput = document.getElementById("taskPriorityInput");
    const taskDateInput = document.getElementById("taskDateInput");

    const priorityRank = {
        high: 1,
        medium: 2,
        low: 3
    };

    let tasks = getTasks();

    function getStatusLabel(status) {
        if (status === "pending") return "Pending";
        if (status === "in-progress") return "In Progress";
        if (status === "completed") return "Completed";
        return "Pending";
    }

    function renderTasks() {
        tasksGrid.innerHTML = "";

        let filteredTasks = [...tasks];

        const selectedStatus = statusFilter ? statusFilter.value : "all";
        const selectedPriority = priorityFilter ? priorityFilter.value : "all";
        const selectedSort = sortBy ? sortBy.value : "due-date";

        if (selectedStatus !== "all") {
            filteredTasks = filteredTasks.filter((task) => task.status === selectedStatus);
        }

        if (selectedPriority !== "all") {
            filteredTasks = filteredTasks.filter((task) => task.priority === selectedPriority);
        }

        if (selectedSort === "priority") {
            filteredTasks.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
        } else {
            filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        filteredTasks.forEach((task) => {
            const card = document.createElement("div");
            card.className = "task-card";
            card.dataset.id = String(task.id);
            card.dataset.status = task.status;
            card.dataset.priority = task.priority;
            card.dataset.date = task.date;

            card.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description || "No description provided."}</p>
                <div class="task-meta">
                    <span>${formatDate(task.date)}</span>
                    <span class="priority ${task.priority}">${capitalize(task.priority)}</span>
                </div>
                <span class="badge ${task.status}">${getStatusLabel(task.status)}</span>
                <div class="task-actions">
                    <select class="status-select">
                        <option value="pending" ${task.status === "pending" ? "selected" : ""}>Pending</option>
                        <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In Progress</option>
                        <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
                    </select>
                    <button class="delete-btn" type="button">Delete</button>
                </div>
            `;

            const statusSelect = card.querySelector(".status-select");
            const deleteBtn = card.querySelector(".delete-btn");

            statusSelect.addEventListener("change", (event) => {
                task.status = event.target.value;
                saveTasks(tasks);
                renderTasks();
            });

            deleteBtn.addEventListener("click", () => {
                tasks = tasks.filter((item) => item.id !== task.id);
                saveTasks(tasks);
                renderTasks();
            });

            tasksGrid.appendChild(card);
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", renderTasks);
    }

    if (priorityFilter) {
        priorityFilter.addEventListener("change", renderTasks);
    }

    if (sortBy) {
        sortBy.addEventListener("change", renderTasks);
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", () => {
            if (statusFilter) statusFilter.value = "all";
            if (priorityFilter) priorityFilter.value = "all";
            if (sortBy) sortBy.value = "due-date";
            renderTasks();
        });
    }

    if (openTaskModalBtn && taskModal) {
        openTaskModalBtn.addEventListener("click", () => {
            taskModal.classList.remove("hidden");
        });
    }

    if (cancelTaskBtn && taskModal) {
        cancelTaskBtn.addEventListener("click", () => {
            taskModal.classList.add("hidden");
        });
    }

    if (saveTaskBtn && taskModal) {
        saveTaskBtn.addEventListener("click", () => {
            const title = taskTitleInput.value.trim();
            const description = taskDescInput.value.trim();
            const priority = taskPriorityInput.value;
            const dueDate = taskDateInput.value;

            if (!title || !dueDate) {
                alert("Please enter a title and due date.");
                return;
            }

            const newTask = {
                id: Date.now(),
                title,
                description,
                priority,
                status: "pending",
                date: dueDate
            };

            tasks.push(newTask);
            saveTasks(tasks);
            renderTasks();

            taskTitleInput.value = "";
            taskDescInput.value = "";
            taskPriorityInput.value = "high";
            taskDateInput.value = "";

            taskModal.classList.add("hidden");
        });
    }

    renderTasks();
}

/* =========================
   CALENDAR PAGE
========================= */

function initializeCalendarPage() {
    const calendarGrid = document.getElementById("calendarGrid");

    if (!calendarGrid) {
        return;
    }

    const calendarMonthTitle = document.getElementById("calendarMonthTitle");
    const selectedDateTitle = document.getElementById("selectedDateTitle");
    const selectedTaskTitle = document.getElementById("selectedTaskTitle");
    const selectedTaskPriority = document.getElementById("selectedTaskPriority");
    const selectedTaskDescription = document.getElementById("selectedTaskDescription");
    const selectedTaskStatus = document.getElementById("selectedTaskStatus");

    const year = 2026;
    const monthIndex = 3;
    const monthName = "April";

    const priorityDotClass = {
        high: "high-dot",
        medium: "medium-dot",
        low: "low-dot"
    };

    function getTasksForMonth() {
        const allTasks = getTasks();

        return allTasks.filter((task) => {
            const taskDate = new Date(task.date);
            return taskDate.getFullYear() === year && taskDate.getMonth() === monthIndex;
        });
    }

    function getStatusLabel(status) {
        if (status === "pending") return "Pending";
        if (status === "in-progress") return "In Progress";
        if (status === "completed") return "Completed";
        return "Pending";
    }

    function updateDetailPanel(day, dayTasks) {
        selectedDateTitle.textContent = `${monthName} ${day}, ${year}`;

        if (!dayTasks || dayTasks.length === 0) {
            selectedTaskTitle.textContent = "No tasks scheduled";
            selectedTaskDescription.textContent = "There are no tasks planned for this day.";
            selectedTaskPriority.textContent = "None";
            selectedTaskPriority.className = "priority-pill medium";
            selectedTaskStatus.textContent = "Available";
            selectedTaskStatus.className = "badge pending";
            return;
        }

        const firstTask = dayTasks[0];

        selectedTaskTitle.textContent = firstTask.title;
        selectedTaskDescription.textContent = firstTask.description || "No description provided.";
        selectedTaskPriority.textContent = capitalize(firstTask.priority);
        selectedTaskPriority.className = `priority-pill ${firstTask.priority}`;
        selectedTaskStatus.textContent = getStatusLabel(firstTask.status);
        selectedTaskStatus.className = `badge ${firstTask.status}`;
    }

    function renderCalendar() {
        const tasks = getTasksForMonth();

        calendarGrid.innerHTML = "";
        calendarMonthTitle.textContent = `${monthName} ${year}`;

        const firstDayOfMonth = new Date(year, monthIndex, 1).getDay();
        const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "calendar-day empty";
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDaysInMonth; day++) {
            const dayButton = document.createElement("button");
            dayButton.type = "button";
            dayButton.className = "calendar-day";
            dayButton.dataset.day = String(day);

            const dayNumber = document.createElement("span");
            dayNumber.className = "day-number";
            dayNumber.textContent = String(day);
            dayButton.appendChild(dayNumber);

            const dayTasks = tasks.filter((task) => new Date(task.date).getDate() === day);

            if (dayTasks.length > 0) {
                const label = document.createElement("span");
                label.className = "calendar-task-label";
                label.textContent = dayTasks[0].title;
                dayButton.appendChild(label);

                const dot = document.createElement("span");
                dot.className = `day-dot ${priorityDotClass[dayTasks[0].priority]}`;
                dayButton.appendChild(dot);
            }

            dayButton.addEventListener("click", () => {
                const allDays = Array.from(calendarGrid.querySelectorAll(".calendar-day"));
                allDays.forEach((button) => button.classList.remove("selected"));
                dayButton.classList.add("selected");
                updateDetailPanel(day, dayTasks);
            });

            calendarGrid.appendChild(dayButton);
        }

        const defaultDay = 8;
        const defaultTasks = tasks.filter((task) => new Date(task.date).getDate() === defaultDay);

        const defaultButton = calendarGrid.querySelector(`[data-day="${defaultDay}"]`);
        if (defaultButton) {
            defaultButton.classList.add("selected");
        }

        updateDetailPanel(defaultDay, defaultTasks);
    }

    renderCalendar();
}

/* =========================
   DASHBOARD PAGE
========================= */

function initializeDashboardPage() {
    const totalTasksElement = document.getElementById("dashboardTotalTasks");
    const inProgressTasksElement = document.getElementById("dashboardInProgressTasks");
    const completedTasksElement = document.getElementById("dashboardCompletedTasks");
    const progressTextElement = document.getElementById("dashboardProgressText");
    const progressPercentElement = document.getElementById("dashboardProgressPercent");
    const progressFillElement = document.getElementById("dashboardProgressFill");
    const pendingSummaryElement = document.getElementById("dashboardPendingSummary");
    const inProgressSummaryElement = document.getElementById("dashboardInProgressSummary");
    const completedSummaryElement = document.getElementById("dashboardCompletedSummary");
    const upcomingTasksContainer = document.getElementById("dashboardUpcomingTasks");

    if (
        !totalTasksElement ||
        !inProgressTasksElement ||
        !completedTasksElement ||
        !progressTextElement ||
        !progressPercentElement ||
        !progressFillElement ||
        !pendingSummaryElement ||
        !inProgressSummaryElement ||
        !completedSummaryElement ||
        !upcomingTasksContainer
    ) {
        return;
    }

    const tasks = getTasks();

    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter((task) => task.status === "pending");
    const inProgressTasks = tasks.filter((task) => task.status === "in-progress");
    const completedTasks = tasks.filter((task) => task.status === "completed");

    const completedCount = completedTasks.length;
    const inProgressCount = inProgressTasks.length;
    const pendingCount = pendingTasks.length;

    const progressPercent = totalTasks > 0
        ? Math.round((completedCount / totalTasks) * 100)
        : 0;

    totalTasksElement.textContent = totalTasks;
    inProgressTasksElement.textContent = inProgressCount;
    completedTasksElement.textContent = completedCount;

    progressTextElement.textContent = `${completedCount} of ${totalTasks} tasks completed`;
    progressPercentElement.textContent = `${progressPercent}%`;
    progressFillElement.style.width = `${progressPercent}%`;

    pendingSummaryElement.textContent = `${pendingCount} Pending`;
    inProgressSummaryElement.textContent = `${inProgressCount} In Progress`;
    completedSummaryElement.textContent = `${completedCount} Completed`;

    const upcomingTasks = [...tasks]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    upcomingTasksContainer.innerHTML = "";

    upcomingTasks.forEach((task) => {
        const card = document.createElement("div");
        card.className = "task-card";

        card.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || "No description provided."}</p>
            <div class="task-meta">
                <span>${formatDate(task.date)}</span>
                <span class="priority ${task.priority}">${capitalize(task.priority)}</span>
            </div>
            <span class="badge ${task.status}">${capitalize(task.status)}</span>
        `;

        upcomingTasksContainer.appendChild(card);
    });
}

/* =========================
   THEME
========================= */

function initializeThemeToggle() {
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const themeStatusText = document.getElementById("themeStatusText");

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        if (themeStatusText) {
            themeStatusText.textContent = "Currently using dark mode";
        }
        if (themeToggleBtn) {
            themeToggleBtn.textContent = "Switch to Light Mode";
        }
    }

    if (!themeToggleBtn) {
        return;
    }

    themeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        const isDarkMode = document.body.classList.contains("dark-mode");

        if (isDarkMode) {
            localStorage.setItem("theme", "dark");
            if (themeStatusText) {
                themeStatusText.textContent = "Currently using dark mode";
            }
            themeToggleBtn.textContent = "Switch to Light Mode";
        } else {
            localStorage.setItem("theme", "light");
            if (themeStatusText) {
                themeStatusText.textContent = "Currently using light mode";
            }
            themeToggleBtn.textContent = "Switch to Dark Mode";
        }
    });
}

/* =========================
   SETTINGS
========================= */

function initializeSettingsPage() {
    const exportBtn = document.getElementById("exportBtn");
    const clearBtn = document.getElementById("clearDataBtn");

    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            const tasks = getTasks();

            const blob = new Blob([JSON.stringify(tasks, null, 2)], {
                type: "application/json"
            });

            const url = URL.createObjectURL(blob);

            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "tasks.json";
            anchor.click();

            URL.revokeObjectURL(url);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            const confirmClear = confirm("Are you sure you want to delete all task data?");

            if (confirmClear) {
                localStorage.removeItem("tasks");
                alert("All task data has been cleared.");
                location.reload();
            }
        });
    }
}

/* =========================
   HELPERS
========================= */

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
}

function capitalize(text) {
    if (!text) return "";
    if (text === "in-progress") return "In Progress";
    return text.charAt(0).toUpperCase() + text.slice(1);
}