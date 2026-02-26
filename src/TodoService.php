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
    
    public function createTodo($text) {
        $text = $this->conn->real_escape_string($text);
        $sql = "INSERT INTO todos (text) VALUES ('$text')";
        
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
    
    public function updateTodo($id, $text) {
        $id = intval($id);
        $text = $this->conn->real_escape_string($text);
        $sql = "UPDATE todos SET text = '$text' WHERE id = $id";
        
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
