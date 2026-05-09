export type Role = 'admin' | 'devops' | 'developer';
export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'doing' | 'done';
export type ISOString = string;
export type UserID = string;

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    role: Role;
}

export interface Project {
    id: string;
    name: string;
    description: string;
}

export interface UserStory {
    id: string;
    name: string;
    description: string;
    priority: Priority;
    projectId: string;
    createdAt: string;
    status: Status;
    ownerId: string;
}

export interface Task {
    id: string;
    name: string;
    description: string;
    priority: Priority;
    storyId: string;
    estimatedTime: number;
    status: Status;
    createdAt: string;
    startDate?: string; 
    endDate?: string;
    assignedUserId?: string;
}
export interface Notification {
    id: string;
    title: string;
    message: string;
    date: ISOString;
    priority: Priority;
    isRead: boolean;
    recipientId: UserID;
}