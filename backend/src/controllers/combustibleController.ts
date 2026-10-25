import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../config/db';

// Registrar tanqueo de combustible con cálculo automático de rendimiento y alertas
export const registrarTanqueo = async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        const { maquinaria_id, sede_id, galones, horometro_en_tanqueo, costo_total, observacion } = req.body;
        const usuario_id = req.user?.id;

        if (!maquinaria_id || !sede_id || !galones || !horometro_en_tanqueo) {
            return res.status(400).json({ error: 'Maquinaria, sede, galones y horómetro son obligatorios' });
        }

        await client.query('BEGIN');

        // 1. Guardar el registro de combustible
        const result = await client.query(
            `INSERT INTO registro_combustible 
             (maquinaria_id, sede_id, galones, horometro_en_tanqueo, costo_total, usuario_id, observacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [maquinaria_id, sede_id, galones, horometro_en_tanqueo, costo_total || 0, usuario_id, observacion || 'Tanqueo de rutina']
        );

        // 2. Verificar consumo previo para detectar anomalías
        const tanqueoAnterior = await client.query(
            `SELECT galones, horometro_en_tanqueo FROM registro_combustible 
             WHERE maquinaria_id = $1 AND id != $2 
             ORDER BY id DESC LIMIT 1`,
            [maquinaria_id, result.rows[0].id]
        );

        let alertaGenerada = false;

        if (tanqueoAnterior.rows.length > 0) {
            const horasTranscurridas = Number(horometro_en_tanqueo) - Number(tanqueoAnterior.rows[0].horometro_en_tanqueo);
            const galonesConsumidos = Number(galones);

            if (horasTranscurridas > 0) {
                const consumoPorHora = galonesConsumidos / horasTranscurridas;

                // Alerta si el consumo supera los 8 galones/hora (parámetro estándar de maquinaria pesada)
                if (consumoPorHora > 8.0) {
                    await client.query(
                        `INSERT INTO alertas_sistema (sede_id, tipo_alerta, descripcion)
                         VALUES ($1, 'CONSUMO_ALTO', $2)`,
                        [
                            sede_id, 
                            `Consumo anormalmente alto detected en la máquina ID ${maquinaria_id}: ${consumoPorHora.toFixed(2)} gal/hora.`
                        ]
                    );
                    alertaGenerada = true;
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Tanqueo registrado con éxito',
            registro: result.rows[0],
            alerta_generada: alertaGenerada
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error al registrar el abastecimiento de combustible' });
    } finally {
        client.release();
    }
};

// Consultar alertas activas del sistema
export const getAlertas = async (req: AuthRequest, res: Response) => {
    try {
        const { sede_id } = req.query;

        let query = `SELECT a.*, s.nombre as sede_nombre FROM alertas_sistema a LEFT JOIN sedes s ON a.sede_id = s.id`;
        const params: any[] = [];

        if (sede_id) {
            query += ` WHERE a.sede_id = $1`;
            params.push(sede_id);
        }

        query += ` ORDER BY a.creado_en DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las alertas' });
    }
};