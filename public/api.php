<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

require_once __DIR__ . '/../src/TodoService.php';

$todoService = new TodoService();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $todos = $todoService->getAllTodos();
    echo json_encode($todos);
    
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['text']) && !empty(trim($data['text']))) {
        $result = $todoService->createTodo(trim($data['text']));
        echo json_encode($result);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Text veld is verplicht'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Methode niet toegestaan'
    ]);
}
?>
