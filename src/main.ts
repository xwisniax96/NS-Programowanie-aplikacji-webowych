import './style.css';
import { ProjectService } from './storage';

const service = new ProjectService();
const form = document.querySelector<HTMLFormElement>('#project-form')!;
const list = document.querySelector<HTMLUListElement>('#project-list')!;
const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;

// Zmienna do trzymania ID projektu, który właśnie edytujemy
let editingId: string | null = null;

function render() {
    const projects = service.getAll();
    list.innerHTML = projects.map(p => `
        <li class="project-item">
            <div>
                <strong>${p.name}</strong>
                <p style="margin: 5px 0 0 0; color: #666;">${p.description}</p>
            </div>
            <div>
                <button class="edit-btn" data-id="${p.id}">Edytuj</button>
                <button class="delete-btn" data-id="${p.id}">Usuń</button>
            </div>
        </li>
    `).join('');

    // Obsługa kliknięcia "Usuń"
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.target as HTMLButtonElement).dataset.id!;
            service.delete(id);
            render(); 
        });
    });

    // Obsługa kliknięcia "Edytuj"
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.target as HTMLButtonElement).dataset.id!;
            const projectToEdit = service.getAll().find(p => p.id === id);
            
            if (projectToEdit) {
                // Wrzucamy dane z powrotem do formularza
                document.querySelector<HTMLInputElement>('#name')!.value = projectToEdit.name;
                document.querySelector<HTMLTextAreaElement>('#description')!.value = projectToEdit.description;
                
                // Przestawiamy aplikację w tryb edycji
                editingId = projectToEdit.id;
                submitBtn.textContent = 'Zapisz zmiany';
                submitBtn.style.background = '#ffb703'; 
            }
        });
    });
}

// Obsługa formularza (Zapisywanie nowego ALBO Zapisywanie edytowanego)
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.querySelector<HTMLInputElement>('#name')!;
    const descInput = document.querySelector<HTMLTextAreaElement>('#description')!;

    if (editingId) {
        // TRYB EDYCJI: Przekazujemy CAŁY obiekt (razem z ID) 
        service.update({
            id: editingId,
            name: nameInput.value,
            description: descInput.value
        });
        
        // Wychodzimy z trybu edycji po zapisaniu
        editingId = null;
        submitBtn.textContent = 'Dodaj Projekt';
        submitBtn.style.background = ''; 
    } else {
        // TRYB DODAWANIA NOWEGO PROJEKTU
        service.create({
            name: nameInput.value,
            description: descInput.value
        });
    }

    form.reset();
    render();
});

// Pierwsze uruchomienie listy przy starcie aplikacji
render();