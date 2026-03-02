<?php
// Laad het database configuratie bestand
require_once __DIR__ . '/../config/database.php';

// Deze class wordt gebruikt door api.php om todo's op te halen, toe te voegen, bij te werken en te verwijderen
class TodoService {
    private $conn; // Database connectie object
    
    // Constructor: wordt automatisch aangeroepen als er een nieuw TodoService object wordt gemaakt
    public function __construct() {
        // Maak verbinding met de database
        $this->conn = getDbConnection();
    }
    
    // Haal alle todo's op uit de database
    // Return: array met alle todo's, nieuwste eerst (gesorteerd op created_at)
    // Inclusief categorie informatie via een LEFT JOIN
    public function getAllTodos() {
        // SQL query met LEFT JOIN om ook de categorie informatie op te halen
        // LEFT JOIN zorgt ervoor dat todo's zonder categorie ook worden opgehaald
        $sql = "SELECT todos.*, categories.name as category_name, categories.color as category_color 
                FROM todos 
                LEFT JOIN categories ON todos.category_id = categories.id 
                ORDER BY todos.created_at DESC";

        $result = $this->conn->query($sql); // Voer de query uit en sla het resultaat op

        $todos = []; // Maak een lege array om de todo's in op te slaan

        
        // Check of er überhaupt todo's zijn gevonden
        if ($result->num_rows > 0) {
            // Loop door alle gevonden rijen
            while($row = $result->fetch_assoc()) {
                // Voeg elke todo toe aan de array
                $todos[] = $row;
            }
        }
        
        // Geef de array met todo's terug kan dus ook leeg zijn als er geen todo's zijn
        return $todos;
    }
    
    // Maak een nieuwe todo aan in de database
    public function createTodo($text, $description = '', $priority = null, $time = null, $deadline = null, $category_id = null) {
        // Escape alle input om SQL injection te voorkomen (beveiligingsmaatregel)
        // real_escape_string zorgt ervoor dat speciale karakters veilig worden gemaakt
        $text = $this->conn->real_escape_string($text);
        $description = $this->conn->real_escape_string($description);
        // Voor optionele velden: alleen escapen als ze een waarde hebben
        $priority = $priority ? $this->conn->real_escape_string($priority) : null;
        $time = $time ? $this->conn->real_escape_string($time) : null;
        $deadline = $deadline ? $this->conn->real_escape_string($deadline) : null;
        // Category_id moet een integer zijn of null
        $category_id = $category_id ? intval($category_id) : null;
        
        // Bouw de SQL INSERT query op
        // Alleen de velden die een waarde hebben worden toegevoegd aan de query
        $sql = "INSERT INTO todos (text, description";
        $values = "VALUES ('$text', '$description'";
        
        // Als priority is ingevuld, voeg het toe aan de query
        if ($priority) {
            $sql .= ", priority";
            $values .= ", '$priority'";
        }
        
        // Als time is ingevuld, voeg het toe aan de query
        if ($time) {
            $sql .= ", time";
            $values .= ", '$time'";
        }
        
        // Als deadline is ingevuld, voeg het toe aan de query
        if ($deadline) {
            $sql .= ", deadline";
            $values .= ", '$deadline'";
        }
        
        // Als category_id is ingevuld, voeg het toe aan de query
        if ($category_id) {
            $sql .= ", category_id";
            $values .= ", $category_id";
        }
        
        // Sluit de query af door beide delen samen te voegen
        $sql .= ") " . $values . ")";
        
        // Voer de INSERT query uit
        if ($this->conn->query($sql) === TRUE) {
            // Als het gelukt is, Geef succes terug met het nieuwe ID
            return [
                'success' => true,
                'id' => $this->conn->insert_id,
                'message' => 'Todo aangemaakt'
            ];
        } else {
            // Mislukt, geef foutmelding terug
            return [
                'success' => false,
                'message' => 'Error: ' . $this->conn->error
            ];
        }
    }
    
    // Update een bestaande todo in de database
    public function updateTodo($id, $text, $description = '', $priority = null, $time = null, $deadline = null, $category_id = null) {
        // Zet ID om naar integer voor beveiliging (voorkomt SQL injection)
        $id = intval($id);
        // Escape de verplichte velden
        $text = $this->conn->real_escape_string($text);
        $description = $this->conn->real_escape_string($description);
        
        // Begin de UPDATE query met de verplichte velden
        $sql = "UPDATE todos SET text = '$text', description = '$description'";
        
        // Voeg optionele velden alleen toe als ze niet null zijn
        if ($priority !== null) {
            $priority = $this->conn->real_escape_string($priority);
            $sql .= ", priority = '$priority'";
        }
        
        if ($time !== null) {
            $time = $this->conn->real_escape_string($time);
            $sql .= ", time = '$time'";
        }
        
        if ($deadline !== null) {
            $deadline = $this->conn->real_escape_string($deadline);
            $sql .= ", deadline = '$deadline'";
        }
        
        // Als category_id is ingevuld, voeg het toe aan de query
        if ($category_id !== null) {
            $category_id = $category_id ? intval($category_id) : 'NULL';
            $sql .= ", category_id = $category_id";
        }
        
        // Sluit de query af met WHERE om aan te geven welke todo moet worden bijgewerkt
        $sql .= " WHERE id = $id";
        
        // Voer de UPDATE query uit
        if ($this->conn->query($sql) === TRUE) {
            return [
                'success' => true,
                'message' => 'Todo bijgewerkt'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Error: ' . $this->conn->error
            ];
        }
    }
    
    // Verwijder een todo uit de database
    public function deleteTodo($id) {
        // Zet ID om naar integer voor beveiliging
        $id = intval($id);
        // DELETE query: verwijder de todo met dit specifieke ID
        $sql = "DELETE FROM todos WHERE id = $id";
        
        // Voer de DELETE query uit
        if ($this->conn->query($sql) === TRUE) {
            return [
                'success' => true,
                'message' => 'Todo verwijderd'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Error: ' . $this->conn->error
            ];
        }
    }
    
    // Schakel de 'completed' status van een todo om (0 wordt 1, 1 wordt 0) als je een todo afvinkt of weer terugzet
    public function toggleCompleted($id) {
        // Zet ID om naar integer voor beveiliging zelfde als net heel de tijd
        $id = intval($id);
        // Als het 0 is wordt het 1, als het 1 is wordt het 0 (toggle functie)
        $sql = "UPDATE todos SET completed = NOT completed WHERE id = $id";
        
        // Voer de UPDATE query uit
        if ($this->conn->query($sql) === TRUE) {
            // Gelukt
            return [
                'success' => true,
                'message' => 'Todo status bijgewerkt'
            ];
        } else {
            // Mislukt
            return [
                'success' => false,
                'message' => 'Error: ' . $this->conn->error
            ];
        }
    }
    
    // Destructor: wordt automatisch aangeroepen als het TodoService object niet meer gebruikt wordt
    // Sluit de database connectie netjes af om geheugen vrij te maken
    public function __destruct() {
        $this->conn->close();
    }
}
?>
