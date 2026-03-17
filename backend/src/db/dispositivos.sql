CREATE TABLE IF NOT EXISTS dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    qr_code VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    icono VARCHAR(50) DEFAULT NULL,
    tipo VARCHAR(50) DEFAULT 'general',
    modelo VARCHAR(100),
    serial VARCHAR(100),
    estado ENUM('en_linea', 'en_espera') NOT NULL DEFAULT 'en_espera',
    online BOOLEAN NOT NULL DEFAULT TRUE,
    watts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
