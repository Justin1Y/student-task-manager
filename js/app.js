const API_BASE_URL = "http://127.0.0.1:5001/api";
const AUTH_TOKEN_KEY = "authToken";
const AUTH_USER_KEY = "authUser";

document.addEventListener("DOMContentLoaded", () => {
    initializeThemeToggle();

    initializeApp().catch((error) => {
        console.error(error);

        const isLoginPage = window.location.pathname.includes("login.html");

        if (!isLoginPage) {
            alert(error.message || "Something went wrong while loading the app.");
        }
    });
});

async function initializeApp() {
    const currentUser = await initializeAuth();

    if (!currentUser) {
        return;
    }

    initializeLogout();
    displayUser(currentUser);

    await initializeTasksPage();
    await initializeCalendarPage();
    await initializeDashboardPage();
    await initializeSettingsPage(currentUser);
}

/* =========================
   AUTH / API
========================= */

async function initializeAuth() {
    const isLoginPage = window.location.pathname.includes("login.html");
    const isRegisterPage = window.location.pathname.includes("register.html");
    const token = getAuthToken();

    if (isLoginPage || isRegisterPage) {
        if (isLoginPage) {
            initializeLoginPage();
        }

        if (isRegisterPage) {
            initializeRegisterPage();
        }

        if (!token) {
            return null;
        }

        try {
            const user = await fetchCurrentUser();
            storeAuthSession(token, user);
            window.location.href = "index.html";
        } catch (error) {
            clearAuthSession();
        }

        return null;
    }

    if (!token) {
        redirectToLogin();
        return null;
    }

    try {
        const user = await fetchCurrentUser();
        storeAuthSession(token, user);
        return user;
    } catch (error) {
        clearAuthSession();
        redirectToLogin();
        return null;
    }
}

async function apiRequest(path, options = {}, config = {}) {
    const { requireAuth = true, redirectOnUnauthorized = true } = config;
    const headers = new Headers(options.headers || {});
    const token = getAuthToken();

    if (requireAuth && token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const hasBody = options.body !== undefined;

    if (hasBody && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        body: hasBody && typeof options.body !== "string"
            ? JSON.stringify(options.body)
            : options.body
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        if (response.status === 401 && redirectOnUnauthorized) {
            clearAuthSession();

            if (!window.location.pathname.includes("login.html")) {
                redirectToLogin();
            }
        }

        throw new Error(data.message || "Request failed.");
    }

    return data;
}

function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredUser() {
    const user = localStorage.getItem(AUTH_USER_KEY);
    return user ? JSON.parse(user) : null;
}

function storeAuthSession(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem("username", user.name || user.account);
}

function clearAuthSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem("username");
}

function redirectToLogin() {
    window.location.href = "login.html";
}

async function fetchCurrentUser() {
    const response = await apiRequest("/auth/me");
    return response.user;
}

async function fetchTasks() {
    const response = await apiRequest("/tasks");
    return response.data || [];
}

async function createTask(payload) {
    const response = await apiRequest("/tasks", {
        method: "POST",
        body: payload
    });
    return response.data;
}

async function updateTask(id, payload) {
    const response = await apiRequest(`/tasks/${id}`, {
        method: "PUT",
        body: payload
    });
    return response.data;
}

async function deleteTaskRequest(id) {
    return apiRequest(`/tasks/${id}`, {
        method: "DELETE"
    });
}

/* =========================
   LOGIN / USER
========================= */

function initializeLoginPage() {
    const loginForm = document.getElementById("loginForm");
    const loginBtn = document.getElementById("loginBtn");
    const accountInput = document.getElementById("accountInput");
    const passwordInput = document.getElementById("passwordInput");

    if (!loginForm || !loginBtn || !accountInput || !passwordInput) {
        return;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const account = accountInput.value.trim();
        const password = passwordInput.value.trim();

        if (!account) {
            alert("Please enter your account.");
            accountInput.focus();
            return;
        }

        if (!password) {
            alert("Please enter your password.");
            passwordInput.focus();
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "Signing In...";

        try {
            const response = await apiRequest(
                "/auth/login",
                {
                    method: "POST",
                    body: { account, password }
                },
                {
                    requireAuth: false,
                    redirectOnUnauthorized: false
                }
            );

            storeAuthSession(response.token, response.user);
            window.location.href = "index.html";
        } catch (error) {
            alert(error.message || "Login failed.");
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "Log In";
        }
    });
}

