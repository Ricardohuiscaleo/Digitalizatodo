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
 * API de Búsqueda Multinivel
 * Endpoint: /api/search
 */

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

if ($method !== 'GET') {
    jsonResponse(['error' => 'Solo se permite método GET'], 405);
}

$query = $_GET['q'] ?? '';
$table = $_GET['table'] ?? 'all';
$level = min((int)($_GET['level'] ?? 1), MAX_SEARCH_DEPTH);

if (!$query) {
    jsonResponse(['error' => 'Parámetro de búsqueda "q" es requerido'], 400);
}

try {
    $results = [];
    
    if ($table === 'all' || $table === 'contacts') {
        // amazonq-ignore-next-line
        $contacts = searchMultiLevel('contacts', $query, ['name', 'email', 'message'], $level);
        if ($contacts) $results['contacts'] = $contacts;
    }
    
    if ($table === 'all' || $table === 'projects') {
        $projects = searchMultiLevel('projects', $query, ['name', 'type', 'description'], $level);
        if ($projects) $results['projects'] = $projects;
    }
    
    if ($table === 'all' || $table === 'services') {
        $services = searchMultiLevel('services', $query, ['name', 'description', 'category'], $level);
        if ($services) $results['services'] = $services;
    }
    
    jsonResponse([
        'query' => $query,
        'table' => $table,
        'level' => $level,
        'results' => $results,
        'total' => array_sum(array_map('count', $results))
    ]);
    
} catch (Exception $e) {
    handleError('Error en búsqueda: ' . $e->getMessage());
}
?>