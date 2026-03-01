# Hoe werkt de Todo App?

## Overzicht

De app bestaat uit 3 lagen:
1. **Frontend** - HTML, CSS, JavaScript
2. **Backend** - PHP (API + Service layer)
3. **Database** - MySQL

## Features

- ✅ Todo's toevoegen, bewerken en verwijderen
- ✅ Prioriteit instellen (Laag, Medium, Hoog, ASAP)
- ✅ Tijdsduur kiezen (10 min tot 5+ uur)
- ✅ Deadline instellen (met vandaag-markering)
- ✅ Sorteren op tekst, prioriteit, tijd of deadline
- ✅ Kolommen tonen/verbergen
- ✅ Beschrijving toevoegen via modal

## API Endpoints

| Method | Doel | Verplichte velden |
|--------|------|------------------|
| GET | Alle todos ophalen | - |
| POST | Nieuwe todo | text |
| PUT | Todo bijwerken | id, text |
| DELETE | Todo verwijderen | id |
| PATCH | Completed toggle | id |

## Belangrijkste bestanden

### Frontend (public/)
- **index.html** - Hoofdpagina met tabel en modal
- **app.js** - JavaScript logica en API calls
- **style.css** - Styling

### Backend
- **public/api.php** - API endpoint (routing)
- **src/TodoService.php** - Database operaties
- **config/database.php** - Database connectie

## Database structuur

**Tabel: todos**
| Veld | Type | Beschrijving |
|------|------|--------------|
| id | INT | Primary key |
| text | VARCHAR(255) | Todo tekst |
| description | TEXT | Uitgebreide beschrijving |
| priority | VARCHAR(20) | Laag/Medium/Hoog/ASAP |
| time | VARCHAR(20) | Geschatte tijdsduur |
| deadline | DATE | Deadline datum |
| completed | BOOLEAN | Afgevinkt status |
| created_at | TIMESTAMP | Aanmaak datum |
