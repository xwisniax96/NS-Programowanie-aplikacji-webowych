# ManageMe

Aplikacja webowa typu SPA (Single Page Application) do zarządzania projektami, oparta o strukturę trójpoziomową: Projekt, historyjki (User Stories) oraz zadania podrzędne (Tasks).

## Stos technologiczny
* TypeScript
* Tailwind CSS v4
* Vite
* **Firebase (Cloud Firestore)** - persystencja danych w chmurze działająca w czasie rzeczywistym.

## Funkcjonalności

### Zarządzanie projektami
* Pełny cykl CRUD dla projektów (zabezpieczony: tworzenie i usuwanie tylko dla Administratorów).
* Możliwość ustawienia aktywnego projektu w celu izolacji widoku tablicy.

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
* **Interfejs:** Powiadomienia typu "Toast" dla priorytetów High/Medium oraz pełna lista powiadomień.

### Kaskadowa aktualizacja statusów
* Logika biznesowa automatycznie zmienia status historyjki na DOING przy rozpoczęciu pierwszego zadania.
* Automatyczna zmiana statusu historyjki na DONE po zakończeniu wszystkich powiązanych zadań.

### Użytkownicy i role
Aplikacja wykorzystuje predefiniowaną listę użytkowników testowych (moduł mock-auth):
* Jan Kowalski (Admin) - uprawnienia zarządcze.
* Anna Nowak (Developer) - realizacja zadań.
* Piotr Zieliński (DevOps) - realizacja zadań.

### Interfejs
* Responsywny design z wykorzystaniem Tailwind CSS v4 (podejście utility-first).
* Natywne wsparcie dla trybu ciemnego (Dark Mode) z preferencją w systemie/przeglądarce.
* Modularna i zoptymalizowana architektura kodu.

## Struktura projektu
Aplikacja została podzielona na moduły logiczne w celu łatwiejszego utrzymania:
* `src/types.ts` - Modele danych i definicje typów TypeScript.
* `src/storage.ts` - Konfiguracja bazy Cloud Firestore oraz komunikacja z API.
* `src/store.ts` - Globalny stan aplikacji oraz serwisy agregujące logikę biznesową.
* `src/templates.ts` - Generatory widoków i komponentów HTML.
* `src/theme.ts` - Zarządzanie motywem graficznym (Dark/Light mode).
* `src/notifications.ts` - Logika i renderowanie systemu powiadomień i alertów Toast.
* `src/authService.ts` - Moduł autoryzacji oraz zarządzanie uprawnieniami.
* `src/main.ts` - Główny kontroler aplikacji, obsługa zdarzeń DOM oraz routing widoków.

## Uruchomienie środowiska

1. Instalacja zależności:
```
npm install
```
2. Konfiguracja zmiennych środowiskowych (wymagane):

Utwórz plik .env w głównym katalogu projektu na podstawie dostarczonego pliku .env.example i uzupełnij klucze dostępowe do Firebase:
```
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

3. Uruchomienie deweloperskie:
```
npm run dev
```

4. Wersja produkcyjna:

```
npm run build
```