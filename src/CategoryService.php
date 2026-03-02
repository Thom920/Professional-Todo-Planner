<?php
// Laad het database configuratie bestand
require_once __DIR__ . '/../config/database.php';

/** 
 * Deze class beheert alle operaties voor categorieën in de todo applicatie.
 * Gebruikers kunnen eigen categorieën aanmaken, verwijderen en ophalen.
 * Categorieën kunnen worden toegewezen aan todo's om ze te organiseren.
 */
class CategoryService {
    private $conn; // Database connectie object
    
    
    //Constructor: wordt automatisch aangeroepen als er een nieuw CategoryService object wordt gemaakt
    public function __construct() {
        // Maak verbinding met de database
        $this->conn = getDbConnection();
    }
    
    /**
     * Haal alle categorieën op uit de database
     * 
     * @return array Lijst met alle categorieën gesorteerd op naam
     */
    public function getAllCategories() {
        // SQL query: selecteer alle categorieën en sorteer alfabetisch op naam
        $sql = "SELECT * FROM categories ORDER BY name ASC";
        
        $result = $this->conn->query($sql); // Voer de query uit
        
        $categories = []; // Maak een lege array om de categorieën in op te slaan
        
        // Check of er categorieën zijn gevonden
        if ($result->num_rows > 0) {
            // Loop door alle gevonden rijen
            while($row = $result->fetch_assoc()) {
                // Voeg elke categorie toe aan de array
                $categories[] = $row;
            }
        }
        
        // Geef de array met categorieën terug kan dus ook leeg zijn als er geen categorieën zijn
        return $categories;
    }
    
    /**
     * Maak een nieuwe categorie aan
     * 
     * @param string $name De naam van de categorie
     * @param string $color De kleur van de categorie in hex formaat (bijv. #3498db)
     * @return array Resultaat met success status en bericht
     */
    public function createCategory($name, $color = '#3498db') {
        // Escape de input om SQL injection te voorkomen voor naam en kleur
        $name = $this->conn->real_escape_string(trim($name));
        $color = $this->conn->real_escape_string(trim($color));
        
        // Controleer of de categorie naam al bestaat
        $checkSql = "SELECT id FROM categories WHERE name = '$name'";
        $checkResult = $this->conn->query($checkSql);
        
        if ($checkResult->num_rows > 0) {
            // Categorie bestaat al
            return [
                'success' => false,
                'message' => 'Een categorie met deze naam bestaat al'
            ];
        }
        
        // Bouw de SQL INSERT query op
        $sql = "INSERT INTO categories (name, color) VALUES ('$name', '$color')";
        
        // Voer de INSERT query uit
        if ($this->conn->query($sql) === TRUE) {
            // Gelukt, geef succes terug
            return [
                'success' => true,
                'id' => $this->conn->insert_id,
                'message' => 'Categorie aangemaakt'
            ];
        } else {
            // Mislukt, geef foutmelding terug
            return [
                'success' => false,
                'message' => 'Error: ' . $this->conn->error
            ];
        }
    }
    
    /**
     * Bewerk een bestaande categorie
     * 
     * @param int $id Het ID van de categorie die bewerkt moet worden
     * @param string $name De nieuwe naam van de categorie
     * @param string $color De nieuwe kleur van de categorie in hex formaat
     * @return array Resultaat met success status en bericht
     */
    public function updateCategory($id, $name, $color) {
        // Zet ID om naar integer voor beveiliging
        $id = intval($id);
        
        // Escape de input om SQL injection te voorkomen
        $name = $this->conn->real_escape_string(trim($name));
        $color = $this->conn->real_escape_string(trim($color));
        
        // Controleer of de naam al bestaat bij een andere categorie
        $checkSql = "SELECT id FROM categories WHERE name = '$name' AND id != $id";
        $checkResult = $this->conn->query($checkSql);
        
        if ($checkResult->num_rows > 0) {
            // Er bestaat al een andere categorie met deze naam
            return [
                'success' => false,
                'message' => 'Een categorie met deze naam bestaat al'
            ];
        }
        
        // UPDATE query: werk de categorie bij
        $sql = "UPDATE categories SET name = '$name', color = '$color' WHERE id = $id";
        
        // Voer de UPDATE query uit
        if ($this->conn->query($sql) === TRUE) {
            return [
                'success' => true,
                'message' => 'Categorie is bijgewerkt'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Error: ' . $this->conn->error
            ];
        }
    }
    
    /**
     * Verwijder een categorie uit de database
     * 
     * @param int $id Het ID van de categorie die verwijderd moet worden
     * @return array Resultaat met success status en bericht
     */
    public function deleteCategory($id) {
        // Zet ID om naar integer voor beveiliging
        $id = intval($id);
        
        // Controleer eerst hoeveel todo's deze categorie gebruiken
        $checkSql = "SELECT COUNT(*) as count FROM todos WHERE category_id = $id";
        $checkResult = $this->conn->query($checkSql);
        $row = $checkResult->fetch_assoc();
        $todoCount = $row['count'];
        
        // DELETE query: verwijder de categorie met dit specifieke ID
        $sql = "DELETE FROM categories WHERE id = $id";
        
        // Voer de DELETE query uit
        if ($this->conn->query($sql) === TRUE) {
            // Maak een bericht dat aangeeft hoeveel todo's zijn beïnvloed
            $message = 'Categorie verwijderd';
            if ($todoCount > 0) {
                $message .= " ($todoCount todo's zijn nu zonder categorie)";
            }
            
            return [
                'success' => true,
                'message' => $message
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Error: ' . $this->conn->error
            ];
        }
    }
    
    /**
     * Destructor: wordt automatisch aangeroepen als het CategoryService object niet meer gebruikt wordt
     * Sluit de database connectie netjes af om geheugen vrij te maken
     */
    public function __destruct() {
        $this->conn->close();
    }
}
?>
