// app.js

// --- Global Variables and Base URL ---
const API_BASE_URL = 'http://localhost:5000/api'; // Make sure this matches your backend URL
let authToken = localStorage.getItem('token'); // Get token from local storage on load
let tasks = []; // This will now store tasks fetched from the backend
let currentStatus = 'toStart'; // Still used for new task creation default status

// --- DOM Elements (for easier access) ---
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescInput = document.getElementById('taskDesc');
const taskDateInput = document.getElementById('taskDate');
const habitTimeSelect = document.getElementById('habitTime');
const editTaskIdInput = document.getElementById('editTaskId');
const authSection = document.getElementById('authSection'); // The authentication UI container
const mainAppContent = document.getElementById('mainAppContent'); // The main application dashboard content container
const overlay = document.getElementById('overlay'); // The overlay div for the form
const logoutButtonSidebar = document.querySelector('.sidebar .logout-button'); // Reference to the new logout button in sidebar


// --- Utility Functions ---

/**
 * Handles API calls to the backend.
 * @param {string} endpoint - The API endpoint (e.g., '/auth/login', '/habits').
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
 * @param {object} data - Request body data (for POST/PUT).
 * @returns {Promise<object>} - The JSON response data from the API.
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (authToken) {
        headers['x-auth-token'] = authToken; // Attach token for authenticated requests
    }

    const config = {
        method,
        headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const responseData = await response.json();

        if (!response.ok) {
            // Handle specific error messages from backend
            const errorMessage = responseData.msg || (responseData.errors && responseData.errors[0] && responseData.errors[0].msg) || 'Something went wrong.';
            console.error('API Error:', response.status, errorMessage, responseData);
            alert(`Error ${response.status}: ${errorMessage}`);
            // If unauthorized, clear token and potentially redirect to login
            if (response.status === 401) {
                logoutUser();
            }
            throw new Error(errorMessage);
        }
        return responseData;
    } catch (error) {
        console.error('API Call Failed:', error);
        throw error; // Re-throw to be caught by specific functions
    }
}

// --- Authentication Functions ---

async function registerUser() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const data = await apiCall('/auth/register', 'POST', { username, email, password });
        authToken = data.token;
        localStorage.setItem('token', authToken);
        alert('Registration successful! Logged in.');
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        handleAuthSuccess();
    } catch (error) {
        console.error('Registration failed:', error);
    }
}

async function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const data = await apiCall('/auth/login', 'POST', { email, password });
        authToken = data.token;
        localStorage.setItem('token', authToken);
        alert('Login successful!');
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        handleAuthSuccess();
    } catch (error) {
        console.error('Login failed:', error);
    }
}

function logoutUser() {
    authToken = null;
    localStorage.removeItem('token');
    tasks = []; // Clear local tasks
    renderTasks(); // Clear UI (will render empty columns and calendar)
    alert('Logged out. Please login again.');
    mainAppContent.style.display = 'none'; // Hide main content
    authSection.style.display = 'block'; // Show auth section
    if (logoutButtonSidebar) { // Hide sidebar logout button as well
        logoutButtonSidebar.style.display = 'none';
    }
}

function handleAuthSuccess() {
    authSection.style.display = 'none'; // Hide auth section
    mainAppContent.style.display = 'block'; // Show main content
    if (logoutButtonSidebar) { // Show sidebar logout button
        logoutButtonSidebar.style.display = 'block';
    }
    fetchTasks(); // Load user's data
}

// --- Task/Habit Functions ---

function showTaskForm(status = 'toStart', task = null) {
    taskForm.style.display = 'block';
    overlay.style.display = 'block'; // Show overlay when form appears
    editTaskIdInput.value = '';
    currentStatus = status; // Set default status for new tasks

    if (task) {
        // When editing, populate form with task data
        taskTitleInput.value = task.title;
        taskDescInput.value = task.description || '';
        taskDateInput.value = task.date || ''; // Assuming date might come from backend if added
        habitTimeSelect.value = task.timeOfDay || '';
        editTaskIdInput.value = task._id; // Use MongoDB's _id
    } else {
        // Clear form for new task
        taskTitleInput.value = '';
        taskDescInput.value = '';
        taskDateInput.value = '';
        habitTimeSelect.value = '';
    }
}

async function saveTask() {
    const title = taskTitleInput.value;
    const description = taskDescInput.value;
    const date = taskDateInput.value; // Important: Make sure your Habit model can store this date, or remove it if not needed for habits.
    const timeOfDay = habitTimeSelect.value;
    const id = editTaskIdInput.value; // This will be the backend _id if editing

    if (!title) {
        alert('Habit Title is required!');
        return;
    }

    const habitData = {
        title,
        description,
        timeOfDay,
        date, // Sending the date as provided by the form
    };

    try {
        if (id) {
            // Update existing habit
            await apiCall(`/habits/${id}`, 'PUT', habitData);
        } else {
            // Create new habit
            await apiCall('/habits', 'POST', habitData);
        }
        taskForm.style.display = 'none';
        overlay.style.display = 'none'; // Hide overlay when form is saved/closed
        await fetchTasks(); // Re-fetch all tasks to update UI
    } catch (error) {
        console.error('Failed to save habit:', error);
    }
}

function renderTasks() {
    ['toStart', 'inProgress', 'completed'].forEach(status => {
        const col = document.getElementById(status);
        col.querySelectorAll('.task').forEach(e => e.remove()); // Clear existing tasks

        tasks.filter(t => t.status === status).forEach(task => {
            const div = document.createElement('div');
            div.className = 'task';
            div.innerHTML = `
                <div class="task-title">${task.title}</div>
                <div>${task.description || ''}</div>
                <div>${task.date || ''} ${task.timeOfDay ? `(${task.timeOfDay})` : ''}</div>
                <div class="task-menu" onclick="event.stopPropagation(); this.classList.toggle('show-dropdown');">⋮
                    <div class="dropdown">
                        <button onclick='editTask("${task.id}")'>Edit</button>
                        <button onclick='deleteTask("${task.id}")'>Delete</button>
                        ${task.status !== 'toStart' ? `<button onclick="changeStatus('${task.id}', 'toStart')">Move to Start</button>` : ''}
                        ${task.status !== 'inProgress' ? `<button onclick="changeStatus('${task.id}', 'inProgress')">Move to Progress</button>` : ''}
                        ${task.status !== 'completed' ? `<button onclick="changeStatus('${task.id}', 'completed')">Move to Completed</button>` : ''}
                    </div>
                </div>
            `;
            col.appendChild(div);
        });
    });

    renderHistory(); // Ensure history is always updated
    renderHabitCalendar(); // Ensure calendar is always updated
}


async function fetchTasks() {
    if (!authToken) {
        // console.log("No auth token found, not fetching tasks.");
        tasks = []; // Clear tasks if not authenticated
        renderTasks(); // Render with empty tasks to clear UI
        return;
    }
    try {
        const fetchedHabits = await apiCall('/habits');
        // Map backend habits to frontend 'tasks' structure
        tasks = fetchedHabits.map(habit => ({
            ...habit,
            // Assign a 'status' for frontend columns. This is a frontend-only concept for now.
            // If your backend Habit has a 'status' field, use habit.status here.
            status: 'toStart', // Default for tasks in columns, until backend supports explicit status
            id: habit._id // Map backend _id to frontend id for consistency with old code
        }));

        renderTasks();
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        // If an error occurs (e.g., token expired), prompt re-login
        if (error.message.includes('No token') || error.message.includes('Token is not valid')) {
            logoutUser();
        }
    }
}

async function deleteTask(id) {
    if (confirm('Are you sure you want to delete this habit?')) {
        try {
            await apiCall(`/habits/${id}`, 'DELETE');
            await fetchTasks(); // Re-fetch tasks to update UI
        } catch (error) {
            console.error('Failed to delete habit:', error);
        }
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id); // Find by frontend 'id' (which is backend '_id')
    if (task) {
        showTaskForm(task.status, task); // Pass the found task object to populate the form
    }
}

async function changeStatus(id, newStatus) {
    // This function assumes your backend `Habit` model has a `status` field.
    // If it doesn't, this PUT request will likely fail or just ignore the 'status' field.
    // You MUST add `status: { type: String, enum: ['toStart', 'inProgress', 'completed'], default: 'toStart' }`
    // to your `HabitSchema` in `backend/models/Habit.js` and update your backend route.

    try {
        await apiCall(`/habits/${id}`, 'PUT', { status: newStatus });
        // After successful update, update the local task object's status
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].status = newStatus;
        }

        if (newStatus === 'completed') {
            const task = tasks.find(t => t.id === id);
            if (task) {
                const today = new Date().toISOString().slice(0, 10);
                saveToHistory(task.title, today); // Call frontend history function
            }
        }
        renderTasks(); // Re-render to reflect status change without re-fetching all if only status changed
        // If you prefer, you can re-fetch all: await fetchTasks();
    } catch (error) {
        console.error('Failed to change task status:', error);
        alert('Failed to change status. Ensure your backend Habit model supports "status" field.');
    }
}

function searchTasks() {
    const query = document.getElementById('searchBox').value.toLowerCase();
    // Render all tasks first to ensure they are present in the DOM
    renderTasks();
    document.querySelectorAll('.column .task').forEach(taskDiv => {
        const title = taskDiv.querySelector('.task-title').textContent.toLowerCase();
        const descriptionElement = taskDiv.querySelector('div:nth-child(2)');
        const description = descriptionElement ? descriptionElement.textContent.toLowerCase() : '';
        const dateElement = taskDiv.querySelector('div:nth-child(3)');
        const date = dateElement ? dateElement.textContent.toLowerCase() : '';

        const combinedText = `${title} ${description} ${date}`;
        taskDiv.style.display = combinedText.includes(query) ? 'block' : 'none';
    });
}


// --- Habit Calendar Functions ---

function renderHabitCalendar() {
    const weekDates = getCurrentWeekDates();
    const container = document.getElementById('habitCalendarContainer');
    container.innerHTML = '';

    if (tasks.length === 0) {
        container.innerHTML = "<p>No habits to track yet.</p>";
        return;
    }

    let table = `<table border="1" style="width:100%; text-align:center; border-collapse:collapse;">
        <tr>
            <th>Habit</th>
            ${weekDates.map(date => `<th>${new Date(date + 'T00:00:00').toDateString().slice(0, 3)}</th>`).join('')}
            <th>🔥 Streak</th>
        </tr>`;

    tasks.forEach(habit => {
        const streak = calculateStreak(habit.completedDates || []);
        table += `<tr>
            <td>${habit.title}</td>
            ${weekDates.map(date => {
                const checked = (habit.completedDates || []).includes(date) ? 'checked' : '';
                // Use a label and input for the toggle switch
                return `<td>
                    <label class="switch">
                        <input type="checkbox" onchange="toggleHabitComplete('${habit._id}', '${date}')" ${checked}>
                        <span class="slider"></span>
                    </label>
                </td>`;
            }).join('')}
            <td><strong>${streak} days</strong></td>
        </tr>`;
    });

    table += '</table>';
    container.innerHTML = table;
}

async function toggleHabitComplete(id, date) {
    const habit = tasks.find(t => t._id === id); // Find by backend _id
    if (!habit) return;

    let updatedCompletedDates = [...(habit.completedDates || [])];
    if (updatedCompletedDates.includes(date)) {
        updatedCompletedDates = updatedCompletedDates.filter(d => d !== date);
    } else {
        updatedCompletedDates.push(date);
    }

    try {
        await apiCall(`/habits/${id}`, 'PUT', { completedDates: updatedCompletedDates });
        await fetchTasks(); // Re-fetch to update the local 'tasks' array and re-render calendar
    } catch (error) {
        console.error('Failed to toggle habit completion:', error);
    }
}

function calculateStreak(dates) {
    if (!dates || dates.length === 0) return 0;

    // Convert dates to Date objects (normalized to start of day UTC) and sort them ascending
    // Ensure uniqueness
    const uniqueSortedDates = [...new Set(dates)]
        .map(d => new Date(d + 'T00:00:00Z')) // Parse as UTC date to avoid timezone issues
        .sort((a, b) => a.getTime() - b.getTime());

    let streak = 0;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Normalize today to UTC start of day

    // Check from today backwards
    let checkDate = new Date(today);
    
    // Determine the effective starting point for streak calculation
    const wasCompletedToday = uniqueSortedDates.some(d => d.getTime() === today.getTime());
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1); // Get UTC yesterday
    const wasCompletedYesterday = uniqueSortedDates.some(d => d.getTime() === yesterday.getTime());

    if (!wasCompletedToday && !wasCompletedYesterday) {
        return 0; // Not completed today or yesterday, so streak is 0
    } else if (wasCompletedYesterday && !wasCompletedToday) {
        checkDate = yesterday; // Start checking from yesterday
    }
    // If wasCompletedToday is true, checkDate is already set to today, which is correct.


    // Iterate backwards from checkDate
    for (let i = 0; i < uniqueSortedDates.length + 7; i++) { // Add buffer for safety
        const currentCheckDateStr = checkDate.toISOString().slice(0, 10);
        const found = uniqueSortedDates.some(d => d.toISOString().slice(0, 10) === currentCheckDateStr);

        if (found) {
            streak++;
            checkDate.setUTCDate(checkDate.getUTCDate() - 1); // Move to previous day (UTC)
        } else {
            // Streak broken, or we've gone past the first completed date if streak is > 0
            if (streak > 0) break; // If we had a streak, and current day is missed, break
            
            // If streak is 0 and we haven't found a match, continue checking backwards,
            // but this loop should eventually terminate if no more dates are found or it goes too far back.
            checkDate.setUTCDate(checkDate.getUTCDate() - 1); 
            // Avoid infinite loop if uniqueSortedDates is empty or we've passed the earliest date
            if (uniqueSortedDates.length > 0 && checkDate.getTime() < uniqueSortedDates[0].getTime()) break;
        }
    }
    return streak;
}


function getCurrentWeekDates() {
    const today = new Date();
    // Get the current day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
    const currentDayOfWeek = today.getDay(); 

    // Calculate the date of the current Sunday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDayOfWeek); // Subtract days to get to Sunday
    weekStart.setHours(0, 0, 0, 0); // Normalize to start of the day

    const week = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i); // Add days to get Monday, Tuesday, etc.
        week.push(day.toISOString().slice(0, 10)); // Format as 'YYYY-MM-DD'
    }
    return week;
}

// --- History Functions ---

function saveToHistory(title, date) {
    const history = JSON.parse(localStorage.getItem("taskHistory")) || [];
    history.push({ title, date });
    localStorage.setItem("taskHistory", JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById("historyList");
    const history = JSON.parse(localStorage.getItem("taskHistory")) || [];

    historyList.innerHTML = "";
    history.slice().reverse().slice(0, 10).forEach(item => { // Display recent 10 items
        const li = document.createElement("li");
        li.textContent = `${item.title} (${item.date})`;
        historyList.appendChild(li);
    });

    // Add a clear history button only if there's history to clear
    if (history.length > 0) {
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear History';
        clearBtn.className = 'clear-history';
        clearBtn.onclick = clearHistory;
        historyList.appendChild(clearBtn);
    }
}

function clearHistory() {
    localStorage.removeItem("taskHistory");
    renderHistory();
}

// --- Local Storage for Theme ---
function saveTasksToLocal() {
    // This function is largely inactive as tasks are fetched from backend.
    console.warn("saveTasksToLocal() called, but tasks are now managed by backend. This function is mostly inactive.");
}

// Theme toggle (assuming you have a theme switcher element with id 'themeSwitcher')
const themeToggle = document.getElementById('themeSwitcher');
if (themeToggle) {
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme', themeToggle.checked);
        localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
    });
}

// --- Initial App Load ---
window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    const toggle = document.getElementById('themeSwitcher');
    if (toggle) toggle.checked = isDark;

    // Check if authToken exists to decide which section to show
    if (authToken) {
        mainAppContent.style.display = 'block'; // Show app if token exists
        authSection.style.display = 'none'; // Hide auth forms
        if (logoutButtonSidebar) { // Ensure logout button in sidebar is visible
            logoutButtonSidebar.style.display = 'block';
        }
        fetchTasks(); // Load tasks for the logged-in user
    } else {
        mainAppContent.style.display = 'none'; // Hide app content
        authSection.style.display = 'block'; // Show auth forms
        if (logoutButtonSidebar) { // Ensure logout button in sidebar is hidden
            logoutButtonSidebar.style.display = 'none';
        }
        renderTasks(); // Render with empty tasks (to clear any previous UI state)
    }
    renderHistory(); // Render history, which is still local for now
});