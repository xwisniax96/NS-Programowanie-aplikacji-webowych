// src/main.ts
import './style.css';
import { ProjectService, UserStoryService, TaskService, NotificationService } from './storage';
import { AuthService } from './authService';
import type { Priority } from './types';

const themeToggleBtn = document.getElementById('theme-toggle')!;
if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

const projectService = new ProjectService();
const storyService = new UserStoryService();
const taskService = new TaskService();
const authService = new AuthService(); // Pamiętaj, że AuthService celowo zostawiliśmy w pamięci jako "mock" z wytycznych
const notificationService = new NotificationService();

// DOM Elements
const projectsSection = document.querySelector<HTMLElement>('#projects-section')!;
const activeProjectSection = document.querySelector<HTMLElement>('#active-project-section')!;
const activeStorySection = document.querySelector<HTMLElement>('#active-story-section')!;
const allNotificationsSection = document.querySelector<HTMLElement>('#all-notifications-section')!;
const singleNotificationSection = document.querySelector<HTMLElement>('#single-notification-section')!;
const backToProjectsBtn = document.querySelector<HTMLElement>('#back-to-projects')!;
const notifBellBtn = document.querySelector<HTMLElement>('#notif-bell')!;
const navNotifBtn = document.querySelector<HTMLElement>('#nav-notifications')!;
const notifBadge = document.querySelector<HTMLElement>('#notif-badge')!;
const toastContainer = document.querySelector<HTMLElement>('#toast-container')!;

// Stan aplikacji
let editingProjectId: string | null = null;
let activeStoryId: string | null = null;
let showNotificationsView = false;
let activeNotificationId: string | null = null;

// --- OBSŁUGA UŻYTKOWNIKA ---
const currentUser = authService.getCurrentUser();
document.querySelector('#user-info')!.innerHTML = `Witaj, ${currentUser.firstName}`;

const userSwitcher = document.querySelector<HTMLSelectElement>('#user-switcher')!;
authService.getAllUsers().forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.firstName} ${u.lastName} (${u.role})`;
    if (u.id === currentUser.id) opt.selected = true;
    userSwitcher.appendChild(opt);
});

userSwitcher.addEventListener('change', async (e) => {
    authService.login((e.target as HTMLSelectElement).value);
    // Odświeżamy stronę po zmianie użytkownika
    window.location.reload(); 
});

// --- SYSTEM POWIADOMIEŃ ---
async function updateBell() {
    const unreadCount = await notificationService.getUnreadCount(currentUser.id);
    if (unreadCount > 0) {
        notifBadge.textContent = unreadCount.toString();
        notifBadge.classList.remove('hidden');
        notifBadge.classList.add('flex');
    } else {
        notifBadge.classList.add('hidden');
        notifBadge.classList.remove('flex');
    }
}

async function showToast(notifId: string, title: string, message: string, priority: Priority) {
    const bgColors = { low: 'bg-blue-500', medium: 'bg-amber-500', high: 'bg-red-500' };
    
    const toast = document.createElement('div');
    toast.className = `${bgColors[priority]} text-white p-4 rounded-lg shadow-lg flex flex-col gap-1 w-72 animate-bounce cursor-pointer`;
    toast.innerHTML = `<strong class="text-sm font-bold">${title}</strong><span class="text-xs opacity-90">${message}</span>`;
    
    toast.addEventListener('click', async () => {
        toast.remove();
        showNotificationsView = false;
        activeNotificationId = notifId;
        await render(); 
    });

    toastContainer.appendChild(toast);
    setTimeout(() => { if(toast.parentElement) toast.remove(); }, 5000);
}

async function sendNotification(recipientId: string, title: string, message: string, priority: Priority) {
    const notif = await notificationService.create({ title, message, priority, recipientId });
    if (recipientId === currentUser.id && (priority === 'high' || priority === 'medium')) {
        showToast(notif.id, title, message, priority);
    }
    await updateBell();
}

const openNotifView = async () => { showNotificationsView = true; activeNotificationId = null; await render(); };
notifBellBtn.addEventListener('click', openNotifView);
navNotifBtn.addEventListener('click', openNotifView);
document.querySelector('#back-to-notifications')!.addEventListener('click', openNotifView);

async function renderAllNotifications() {
    const notifications = await notificationService.getForUser(currentUser.id);
    const list = document.querySelector('#full-notifications-list')!;
    list.innerHTML = notifications.length === 0 ? '<p class="text-gray-500 text-center mt-10">Brak powiadomień w skrzynce.</p>' : '';
    
    notifications.forEach(n => {
        const bgColors = { low: 'border-l-blue-500', medium: 'border-l-amber-500', high: 'border-l-red-500' };
        const readClass = n.isRead ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-white dark:bg-gray-700 font-bold shadow-md';

        const item = document.createElement('div');
        item.className = `p-4 rounded-xl border border-gray-200 dark:border-gray-600 flex justify-between items-center transition-colors border-l-4 ${bgColors[n.priority]} ${readClass}`;
        
        const readBtnHTML = n.isRead ? '' : `<button class="mark-read text-xs bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded hover:bg-gray-300 flex items-center gap-1">
            Oznacz jako przeczytane <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
        </button>`;
        
        item.innerHTML = `
            <div class="cursor-pointer flex-grow" id="open-notif-${n.id}">
                <h3 class="text-lg">${n.title}</h3>
                <span class="text-xs text-gray-500">${new Date(n.date).toLocaleString()}</span>
            </div>
            ${readBtnHTML}
        `;
        
        list.appendChild(item);

        document.querySelector(`#open-notif-${n.id}`)!.addEventListener('click', async () => {
            activeNotificationId = n.id;
            showNotificationsView = false;
            await render();
        });

        if (!n.isRead) {
            item.querySelector('.mark-read')!.addEventListener('click', async (e) => {
                e.stopPropagation();
                await notificationService.markAsRead(n.id);
                await renderAllNotifications();
                await updateBell();
            });
        }
    });
}

