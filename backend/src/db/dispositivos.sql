CREATE TABLE IF NOT EXISTS dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    qr_code VARCHAR(50) UNIQUE,          -- Contiene el MAC address del ESP32
    mac_address VARCHAR(20) DEFAULT NULL, -- MAC del ESP32 (ej: A0:F2:62:E5:5A:5C)
    ip_local VARCHAR(50) DEFAULT NULL,    -- IP local del ESP32 (se actualiza en cada boot)
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

-- Ejecutar esto si la tabla ya existe (migración):
-- ALTER TABLE dispositivos
--   ADD COLUMN mac_address VARCHAR(20) DEFAULT NULL,
--   ADD COLUMN ip_local VARCHAR(50) DEFAULT NULL;
