import type { Project, UserStory } from './types';

export class ProjectService {
    private readonly STORAGE_KEY = 'manageme_projects';
    private readonly ACTIVE_ID_KEY = 'manageme_active_project_id';

    // ... (getAll, save, create, delete, update zostają bez zmian) ...
    getAll(): Project[] {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }
    save(projects: Project[]): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    }
    create(data: Omit<Project, 'id'>): Project {
        const projects = this.getAll();
        const newProject = { ...data, id: crypto.randomUUID() };
        projects.push(newProject);
        this.save(projects);
        return newProject;
    }
    delete(id: string): void {
        const projects = this.getAll().filter(p => p.id !== id);
        this.save(projects);
    }
    update(updatedProject: Project): void {
        const projects = this.getAll().map(p => p.id === updatedProject.id ? updatedProject : p);
        this.save(projects);
    }

    // NOWE: Zarządzanie aktywnym projektem
    setActiveProjectId(id: string | null): void {
        if (id) localStorage.setItem(this.ACTIVE_ID_KEY, id);
        else localStorage.removeItem(this.ACTIVE_ID_KEY);
    }

    getActiveProjectId(): string | null {
        return localStorage.getItem(this.ACTIVE_ID_KEY);
    }
}

export class UserStoryService {
    private readonly STORAGE_KEY = 'manageme_stories';

    getAll(): UserStory[] {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Pobierz tylko te historyjki, które należą do danego projektu
    getByProject(projectId: string): UserStory[] {
        return this.getAll().filter(s => s.projectId === projectId);
    }

    create(story: Omit<UserStory, 'id' | 'createdAt'>): UserStory {
        const stories = this.getAll();
        const newStory: UserStory = {
            ...story,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        stories.push(newStory);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stories));
        return newStory;
    }

    delete(id: string): void {
        const stories = this.getAll().filter(s => s.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stories));
    }

    update(updatedStory: UserStory): void {
        const stories = this.getAll().map(s => s.id === updatedStory.id ? updatedStory : s);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stories));
    }
}