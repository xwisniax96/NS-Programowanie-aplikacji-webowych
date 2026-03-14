import { projectAPI } from './api/projectApi';
import { Project, CreateProjectDTO } from './types';

/**
 * Aplikacja do zarządzania projektami - ManageMe
 */

// Referencje do elementów DOM
const projectsContainer = document.getElementById('projectsContainer') as HTMLDivElement;
const addProjectForm = document.getElementById('addProjectForm') as HTMLFormElement;

/**
 * Renderuje listę projektów
 */
function renderProjects(): void {
  const projects = projectAPI.getAll();
  
  if (projects.length === 0) {
    projectsContainer.innerHTML = '<p class="empty-message">Brak projektów. Dodaj pierwszy projekt!</p>';
    return;
  }

  projectsContainer.innerHTML = projects.map(project => createProjectCard(project)).join('');
  
  // Dodaj nasłuchywacze dla przycisków edycji i usuwania
  projects.forEach(project => {
    const deleteBtn = document.getElementById(`delete-${project.id}`);
    const editBtn = document.getElementById(`edit-${project.id}`);
    const saveBtn = document.getElementById(`save-${project.id}`);
    const cancelBtn = document.getElementById(`cancel-${project.id}`);
    
    deleteBtn?.addEventListener('click', () => handleDelete(project.id));
    editBtn?.addEventListener('click', () => handleEdit(project.id));
    saveBtn?.addEventListener('click', () => handleSave(project.id));
    cancelBtn?.addEventListener('click', () => handleCancel(project.id));
  });
}

/**
 * Tworzy HTML dla pojedynczej karty projektu
 */
function createProjectCard(project: Project): string {
  return `
    <div class="project-card" id="card-${project.id}">
      <div class="project-info" id="view-${project.id}">
        <h3>${escapeHtml(project.name)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <small>Utworzono: ${new Date(project.createdAt).toLocaleDateString('pl-PL')}</small>
        <div class="project-actions">
          <button id="edit-${project.id}" class="btn-edit">Edytuj</button>
          <button id="delete-${project.id}" class="btn-delete">Usuń</button>
        </div>
      </div>
      <div class="project-edit" id="edit-form-${project.id}" style="display: none;">
        <input type="text" id="edit-name-${project.id}" value="${escapeHtml(project.name)}" />
        <textarea id="edit-description-${project.id}">${escapeHtml(project.description)}</textarea>
        <div class="project-actions">
          <button id="save-${project.id}" class="btn-save">Zapisz</button>
          <button id="cancel-${project.id}" class="btn-cancel">Anuluj</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Obsługa dodawania nowego projektu
 */
function handleAddProject(event: Event): void {
  event.preventDefault();
  
  const nameInput = document.getElementById('projectName') as HTMLInputElement;
  const descriptionInput = document.getElementById('projectDescription') as HTMLTextAreaElement;
  
  const dto: CreateProjectDTO = {
    name: nameInput.value.trim(),
    description: descriptionInput.value.trim()
  };
  
  if (!dto.name || !dto.description) {
    alert('Proszę wypełnić wszystkie pola!');
    return;
  }
  
  projectAPI.create(dto);
  addProjectForm.reset();
  renderProjects();
}

/**
 * Obsługa usuwania projektu
 */
function handleDelete(id: string): void {
  if (confirm('Czy na pewno chcesz usunąć ten projekt?')) {
    projectAPI.delete(id);
    renderProjects();
  }
}

/**
 * Przełącza widok na edycję projektu
 */
function handleEdit(id: string): void {
  const viewElement = document.getElementById(`view-${id}`);
  const editElement = document.getElementById(`edit-form-${id}`);
  
  if (viewElement && editElement) {
    viewElement.style.display = 'none';
    editElement.style.display = 'block';
  }
}

/**
 * Zapisuje zmiany w projekcie
 */
function handleSave(id: string): void {
  const nameInput = document.getElementById(`edit-name-${id}`) as HTMLInputElement;
  const descriptionInput = document.getElementById(`edit-description-${id}`) as HTMLTextAreaElement;
  
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  
  if (!name || !description) {
    alert('Proszę wypełnić wszystkie pola!');
    return;
  }
  
  projectAPI.update(id, { name, description });
  renderProjects();
}

/**
 * Anuluje edycję projektu
 */
function handleCancel(id: string): void {
  const viewElement = document.getElementById(`view-${id}`);
  const editElement = document.getElementById(`edit-form-${id}`);
  
  if (viewElement && editElement) {
    viewElement.style.display = 'block';
    editElement.style.display = 'none';
  }
}

/**
 * Zabezpieczenie przed XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Inicjalizacja aplikacji
function init(): void {
  addProjectForm.addEventListener('submit', handleAddProject);
  renderProjects();
}

// Uruchom aplikację po załadowaniu DOM
document.addEventListener('DOMContentLoaded', init);

