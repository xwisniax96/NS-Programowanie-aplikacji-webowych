import { Project, CreateProjectDTO, UpdateProjectDTO } from '../types';

const STORAGE_KEY = 'manageme_projects';

/**
 * Klasa do zarządzania projektami w localStorage
 * Udostępnia metody CRUD: Create, Read, Update, Delete
 */
class ProjectAPI {
  /**
   * Pobiera wszystkie projekty z localStorage
   */
  getAll(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data) as Project[];
    } catch {
      console.error('Błąd podczas parsowania danych z localStorage');
      return [];
    }
  }

  /**
   * Pobiera pojedynczy projekt po id
   */
  getById(id: string): Project | null {
    const projects = this.getAll();
    return projects.find(p => p.id === id) || null;
  }

  /**
   * Tworzy nowy projekt
   */
  create(dto: CreateProjectDTO): Project {
    const projects = this.getAll();
    const newProject: Project = {
      id: this.generateId(),
      name: dto.name,
      description: dto.description,
      createdAt: Date.now()
    };
    projects.push(newProject);
    this.save(projects);
    return newProject;
  }

  /**
   * Aktualizuje istniejący projekt
   */
  update(id: string, dto: UpdateProjectDTO): Project | null {
    const projects = this.getAll();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedProject: Project = {
      ...projects[index],
      ...dto
    };
    
    projects[index] = updatedProject;
    this.save(projects);
    return updatedProject;
  }

  /**
   * Usuwa projekt po id
   */
  delete(id: string): boolean {
    const projects = this.getAll();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      return false;
    }

    projects.splice(index, 1);
    this.save(projects);
    return true;
  }

  /**
   * Zapisuje projekty do localStorage
   */
  private save(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  /**
   * Generuje unikalne id dla projektu
   */
  private generateId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Eksportujemy singleton instance
export const projectAPI = new ProjectAPI();