async function renderSingleNotification(id: string) {
    const allNotifs = await notificationService.getAll();
    const notif = allNotifs.find(n => n.id === id);
    if(!notif) return;

    if (!notif.isRead) {
        await notificationService.markAsRead(notif.id);
        await updateBell();
    }

    const bgColors = { low: 'bg-blue-100 text-blue-800', medium: 'bg-amber-100 text-amber-800', high: 'bg-red-100 text-red-800' };

    document.querySelector('#single-notif-title')!.textContent = notif.title;
    document.querySelector('#single-notif-priority')!.className = `px-3 py-1 rounded-full text-xs font-bold uppercase ${bgColors[notif.priority]}`;
    document.querySelector('#single-notif-priority')!.textContent = notif.priority;
    document.querySelector('#single-notif-date')!.textContent = new Date(notif.date).toLocaleString();
    document.querySelector('#single-notif-message')!.textContent = notif.message;
}

// GŁÓWNA FUNKCJA RENDERUJĄCA (teraz ASYNC)
async function render() {
    projectsSection.classList.add('hidden');
    activeProjectSection.classList.add('hidden');
    activeStorySection.classList.add('hidden');
    allNotificationsSection.classList.add('hidden');
    singleNotificationSection.classList.add('hidden');
    backToProjectsBtn.classList.add('hidden');

    const activeProjectId = projectService.getActiveProjectId();

    if (activeNotificationId) {
        singleNotificationSection.classList.remove('hidden');
        backToProjectsBtn.classList.remove('hidden'); 
        await renderSingleNotification(activeNotificationId);
    } else if (showNotificationsView) {
        allNotificationsSection.classList.remove('hidden');
        backToProjectsBtn.classList.remove('hidden'); 
        await renderAllNotifications();
    } else if (activeStoryId) {
        activeStorySection.classList.remove('hidden');
        backToProjectsBtn.classList.remove('hidden');
        await renderTasks(activeStoryId);
    } else if (activeProjectId) {
        activeProjectSection.classList.remove('hidden');
        backToProjectsBtn.classList.remove('hidden');
        await renderStories(activeProjectId);
    } else {
        projectsSection.classList.remove('hidden');
        await renderProjects();
    }
    await updateBell();
}

async function renderProjects() {
    const list = document.querySelector('#project-list')!;
    const projects = await projectService.getAll();
    
    list.innerHTML = projects.map(p => `
        <li class="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <span class="open-project cursor-pointer font-bold text-blue-600 dark:text-blue-400 grow hover:underline flex items-center gap-2" data-id="${p.id}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500 dark:text-gray-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
                ${p.name}
            </span>
            <div class="mt-4 sm:mt-0 flex gap-2">
                <button class="edit-btn bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors" data-id="${p.id}">Edytuj</button>
                <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors" data-id="${p.id}">Usuń</button>
            </div>
        </li>
    `).join('');

    document.querySelectorAll('.open-project').forEach(el => el.addEventListener('click', async (e) => {
        projectService.setActiveProjectId((e.currentTarget as HTMLElement).dataset.id!);
        await render();
    }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async (e) => {
        await projectService.delete((e.target as HTMLButtonElement).dataset.id!);
        await render();
    }));
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', async (e) => {
        const idToEdit = (e.target as HTMLButtonElement).dataset.id!;
        const allProjects = await projectService.getAll();
        const p = allProjects.find(proj => proj.id === idToEdit);
        if (p) {
            document.querySelector<HTMLInputElement>('#name')!.value = p.name;
            document.querySelector<HTMLTextAreaElement>('#description')!.value = p.description;
            editingProjectId = p.id;
        }
    }));
}

