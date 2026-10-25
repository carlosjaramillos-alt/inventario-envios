import { Request, Response } from 'express';
import { pool } from '../config/db';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { codigo_sku, nombre, descripcion, precio, stock } = req.body;

  try {
    const newProduct = await pool.query(
      'INSERT INTO productos (codigo_sku, nombre, descripcion, precio, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [codigo_sku, nombre, descripcion, precio, stock || 0]
    );

    res.status(201).json({ message: 'Producto creado exitosamente', product: newProduct.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el producto' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock } = req.body;

  try {
    const result = await pool.query(
      'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, stock = $4 WHERE id = $5 RETURNING *',
      [nombre, descripcion, precio, stock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado exitosamente', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
};