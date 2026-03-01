# Installatie Handleiding

## Vereisten
- XAMPP, MAMP of WAMP geïnstalleerd
- Browser (Chrome, Firefox, Edge)

## Stappen

### 1. XAMPP/MAMP/WAMP starten
1. Open XAMPP/MAMP/WAMP Control Panel
2. Start **Apache** en **MySQL**

### 2. Database aanmaken
1. Ga naar `http://localhost/phpmyadmin`
2. Klik op "Import"
3. Selecteer: `config/setup_database.sql`
4. Klik op "Go"

**Of handmatig:**
1. Maak database aan: `todo_app`
2. Voer SQL uit vanuit `config/setup_database.sql`

### 3. App gebruiken
Open in browser: `http://localhost/[pad-naar-project]/public/`

Bijvoorbeeld: `http://localhost/p3-startproject-thom/public/`

## Problemen?

**Database verbinding mislukt:**
- Check of MySQL draait in XAMPP
- Check instellingen in `config/database.php`
- Check of database `todo_app` bestaat

**Pagina laadt niet:**
- Check of Apache draait
- Controleer het pad in de URL
- Controleer of je in de `/public/` map zit

**API werkt niet:**
- Check browser console (F12) voor errors
- Check of `api.php` bereikbaar is