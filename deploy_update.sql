INSERT INTO app_updates (version, title, description, target, published_at, created_at, updated_at)
SELECT '1.6.4', 'Sincronización en Tiempo Real', 'Se mejoró la actualización en tiempo real del panel administrativo al procesar retiros de apoderados.', 'all', NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_updates WHERE version = '1.6.4');