function initializeRegisterPage() {
    const registerForm = document.getElementById("registerForm");
    const registerBtn = document.getElementById("registerBtn");
    const tenantNameInput = document.getElementById("tenantNameInput");
    const nameInput = document.getElementById("nameInput");
    const accountInput = document.getElementById("registerAccountInput");
    const passwordInput = document.getElementById("registerPasswordInput");

    if (!registerForm || !registerBtn || !tenantNameInput || !nameInput || !accountInput || !passwordInput) {
        return;
    }

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const tenantName = tenantNameInput.value.trim();
        const name = nameInput.value.trim();
        const account = accountInput.value.trim();
        const password = passwordInput.value.trim();

        if (!tenantName) {
            alert("Please enter your workspace name.");
            tenantNameInput.focus();
            return;
        }

        if (!name) {
            alert("Please enter your name.");
            nameInput.focus();
            return;
        }

        if (!account) {
            alert("Please choose an account.");
            accountInput.focus();
            return;
        }

        if (!password) {
            alert("Please create a password.");
            passwordInput.focus();
            return;
        }

        registerBtn.disabled = true;
        registerBtn.textContent = "Creating...";

        try {
            const response = await apiRequest(
                "/auth/register",
                {
                    method: "POST",
                    body: { tenantName, name, account, password }
                },
                {
                    requireAuth: false,
                    redirectOnUnauthorized: false
                }
            );

            storeAuthSession(response.token, response.user);
            window.location.href = "index.html";
        } catch (error) {
            alert(error.message || "Registration failed.");
        } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = "Create Account";
        }
    });
}

function displayUser(user = getStoredUser()) {
    if (!user) {
        return;
    }

    const displayName = user.name || user.account;
    const displayElements = document.querySelectorAll(".user-name, #displayUsername");
    const accountElements = document.querySelectorAll(".user-email");
    const avatars = document.querySelectorAll(".avatar");

    displayElements.forEach((element) => {
        element.textContent = displayName;
    });

    accountElements.forEach((element) => {
        element.textContent = user.account;
    });

    avatars.forEach((avatar) => {
        avatar.textContent = displayName.charAt(0).toUpperCase();
    });
}

function initializeLogout() {
    const logoutBtn = document.querySelector(".logout-section a");

    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener("click", (event) => {
        event.preventDefault();
        clearAuthSession();
        redirectToLogin();
    });
}

/* =========================
   TASKS PAGE
========================= */

