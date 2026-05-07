import type { Project } from './types';

export class ProjectService {
    private readonly STORAGE_KEY = 'manageme_projects';

    // Pobierz wszystkie
    getAll(): Project[] {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Dodaj nowy
    create(project: Omit<Project, 'id'>): Project {
        const projects = this.getAll();
        const newProject = { ...project, id: crypto.randomUUID() };
        projects.push(newProject);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
        return newProject;
    }

    // Usuń
    delete(id: string): void {
        const projects = this.getAll().filter(p => p.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    }

    // Aktualizuj
    update(updatedProject: Project): void {
        const projects = this.getAll().map(p => 
            p.id === updatedProject.id ? updatedProject : p
        );
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    }
}