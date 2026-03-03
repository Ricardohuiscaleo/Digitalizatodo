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

// amazonq-ignore-next-line
foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        break;
    }
}

/**
 * API Principal - Digitaliza Todo
 * Endpoint: /api/
 */

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '/';

switch ($method) {
    // amazonq-ignore-next-line
    case 'GET':
        if ($path === '/') {
            jsonResponse([
                'message' => 'API Digitaliza Todo',
                'version' => '1.0',
                'endpoints' => [
                    '/api/contacts' => 'Gestión de contactos',
                    '/api/projects' => 'Gestión de proyectos',
                    '/api/services' => 'Gestión de servicios',
                    '/api/users' => 'Gestión de usuarios',
                    '/api/auth' => 'Autenticación',
                    '/api/search' => 'Búsqueda multinivel'
                ]
            ]);
        }
        break;
    
    default:
        jsonResponse(['error' => 'Método no permitido'], 405);
}
?>