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

### 3. App gebruiken
Open in browser: `http://localhost/school/github/p3-startproject-thom/public/`

## Problemen?

**Database verbinding mislukt:**
- Check of MySQL draait in XAMPP
- Check instellingen in `config/database.php`

**Pagina laadt niet:**
- Check of Apache draait
- Controleer het pad in de URL