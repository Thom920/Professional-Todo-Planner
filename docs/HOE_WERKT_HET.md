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
- ✅ Categorieën aanmaken, bewerken en toewijzen aan todo's
- ✅ Sorteren op tekst, prioriteit, tijd, deadline of categorie
- ✅ Kolommen tonen/verbergen
- ✅ Beschrijving toevoegen via modal

## API Endpoints

### Todos (api.php)
| Method | Doel | Verplichte velden |
|--------|------|------------------|
| GET | Alle todos ophalen | - |
| POST | Nieuwe todo | text |
| PUT | Todo bijwerken | id, text |
| DELETE | Todo verwijderen | id |
| PATCH | Completed toggle | id |

### Categorieën (categories.php)
| Method | Doel | Verplichte velden |
|--------|------|------------------|
| GET | Alle categorieën ophalen | - |
| POST | Nieuwe categorie | name |
| PUT | Categorie bijwerken | id, name |
| DELETE | Categorie verwijderen | id |

## Belangrijkste bestanden

### Frontend (public/)
- **index.html** - Hoofdpagina met tabel en modal
- **app.js** - JavaScript logica en API calls
- **style.css** - Styling

### Backend
- **public/api.php** - API endpoint voor todos (routing)
- **public/categories.php** - API endpoint voor categorieën
- **src/TodoService.php** - Database operaties voor todos
- **src/CategoryService.php** - Database operaties voor categorieën
- **config/database.php** - Database connectie

## Database structuur

**Tabel: categories**
| Veld | Type | Beschrijving |
|------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(50) | Naam van de categorie |
| color | VARCHAR(7) | Hex kleurcode (bijv. #3498db) |
| created_at | TIMESTAMP | Aanmaak datum |

**Tabel: todos**
| Veld | Type | Beschrijving |
|------|------|-------------|
| id | INT | Primary key |
| text | VARCHAR(255) | Todo tekst |
| description | TEXT | Uitgebreide beschrijving |
| priority | VARCHAR(20) | Laag/Medium/Hoog/ASAP |
| time | VARCHAR(20) | Geschatte tijdsduur |
| deadline | DATE | Deadline datum |
| category_id | INT | Foreign key naar categories tabel |
| completed | BOOLEAN | Afgevinkt status |
| created_at | TIMESTAMP | Aanmaak datum |
