<?php
require_once __DIR__ . '/../config/database.php';

class TodoService {
    private $conn;
    
    public function __construct() {
        $this->conn = getDbConnection();
    }
    
    public function getAllTodos() {
        $sql = "SELECT * FROM todos ORDER BY created_at DESC";
        $result = $this->conn->query($sql);
        $todos = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $todos[] = $row;
            }
        }
        
        return $todos;
    }
    
    public function createTodo($text, $description = '', $priority = null, $time = null) {
        $text = $this->conn->real_escape_string($text);
        $description = $this->conn->real_escape_string($description);
        $priority = $priority ? $this->conn->real_escape_string($priority) : null;
        $time = $time ? $this->conn->real_escape_string($time) : null;
        
        $sql = "INSERT INTO todos (text, description";
        $values = "VALUES ('$text', '$description'";
        
        if ($priority) {
            $sql .= ", priority";
            $values .= ", '$priority'";
        }
        
        if ($time) {
            $sql .= ", time";
            $values .= ", '$time'";
        }
        
        $sql .= ") " . $values . ")";
        
        if ($this->conn->query($sql) === TRUE) {
            return [
                'success' => true,
                'id' => $this->conn->insert_id,
                'message' => 'Todo aangemaakt'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Error: ' . $this->conn->error
            ];
        }
    }
    
    public function updateTodo($id, $text, $description = '', $priority = null, $time = null) {
        $id = intval($id);
        $text = $this->conn->real_escape_string($text);
        $description = $this->conn->real_escape_string($description);
        
        $sql = "UPDATE todos SET text = '$text', description = '$description'";
        
        if ($priority !== null) {
            $priority = $this->conn->real_escape_string($priority);
            $sql .= ", priority = '$priority'";
        }
        
        if ($time !== null) {
            $time = $this->conn->real_escape_string($time);
            $sql .= ", time = '$time'";
        }
        
        $sql .= " WHERE id = $id";
        
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
    
    public function deleteTodo($id) {
        $id = intval($id);
        $sql = "DELETE FROM todos WHERE id = $id";
        
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
    
    public function toggleCompleted($id) {
        $id = intval($id);
        $sql = "UPDATE todos SET completed = NOT completed WHERE id = $id";
        
        if ($this->conn->query($sql) === TRUE) {
            return [
                'success' => true,
                'message' => 'Todo status bijgewerkt'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Error: ' . $this->conn->error
            ];
        }
    }
    
    public function __destruct() {
        $this->conn->close();
    }
}
?>
