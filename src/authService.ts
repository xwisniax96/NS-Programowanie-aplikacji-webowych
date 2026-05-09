import type { User } from './types';

export class AuthService {
    private users: User[] = [
        { id: 'admin-1', firstName: 'Jan', lastName: 'Kowalski', role: 'admin' },
        { id: 'dev-1', firstName: 'Anna', lastName: 'Nowak', role: 'developer' },
        { id: 'ops-1', firstName: 'Piotr', lastName: 'Zieliński', role: 'devops' }
    ];

    getCurrentUser(): User {
        return this.users[0]; 
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
}