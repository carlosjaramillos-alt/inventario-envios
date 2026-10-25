-- 1. Tabla de Registro de Tanqueo de Combustible
CREATE TABLE IF NOT EXISTS registro_combustible (
    id SERIAL PRIMARY KEY,
    maquinaria_id INT REFERENCES maquinaria(id) ON DELETE CASCADE,
    sede_id INT REFERENCES sedes(id) ON DELETE CASCADE,
    galones NUMERIC(10, 2) NOT NULL CHECK (galones > 0),
    horometro_en_tanqueo NUMERIC(10, 2) NOT NULL,
    costo_total NUMERIC(12, 2) DEFAULT 0.00,
    usuario_id INT REFERENCES usuarios(id),
    observacion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Alertas de Consumo Anormal o Mantenimiento
CREATE TABLE IF NOT EXISTS alertas_sistema (
    id SERIAL PRIMARY KEY,
    sede_id INT REFERENCES sedes(id) ON DELETE CASCADE,
    tipo_alerta VARCHAR(50) NOT NULL, -- 'CONSUMO_ALTO', 'STOCK_BAJO', 'MANTENIMIENTO'
    descripcion TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);