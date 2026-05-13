import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import type { Project, UserStory, Task, Notification, Priority } from './types';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCH3PFbog4w3Z5k1cNXmO_dvVpRyCtYsdM",
  authDomain: "manageme-5e456.firebaseapp.com",
  projectId: "manageme-5e456",
  storageBucket: "manageme-5e456.firebasestorage.app",
  messagingSenderId: "315560032848",
  appId: "1:315560032848:web:6d461ff19b1868b3f4ef55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export class ProjectService {
    private coll = collection(db, 'projects');
    private activeProjectId: string | null = null;

    setActiveProjectId(id: string | null) { this.activeProjectId = id; }
    getActiveProjectId() { return this.activeProjectId; }

    async getAll(): Promise<Project[]> {
        const snap = await getDocs(this.coll);
        return snap.docs.map(d => d.data() as Project);
    }

    async create(data: Omit<Project, 'id'>): Promise<Project> {
        const newDoc = doc(this.coll); // Automatycznie generuje unikalne ID w chmurze
        const project = { ...data, id: newDoc.id } as Project;
        await setDoc(newDoc, project);
        return project;
    }

    async update(project: Project): Promise<void> {
        await setDoc(doc(this.coll, project.id), project);
    }

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(this.coll, id));
    }
}

export class UserStoryService {
    private coll = collection(db, 'userStories');

    async getAll(): Promise<UserStory[]> {
        const snap = await getDocs(this.coll);
        return snap.docs.map(d => d.data() as UserStory);
    }

    async getByProject(projectId: string): Promise<UserStory[]> {
        const q = query(this.coll, where('projectId', '==', projectId));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as UserStory);
    }

    async create(data: Omit<UserStory, 'id' | 'createdAt'>): Promise<UserStory> {
        const newDoc = doc(this.coll);
        const story = { ...data, id: newDoc.id, createdAt: new Date().toISOString() } as UserStory;
        await setDoc(newDoc, story);
        return story;
    }

    async update(story: UserStory): Promise<void> {
        await setDoc(doc(this.coll, story.id), story);
    }
    
    async delete(id: string): Promise<void> {
        await deleteDoc(doc(this.coll, id));
    }
}

export class TaskService {
    private coll = collection(db, 'tasks');

    async getAll(): Promise<Task[]> {
        const snap = await getDocs(this.coll);
        return snap.docs.map(d => d.data() as Task);
    }

    async getByStory(storyId: string): Promise<Task[]> {
        const q = query(this.coll, where('storyId', '==', storyId));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as Task);
    }

    async create(data: Omit<Task, 'id' | 'createdAt' | 'status'>): Promise<Task> {
        const newDoc = doc(this.coll);
        const task = { ...data, id: newDoc.id, status: 'todo', createdAt: new Date().toISOString() } as Task;
        await setDoc(newDoc, task);
        return task;
    }

    async update(task: Task): Promise<void> {
        await setDoc(doc(this.coll, task.id), task);
    }

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(this.coll, id));
    }
}

export class NotificationService {
    private coll = collection(db, 'notifications');

    async getAll(): Promise<Notification[]> {
        const snap = await getDocs(this.coll);
        return snap.docs.map(d => d.data() as Notification);
    }

    async getForUser(userId: string): Promise<Notification[]> {
        const q = query(this.coll, where('recipientId', '==', userId));
        const snap = await getDocs(q);
        // Sortujemy powiadomienia od najnowszych
        return snap.docs.map(d => d.data() as Notification).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    async getUnreadCount(userId: string): Promise<number> {
        const notifs = await this.getForUser(userId);
        return notifs.filter(n => !n.isRead).length;
    }

    async create(data: { title: string, message: string, priority: Priority, recipientId: string }): Promise<Notification> {
        const newDoc = doc(this.coll);
        const notif = { ...data, id: newDoc.id, date: new Date().toISOString(), isRead: false } as Notification;
        await setDoc(newDoc, notif);
        return notif;
    }

    async markAsRead(id: string): Promise<void> {
        const snap = await getDocs(this.coll);
        const docSnap = snap.docs.find(d => d.id === id);
        if (docSnap) {
            const notif = docSnap.data() as Notification;
            notif.isRead = true;
            await setDoc(doc(this.coll, id), notif);
        }
    }
}