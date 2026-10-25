import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

export const register = async (req: Request, res: Response) => {
  const { nombre, email, password, rol } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, creado_en',
      [nombre, email, passwordHash, rol || 'operador']
    );

    res.status(201).json({ message: 'Usuario registrado con éxito', user: newUser.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};