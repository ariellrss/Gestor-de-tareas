<?php
// login.php

// Headers primero para evitar output no deseado
header('Content-Type: application/json; charset=utf-8');

// Deshabilitar errores
ini_set('display_errors', 0);
error_reporting(0);

// Incluir config después de headers
include 'config.php';

// Verificar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Obtener datos
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

// Validaciones
if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Usuario y contraseña son obligatorios']);
    exit;
}

try {
    // Verificar conexión a BD
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }
    
    $sql = "SELECT id, username, password_hash FROM usuarios WHERE username = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$username]);
    
    if ($stmt->rowCount() === 1) {
        $user = $stmt->fetch();
        
        if (password_verify($password, $user['password_hash'])) {
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            echo json_encode(['success' => true, 'message' => 'Login exitoso']);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas']);
        }
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor']);
}
?>