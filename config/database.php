<?php
// Database configuratie instellingen
// Hier worden de gegevens opgeslagen om verbinding te maken met de database


define('DB_HOST', 'localhost');// Het adres waar de database draait (meestal 'localhost' bij lokale ontwikkeling)
define('DB_USER', 'root');// De gebruikersnaam om in te loggen op de database (standaard 'root' bij XAMPP)
define('DB_PASS', '');// Het wachtwoord voor de database gebruiker (standaard leeg bij XAMPP)
define('DB_NAME', 'todo_app');// De naam van de database die we gebruiken

/**
 * Functie om een verbinding met de database te maken
 * 
 * Deze functie probeert verbinding te maken met de MySQL database.
 * Als de verbinding lukt, krijg je een database object terug.
 * Als de verbinding mislukt, wordt er een foutmelding getoond.
 * 
 * @return mysqli database verbinding object
 */
function getDbConnection() {
    // Maak een nieuwe verbinding met de database met de instellingen hierboven
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    // Controleer of de verbinding is mislukt
    if ($conn->connect_error) {
        // Als de verbinging is mislukt, stuur een 500 status code terug
        http_response_code(500);
        
        // JSON terugsturen
        header('Content-Type: application/json');
        
        // Stuur een foutmelding terug in JSON formaat
        echo json_encode([
            'success' => false,
            'message' => 'Database verbinding mislukt: ' . $conn->connect_error
        ]);      
        exit;
    }
    
    // Als alles goed ging, stuur de werkende database verbinding terug
    return $conn;
}
?>
