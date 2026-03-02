<?php
/**
 * API Endpoint voor Todo Applicatie
 * 
 * Dit bestand is het centrale punt voor alle communicatie met de todo applicatie.
 * Het ontvangt verzoeken (requests) en stuurt antwoorden (responses) terug in JSON formaat.
 */


header('Content-Type: application/json');// Aangeven dat JSON data terug wordt gestuurd
header('Access-Control-Allow-Origin: *');// Sta toe dat andere websites de API kan gebruiken (CORS = Cross-Origin Resource Sharing)
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH');// Zeg welke soorten verzoeken zijn toegestaan

// Laad de TodoService class die alle database operaties voor ons doet
require_once __DIR__ . '/../src/TodoService.php';

// Maak een nieuw TodoService object aan
$todoService = new TodoService();

// Kijk welk type verzoek is ontvangen (GET, POST, PUT, DELETE of PATCH)
$method = $_SERVER['REQUEST_METHOD'];

// ===== GET REQUEST: Alle todo's ophalen =====
// Wordt gebruikt om de lijst met alle todo's te tonen
if ($method === 'GET') {
    // Haal alle todo's op uit de database
    $todos = $todoService->getAllTodos();
    
    // Stuur de todo's terug als JSON
    echo json_encode($todos);
    
// ===== POST REQUEST: Nieuwe todo aanmaken =====
// Wordt gebruikt om een nieuwe todo toe te voegen aan de lijst
} elseif ($method === 'POST') {
    // Lees de JSON data die is meegestuurd in het verzoek
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Controleer of het verplichte 'text' veld is ingevuld
    if (isset($data['text']) && !empty(trim($data['text']))) {
        // Maak de nieuwe todo aan in de database
        $result = $todoService->createTodo(trim($data['text']));
        
        // Stuur het resultaat terug
        echo json_encode($result);
    } else {
        // Als het text veld ontbreekt, stuur een foutmelding terug
        echo json_encode([
            'success' => false,
            'message' => 'Text veld is verplicht'
        ]);
    }
    
// ===== PUT REQUEST: Bestaande todo bijwerken =====
// Wordt gebruikt om een bestaande todo te wijzigen
} elseif ($method === 'PUT') {
    // Lees de JSON data die is meegestuurd
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Controleer of zowel het ID als de nieuwe text zijn meegestuurd
    if (isset($data['id']) && isset($data['text']) && !empty(trim($data['text']))) {
        // Haal de optionele velden op
        $description = isset($data['description']) ? trim($data['description']) : '';
        $priority = isset($data['priority']) ? trim($data['priority']) : null;
        $time = isset($data['time']) ? trim($data['time']) : null;
        $deadline = isset($data['deadline']) ? trim($data['deadline']) : null;
        $category_id = isset($data['category_id']) ? $data['category_id'] : null;
        
        // Update de todo in de database
        $result = $todoService->updateTodo($data['id'], trim($data['text']), $description, $priority, $time, $deadline, $category_id);
        
        // Stuur het resultaat terug
        echo json_encode($result);
    } else {
        // Als ID of text ontbreekt (wat ik knap zou vinden als je dat voor elkaar krijgt), stuur een foutmelding terug
        echo json_encode([
            'success' => false,
            'message' => 'ID en text zijn verplicht'
        ]);
    }
    
// ===== DELETE REQUEST: Todo verwijderen =====
// Wordt gebruikt om een todo permanent te verwijderen
} elseif ($method === 'DELETE') {
    // Lees de JSON data om te zien welke todo verwijderd moet worden
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Controleer of het ID is meegestuurd
    if (isset($data['id'])) {
        // Verwijder de todo uit de database
        $result = $todoService->deleteTodo($data['id']);
        
        // Stuur het resultaat terug
        echo json_encode($result);
    } else {
        // Als het ID ontbreekt, stuur een foutmelding
        echo json_encode([
            'success' => false,
            'message' => 'ID is verplicht'
        ]);
    }
    
// ===== PATCH REQUEST: Todo afvinken (completed toggle) =====
// Wordt gebruikt om een todo als 'voltooid' of 'niet voltooid' te markeren
} elseif ($method === 'PATCH') {
    // Lees de JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Controleer of het ID is meegestuurd
    if (isset($data['id'])) {
        // Schakel de 'completed' status om (van aan naar uit, of van uit naar aan)
        $result = $todoService->toggleCompleted($data['id']);
        
        // Stuur het resultaat terug
        echo json_encode($result);
    } else {
        // Als het ID ontbreekt, stuur een foutmelding
        echo json_encode([
            'success' => false,
            'message' => 'ID is verplicht'
        ]);
    }
    
// ===== ONBEKENDE REQUEST METHOD =====
// Als je op een of andere manier een methode gebruikt die niet wordt ondersteund, stuur dan een foutmelding terug
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Methode niet toegestaan'
    ]);
}
?>
