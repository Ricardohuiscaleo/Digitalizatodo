-- SQL para habilitar la segmentación de planes por audiencia (Adultos/Kids)
-- id: 867
ALTER TABLE plans ADD COLUMN target_audience ENUM('adults', 'kids', 'all') DEFAULT 'all' AFTER category;

-- Opcional: Actualizar planes existentes si se desea
-- UPDATE plans SET target_audience = 'kids' WHERE name LIKE '%KIDS%';
-- UPDATE plans SET target_audience = 'adults' WHERE name NOT LIKE '%KIDS%' AND category = 'dojo';
