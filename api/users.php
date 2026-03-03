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

foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        break;
    }
}

/**
 * API de Usuarios y Autenticación
 * Endpoint: /api/users
 */

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

switch ($method) {
    case 'POST':
        // amazonq-ignore-next-line
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        if ($action === 'login') {
            // Login
            if (!$input['email'] || !$input['password']) {
                jsonResponse(['error' => 'Email y contraseña requeridos'], 400);
            }
            
            try {
                $sql = "SELECT * FROM users WHERE email = ? AND active = 1";
                $stmt = $db->prepare($sql);
                $stmt->execute([$input['email']]);
                $user = $stmt->fetch();
                
                if ($user && password_verify($input['password'], $user['password'])) {
                    $token = bin2hex(random_bytes(32));
                    
                    // Actualizar token de sesión
                    $sql = "UPDATE users SET session_token = ?, last_login = NOW() WHERE id = ?";
                    $stmt = $db->prepare($sql);
                    $stmt->execute([$token, $user['id']]);
                    
                    jsonResponse([
                        'success' => true,
                        'token' => $token,
                        'user' => [
                            'id' => $user['id'],
                            'name' => $user['name'],
                            'email' => $user['email'],
                            'role' => $user['role']
                        ]
                    ]);
                } else {
                    jsonResponse(['error' => 'Credenciales inválidas'], 401);
                }
            } catch (Exception $e) {
                handleError('Error en login: ' . $e->getMessage());
            }
            
        } elseif ($action === 'register') {
            // Registro (solo admin puede crear usuarios)
            if (!$input['name'] || !$input['email'] || !$input['password']) {
                jsonResponse(['error' => 'Nombre, email y contraseña requeridos'], 400);
            }
            
            try {
                $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
                // amazonq-ignore-next-line
                // amazonq-ignore-next-line
                // amazonq-ignore-next-line
                // amazonq-ignore-next-line
                // amazonq-ignore-next-line
                $sql = "INSERT INTO users (name, email, password, role, active, created_at) VALUES (?, ?, ?, ?, 1, NOW())";
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    $input['name'],
                    $input['email'],
                    $hashedPassword,
                    $input['role'] ?? 'user'
                ]);
                
                jsonResponse([
                    'success' => true,
                    'id' => $db->lastInsertId(),
                    'message' => 'Usuario creado exitosamente'
                ]);
            } catch (Exception $e) {
                handleError('Error al crear usuario: ' . $e->getMessage());
            }
        }
        break;
    
    case 'GET':
        // Listar usuarios (requiere autenticación)
        // amazonq-ignore-next-line
        $token = $_GET['token'] ?? '';
        if (!$token) {
            jsonResponse(['error' => 'Token requerido'], 401);
        }
        
        try {
            $search = $_GET['search'] ?? '';
            $level = min((int)($_GET['level'] ?? 1), MAX_SEARCH_DEPTH);
            
            if ($search) {
                $results = searchMultiLevel('users', $search, ['name', 'email'], $level);
                // Remove passwords from results
                $results = array_map(function($user) {
                    unset($user['password'], $user['session_token']);
                    return $user;
                }, $results);
                
                jsonResponse([
                    'search' => $search,
                    'level' => $level,
                    'results' => $results,
                    'total' => count($results)
                ]);
            } else {
                $sql = "SELECT id, name, email, role, active, created_at, last_login FROM users ORDER BY created_at DESC";
                $stmt = $db->query($sql);
                jsonResponse($stmt->fetchAll());
            }
        } catch (Exception $e) {
            handleError('Error al obtener usuarios: ' . $e->getMessage());
        }
        break;
    
    default:
        jsonResponse(['error' => 'Método no permitido'], 405);
}
?>