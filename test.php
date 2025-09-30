<?php
// test.php - Para diagnosticar problemas de conexión
echo "PHP está funcionando<br>";

try {
    $pdo = new PDO("mysql:host=localhost;dbname=gestor_tareas", "root", "");
    echo "Conexión a la base de datos: OK<br>";
    
    // Verificar si las tablas existen
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tablas encontradas: " . implode(", ", $tables) . "<br>";
    
} catch (PDOException $e) {
    echo "Error de conexión: " . $e->getMessage() . "<br>";
}
?>