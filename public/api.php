<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH');

require_once __DIR__ . '/../src/TodoService.php';

$todoService = new TodoService();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $todos = $todoService->getAllTodos();
    echo json_encode($todos);
    
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['text']) && !empty(trim($data['text']))) {
        $description = isset($data['description']) ? trim($data['description']) : '';
        $result = $todoService->createTodo(trim($data['text']), $description);
        echo json_encode($result);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Text veld is verplicht'
        ]);
    }
    
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['id']) && isset($data['text']) && !empty(trim($data['text']))) {
        $description = isset($data['description']) ? trim($data['description']) : '';
        $result = $todoService->updateTodo($data['id'], trim($data['text']), $description);
        echo json_encode($result);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'ID en text zijn verplicht'
        ]);
    }
    
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['id'])) {
        $result = $todoService->deleteTodo($data['id']);
        echo json_encode($result);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'ID is verplicht'
        ]);
    }
    
} elseif ($method === 'PATCH') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['id'])) {
        $result = $todoService->toggleCompleted($data['id']);
        echo json_encode($result);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'ID is verplicht'
        ]);
    }
    
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Methode niet toegestaan'
    ]);
}
?>
