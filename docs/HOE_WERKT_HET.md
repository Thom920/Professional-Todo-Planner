# Hoe werkt de Todo App?

## Overzicht

De app bestaat uit 3 lagen:
1. **Frontend** - HTML, CSS, JavaScript
2. **Backend** - PHP (API + Service layer)
3. **Database** - MySQL

## Flow: Todo toevoegen

1. **Gebruiker** → Vult todo in en klikt "Toevoegen"
2. **app.js** → Stuurt todo naar `api.php` (POST request)
3. **api.php** → Ontvangt data en roept `TodoService` aan
4. **TodoService.php** → Slaat todo op in MySQL database
5. **Database** → Bevestigt opslag
6. **app.js** → Haalt alle todos op en toont ze

## Belangrijkste bestanden

### Frontend (public/)
- **index.html** - Hoofdpagina met formulier en todo lijst
- **app.js** - Verstuurt/ontvangt data via API
- **style.css** - Styling

### Backend (src/)
- **api.php** - API endpoint (GET/POST)
- **TodoService.php** - Database operaties
- **database.php** - Database connectie

## Database structuur

**Tabel: todos**
| Veld | Type | Beschrijving |
|------|------|--------------|
| id | INT | Primary key |
| text | VARCHAR(255) | Todo tekst |
| completed | BOOLEAN | Status |
| created_at | TIMESTAMP | Aanmaak datum |
