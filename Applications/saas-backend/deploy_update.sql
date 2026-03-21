INSERT INTO app_updates (version, title, description, target, published_at, created_at, updated_at)
SELECT '1.6.2', 'Corrección de Base de Datos para Notificaciones', 'Se corrigió un error en el esquema de base de datos que impedía completar el retiro de apoderados. Soporte mejorado para notificaciones push.', 'all', NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_updates WHERE version = '1.6.2');
