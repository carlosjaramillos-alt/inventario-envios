-- 1. Tabla de Maquinaria / Equipos de Construcción
CREATE TABLE IF NOT EXISTS maquinaria (
    id SERIAL PRIMARY KEY,
    codigo_interno VARCHAR(50) UNIQUE NOT NULL, -- Ej: RETRO-01, EXCAV-03
    nombre VARCHAR(100) NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    serie VARCHAR(100),
    sede_id INT REFERENCES sedes(id) ON DELETE SET NULL, -- Frente actual donde trabaja la máquina
    horometro_actual NUMERIC(10, 2) DEFAULT 0.00,
    estado VARCHAR(30) DEFAULT 'OPERATIVA', -- 'OPERATIVA', 'EN_MANTENIMIENTO', 'INACTIVA'
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Historial de Lectura de Horómetros (Para control diario/semanal)
CREATE TABLE IF NOT EXISTS historial_horometros (
    id SERIAL PRIMARY KEY,
    maquinaria_id INT REFERENCES maquinaria(id) ON DELETE CASCADE,
    horometro_anterior NUMERIC(10, 2) NOT NULL,
    horometro_nuevo NUMERIC(10, 2) NOT NULL,
    horas_trabajadas NUMERIC(10, 2) GENERATED ALWAYS AS (horometro_nuevo - horometro_anterior) STORED,
    usuario_id INT REFERENCES usuarios(id),
    observacion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);