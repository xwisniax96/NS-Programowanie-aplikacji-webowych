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
const authService = new AuthService();
const notificationService = new NotificationService();

const projectsSection = document.querySelector<HTMLElement>('#projects-section')!;
const activeProjectSection = document.querySelector<HTMLElement>('#active-project-section')!;
const activeStorySection = document.querySelector<HTMLElement>('#active-story-section')!;
const backToProjectsBtn = document.querySelector<HTMLElement>('#back-to-projects')!;

const notifBellBtn = document.querySelector<HTMLElement>('#notif-bell')!;
const notifBadge = document.querySelector<HTMLElement>('#notif-badge')!;
const notifModal = document.querySelector<HTMLElement>('#notifications-modal')!;
const closeNotifModalBtn = document.querySelector<HTMLElement>('#close-notif-modal')!;
const notifList = document.querySelector<HTMLElement>('#notifications-list')!;
const toastContainer = document.querySelector<HTMLElement>('#toast-container')!;

let editingProjectId: string | null = null;
let activeStoryId: string | null = null;

const currentUser = authService.getCurrentUser();
document.querySelector('#user-info')!.innerHTML = `Zalogowany: <strong>${currentUser.firstName} ${currentUser.lastName}</strong> <span class="ml-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-black px-2 py-1 rounded text-xs font-bold">${currentUser.role.toUpperCase()}</span>`;

function updateBell() {
    const unreadCount = notificationService.getUnreadCount(currentUser.id);
    if (unreadCount > 0) {
        notifBadge.textContent = unreadCount.toString();
        notifBadge.classList.remove('hidden');
    } else {
        notifBadge.classList.add('hidden');
    }
}

function showToast(title: string, message: string, priority: Priority) {
    const bgColors = {
        low: 'bg-blue-500',
        medium: 'bg-amber-500',
        high: 'bg-red-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `${bgColors[priority]} text-white p-4 rounded-lg shadow-lg flex flex-col gap-1 w-72 animate-bounce cursor-pointer`;
    toast.innerHTML = `
        <strong class="text-sm font-bold">${title}</strong>
        <span class="text-xs opacity-90">${message}</span>
    `;
    
    toast.addEventListener('click', () => {
        toast.remove();
        notifModal.classList.remove('hidden');
        renderNotificationsModal();
    });

    toastContainer.appendChild(toast);

    setTimeout(() => {
        if(toast.parentElement) toast.remove();
    }, 5000);
}

function sendNotification(recipientId: string, title: string, message: string, priority: Priority) {
   notificationService.create({ title, message, priority, recipientId });
    if (recipientId === currentUser.id && (priority === 'high' || priority === 'medium')) {
        showToast(title, message, priority);
    }
    updateBell();
}

function renderNotificationsModal() {
    const notifications = notificationService.getForUser(currentUser.id);
    notifList.innerHTML = notifications.length === 0 ? '<p class="text-gray-500 text-center">Brak powiadomień</p>' : '';
    
    notifications.forEach(n => {
        const bgColors = {
            low: 'bg-blue-100 text-blue-800',
            medium: 'bg-amber-100 text-amber-800',
            high: 'bg-red-100 text-red-800'
        };

        const item = document.createElement('div');
        item.className = `p-3 rounded-lg border flex flex-col gap-1 cursor-pointer transition-colors ${n.isRead ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-70' : 'bg-white dark:bg-gray-600 border-blue-300 dark:border-blue-500'}`;
        item.innerHTML = `
            <div class="flex justify-between items-start">
                <strong class="text-sm ${n.isRead ? 'font-normal' : 'font-bold'}">${n.title}</strong>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${bgColors[n.priority]}">${n.priority}</span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-300">${n.message}</p>
            <span class="text-[10px] text-gray-400 mt-1">${new Date(n.date).toLocaleString()}</span>
        `;
        
        item.addEventListener('click', () => {
            notificationService.markAsRead(n.id);
            renderNotificationsModal();
            updateBell();
        });

        notifList.appendChild(item);
    });
}

notifBellBtn.addEventListener('click', () => {
    notifModal.classList.remove('hidden');
    renderNotificationsModal();
});

closeNotifModalBtn.addEventListener('click', () => {
    notifModal.classList.add('hidden');
});

function render() {
    const activeProjectId = projectService.getActiveProjectId();

    if (activeStoryId) {
        projectsSection.classList.add('hidden');
        activeProjectSection.classList.add('hidden');
        activeStorySection.classList.remove('hidden');
        backToProjectsBtn.classList.remove('hidden');
        renderTasks(activeStoryId);
    } else if (activeProjectId) {
        projectsSection.classList.add('hidden');
        activeProjectSection.classList.remove('hidden');
        activeStorySection.classList.add('hidden');
        backToProjectsBtn.classList.remove('hidden');
        renderStories(activeProjectId);
    } else {
        projectsSection.classList.remove('hidden');
        activeProjectSection.classList.add('hidden');
        activeStorySection.classList.add('hidden');
        backToProjectsBtn.classList.add('hidden');
        renderProjects();
    }
    updateBell();
}

function renderProjects() {
    const list = document.querySelector('#project-list')!;
    list.innerHTML = projectService.getAll().map(p => `
        <li class="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <span class="open-project cursor-pointer font-bold text-blue-600 dark:text-blue-400 grow hover:underline" data-id="${p.id}">
                📁 ${p.name}
            </span>
            <div class="mt-4 sm:mt-0 flex gap-2">
                <button class="edit-btn bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors" data-id="${p.id}">Edytuj</button>
                <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors" data-id="${p.id}">Usuń</button>
            </div>
        </li>
    `).join('');

    document.querySelectorAll('.open-project').forEach(el => el.addEventListener('click', (e) => {
        projectService.setActiveProjectId((e.target as HTMLElement).dataset.id!);
        render();
    }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => {
        projectService.delete((e.target as HTMLButtonElement).dataset.id!);
        render();
    }));
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const p = projectService.getAll().find(p => p.id === (e.target as HTMLButtonElement).dataset.id!);
        if (p) {
            document.querySelector<HTMLInputElement>('#name')!.value = p.name;
            document.querySelector<HTMLTextAreaElement>('#description')!.value = p.description;
            editingProjectId = p.id;
        }
    }));
}

