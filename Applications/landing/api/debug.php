<?php
header('Content-Type: application/json');

// Debug info
$debug = [
    'current_dir' => __DIR__,
    'config_paths' => [],
    'config_found' => false,
    'config_path' => null,
    'error' => null
];

$config_paths = [
    __DIR__ . '/../config.php',
    __DIR__ . '/../../config.php',
    __DIR__ . '/../../../config.php',
    __DIR__ . '/../../../../config.php',
    __DIR__ . '/../../../../../config.php'
];

foreach ($config_paths as $path) {
    $debug['config_paths'][] = [
        'path' => $path,
        // amazonq-ignore-next-line
        'exists' => file_exists($path),
        // amazonq-ignore-next-line
        'readable' => is_readable($path)
    ];
    
    if (file_exists($path)) {
        $debug['config_found'] = true;
        $debug['config_path'] = $path;
        try {
            require_once $path;
        } catch (Exception $e) {
            $debug['error'] = $e->getMessage();
        }
        break;
    }
}

// Test database connection
if ($debug['config_found'] && !$debug['error']) {
    try {
        $db = Database::getInstance()->getConnection();
        $debug['database'] = 'Connected';
        
        // Test analytics table
        // amazonq-ignore-next-line
        $stmt = $db->query("SHOW TABLES LIKE 'analytics'");
        $debug['analytics_table'] = $stmt->rowCount() > 0 ? 'Exists' : 'Not found';
        
    } catch (Exception $e) {
        $debug['database_error'] = $e->getMessage();
    }
}

echo json_encode($debug, JSON_PRETTY_PRINT);
?>