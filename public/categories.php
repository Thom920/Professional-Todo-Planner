<?php
/**
 * API Endpoint voor Categorieën
 * 
 * Dit bestand beheert alle API verzoeken voor categorieën.
 * Gebruikers kunnen categorieën ophalen, aanmaken en verwijderen.
 * Categorieën worden gebruikt om todo's te organiseren.
 */

header('Content-Type: application/json'); // Aangeven dat JSON data terug wordt gestuurd
header('Access-Control-Allow-Origin: *'); // Sta toe dat andere websites de API kan gebruiken
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE'); // Zeg welke soorten verzoeken zijn toegestaan

// Laad de CategoryService class die alle database operaties voor categorieën doet
require_once __DIR__ . '/../src/CategoryService.php';

// Maak een nieuw CategoryService object aan
$categoryService = new CategoryService();

// Kijk welk type verzoek is ontvangen
$method = $_SERVER['REQUEST_METHOD'];

// ===== GET REQUEST: Alle categorieën ophalen =====
// Wordt gebruikt om de lijst met alle beschikbare categorieën te tonen
if ($method === 'GET') {
    // Haal alle categorieën op uit de database
    $categories = $categoryService->getAllCategories();
    
    // Stuur de categorieën terug als JSON
    echo json_encode($categories);
    
// ===== POST REQUEST: Nieuwe categorie aanmaken =====
// Wordt gebruikt om een nieuwe categorie toe te voegen
} elseif ($method === 'POST') {
    // Lees de JSON data die is meegestuurd in het verzoek
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Controleer of het verplichte 'name' veld is ingevuld
    if (isset($data['name']) && !empty(trim($data['name']))) {
        // Haal de optionele kleur op, gebruik default blauw als er geen is opgegeven
        $color = isset($data['color']) ? trim($data['color']) : '#3498db';
        
        // Maak de nieuwe categorie aan in de database
        $result = $categoryService->createCategory(trim($data['name']), $color);
        
        // Stuur het resultaat terug
        echo json_encode($result);
    } else {
        // Als het name veld ontbreekt, stuur een foutmelding terug
        echo json_encode([
            'success' => false,
            'message' => 'Naam veld is verplicht'
        ]);
    }
    
// ===== PUT REQUEST: Categorie bewerken =====
// Wordt gebruikt om een bestaande categorie te wijzigen
} elseif ($method === 'PUT') {
    // Lees de JSON data die is meegestuurd
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Controleer of zowel het ID als de nieuwe name zijn meegestuurd
    if (isset($data['id']) && isset($data['name']) && !empty(trim($data['name']))) {
        // Haal de kleur op
        $color = isset($data['color']) ? trim($data['color']) : '#3498db';
        
        // Update de categorie in de database
        $result = $categoryService->updateCategory($data['id'], trim($data['name']), $color);
        
        // Stuur het resultaat terug
        echo json_encode($result);
    } else {
        // Als ID of name ontbreekt, stuur een foutmelding terug
        echo json_encode([
            'success' => false,
            'message' => 'ID en naam zijn verplicht'
        ]);
    }
    
// ===== DELETE REQUEST: Categorie verwijderen =====
// Wordt gebruikt om een categorie permanent te verwijderen
} elseif ($method === 'DELETE') {
    // Lees de JSON data om te zien welke categorie verwijderd moet worden
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Controleer of het ID is meegestuurd
    if (isset($data['id'])) {
        // Verwijder de categorie uit de database
        $result = $categoryService->deleteCategory($data['id']);
        
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
// Als er een methode wordt gebruikt die niet wordt ondersteund
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Methode niet toegestaan'
    ]);
}
?>
