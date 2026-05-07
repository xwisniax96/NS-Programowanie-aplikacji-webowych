import type { User } from './types';

export class AuthService {
    private mockUser: User = {
        id: 'user-123',
        firstName: 'Jan',
        lastName: 'Kowalski'
    };

    getCurrentUser(): User {
        return this.mockUser;
    }
}