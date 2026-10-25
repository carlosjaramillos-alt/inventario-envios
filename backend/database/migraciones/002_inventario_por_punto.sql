-- 1. Renombrar la tabla productos a repuestos (o crearla si no existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'productos') THEN
        ALTER TABLE productos RENAME TO repuestos;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS repuestos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20) DEFAULT 'unidad',
    categoria VARCHAR(50),
    costo_referencia NUMERIC(12, 2) DEFAULT 0.00,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inventario independiente por cada Frente / Sede
CREATE TABLE IF NOT EXISTS inventario_punto (
    id SERIAL PRIMARY KEY,
    sede_id INT REFERENCES sedes(id) ON DELETE CASCADE,
    repuesto_id INT REFERENCES repuestos(id) ON DELETE CASCADE,
    cantidad INT DEFAULT 0 CHECK (cantidad >= 0),
    stock_minimo INT DEFAULT 5,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sede_id, repuesto_id)
);

-- 3. Libro de Movimientos de Inventario (Kardex imborrable)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    sede_id INT REFERENCES sedes(id) ON DELETE CASCADE,
    repuesto_id INT REFERENCES repuestos(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(20) NOT NULL, -- 'ENTRADA', 'SALIDA', 'AJUSTE', 'TRASLADO'
    cantidad INT NOT NULL,
    usuario_id INT REFERENCES usuarios(id),
    motivo TEXT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);