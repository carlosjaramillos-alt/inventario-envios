-- 1. Crear tabla de Sedes / Frentes de Mantenimiento
CREATE TABLE IF NOT EXISTS sedes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(150),
    tipo VARCHAR(20) DEFAULT 'punto', -- 'principal' (Medellín) o 'punto' (Frente)
    activa BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla intermedia para saber a qué puntos tiene acceso cada usuario
CREATE TABLE IF NOT EXISTS usuario_sedes (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    sede_id INT REFERENCES sedes(id) ON DELETE CASCADE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, sede_id)
);

-- 3. Agregar columna de rol a la tabla usuarios si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(30) DEFAULT 'almacenista';

-- 4. Registrar la Sede Principal (Medellín) por defecto
INSERT INTO sedes (nombre, ubicacion, tipo) 
VALUES ('Sede Principal Medellín', 'Medellín', 'principal')
ON CONFLICT DO NOTHING;