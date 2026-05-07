import './style.css';
import { ProjectService, UserStoryService, TaskService } from './storage';
import { AuthService } from './authService';

const projectService = new ProjectService();
const storyService = new UserStoryService();
const taskService = new TaskService();
const authService = new AuthService();

const projectsSection = document.querySelector<HTMLElement>('#projects-section')!;
const activeProjectSection = document.querySelector<HTMLElement>('#active-project-section')!;
const activeStorySection = document.querySelector<HTMLElement>('#active-story-section')!;

let editingProjectId: string | null = null;
let activeStoryId: string | null = null;

const currentUser = authService.getCurrentUser();
document.querySelector('#user-info')!.innerHTML = `Zalogowany: <strong>${currentUser.firstName} ${currentUser.lastName}</strong> <span style="background: #000; color:#fff; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${currentUser.role.toUpperCase()}</span>`;

function render() {
    const activeProjectId = projectService.getActiveProjectId();

    if (activeStoryId) {
        projectsSection.style.display = 'none';
        activeProjectSection.style.display = 'none';
        activeStorySection.style.display = 'block';
        renderTasks(activeStoryId);
    } else if (activeProjectId) {
        projectsSection.style.display = 'none';
        activeProjectSection.style.display = 'block';
        activeStorySection.style.display = 'none';
        renderStories(activeProjectId);
    } else {
        projectsSection.style.display = 'block';
        activeProjectSection.style.display = 'none';
        activeStorySection.style.display = 'none';
        renderProjects();
    }
}

function renderProjects() {
    const list = document.querySelector('#project-list')!;
    list.innerHTML = projectService.getAll().map(p => `
        <li style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #eee;">
            <span class="open-project" data-id="${p.id}" style="cursor:pointer; font-weight:bold; color: #007bff; flex-grow: 1;">📁 ${p.name}</span>
            <div>
                <button class="edit-btn" data-id="${p.id}" style="background: #ffb703; padding: 8px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">Edytuj</button>
                <button class="delete-btn" data-id="${p.id}" style="background: #ff4646; color: white; padding: 8px; border: none; border-radius: 4px; cursor: pointer;">Usuń</button>
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
        projectService.create({ name, description: desc });
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
        const li = `
            <li style="background: white; padding: 10px; border-radius: 4px; margin-bottom: 10px; border-left: 4px solid ${s.status === 'done' ? '#28a745' : '#007bff'};">
                <strong>${s.name}</strong> <span style="font-size: 11px; background: #eee; padding: 2px 4px; border-radius: 3px;">${s.priority}</span>
                <p style="margin: 5px 0; font-size: 14px;">${s.description}</p>
                <small style="color: #666;">Dodał: ${owner ? owner.firstName + ' ' + owner.lastName : 'Nieznany'}</small>
                
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc;">
                    <button style="width: 100%; background: #6f42c1; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;" onclick="window.openStory('${s.id}')">Zarządzaj Zadaniami ➔</button>
                </div>
            </li>
        `;
        (columns as any)[s.status].innerHTML += li;
    });
}

document.querySelector('#back-to-projects')!.addEventListener('click', () => {
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
        let detailsHTML = `<small style="display:block; margin-top:5px; color: #555;">Czas: ${t.estimatedTime}h | Priorytet: ${t.priority}</small>`;

        if (t.status === 'todo') {
            actionHTML = `
                <div style="margin-top: 10px; display:flex; gap: 5px;">
                    <select id="assign-${t.id}" style="flex:1; padding: 4px;">
                        <option value="" disabled selected>Wybierz wykonawcę...</option>
                        ${userOptions}
                    </select>
                    <button style="background: #007bff; color: white; border: none; padding: 4px 8px; cursor: pointer;" onclick="window.startTask('${t.id}')">Start</button>
                </div>
            `;
        } else if (t.status === 'doing') {
            const assignee = authService.getUserById(t.assignedUserId!);
            detailsHTML += `<small style="display:block; color: #d35400;">Wykonuje: <b>${assignee?.firstName} ${assignee?.lastName}</b><br>Start: ${new Date(t.startDate!).toLocaleTimeString()}</small>`;
            actionHTML = `<button style="margin-top: 10px; width: 100%; background: #28a745; color: white; border: none; padding: 6px; cursor: pointer;" onclick="window.finishTask('${t.id}')">Zakończ zadanie ✅</button>`;
        } else if (t.status === 'done') {
            const assignee = authService.getUserById(t.assignedUserId!);
            detailsHTML += `<small style="display:block; color: #28a745;">Wykonano przez: <b>${assignee?.firstName} ${assignee?.lastName}</b><br>Zakończono: ${new Date(t.endDate!).toLocaleTimeString()}</small>`;
        }

        const li = `
            <li style="background: white; padding: 10px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #ccc;">
                <strong>${t.name}</strong>
                <p style="margin: 5px 0; font-size: 13px;">${t.description}</p>
                ${detailsHTML}
                ${actionHTML}
                <button style="margin-top: 5px; width: 100%; background: #ff4646; color: white; border: none; padding: 4px; cursor: pointer;" onclick="window.deleteTask('${t.id}')">Usuń zadanie</button>
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
    taskService.create({
        name: document.querySelector<HTMLInputElement>('#task-name')!.value,
        description: document.querySelector<HTMLTextAreaElement>('#task-desc')!.value,
        estimatedTime: Number(document.querySelector<HTMLInputElement>('#task-time')!.value),
        priority: document.querySelector<HTMLSelectElement>('#task-priority')!.value as any,
        storyId: activeStoryId!,
    });
    (e.target as HTMLFormElement).reset();
    render();
});

(window as any).startTask = (taskId: string) => {
    const selectEl = document.querySelector<HTMLSelectElement>(`#assign-${taskId}`);
    if (!selectEl || !selectEl.value) { alert('Musisz przypisać osobę (DevOps / Developer)!'); return; }
    
    const task = taskService.getAll().find(t => t.id === taskId);
    if (task) {
        task.assignedUserId = selectEl.value;
        task.status = 'doing';
        task.startDate = new Date().toISOString();
        taskService.update(task);

        const story = storyService.getAll().find(s => s.id === task.storyId);
        if (story && story.status === 'todo') {
            story.status = 'doing';
            storyService.update(story);
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
        const storyTasks = taskService.getByStory(task.storyId);
        const allDone = storyTasks.every(t => t.status === 'done');
        
        if (allDone) {
            const story = storyService.getAll().find(s => s.id === task.storyId);
            if (story) {
                story.status = 'done';
                storyService.update(story);
            }
        }
        render();
    }
};

(window as any).deleteTask = (taskId: string) => { taskService.delete(taskId); render(); };

render();