document.querySelector('#project-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') { alert('Tylko admin może tworzyć projekty!'); return; }

    const name = document.querySelector<HTMLInputElement>('#name')!.value;
    const desc = document.querySelector<HTMLTextAreaElement>('#description')!.value;
    
    if (editingProjectId) {
        const allProjects = await projectService.getAll();
        const projectToUpdate = allProjects.find(p => p.id === editingProjectId);
        if(projectToUpdate) {
            projectToUpdate.name = name;
            projectToUpdate.description = desc;
            await projectService.update(projectToUpdate);
        }
        editingProjectId = null;
    } else {
        const newProj = await projectService.create({ name, description: desc });
        const admins = authService.getAdmins();
        for (const admin of admins) {
            await sendNotification(admin.id, 'Nowy projekt!', `Projekt "${newProj.name}" został utworzony.`, 'high');
        }
    }
    (e.target as HTMLFormElement).reset();
    await render();
});

async function renderStories(projectId: string) {
    const allProjects = await projectService.getAll();
    const proj = allProjects.find(p => p.id === projectId);
    if (proj) {
        document.querySelector('#active-project-name')!.textContent = `Projekt: ${proj.name}`;
        document.querySelector('#active-project-desc')!.textContent = proj.description;
    }

    const columns = { todo: document.querySelector('#todo-list')!, doing: document.querySelector('#doing-list')!, done: document.querySelector('#done-list')! };
    Object.values(columns).forEach(c => c.innerHTML = '');

    const stories = await storyService.getByProject(projectId);
    stories.forEach(s => {
        const owner = authService.getUserById(s.ownerId);
        const borderColor = s.status === 'done' ? 'border-l-green-500' : 'border-l-blue-500';
        
        const li = `
            <li class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border-l-4 ${borderColor}">
                <div class="flex justify-between items-start">
                    <strong class="text-lg">${s.name}</strong>
                    <span class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">${s.priority}</span>
                </div>
                <p class="my-2 text-sm text-gray-600 dark:text-gray-300">${s.description}</p>
                <small class="text-gray-500 dark:text-gray-400 block">Dodał: ${owner ? owner.firstName + ' ' + owner.lastName : 'Nieznany'}</small>
                
                <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600 flex gap-2">
                    <button class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors flex justify-center items-center gap-2" onclick="window.openStory('${s.id}')">
                        Zarządzaj Zadaniami
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                    </button>
                </div>
            </li>
        `;
        (columns as any)[s.status].innerHTML += li;
    });
}

backToProjectsBtn.addEventListener('click', async () => {
    projectService.setActiveProjectId(null);
    showNotificationsView = false;
    activeNotificationId = null;
    activeStoryId = null;
    await render();
});

document.querySelector('#story-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    await storyService.create({
        name: document.querySelector<HTMLInputElement>('#story-name')!.value,
        description: document.querySelector<HTMLTextAreaElement>('#story-desc')!.value,
        priority: document.querySelector<HTMLSelectElement>('#story-priority')!.value as any,
        projectId: projectService.getActiveProjectId()!,
        status: 'todo',
        ownerId: currentUser.id
    });
    (e.target as HTMLFormElement).reset();
    await render();
});

(window as any).openStory = async (id: string) => { activeStoryId = id; showNotificationsView = false; activeNotificationId = null; await render(); };

