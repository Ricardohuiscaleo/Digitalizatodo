<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

$config_paths = [
    __DIR__ . '/../config.php',
    __DIR__ . '/../../config.php',
    __DIR__ . '/../../../config.php',
    __DIR__ . '/../../../../config.php',
    __DIR__ . '/../../../../../config.php'
];

foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        break;
    }
}

/**
 * API de Servicios
 * Endpoint: /api/services
 */

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'GET':
        try {
            $search = $_GET['search'] ?? '';
            $level = min((int)($_GET['level'] ?? 1), MAX_SEARCH_DEPTH);
            
            if ($search) {
                $results = searchMultiLevel('services', $search, ['name', 'description', 'category'], $level);
                jsonResponse([
                    'search' => $search,
                    'level' => $level,
                    'results' => $results,
                    'total' => count($results)
                ]);
            } else {
                $sql = "SELECT * FROM services WHERE active = 1 ORDER BY sort_order, name";
                $stmt = $db->query($sql);
                jsonResponse($stmt->fetchAll());
            }
        } catch (Exception $e) {
            handleError('Error al obtener servicios: ' . $e->getMessage());
        }
        break;
    
    case 'POST':
        // amazonq-ignore-next-line
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input['name'] || !$input['category']) {
            jsonResponse(['error' => 'Nombre y categoría son requeridos'], 400);
        }
        
        try {
            $sql = "INSERT INTO services (name, description, category, price, active, created_at) VALUES (?, ?, ?, ?, 1, NOW())";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['description'] ?? null,
                $input['category'],
                $input['price'] ?? null
            ]);
            
            jsonResponse([
                'success' => true,
                'id' => $db->lastInsertId(),
                'message' => 'Servicio creado exitosamente'
            ]);
        } catch (Exception $e) {
            handleError('Error al crear servicio: ' . $e->getMessage());
        }
        break;
    
    default:
        jsonResponse(['error' => 'Método no permitido'], 405);
}
?>