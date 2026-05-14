import { ProjectService, UserStoryService, TaskService, NotificationService } from './storage';
import { AuthService } from './authService';

// 1. Inicjalizacja wszystkich serwisów w jednym miejscu
export const projectService = new ProjectService();
export const storyService = new UserStoryService();
export const taskService = new TaskService();
export const authService = new AuthService();
export const notificationService = new NotificationService();

export const currentUser = authService.getCurrentUser();

// 2. Globalny stan aplikacji (zamiast luźnych zmiennych "let" w main.ts)
export const appState = {
    editingProjectId: null as string | null,
    activeStoryId: null as string | null,
    showNotificationsView: false,
    activeNotificationId: null as string | null,
};

// 3. Magia architektury Event-Driven (Wyzwalacz odświeżenia widoku)
export const triggerRender = () => window.dispatchEvent(new Event('app:render'));