async function renderTasks(storyId: string) {
    const allStories = await storyService.getAll();
    const story = allStories.find(s => s.id === storyId);
    if (story) document.querySelector('#active-story-name')!.textContent = story.name;

    const columns = { todo: document.querySelector('#task-todo-list')!, doing: document.querySelector('#task-doing-list')!, done: document.querySelector('#task-done-list')! };
    Object.values(columns).forEach(c => c.innerHTML = '');

    const assignableUsers = authService.getAssignableUsers();
    const userOptions = assignableUsers.map(u => `<option value="${u.id}">${u.firstName} ${u.lastName} (${u.role})</option>`).join('');

    const tasks = await taskService.getByStory(storyId);
    tasks.forEach(t => {
        let actionHTML = '';
        let detailsHTML = `<small class="block mt-2 text-gray-500 dark:text-gray-400">Czas: ${t.estimatedTime}h | Priorytet: ${t.priority}</small>`;

        if (t.status === 'todo') {
            actionHTML = `
                <div class="mt-3 flex gap-2">
                    <select id="assign-${t.id}" class="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm">
                        <option value="" disabled selected>Wybierz wykonawcę...</option>
                        ${userOptions}
                    </select>
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors" onclick="window.startTask('${t.id}')">Start</button>
                </div>
            `;
        } else if (t.status === 'doing') {
            const assignee = authService.getUserById(t.assignedUserId!);
            detailsHTML += `<small class="block text-amber-600 dark:text-amber-400 mt-1">Wykonuje: <b>${assignee?.firstName} ${assignee?.lastName}</b><br>Start: ${new Date(t.startDate!).toLocaleTimeString()}</small>`;
            actionHTML = `<button class="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded transition-colors flex justify-center items-center gap-2" onclick="window.finishTask('${t.id}')">
                Zakończ zadanie
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
            </button>`;
        } else if (t.status === 'done') {
            const assignee = authService.getUserById(t.assignedUserId!);
            detailsHTML += `<small class="block text-green-600 dark:text-green-400 mt-1">Wykonano przez: <b>${assignee?.firstName} ${assignee?.lastName}</b><br>Zakończono: ${new Date(t.endDate!).toLocaleTimeString()}</small>`;
        }

        const li = `
            <li class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-4">
                <strong class="block text-lg mb-1">${t.name}</strong>
                <p class="text-sm text-gray-700 dark:text-gray-300">${t.description}</p>
                ${detailsHTML}
                ${actionHTML}
                <button class="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-1 rounded text-sm transition-colors" onclick="window.deleteTask('${t.id}')">Usuń zadanie</button>
            </li>
        `;
        (columns as any)[t.status].innerHTML += li;
    });
}

document.querySelector('#back-to-project')!.addEventListener('click', async () => {
    activeStoryId = null;
    await render();
});

document.querySelector('#task-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newTask = await taskService.create({
        name: document.querySelector<HTMLInputElement>('#task-name')!.value,
        description: document.querySelector<HTMLTextAreaElement>('#task-desc')!.value,
        estimatedTime: Number(document.querySelector<HTMLInputElement>('#task-time')!.value),
        priority: document.querySelector<HTMLSelectElement>('#task-priority')!.value as any,
        storyId: activeStoryId!,
    });
    
    const allStories = await storyService.getAll();
    const story = allStories.find(s => s.id === activeStoryId);
    if(story) {
        await sendNotification(story.ownerId, 'Nowe zadanie', `W historyjce "${story.name}" dodano zadanie "${newTask.name}".`, 'medium');
    }

    (e.target as HTMLFormElement).reset();
    await render();
});

(window as any).startTask = async (taskId: string) => {
    const selectEl = document.querySelector<HTMLSelectElement>(`#assign-${taskId}`);
    if (!selectEl || !selectEl.value) { alert('Musisz przypisać osobę!'); return; }
    
    const allTasks = await taskService.getAll();
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
        task.assignedUserId = selectEl.value;
        task.status = 'doing';
        task.startDate = new Date().toISOString();
        await taskService.update(task);
        
        const assignee = authService.getUserById(task.assignedUserId);
        const allStories = await storyService.getAll();
        const story = allStories.find(s => s.id === task.storyId);
        
        if (assignee) {
             await sendNotification(assignee.id, 'Nowy przydział!', `Przydzielono Cię do zadania "${task.name}".`, 'high');
        }
        if (story) {
             await sendNotification(story.ownerId, 'Zadanie rozpoczęte', `Zadanie "${task.name}" jest w trakcie realizacji.`, 'low');
             if (story.status === 'todo') {
                 story.status = 'doing';
                 await storyService.update(story);
             }
        }
        await render();
    }
};

(window as any).finishTask = async (taskId: string) => {
    const allTasks = await taskService.getAll();
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'done';
        task.endDate = new Date().toISOString();
        await taskService.update(task);
        
        const allStories = await storyService.getAll();
        const story = allStories.find(s => s.id === task.storyId);
        if (story) {
            await sendNotification(story.ownerId, 'Zadanie zakończone', `Zadanie "${task.name}" zostało oznaczone jako DONE.`, 'medium');
        }

        const storyTasks = await taskService.getByStory(task.storyId);
        const allDone = storyTasks.every(t => t.status === 'done');
        if (allDone && story) {
            story.status = 'done';
            await storyService.update(story);
        }
        await render();
    }
};

(window as any).deleteTask = async (taskId: string) => { 
    const allTasks = await taskService.getAll();
    const task = allTasks.find(t => t.id === taskId);
    if(task) {
        const allStories = await storyService.getAll();
        const story = allStories.find(s => s.id === task.storyId);
        if (story) {
            await sendNotification(story.ownerId, 'Usunięto zadanie', `Zadanie "${task.name}" zostało usunięte z historyjki.`, 'medium');
        }
    }
    await taskService.delete(taskId); 
    await render(); 
};

render();