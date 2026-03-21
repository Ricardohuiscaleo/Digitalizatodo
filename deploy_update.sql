INSERT INTO app_updates (version, title, description, target, published_at, created_at, updated_at)
SELECT '1.6.1', 'Fix de Eliminación con Comprobante', 'Corrección técnica para permitir la subida de comprobantes durante el retiro definitivo de apoderados.', 'all', NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_updates WHERE version = '1.6.1');
