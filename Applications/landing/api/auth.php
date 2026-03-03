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
 * API de Autenticación
 * Endpoint: /api/auth
 */

$method = $_SERVER['REQUEST_METHOD'];
// amazonq-ignore-next-line
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        // amazonq-ignore-next-line
        if ($action === 'verify') {
            // Verificar token
            $token = $input['token'] ?? '';
            if (!$token) {
                jsonResponse(['error' => 'Token requerido'], 400);
            }
            
            try {
                $sql = "SELECT id, name, email, role FROM users WHERE session_token = ? AND active = 1";
                $stmt = $db->prepare($sql);
                $stmt->execute([$token]);
                $user = $stmt->fetch();
                
                if ($user) {
                    jsonResponse([
                        'valid' => true,
                        'user' => $user
                    ]);
                } else {
                    jsonResponse(['valid' => false], 401);
                }
            } catch (Exception $e) {
                handleError('Error al verificar token: ' . $e->getMessage());
            }
            
        } elseif ($action === 'logout') {
            // Logout
            $token = $input['token'] ?? '';
            if ($token) {
                try {
                    $sql = "UPDATE users SET session_token = NULL WHERE session_token = ?";
                    $stmt = $db->prepare($sql);
                    $stmt->execute([$token]);
                } catch (Exception $e) {
                    // Log error but don't fail logout
                    error_log('Error en logout: ' . $e->getMessage());
                }
            }
            
            jsonResponse(['success' => true, 'message' => 'Sesión cerrada']);
        }
        break;
    
    default:
        jsonResponse(['error' => 'Método no permitido'], 405);
}
?>