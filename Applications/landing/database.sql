-- Base de Datos: u958525313_digital
-- Tablas para Digitaliza Todo

-- Tabla de contactos
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('web', 'app', 'software', 'marketing', 'automation') NOT NULL,
    description TEXT,
    budget DECIMAL(10,2),
    deadline DATE,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2),
    active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    session_token VARCHAR(64),
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de analytics
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    page VARCHAR(255) NOT NULL,
    event_type ENUM('pageview', 'time_on_page', 'service_click', 'contact_form', 'section_view') NOT NULL,
    data JSON,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario admin por defecto
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@digitalizatodo.cl', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- Contraseña: password

-- Insertar servicios iniciales
INSERT INTO services (name, description, category, price, sort_order) VALUES
('Apps Web', 'Aplicaciones web modernas y escalables', 'desarrollo', 124890.00, 1),
('Páginas Web', 'Sitios web responsive y optimizados', 'desarrollo', 89990.00, 2),
('Marketing Digital', 'Estrategias digitales para tu negocio', 'marketing', 79990.00, 3),
('Creación de Contenido', 'Contenido visual y textual profesional', 'marketing', 59990.00, 4),
('Soluciones Digitales', 'Automatización y sistemas personalizados', 'desarrollo', 149990.00, 5),
('Plataformas Personalizadas', 'Desarrollo de plataformas a medida', 'desarrollo', 199990.00, 6);

-- Índices para optimizar búsquedas
CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_projects_type ON projects(type);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_session_token ON users(session_token);
CREATE INDEX idx_analytics_session ON analytics(session_id);
CREATE INDEX idx_analytics_page ON analytics(page);
CREATE INDEX idx_analytics_event ON analytics(event_type);
CREATE INDEX idx_analytics_date ON analytics(created_at);