document.querySelector('#project-form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector<HTMLInputElement>('#name')!.value;
    const desc = document.querySelector<HTMLTextAreaElement>('#description')!.value;
    if (editingProjectId) {
        projectService.update({ id: editingProjectId, name, description: desc });
        editingProjectId = null;
    } else {
        const newProj = projectService.create({ name, description: desc });
        authService.getAdmins().forEach(admin => {
            sendNotification(admin.id, 'Nowy projekt!', `Projekt "${newProj.name}" został utworzony.`, 'high');
        });
    }
    (e.target as HTMLFormElement).reset();
    render();
});

function renderStories(projectId: string) {
    const proj = projectService.getAll().find(p => p.id === projectId);
    if (proj) {
        document.querySelector('#active-project-name')!.textContent = `Projekt: ${proj.name}`;
        document.querySelector('#active-project-desc')!.textContent = proj.description;
    }

    const columns = { todo: document.querySelector('#todo-list')!, doing: document.querySelector('#doing-list')!, done: document.querySelector('#done-list')! };
    Object.values(columns).forEach(c => c.innerHTML = '');

    storyService.getByProject(projectId).forEach(s => {
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
                    <button class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors" onclick="window.openStory('${s.id}')">Zarządzaj Zadaniami ➔</button>
                </div>
            </li>
        `;
        (columns as any)[s.status].innerHTML += li;
    });
}

backToProjectsBtn.addEventListener('click', () => {
    projectService.setActiveProjectId(null);
    render();
});

document.querySelector('#story-form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    storyService.create({
        name: document.querySelector<HTMLInputElement>('#story-name')!.value,
        description: document.querySelector<HTMLTextAreaElement>('#story-desc')!.value,
        priority: document.querySelector<HTMLSelectElement>('#story-priority')!.value as any,
        projectId: projectService.getActiveProjectId()!,
        status: 'todo',
        ownerId: currentUser.id
    });
    (e.target as HTMLFormElement).reset();
    render();
});

(window as any).openStory = (id: string) => { activeStoryId = id; render(); };

function renderTasks(storyId: string) {
    const story = storyService.getAll().find(s => s.id === storyId);
    if (story) document.querySelector('#active-story-name')!.textContent = story.name;

    const columns = { todo: document.querySelector('#task-todo-list')!, doing: document.querySelector('#task-doing-list')!, done: document.querySelector('#task-done-list')! };
    Object.values(columns).forEach(c => c.innerHTML = '');

    const assignableUsers = authService.getAssignableUsers();
    const userOptions = assignableUsers.map(u => `<option value="${u.id}">${u.firstName} ${u.lastName} (${u.role})</option>`).join('');

    taskService.getByStory(storyId).forEach(t => {
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
            actionHTML = `<button class="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded transition-colors" onclick="window.finishTask('${t.id}')">Zakończ zadanie ✅</button>`;
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

document.querySelector('#back-to-project')!.addEventListener('click', () => {
    activeStoryId = null;
    render();
});

document.querySelector('#task-form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTask = taskService.create({
        name: document.querySelector<HTMLInputElement>('#task-name')!.value,
        description: document.querySelector<HTMLTextAreaElement>('#task-desc')!.value,
        estimatedTime: Number(document.querySelector<HTMLInputElement>('#task-time')!.value),
        priority: document.querySelector<HTMLSelectElement>('#task-priority')!.value as any,
        storyId: activeStoryId!,
    });
    
    const story = storyService.getAll().find(s => s.id === activeStoryId);
    if(story) {
        sendNotification(story.ownerId, 'Nowe zadanie', `W historyjce "${story.name}" dodano zadanie "${newTask.name}".`, 'medium');
    }

    (e.target as HTMLFormElement).reset();
    render();
});

(window as any).startTask = (taskId: string) => {
    const selectEl = document.querySelector<HTMLSelectElement>(`#assign-${taskId}`);
    if (!selectEl || !selectEl.value) { alert('Musisz przypisać osobę!'); return; }
    
    const task = taskService.getAll().find(t => t.id === taskId);
    if (task) {
        task.assignedUserId = selectEl.value;
        task.status = 'doing';
        task.startDate = new Date().toISOString();
        taskService.update(task);
        
        const assignee = authService.getUserById(task.assignedUserId);
        const story = storyService.getAll().find(s => s.id === task.storyId);
        
        if (assignee) {
             sendNotification(assignee.id, 'Nowe przydział!', `Przydzielono Cię do zadania "${task.name}".`, 'high');
        }
        if (story) {
             sendNotification(story.ownerId, 'Zadanie rozpoczęte', `Zadanie "${task.name}" jest w trakcie realizacji.`, 'low');
             if (story.status === 'todo') {
                 story.status = 'doing';
                 storyService.update(story);
             }
        }
        render();
    }
};

(window as any).finishTask = (taskId: string) => {
    const task = taskService.getAll().find(t => t.id === taskId);
    if (task) {
        task.status = 'done';
        task.endDate = new Date().toISOString();
        taskService.update(task);
        
        const story = storyService.getAll().find(s => s.id === task.storyId);
        if (story) {
            sendNotification(story.ownerId, 'Zadanie zakończone', `Zadanie "${task.name}" zostało oznaczone jako DONE.`, 'medium');
        }

        const storyTasks = taskService.getByStory(task.storyId);
        const allDone = storyTasks.every(t => t.status === 'done');
        if (allDone && story) {
            story.status = 'done';
            storyService.update(story);
        }
        render();
    }
};

(window as any).deleteTask = (taskId: string) => { 
    const task = taskService.getAll().find(t => t.id === taskId);
    if(task) {
        const story = storyService.getAll().find(s => s.id === task.storyId);
        if (story) {
            sendNotification(story.ownerId, 'Usunięto zadanie', `Zadanie "${task.name}" zostało usunięte z historyjki.`, 'medium');
        }
    }
    taskService.delete(taskId); 
    render(); 
};

render();