<?php
// preferencias.php
session_start();
header('Content-Type: application/json');

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$user_id = $_SESSION['user_id'];
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener preferencias del usuario
    try {
        $sql = "SELECT * FROM preferencias_usuario WHERE usuario_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        
        if ($stmt->rowCount() > 0) {
            $preferencias = $stmt->fetch();
            echo json_encode($preferencias);
        } else {
            // Crear registro por defecto si no existe
            $sql = "INSERT INTO preferencias_usuario (usuario_id) VALUES (?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user_id]);
            
            $sql = "SELECT * FROM preferencias_usuario WHERE usuario_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user_id]);
            $preferencias = $stmt->fetch();
            echo json_encode($preferencias);
        }
    } catch (Exception $e) {
        echo json_encode([
            'paleta_colores' => 'default',
            'fondo_imagen' => '',
            'fondo_tamaño' => 'cover',
            'fondo_posicion' => 'center',
            'fondo_zoom' => 100
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Guardar preferencias del usuario
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'JSON inválido']);
        exit;
    }
    
    try {
        $sql = "UPDATE preferencias_usuario SET 
                paleta_colores = ?,
                fondo_imagen = '',
                fondo_tamaño = 'cover',
                fondo_posicion = 'center',
                fondo_zoom = 100
                WHERE usuario_id = ?";
        
        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute([
            $data['palette'] ?? 'default',
            $user_id
        ]);
        
        if ($success && $stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Preferencias guardadas']);
        } else {
            // Si no existe el registro, crearlo
            $sql = "INSERT INTO preferencias_usuario (usuario_id, paleta_colores, fondo_imagen, fondo_tamaño, fondo_posicion, fondo_zoom) 
                    VALUES (?, ?, '', 'cover', 'center', 100)";
            $stmt = $pdo->prepare($sql);
            $success = $stmt->execute([
                $user_id,
                $data['palette'] ?? 'default'
            ]);
            
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Preferencias creadas y guardadas']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al guardar preferencias']);
            }
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error del servidor']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>