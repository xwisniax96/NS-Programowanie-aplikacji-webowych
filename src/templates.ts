import type { Project, UserStory, Task } from './types';




export function createProjectHTML(p: Project): string {
    return `
        <li class="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <span class="open-project cursor-pointer font-bold text-blue-600 dark:text-blue-400 grow hover:underline flex items-center gap-2" data-id="${p.id}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500 dark:text-gray-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
                ${p.name}
            </span>
            <div class="mt-4 sm:mt-0 flex gap-2">
                <button class="edit-btn bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors" data-id="${p.id}">Edytuj</button>
                <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors" data-id="${p.id}">Usuń</button>
            </div>
        </li>
    `;
}
export function createStoryHTML(s: UserStory, ownerName: string, borderColor: string): string {
    return `
        <li class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border-l-4 ${borderColor}">
            <div class="flex justify-between items-start">
                <strong class="text-lg">${s.name}</strong>
                <span class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">${s.priority}</span>
            </div>
            <p class="my-2 text-sm text-gray-600 dark:text-gray-300">${s.description}</p>
            <small class="text-gray-500 dark:text-gray-400 block">Dodał: ${ownerName}</small>
            
            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600 flex gap-2">
                <button class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors flex justify-center items-center gap-2" onclick="window.openStory('${s.id}')">
                    Zarządzaj Zadaniami
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </button>
            </div>
        </li>
    `;
}
export function createTaskHTML(t: Task, detailsHTML: string, actionHTML: string): string {
    return `
        <li class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-4">
            <strong class="block text-lg mb-1">${t.name}</strong>
            <p class="text-sm text-gray-700 dark:text-gray-300">${t.description}</p>
            ${detailsHTML}
            ${actionHTML}
            <button class="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-1 rounded text-sm transition-colors" onclick="window.deleteTask('${t.id}')">Usuń zadanie</button>
        </li>
    `;
}