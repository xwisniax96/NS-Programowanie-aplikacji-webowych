import './style.css';
import { projectService, storyService, taskService, authService, currentUser, appState } from './store';
import { initTheme } from './theme';
import { updateBell, sendNotification, renderAllNotifications, renderSingleNotification, initNotificationsNav } from './notifications';
import { createProjectHTML, createStoryHTML, createTaskHTML } from './templates';

// --- INICJALIZACJA POBOCZNYCH MODUŁÓW ---
initTheme();
initNotificationsNav();

// DOM Elements
const projectsSection = document.querySelector<HTMLElement>('#projects-section')!;
const activeProjectSection = document.querySelector<HTMLElement>('#active-project-section')!;
const activeStorySection = document.querySelector<HTMLElement>('#active-story-section')!;
const allNotificationsSection = document.querySelector<HTMLElement>('#all-notifications-section')!;
const singleNotificationSection = document.querySelector<HTMLElement>('#single-notification-section')!;
const backToProjectsBtn = document.querySelector<HTMLElement>('#back-to-projects')!;

// --- OBSŁUGA UŻYTKOWNIKA ---
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
    window.location.reload(); 
});

// --- GŁÓWNY SYSTEM RENDEROWANIA ---

// Nasłuchujemy na nasz customowy sygnał odświeżania z innych plików!
window.addEventListener('app:render', async () => {
    await render();
});

async function render() {
    projectsSection.classList.add('hidden');
    activeProjectSection.classList.add('hidden');
    activeStorySection.classList.add('hidden');
    allNotificationsSection.classList.add('hidden');
    singleNotificationSection.classList.add('hidden');
    backToProjectsBtn.classList.add('hidden');

    const activeProjectId = projectService.getActiveProjectId();

    if (appState.activeNotificationId) {
        singleNotificationSection.classList.remove('hidden');
        backToProjectsBtn.classList.remove('hidden'); 
        await renderSingleNotification(appState.activeNotificationId);
    } else if (appState.showNotificationsView) {
        allNotificationsSection.classList.remove('hidden');
        backToProjectsBtn.classList.remove('hidden'); 
        await renderAllNotifications();
    } else if (appState.activeStoryId) {
        activeStorySection.classList.remove('hidden');
        backToProjectsBtn.classList.remove('hidden');
        await renderTasks(appState.activeStoryId);
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

// --- WIDOKI PROJEKTÓW ---
async function renderProjects() {
    const list = document.querySelector('#project-list')!;
    const projects = await projectService.getAll();
    
    list.innerHTML = projects.map(p => createProjectHTML(p)).join('');

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
            appState.editingProjectId = p.id;
        }
    }));
}

document.querySelector('#project-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') { alert('Tylko admin może tworzyć projekty!'); return; }

    const name = document.querySelector<HTMLInputElement>('#name')!.value;
    const desc = document.querySelector<HTMLTextAreaElement>('#description')!.value;
    
    if (appState.editingProjectId) {
        const allProjects = await projectService.getAll();
        const projectToUpdate = allProjects.find(p => p.id === appState.editingProjectId);
        if(projectToUpdate) {
            projectToUpdate.name = name;
            projectToUpdate.description = desc;
            await projectService.update(projectToUpdate);
        }
        appState.editingProjectId = null;
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

// --- WIDOKI HISTORYJEK ---
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
        const ownerName = owner ? owner.firstName + ' ' + owner.lastName : 'Nieznany';
        const borderColor = s.status === 'done' ? 'border-l-green-500' : 'border-l-blue-500';
        
        (columns as any)[s.status].innerHTML += createStoryHTML(s, ownerName, borderColor);
    });
}

backToProjectsBtn.addEventListener('click', async () => {
    projectService.setActiveProjectId(null);
    appState.showNotificationsView = false;
    appState.activeNotificationId = null;
    appState.activeStoryId = null;
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

(window as any).openStory = async (id: string) => { 
    appState.activeStoryId = id; 
    appState.showNotificationsView = false; 
    appState.activeNotificationId = null; 
    await render(); 
};

// --- WIDOKI ZADAŃ ---
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

        (columns as any)[t.status].innerHTML += createTaskHTML(t, detailsHTML, actionHTML);
    });
}

document.querySelector('#back-to-project')!.addEventListener('click', async () => {
    appState.activeStoryId = null;
    await render();
});

document.querySelector('#task-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newTask = await taskService.create({
        name: document.querySelector<HTMLInputElement>('#task-name')!.value,
        description: document.querySelector<HTMLTextAreaElement>('#task-desc')!.value,
        estimatedTime: Number(document.querySelector<HTMLInputElement>('#task-time')!.value),
        priority: document.querySelector<HTMLSelectElement>('#task-priority')!.value as any,
        storyId: appState.activeStoryId!,
    });
    
    const allStories = await storyService.getAll();
    const story = allStories.find(s => s.id === appState.activeStoryId);
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

// Pierwsze uruchomienie aplikacji
render();