import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

// OBTENER TODOS LOS ENVÍOS (incluye nombres de producto y usuario mediante JOIN)
export const getShipments = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT e.*, p.nombre AS producto_nombre, u.nombre AS usuario_nombre
      FROM envios e
      LEFT JOIN productos p ON e.producto_id = p.id
      LEFT JOIN usuarios u ON e.usuario_id = u.id
      ORDER BY e.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los envíos' });
  }
};

// CREAR UN NUEVO ENVÍO
export const createShipment = async (req: AuthRequest, res: Response) => {
  const { numero_guia, cliente, direccion, producto_id, cantidad, estado } = req.body;
  const usuario_id = req.user?.id; // Extraemos el ID del usuario desde el token JWT

  try {
    const newShipment = await pool.query(
      `INSERT INTO envios (numero_guia, cliente, direccion, producto_id, cantidad, estado, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [numero_guia, cliente, direccion, producto_id, cantidad, estado || 'pendiente', usuario_id]
    );

    res.status(201).json({ message: 'Envío registrado con éxito', shipment: newShipment.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el envío' });
  }
};

// ACTUALIZAR ESTADO DE ENVÍO Y GUARDAR EN HISTORIAL
export const updateShipmentStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nuevo_estado, comentario } = req.body;
  const usuario_id = req.user?.id;

  try {
    // 1. Verificar si el envío existe
    const shipmentCheck = await pool.query('SELECT * FROM envios WHERE id = $1', [id]);
    if (shipmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    // 2. Actualizar el estado actual del envío
    const updatedShipment = await pool.query(
      'UPDATE envios SET estado = $1, actualizado_en = NOW() WHERE id = $2 RETURNING *',
      [nuevo_estado, id]
    );

    // 3. Registrar este cambio en la tabla de historial para auditoría
    await pool.query(
      'INSERT INTO historial_envios (envio_id, estado, comentario, usuario_id) VALUES ($1, $2, $3, $4)',
      [id, nuevo_estado, comentario || '', usuario_id]
    );

    res.json({ message: 'Estado actualizado correctamente', shipment: updatedShipment.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el estado del envío' });
  }
};
import { upload } from '../middleware/upload'; // Importación para el tipo de archivo

// SUBIR FOTO DE EVIDENCIA PARA UN ENVÍO
export const uploadShipmentEvidence = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No se ha adjuntado ninguna imagen' });
  }

  // Generamos la URL accesible de la foto guardada
  const imagenUrl = `/uploads/${req.file.filename}`;

  try {
    const updatedShipment = await pool.query(
      'UPDATE envios SET foto_evidencia = $1, actualizado_en = NOW() WHERE id = $2 RETURNING *',
      [imagenUrl, id]
    );

    if (updatedShipment.rows.length === 0) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    res.json({
      message: 'Evidencia fotográfica subida con éxito',
      shipment: updatedShipment.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la evidencia fotográfica' });
  }
};