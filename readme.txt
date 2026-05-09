# ManageMe

Lokalna aplikacja webowa do zarządzania projektami, oparta o strukturę trójpoziomową: Projekt, Historyjka, Zadanie.

## Stos technologiczny
* TypeScript
* Tailwind CSS v4
* Vite
* LocalStorage (persystencja danych w przeglądarce)

## Funkcjonalności

### Zarządzanie projektami
* Pełny cykl CRUD dla projektów.
* Możliwość ustawienia aktywnego projektu w celu izolacji widoku.

### Historyjki (User Stories)
* Tworzenie i usuwanie historyjek wewnątrz wybranego projektu.
* Definiowanie priorytetów (low, medium, high).
* Zarządzanie stanem poprzez tablicę Kanban (TODO, DOING, DONE).

### Zadania (Tasks)
* Granularne rozbijanie historyjek na konkretne zadania.
* Definiowanie czasu estymowanego, priorytetu oraz przypisywanie wykonawców.
* Automatyczne rejestrowanie czasu rozpoczęcia (start) i zakończenia (finish) pracy.

### System Powiadomień
* **Licznik nieprzeczytanych wiadomości:** Widoczny przy profilu użytkownika.
* **Typy powiadomień:**
    * Utworzenie projektu (High - dla administratorów).
    * Przypisanie do zadania (High).
    * Nowe zadanie w historyjce (Medium - dla właściciela).
    * Zmiana statusu zadania (Medium/Low).
    * Usunięcie zadania (Medium).
* **Interfejs:** Powiadomienia typu "Toast" dla priorytetów High/Medium oraz pełna lista w oknie modalnym.

### Kaskadowa aktualizacja statusów
* Logika biznesowa automatycznie zmienia status historyjki na DOING przy rozpoczęciu pierwszego zadania.
* Automatyczna zmiana statusu historyjki na DONE po zakończeniu wszystkich powiązanych zadań.

### Użytkownicy i role
Aplikacja wykorzystuje predefiniowaną listę użytkowników:
* Jan Kowalski (Admin) - uprawnienia zarządcze.
* Anna Nowak (Developer) - realizacja zadań.
* Piotr Zieliński (DevOps) - realizacja zadań.

### Interfejs
* Responsywny design z wykorzystaniem Tailwind CSS v4.
* Natywne wsparcie dla trybu ciemnego (Dark Mode) z zapisem w LocalStorage.

## Struktura projektu
* `src/types.ts` - Modele danych i definicje typów (Project, Story, Task, Notification).
* `src/storage.ts` - Warstwa dostępu do danych (LocalStorage Services).
* `src/authService.ts` - Zarządzanie użytkownikami i uprawnieniami.
* `src/main.ts` - Główna logika aplikacji, obsługa zdarzeń i renderowanie UI.

## Uruchomienie środowiska

1. Instalacja zależności:
```
npm install
```

2. Uruchomienie deweloperskie:
```
npm run dev
```

3. Budowanie wersji produkcyjnej:

```
npm run build
```