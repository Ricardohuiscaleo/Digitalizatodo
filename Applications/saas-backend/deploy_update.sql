INSERT INTO app_updates (version, title, description, target, published_at, created_at, updated_at)
SELECT '1.6.0', 'Automatización de Cursos y Mejoras de Retiro', 'Se implementó el mapeo automático de cursos al registrarse y se mejoró el modal de retiro de apoderados mostrando los alumnos asociados. Optimización de sistema de despliegue.', 'all', NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_updates WHERE version = '1.6.0');
