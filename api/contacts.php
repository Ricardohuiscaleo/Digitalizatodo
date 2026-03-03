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
 * API de Contactos
 * Endpoint: /api/contacts
 */

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'POST':
        // amazonq-ignore-next-line
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input['name'] || !$input['message']) {
            jsonResponse(['error' => 'Nombre y mensaje son requeridos'], 400);
        }
        
        try {
            $sql = "INSERT INTO contacts (name, email, phone, message, created_at) VALUES (?, ?, ?, ?, NOW())";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['email'] ?? null,
                $input['phone'] ?? null,
                $input['message']
            ]);
            
            jsonResponse([
                'success' => true,
                'id' => $db->lastInsertId(),
                'message' => 'Contacto guardado exitosamente'
            ]);
        } catch (Exception $e) {
            handleError('Error al guardar contacto: ' . $e->getMessage());
        }
        break;
    
    case 'GET':
        try {
            $search = $_GET['search'] ?? '';
            $level = min((int)($_GET['level'] ?? 1), MAX_SEARCH_DEPTH);
            
            if ($search) {
                $results = searchMultiLevel('contacts', $search, ['name', 'email', 'message'], $level);
                jsonResponse([
                    'search' => $search,
                    'level' => $level,
                    'results' => $results,
                    'total' => count($results)
                ]);
            } else {
                $sql = "SELECT * FROM contacts ORDER BY created_at DESC LIMIT 50";
                $stmt = $db->query($sql);
                jsonResponse($stmt->fetchAll());
            }
        } catch (Exception $e) {
            handleError('Error al obtener contactos: ' . $e->getMessage());
        }
        break;
    
    default:
        jsonResponse(['error' => 'Método no permitido'], 405);
}
?>