INSERT INTO app_updates (version, title, description, target, published_at, created_at, updated_at)
SELECT '1.6.3', 'Protección de Sistema y Robustez', 'Se implementó lógica defensiva para asegurar que el sistema no falle ante cambios de esquema en proceso. Mejora en el sistema de auto-actualización del servidor.', 'all', NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_updates WHERE version = '1.6.3');
