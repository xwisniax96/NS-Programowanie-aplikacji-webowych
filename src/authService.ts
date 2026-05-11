import type { User } from './types';

export class AuthService {
    private users: User[] = [
        { id: 'admin-1', firstName: 'Jan', lastName: 'Kowalski', role: 'admin' },
        { id: 'dev-1', firstName: 'Anna', lastName: 'Nowak', role: 'developer' },
        { id: 'ops-1', firstName: 'Piotr', lastName: 'Zieliński', role: 'devops' }
    ];

    private readonly AUTH_KEY = 'manageme_logged_user';

    getCurrentUser(): User {
        const savedId = localStorage.getItem(this.AUTH_KEY);
        if (savedId) {
            const user = this.getUserById(savedId);
            if (user) return user;
        }
        return this.users[0]; // Domyślnie Admin
    }

    login(userId: string): void {
        localStorage.setItem(this.AUTH_KEY, userId);
        window.location.reload(); // Odśwież stronę, aby załadować dane nowego usera
    }

    getAssignableUsers(): User[] {
        return this.users.filter(u => u.role === 'developer' || u.role === 'devops');
    }

    getUserById(id: string): User | undefined {
        return this.users.find(u => u.id === id);
    }

    getAdmins(): User[] {
        return this.users.filter(u => u.role === 'admin');
    }

    getAllUsers(): User[] {
        return this.users;
    }
}