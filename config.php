<?php
/**
 * Configuración de Base de Datos MySQL - Digitaliza Todo
 * Producción: digitalizatodo.cl
 */

// Configuración de Base de Datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'u958525313_digital');
define('DB_USER', 'u958525313_digital');
define('DB_PASS', 'rodsiC-goqqis-tafgy3');
define('DB_CHARSET', 'utf8mb4');

// Configuración de la aplicación
define('BASE_URL', 'https://digitalizatodo.cl');
define('API_BASE_URL', BASE_URL . '/api');

// Configuración de búsqueda multinivel (hasta 5 niveles)
define('MAX_SEARCH_DEPTH', 5);

// Headers CORS y JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Clase de conexión a la base de datos
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
        } catch (PDOException $e) {
            error_log("Error de conexión: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Error de conexión a la base de datos']);
            exit;
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
}

// Función para búsqueda multinivel
function searchMultiLevel($table, $searchTerm, $fields = [], $level = 1) {
    if ($level > MAX_SEARCH_DEPTH) return [];
    
    $db = Database::getInstance()->getConnection();
    $conditions = [];
    $params = [];
    
    foreach ($fields as $field) {
        $conditions[] = "$field LIKE :search_$field";
        $params["search_$field"] = "%$searchTerm%";
    }
    
    $sql = "SELECT * FROM $table WHERE " . implode(' OR ', $conditions);
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    return $stmt->fetchAll();
}

// Función de respuesta JSON
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Manejo de errores
function handleError($message, $code = 500) {
    error_log($message);
    jsonResponse(['error' => $message], $code);
}
?>