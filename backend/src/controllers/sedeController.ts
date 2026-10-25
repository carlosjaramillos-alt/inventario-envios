import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../config/db';

// Obtener todas las sedes/frentes (Admin ve todas, otros ven sus sedes asignadas)
export const getSedes = async (req: AuthRequest, res: Response) => {
    try {
        const usuarioId = req.user?.id;
        const rol = req.user?.rol;

        if (rol === 'admin') {
            const result = await pool.query('SELECT * FROM sedes ORDER BY id ASC');
            return res.json(result.rows);
        }

        const result = await pool.query(
            `SELECT s.* FROM sedes s
             JOIN usuario_sedes us ON s.id = us.sede_id
             WHERE us.usuario_id = $1 AND s.activa = true
             ORDER BY s.id ASC`,
            [usuarioId]
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las sedes' });
    }
};

// Crear una nueva sede/frente (Solo Administrador)
export const createSede = async (req: AuthRequest, res: Response) => {
    try {
        const { nombre, ubicacion, tipo } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre del frente es obligatorio' });
        }

        const result = await pool.query(
            'INSERT INTO sedes (nombre, ubicacion, tipo) VALUES ($1, $2, $3) RETURNING *',
            [nombre, ubicacion || 'Sin ubicación', tipo || 'punto']
        );

        res.status(201).json({
            message: 'Frente creado exitosamente',
            sede: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el frente' });
    }
};

// Asignar un usuario a una sede/frente
export const asignarUsuarioSede = async (req: AuthRequest, res: Response) => {
    try {
        const { usuario_id, sede_id } = req.body;

        if (!usuario_id || !sede_id) {
            return res.status(400).json({ error: 'usuario_id y sede_id son requeridos' });
        }

        await pool.query(
            'INSERT INTO usuario_sedes (usuario_id, sede_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [usuario_id, sede_id]
        );

        res.json({ message: 'Usuario asignado al frente correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al asignar usuario al frente' });
    }
};