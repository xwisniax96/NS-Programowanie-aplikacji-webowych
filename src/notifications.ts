import { notificationService, currentUser, appState, triggerRender } from './store';
import type { Priority } from './types';

const notifBadge = document.querySelector<HTMLElement>('#notif-badge')!;
const toastContainer = document.querySelector<HTMLElement>('#toast-container')!;

export async function updateBell() {
    const unreadCount = await notificationService.getUnreadCount(currentUser.id);
    if (unreadCount > 0) {
        notifBadge.textContent = unreadCount.toString();
        notifBadge.classList.remove('hidden');
        notifBadge.classList.add('flex');
    } else {
        notifBadge.classList.add('hidden');
        notifBadge.classList.remove('flex');
    }
}

export async function showToast(notifId: string, title: string, message: string, priority: Priority) {
    const bgColors = { low: 'bg-blue-500', medium: 'bg-amber-500', high: 'bg-red-500' };
    
    const toast = document.createElement('div');
    toast.className = `${bgColors[priority]} text-white p-4 rounded-lg shadow-lg flex flex-col gap-1 w-72 animate-bounce cursor-pointer`;
    toast.innerHTML = `<strong class="text-sm font-bold">${title}</strong><span class="text-xs opacity-90">${message}</span>`;
    
    toast.addEventListener('click', async () => {
        toast.remove();
        appState.showNotificationsView = false;
        appState.activeNotificationId = notifId;
        triggerRender(); // Sygnał dla main.ts, że ma przerysować ekran!
    });

    toastContainer.appendChild(toast);
    setTimeout(() => { if(toast.parentElement) toast.remove(); }, 5000);
}

export async function sendNotification(recipientId: string, title: string, message: string, priority: Priority) {
    const notif = await notificationService.create({ title, message, priority, recipientId });
    if (recipientId === currentUser.id && (priority === 'high' || priority === 'medium')) {
        showToast(notif.id, title, message, priority);
    }
    await updateBell();
}

export async function renderAllNotifications() {
    const notifications = await notificationService.getForUser(currentUser.id);
    const list = document.querySelector('#full-notifications-list')!;
    list.innerHTML = notifications.length === 0 ? '<p class="text-gray-500 text-center mt-10">Brak powiadomień w skrzynce.</p>' : '';
    
    notifications.forEach(n => {
        const bgColors = { low: 'border-l-blue-500', medium: 'border-l-amber-500', high: 'border-l-red-500' };
        const readClass = n.isRead ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-white dark:bg-gray-700 font-bold shadow-md';

        const item = document.createElement('div');
        item.className = `p-4 rounded-xl border border-gray-200 dark:border-gray-600 flex justify-between items-center transition-colors border-l-4 ${bgColors[n.priority]} ${readClass}`;
        
        const readBtnHTML = n.isRead ? '' : `<button class="mark-read text-xs bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded hover:bg-gray-300 flex items-center gap-1">
            Oznacz jako przeczytane <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
        </button>`;
        
        item.innerHTML = `
            <div class="cursor-pointer flex-grow" id="open-notif-${n.id}">
                <h3 class="text-lg">${n.title}</h3>
                <span class="text-xs text-gray-500">${new Date(n.date).toLocaleString()}</span>
            </div>
            ${readBtnHTML}
        `;
        
        list.appendChild(item);

        document.querySelector(`#open-notif-${n.id}`)!.addEventListener('click', () => {
            appState.activeNotificationId = n.id;
            appState.showNotificationsView = false;
            triggerRender();
        });

        if (!n.isRead) {
            item.querySelector('.mark-read')!.addEventListener('click', async (e) => {
                e.stopPropagation();
                await notificationService.markAsRead(n.id);
                await renderAllNotifications();
                await updateBell();
            });
        }
    });
}

export async function renderSingleNotification(id: string) {
    const allNotifs = await notificationService.getAll();
    const notif = allNotifs.find(n => n.id === id);
    if(!notif) return;

    if (!notif.isRead) {
        await notificationService.markAsRead(notif.id);
        await updateBell();
    }

    const bgColors = { low: 'bg-blue-100 text-blue-800', medium: 'bg-amber-100 text-amber-800', high: 'bg-red-100 text-red-800' };

    document.querySelector('#single-notif-title')!.textContent = notif.title;
    document.querySelector('#single-notif-priority')!.className = `px-3 py-1 rounded-full text-xs font-bold uppercase ${bgColors[notif.priority]}`;
    document.querySelector('#single-notif-priority')!.textContent = notif.priority;
    document.querySelector('#single-notif-date')!.textContent = new Date(notif.date).toLocaleString();
    document.querySelector('#single-notif-message')!.textContent = notif.message;
}

export function initNotificationsNav() {
    const notifBellBtn = document.querySelector<HTMLElement>('#notif-bell')!;
    const navNotifBtn = document.querySelector<HTMLElement>('#nav-notifications')!;
    
    const openNotifView = () => { 
        appState.showNotificationsView = true; 
        appState.activeNotificationId = null; 
        triggerRender(); 
    };
    
    notifBellBtn.addEventListener('click', openNotifView);
    navNotifBtn.addEventListener('click', openNotifView);
    document.querySelector('#back-to-notifications')!.addEventListener('click', openNotifView);
}