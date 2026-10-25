import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../config/db';

// Obtener el inventario de un frente específico
export const getInventarioPorSede = async (req: AuthRequest, res: Response) => {
    try {
        const { sedeId } = req.params;

        const result = await pool.query(
            `SELECT ip.id, ip.sede_id, ip.cantidad, ip.stock_minimo, ip.actualizado_en,
                    r.id as repuesto_id, r.codigo, r.nombre, r.unidad_medida, r.categoria, r.costo_referencia
             FROM inventario_punto ip
             JOIN repuestos r ON ip.repuesto_id = r.id
             WHERE ip.sede_id = $1
             ORDER BY r.nombre ASC`,
            [sedeId]
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar el inventario del frente' });
    }
};

// Registrar movimiento de inventario (Entrada, Salida, Ajuste)
export const registrarMovimiento = async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        const { sede_id, repuesto_id, tipo_movimiento, cantidad, motivo } = req.body;
        const usuario_id = req.user?.id;

        if (!sede_id || !repuesto_id || !tipo_movimiento || !cantidad || !motivo) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        if (cantidad <= 0) {
            return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
        }

        await client.query('BEGIN');

        // 1. Obtener o inicializar stock actual en el frente
        const stockActual = await client.query(
            'SELECT cantidad FROM inventario_punto WHERE sede_id = $1 AND repuesto_id = $2',
            [sede_id, repuesto_id]
        );

        let nuevaCantidad = stockActual.rows.length > 0 ? stockActual.rows[0].cantidad : 0;

        if (tipo_movimiento === 'ENTRADA') {
            nuevaCantidad += Number(cantidad);
        } else if (tipo_movimiento === 'SALIDA') {
            if (nuevaCantidad < cantidad) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Stock insuficiente para realizar la salida' });
            }
            nuevaCantidad -= Number(cantidad);
        } else if (tipo_movimiento === 'AJUSTE') {
            nuevaCantidad = Number(cantidad);
        }

        // 2. Guardar o actualizar en inventario_punto
        await client.query(
            `INSERT INTO inventario_punto (sede_id, repuesto_id, cantidad)
             VALUES ($1, $2, $3)
             ON CONFLICT (sede_id, repuesto_id) 
             DO UPDATE SET cantidad = $3, actualizado_en = CURRENT_TIMESTAMP`,
            [sede_id, repuesto_id, nuevaCantidad]
        );

        // 3. Insertar el registro en el Kardex (movimientos_inventario)
        await client.query(
            `INSERT INTO movimientos_inventario 
             (sede_id, repuesto_id, tipo_movimiento, cantidad, usuario_id, motivo)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [sede_id, repuesto_id, tipo_movimiento, cantidad, usuario_id, motivo]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Movimiento de inventario registrado con éxito',
            nuevo_stock: nuevaCantidad
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error al registrar el movimiento de inventario' });
    } finally {
        client.release();
    }
};