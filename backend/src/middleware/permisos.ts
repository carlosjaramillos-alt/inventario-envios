import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { pool } from '../config/db';

// Definición de roles reconocidos por el sistema
export type RolUsuario = 'admin' | 'almacenista' | 'jefe_frente' | 'mecanico' | 'consulta';

// Middleware para verificar si el usuario tiene un rol permitido
export const verificarRol = (rolesPermitidos: RolUsuario[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const usuario = req.user;

        if (!usuario) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // Si el usuario es admin general, siempre tiene acceso
        if (usuario.rol === 'admin' || rolesPermitidos.includes(usuario.rol as RolUsuario)) {
            return next();
        }

        return res.status(403).json({ error: 'Acceso denegado: no tienes permisos suficientes' });
    };
};

// Middleware para verificar si el usuario tiene acceso a un frente específico
export const verificarAccesoSede = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const usuarioId = req.user?.id;
        const rol = req.user?.rol;
        const sedeId = req.params.sedeId || req.body.sede_id || req.query.sede_id;

        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // El Administrador General de Medellín tiene acceso a todas las sedes
        if (rol === 'admin') {
            return next();
        }

        if (!sedeId) {
            return res.status(400).json({ error: 'Se requiere especificar la sede/frente' });
        }

        // Consultar si el usuario tiene asignada esa sede en la base de datos
        const asignacion = await pool.query(
            'SELECT * FROM usuario_sedes WHERE usuario_id = $1 AND sede_id = $2',
            [usuarioId, sedeId]
        );

        if (asignacion.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes acceso a la información de este frente' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar acceso a la sede' });
    }
};