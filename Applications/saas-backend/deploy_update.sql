INSERT INTO app_updates (version, title, description, target, published_at, created_at, updated_at)
SELECT '1.5.1', 'Estado Inteligente y Limpieza de Historial', 'Se unificaron los estados de apoderados (Al día y Morosos) y ahora al eliminar un comprobante se limpia completamente del historial. Fix de deploy backend.', 'all', NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_updates WHERE version = '1.5.1');