async function initializeTasksPage() {
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

    let tasks = [];

    function getStatusLabel(status) {
        if (status === "pending") return "Pending";
        if (status === "in-progress") return "In Progress";
        if (status === "completed") return "Completed";
        return "Pending";
    }

    function renderEmptyState() {
        tasksGrid.innerHTML = `
            <div class="task-card">
                <h3>No tasks yet</h3>
                <p>Create your first task to start managing deadlines.</p>
            </div>
        `;
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

        if (filteredTasks.length === 0) {
            renderEmptyState();
            return;
        }

        filteredTasks.forEach((task) => {
            const card = document.createElement("div");
            card.className = "task-card";
            card.dataset.id = String(task.id);
            card.dataset.status = task.status;
            card.dataset.priority = task.priority;
            card.dataset.date = task.date;

            card.innerHTML = `
                <h3>${escapeHtml(task.title)}</h3>
                <p>${escapeHtml(task.description || "No description provided.")}</p>
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

            statusSelect.addEventListener("change", async (event) => {
                try {
                    statusSelect.disabled = true;
                    await updateTask(task.id, { status: event.target.value });
                    tasks = await fetchTasks();
                    renderTasks();
                } catch (error) {
                    alert(error.message || "Failed to update task.");
                    statusSelect.value = task.status;
                    statusSelect.disabled = false;
                }
            });

            deleteBtn.addEventListener("click", async () => {
                const confirmed = confirm(`Delete "${task.title}"?`);

                if (!confirmed) {
                    return;
                }

                try {
                    deleteBtn.disabled = true;
                    await deleteTaskRequest(task.id);
                    tasks = await fetchTasks();
                    renderTasks();
                } catch (error) {
                    alert(error.message || "Failed to delete task.");
                    deleteBtn.disabled = false;
                }
            });

            tasksGrid.appendChild(card);
        });
    }

    async function refreshTasks() {
        tasks = await fetchTasks();
        renderTasks();
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
        saveTaskBtn.addEventListener("click", async () => {
            const title = taskTitleInput.value.trim();
            const description = taskDescInput.value.trim();
            const priority = taskPriorityInput.value;
            const dueDate = taskDateInput.value;

            if (!title || !dueDate) {
                alert("Please enter a title and due date.");
                return;
            }

            try {
                saveTaskBtn.disabled = true;
                saveTaskBtn.textContent = "Saving...";

                await createTask({
                    title,
                    description,
                    priority,
                    status: "pending",
                    date: dueDate
                });

                taskTitleInput.value = "";
                taskDescInput.value = "";
                taskPriorityInput.value = "high";
                taskDateInput.value = "";

                taskModal.classList.add("hidden");
                await refreshTasks();
            } catch (error) {
                alert(error.message || "Failed to create task.");
            } finally {
                saveTaskBtn.disabled = false;
                saveTaskBtn.textContent = "Save";
            }
        });
    }

    await refreshTasks();
}

/* =========================
   CALENDAR PAGE
========================= */

async function initializeCalendarPage() {
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
    const navButtons = document.querySelectorAll(".calendar-nav-btn");
    const todayButton = document.querySelector(".calendar-today-btn");

    let tasks = await fetchTasks();
    let currentDate = new Date();

    if (tasks.length > 0) {
        const sortedTasks = [...tasks].sort((a, b) => new Date(a.date) - new Date(b.date));
        currentDate = new Date(sortedTasks[0].date);
    }

    const priorityDotClass = {
        high: "high-dot",
        medium: "medium-dot",
        low: "low-dot"
    };

    function getStatusLabel(status) {
        if (status === "pending") return "Pending";
        if (status === "in-progress") return "In Progress";
        if (status === "completed") return "Completed";
        return "Pending";
    }

    function updateDetailPanel(date, dayTasks) {
        selectedDateTitle.textContent = date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });

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
        const year = currentDate.getFullYear();
        const monthIndex = currentDate.getMonth();
        const monthName = currentDate.toLocaleDateString("en-US", { month: "long" });

        const monthTasks = tasks.filter((task) => {
            const taskDate = new Date(task.date);
            return taskDate.getFullYear() === year && taskDate.getMonth() === monthIndex;
        });

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

            const dayTasks = monthTasks.filter((task) => new Date(task.date).getDate() === day);

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
                updateDetailPanel(new Date(year, monthIndex, day), dayTasks);
            });

            calendarGrid.appendChild(dayButton);
        }

        const preferredDay = monthTasks.length > 0
            ? new Date(monthTasks[0].date).getDate()
            : 1;
        const defaultDate = new Date(year, monthIndex, preferredDay);
        const defaultTasks = monthTasks.filter((task) => new Date(task.date).getDate() === preferredDay);
        const defaultButton = calendarGrid.querySelector(`[data-day="${preferredDay}"]`);

        if (defaultButton) {
            defaultButton.classList.add("selected");
        }

        updateDetailPanel(defaultDate, defaultTasks);
    }

    if (navButtons.length >= 2) {
        navButtons[0].addEventListener("click", () => {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            renderCalendar();
        });

        navButtons[1].addEventListener("click", () => {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            renderCalendar();
        });
    }

    if (todayButton) {
        todayButton.addEventListener("click", () => {
            currentDate = new Date();
            renderCalendar();
        });
    }

    renderCalendar();
}

/* =========================
   DASHBOARD PAGE
========================= */

async function initializeDashboardPage() {
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

    const tasks = await fetchTasks();

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

    if (upcomingTasks.length === 0) {
        upcomingTasksContainer.innerHTML = `
            <div class="task-card">
                <h3>No upcoming tasks</h3>
                <p>Create a task to see it appear here.</p>
            </div>
        `;
        return;
    }

    upcomingTasksContainer.innerHTML = "";

    upcomingTasks.forEach((task) => {
        const card = document.createElement("div");
        card.className = "task-card";

        card.innerHTML = `
            <h3>${escapeHtml(task.title)}</h3>
            <p>${escapeHtml(task.description || "No description provided.")}</p>
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

async function initializeSettingsPage(currentUser) {
    const exportBtn = document.getElementById("exportBtn");
    const clearBtn = document.getElementById("clearDataBtn");
    const studentName = document.getElementById("studentName");
    const studentEmail = document.getElementById("studentEmail");

    if (studentName) {
        studentName.value = currentUser.name || currentUser.account;
    }

    if (studentEmail) {
        studentEmail.value = currentUser.account;
    }

    if (exportBtn) {
        exportBtn.addEventListener("click", async () => {
            try {
                const tasks = await fetchTasks();

                const blob = new Blob([JSON.stringify(tasks, null, 2)], {
                    type: "application/json"
                });

                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "tasks.json";
                anchor.click();

                URL.revokeObjectURL(url);
            } catch (error) {
                alert(error.message || "Failed to export tasks.");
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", async () => {
            const confirmClear = confirm("Are you sure you want to delete all task data?");

            if (!confirmClear) {
                return;
            }

            try {
                clearBtn.disabled = true;

                const tasks = await fetchTasks();
                await Promise.all(tasks.map((task) => deleteTaskRequest(task.id)));

                alert("All task data has been cleared.");
                window.location.reload();
            } catch (error) {
                alert(error.message || "Failed to clear task data.");
                clearBtn.disabled = false;
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

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}
