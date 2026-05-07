export interface User {
    id: string;
    firstName: string;
    lastName: string;
}

export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'doing' | 'done';

export interface UserStory {
    id: string;
    name: string;
    description: string;
    priority: Priority;
    projectId: string; // Relacja do projektu
    createdAt: string;
    status: Status;
    ownerId: string; // Relacja do użytkownika
}

export interface Project {
    id: string;
    name: string;
    description: string;
}