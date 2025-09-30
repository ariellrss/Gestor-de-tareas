<?php
// upload-background.php
session_start();
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(0);

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['background'])) {
    $uploadDir = 'uploads/backgrounds/';
    
    // Crear directorio si no existe
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $fileName = 'user_' . $user_id . '_' . time() . '.jpg';
    $filePath = $uploadDir . $fileName;
    
    if (move_uploaded_file($_FILES['background']['tmp_name'], $filePath)) {
        echo json_encode([
            'success' => true, 
            'imageUrl' => $filePath,
            'message' => 'Imagen guardada'
        ]);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => 'Error al guardar imagen'
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Solicitud inválida']);
}
?>