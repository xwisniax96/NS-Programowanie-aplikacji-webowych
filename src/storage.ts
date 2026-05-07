import type { Project, UserStory, Task } from './types';

export class ProjectService {
    private readonly STORAGE_KEY = 'manageme_projects';
    private readonly ACTIVE_ID_KEY = 'manageme_active_project_id';

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

export class TaskService {
    private readonly STORAGE_KEY = 'manageme_tasks';

    getAll(): Task[] {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    getByStory(storyId: string): Task[] {
        return this.getAll().filter(t => t.storyId === storyId);
    }

    create(taskData: Omit<Task, 'id' | 'createdAt' | 'status'>): Task {
        const tasks = this.getAll();
        const newTask: Task = {
            ...taskData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: 'todo'
        };
        tasks.push(newTask);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
        return newTask;
    }

    update(updatedTask: Task): void {
        const tasks = this.getAll().map(t => t.id === updatedTask.id ? updatedTask : t);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    }

    delete(id: string): void {
        const tasks = this.getAll().filter(t => t.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    }
}