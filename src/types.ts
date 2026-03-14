/**
 * Model reprezentujący projekt
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

/**
 * Model do tworzenia nowego projektu (bez id)
 */
export type CreateProjectDTO = Omit<Project, 'id' | 'createdAt'>;

/**
 * Model do aktualizacji projektu (częściowa aktualizacja)
 */
export type UpdateProjectDTO = Partial<CreateProjectDTO>;

