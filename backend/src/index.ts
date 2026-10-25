import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './config/db';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import shipmentRoutes from './routes/shipmentRoutes';
import sedeRoutes from './routes/sedeRoutes';
import inventarioRoutes from './routes/inventarioRoutes';
import maquinariaRoutes from './routes/maquinariaRoutes';
import combustibleRoutes from './routes/combustibleRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Permitir que la carpeta 'uploads' sea accesible mediante URLs web (ej: http://localhost:3000/uploads/foto.jpg)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas principales de la API
app.use('/api/auth', authRoutes);         // Módulo de usuarios/login
app.use('/api/products', productRoutes);   // Módulo de productos
app.use('/api/shipments', shipmentRoutes); // Módulo de envíos e historial

// Ruta de diagnóstico de la base de datos
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con la base de datos' });
  }
});
app.use('/api/sedes', sedeRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/maquinaria', maquinariaRoutes);
app.use('/api/combustible', combustibleRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});