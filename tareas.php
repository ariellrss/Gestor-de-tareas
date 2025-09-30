<?php
include 'config.php';

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autenticado']);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener tareas del usuario
    $sql = "SELECT * FROM tareas WHERE usuario_id = :user_id ORDER BY fecha_vencimiento";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($tareas);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Crear nueva tarea
    $data = json_decode(file_get_contents('php://input'), true);
    
    $sql = "INSERT INTO tareas (id, usuario_id, series_id, nombre, fecha_vencimiento, prioridad, estado, descripcion, repeticion) 
            VALUES (:id, :usuario_id, :series_id, :nombre, :fecha_vencimiento, :prioridad, :estado, :descripcion, :repeticion)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':id', $data['id'], PDO::PARAM_STR);
    $stmt->bindParam(':usuario_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':series_id', $data['seriesId'], PDO::PARAM_STR);
    $stmt->bindParam(':nombre', $data['name'], PDO::PARAM_STR);
    $stmt->bindParam(':fecha_vencimiento', $data['dueDate'], PDO::PARAM_STR);
    $stmt->bindParam(':prioridad', $data['priority'], PDO::PARAM_STR);
    $stmt->bindParam(':estado', $data['status'], PDO::PARAM_STR);
    $stmt->bindParam(':descripcion', $data['description'], PDO::PARAM_STR);
    $stmt->bindParam(':repeticion', $data['repeat'], PDO::PARAM_STR);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Actualizar tarea
    $data = json_decode(file_get_contents('php://input'), true);
    
    $sql = "UPDATE tareas SET prioridad = :prioridad, estado = :estado WHERE id = :id AND usuario_id = :user_id";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':prioridad', $data['priority'], PDO::PARAM_STR);
    $stmt->bindParam(':estado', $data['status'], PDO::PARAM_STR);
    $stmt->bindParam(':id', $data['id'], PDO::PARAM_STR);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Eliminar tarea
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['seriesId']) && $data['seriesId']) {
        // Eliminar serie completa
        $sql = "DELETE FROM tareas WHERE series_id = :series_id AND usuario_id = :user_id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':series_id', $data['seriesId'], PDO::PARAM_STR);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    } else {
        // Eliminar tarea individual
        $sql = "DELETE FROM tareas WHERE id = :id AND usuario_id = :user_id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $data['id'], PDO::PARAM_STR);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    }
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
}
?>