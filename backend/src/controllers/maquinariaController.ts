import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../config/db';

// Obtener la maquinaria (Filtrado por sede o lista general si es Admin)
export const getMaquinaria = async (req: AuthRequest, res: Response) => {
    try {
        const { sede_id } = req.query;

        let query = `
            SELECT m.*, s.nombre as sede_nombre 
            FROM maquinaria m 
            LEFT JOIN sedes s ON m.sede_id = s.id
        `;
        const params: any[] = [];

        if (sede_id) {
            query += ` WHERE m.sede_id = $1`;
            params.push(sede_id);
        }

        query += ` ORDER BY m.codigo_interno ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar la maquinaria' });
    }
};

// Registrar una nueva máquina
export const createMaquinaria = async (req: AuthRequest, res: Response) => {
    try {
        const { codigo_interno, nombre, marca, modelo, serie, sede_id, horometro_actual } = req.body;

        if (!codigo_interno || !nombre) {
            return res.status(400).json({ error: 'Código interno y nombre son requeridos' });
        }

        const result = await pool.query(
            `INSERT INTO maquinaria (codigo_interno, nombre, marca, modelo, serie, sede_id, horometro_actual)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [codigo_interno, nombre, marca, modelo, serie, sede_id || null, horometro_actual || 0]
        );

        res.status(201).json({
            message: 'Maquinaria registrada exitosamente',
            maquinaria: result.rows[0]
        });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'El código interno de la máquina ya existe' });
        }
        res.status(500).json({ error: 'Error al registrar la maquinaria' });
    }
};

// Actualizar la lectura del horómetro de una máquina
export const actualizarHorometro = async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        const { maquinaria_id, horometro_nuevo, observacion } = req.body;
        const usuario_id = req.user?.id;

        if (!maquinaria_id || horometro_nuevo === undefined) {
            return res.status(400).json({ error: 'ID de maquinaria y nuevo horómetro son requeridos' });
        }

        await client.query('BEGIN');

        // 1. Obtener horómetro actual de la máquina
        const maqResult = await client.query('SELECT horometro_actual FROM maquinaria WHERE id = $1', [maquinaria_id]);
        if (maqResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }

        const horometroAnterior = Number(maqResult.rows[0].horometro_actual);
        const nuevoHorometroNum = Number(horometro_nuevo);

        if (nuevoHorometroNum < horometroAnterior) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: `El nuevo horómetro (${nuevoHorometroNum}) no puede ser menor al actual (${horometroAnterior})` 
            });
        }

        // 2. Registrar en el historial
        await client.query(
            `INSERT INTO historial_horometros (maquinaria_id, horometro_anterior, horometro_nuevo, usuario_id, observacion)
             VALUES ($1, $2, $3, $4, $5)`,
            [maquinaria_id, horometroAnterior, nuevoHorometroNum, usuario_id, observacion || 'Actualización de horómetro']
        );

        // 3. Actualizar horómetro principal en maquinaria
        await client.query(
            'UPDATE maquinaria SET horometro_actual = $1 WHERE id = $2',
            [nuevoHorometroNum, maquinaria_id]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Horómetro actualizado correctamente',
            horas_trabajadas: nuevoHorometroNum - horometroAnterior,
            horometro_actual: nuevoHorometroNum
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error al actualizar el horómetro' });
    } finally {
        client.release();
    }
};