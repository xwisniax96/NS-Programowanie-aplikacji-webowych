import './style.css';
import { ProjectService, UserStoryService } from './storage';
import { AuthService } from './authService';

const projectService = new ProjectService();
const storyService = new UserStoryService();
const authService = new AuthService();

// Elementy UI
const userDiv = document.querySelector('#user-info')!;
const projectsSection = document.querySelector<HTMLElement>('#projects-section')!;
const activeProjectSection = document.querySelector<HTMLElement>('#active-project-section')!;
const backBtn = document.querySelector<HTMLElement>('#back-to-projects')!;
const projectForm = document.querySelector<HTMLFormElement>('#project-form')!;
const projectSubmitBtn = projectForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
const storyForm = document.querySelector<HTMLFormElement>('#story-form')!;

// Użytkownik z Mocka
const user = authService.getCurrentUser();
userDiv.innerHTML = `Zalogowany: <strong>${user.firstName} ${user.lastName}</strong>`;

// Zmienna do zapamiętania, który projekt edytujemy
let editingProjectId: string | null = null;

// GŁÓWNA FUNKCJA
function render() {
    const activeId = projectService.getActiveProjectId();
    if (activeId) {
        projectsSection.style.display = 'none';
        activeProjectSection.style.display = 'block';
        backBtn.style.display = 'block';
        renderStories(activeId);
    } else {
        projectsSection.style.display = 'block';
        activeProjectSection.style.display = 'none';
        backBtn.style.display = 'none';
        renderProjects();
    }
}

// --- PROJEKTY ---
function renderProjects() {
    const list = document.querySelector('#project-list')!;
    list.innerHTML = projectService.getAll().map(p => `
        <li class="project-item" style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #eee;">
            <span class="open-project" data-id="${p.id}" style="cursor:pointer; font-weight:bold; color: #007bff; flex-grow: 1;">
                📁 ${p.name} (Kliknij, aby otworzyć)
            </span>
            <div>
                <button class="edit-btn" data-id="${p.id}" style="background: #ffb703; color: black; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; margin-right: 5px;">Edytuj</button>
                <button class="delete-btn" data-id="${p.id}" style="background: #ff4646; color: white; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer;">Usuń</button>
            </div>
        </li>
    `).join('');

    // Otwieranie projektu
    document.querySelectorAll('.open-project').forEach(el => {
        el.addEventListener('click', (e) => {
            const id = (e.target as HTMLElement).dataset.id!;
            projectService.setActiveProjectId(id);
            render();
        });
    });

    // Usuwanie projektu
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.target as HTMLButtonElement).dataset.id!;
            projectService.delete(id);
            render();
        });
    });

    // Edycja projektu
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.target as HTMLButtonElement).dataset.id!;
            const projectToEdit = projectService.getAll().find(p => p.id === id);
            if (projectToEdit) {
                document.querySelector<HTMLInputElement>('#name')!.value = projectToEdit.name;
                document.querySelector<HTMLTextAreaElement>('#description')!.value = projectToEdit.description;
                editingProjectId = projectToEdit.id;
                projectSubmitBtn.textContent = 'Zapisz zmiany';
                projectSubmitBtn.style.background = '#ffb703';
            }
        });
    });
}

// Obsługa formularza projektów (Dodawanie / Edycja)
projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.querySelector<HTMLInputElement>('#name')!;
    const descInput = document.querySelector<HTMLTextAreaElement>('#description')!;

    if (editingProjectId) {
        projectService.update({
            id: editingProjectId,
            name: nameInput.value,
            description: descInput.value
        });
        editingProjectId = null;
        projectSubmitBtn.textContent = 'Dodaj Projekt';
        projectSubmitBtn.style.background = ''; // reset koloru
    } else {
        projectService.create({
            name: nameInput.value,
            description: descInput.value
        });
    }
    projectForm.reset();
    render();
});

// --- HISTORYJKI ---
function renderStories(projectId: string) {
    const activeProject = projectService.getAll().find(p => p.id === projectId);
    if (activeProject) {
        document.querySelector('#active-project-name')!.textContent = `Tablica: ${activeProject.name}`;
        document.querySelector('#active-project-desc')!.textContent = activeProject.description;
    }

    const stories = storyService.getByProject(projectId);
    const columns = {
        todo: document.querySelector('#todo-list')!,
        doing: document.querySelector('#doing-list')!,
        done: document.querySelector('#done-list')!
    };

    Object.values(columns).forEach(c => c.innerHTML = '');

    stories.forEach(s => {
        // ZAMIANA ID NA IMIĘ I NAZWISKO
        const ownerName = s.ownerId === user.id ? `${user.firstName} ${user.lastName}` : s.ownerId;

        const li = `
            <li style="background: white; padding: 10px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                <strong>${s.name}</strong>
                <p style="margin: 5px 0; font-size: 14px;">${s.description}</p>
                <small style="color: #666;">Priorytet: <b>${s.priority}</b> | Właściciel: <b>${ownerName}</b></small>
                
                <div style="margin-top: 10px; display: flex; gap: 5px;">
                    ${s.status !== 'todo' ? `<button style="font-size: 11px; padding: 4px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.changeStatus('${s.id}', 'todo')">TODO</button>` : ''}
                    ${s.status !== 'doing' ? `<button style="font-size: 11px; padding: 4px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.changeStatus('${s.id}', 'doing')">DOING</button>` : ''}
                    ${s.status !== 'done' ? `<button style="font-size: 11px; padding: 4px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.changeStatus('${s.id}', 'done')">DONE</button>` : ''}
                    <button style="font-size: 11px; padding: 4px; background: #ff4646; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.deleteStory('${s.id}')">Usuń</button>
                </div>
            </li>
        `;
        (columns as any)[s.status].innerHTML += li;
    });
}

backBtn.addEventListener('click', () => {
    projectService.setActiveProjectId(null);
    render();
});

storyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const activeId = projectService.getActiveProjectId();
    if (!activeId) return;

    const name = document.querySelector<HTMLInputElement>('#story-name')!.value;
    const desc = document.querySelector<HTMLTextAreaElement>('#story-desc')!.value;
    const priority = document.querySelector<HTMLSelectElement>('#story-priority')!.value as any;

    storyService.create({
        name,
        description: desc,
        priority,
        projectId: activeId,
        status: 'todo',
        ownerId: user.id
    });
    
    storyForm.reset();
    render();
});

(window as any).changeStatus = (id: string, newStatus: any) => {
    const story = storyService.getAll().find(s => s.id === id);
    if (story) {
        story.status = newStatus;
        storyService.update(story);
        render();
    }
};

(window as any).deleteStory = (id: string) => {
    storyService.delete(id);
    render();
};

render();