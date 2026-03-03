<?php
// Analytics API - No CORS enabled
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('X-Frame-Options: DENY');

$config_loaded = false;
$config_paths = [__DIR__ . '/../config.php', __DIR__ . '/../../config.php'];
foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $config_loaded = true;
        break;
    }
}

if (!$config_loaded) {
    http_response_code(500);
    echo '{"error":"Configuration unavailable"}';
    return;
}

try {
    $db = Database::getInstance()->getConnection();
    if (!$db instanceof PDO) {
        throw new Exception('Invalid DB connection');
    }
} catch (Exception $e) {
    http_response_code(503);
    echo '{"error":"Service unavailable"}';
    return;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        try {
            $stmt = $db->prepare("INSERT INTO analytics (session_id, page, event_type, data, user_agent, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
            $stmt->execute([
                $input['session_id'] ?? session_id(),
                $input['page'] ?? '/',
                $input['event_type'] ?? 'pageview',
                json_encode($input['data'] ?? []),
                $_SERVER['HTTP_USER_AGENT'] ?? '',
                $_SERVER['REMOTE_ADDR'] ?? ''
            ]);
            
            jsonResponse(['success' => true]);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Failed to register event'], 500);
        }
        break;
    
    case 'GET':
        $type = $_GET['type'] ?? 'overview';
        $days = max(1, min(365, (int)($_GET['days'] ?? 30)));
        $search = $_GET['search'] ?? '';
        $level = min((int)($_GET['level'] ?? 1), MAX_SEARCH_DEPTH);
        
        try {
            if ($search) {
                $results = searchMultiLevel('analytics', $search, ['page', 'event_type'], $level);
                jsonResponse(['results' => $results, 'total' => count($results)]);
                break;
            }
            
            switch ($type) {
                case 'overview':
                    jsonResponse(getOverviewMetrics($db, $days));
                    break;
                case 'pages':
                    jsonResponse(getPageMetrics($db, $days));
                    break;
                case 'services':
                    jsonResponse(getServiceMetrics($db, $days));
                    break;
                case 'devices':
                    jsonResponse(getDeviceMetrics($db, $days));
                    break;
                default:
                    jsonResponse(['error' => 'Invalid metric type'], 400);
            }
        } catch (Exception $e) {
            jsonResponse(['error' => 'Failed to retrieve metrics'], 500);
        }
        break;
    
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

function getOverviewMetrics($db, $days) {
    $stmt = $db->prepare("SELECT COUNT(DISTINCT session_id) as visitors, COUNT(*) as pageviews FROM analytics WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
    $stmt->execute([$days]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: ['visitors' => 0, 'pageviews' => 0];
}

function getPageMetrics($db, $days) {
    $stmt = $db->prepare("SELECT page, COUNT(*) as views FROM analytics WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY page ORDER BY views DESC LIMIT 20");
    $stmt->execute([$days]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getServiceMetrics($db, $days) {
    $stmt = $db->prepare("SELECT JSON_EXTRACT(data, '$.service') as service, COUNT(*) as interactions FROM analytics WHERE event_type = 'service_click' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY service LIMIT 10");
    $stmt->execute([$days]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getDeviceMetrics($db, $days) {
    $stmt = $db->prepare("SELECT CASE WHEN user_agent LIKE '%Mobile%' THEN 'Mobile' WHEN user_agent LIKE '%Tablet%' THEN 'Tablet' ELSE 'Desktop' END as device_type, COUNT(DISTINCT session_id) as visitors FROM analytics WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY device_type LIMIT 3");
    $stmt->execute([$days]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>