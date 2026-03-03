<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
// amazonq-ignore-next-line
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    // amazonq-ignore-next-line
    // amazonq-ignore-next-line
    // amazonq-ignore-next-line
    // amazonq-ignore-next-line
    // amazonq-ignore-next-line
    exit;
}

$config_paths = [
    __DIR__ . '/../config.php',
    __DIR__ . '/../../config.php',
    __DIR__ . '/../../../config.php',
    __DIR__ . '/../../../../config.php',
    __DIR__ . '/../../../../../config.php'
];

// amazonq-ignore-next-line
foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        break;
    }
}

/**
 * API de Proyectos
 * Endpoint: /api/projects
 */

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'POST':
        // amazonq-ignore-next-line
        // amazonq-ignore-next-line
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input['name'] || !$input['type']) {
            jsonResponse(['error' => 'Nombre y tipo de proyecto son requeridos'], 400);
        }
        
        try {
            $sql = "INSERT INTO projects (name, type, description, budget, deadline, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', NOW())";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['type'],
                $input['description'] ?? null,
                $input['budget'] ?? null,
                $input['deadline'] ?? null
            ]);
            
            jsonResponse([
                'success' => true,
                'id' => $db->lastInsertId(),
                'message' => 'Proyecto creado exitosamente'
            ]);
        } catch (Exception $e) {
            handleError('Error al crear proyecto: ' . $e->getMessage());
        }
        break;
    
    case 'GET':
        try {
            $search = $_GET['search'] ?? '';
            $level = min((int)($_GET['level'] ?? 1), MAX_SEARCH_DEPTH);
            
            if ($search) {
                $results = searchMultiLevel('projects', $search, ['name', 'type', 'description'], $level);
                jsonResponse([
                    'search' => $search,
                    'level' => $level,
                    'results' => $results,
                    'total' => count($results)
                ]);
            } else {
                $sql = "SELECT * FROM projects ORDER BY created_at DESC";
                $stmt = $db->query($sql);
                jsonResponse($stmt->fetchAll());
            }
        } catch (Exception $e) {
            handleError('Error al obtener proyectos: ' . $e->getMessage());
        }
        break;
    
    default:
        jsonResponse(['error' => 'Método no permitido'], 405);
}
?>