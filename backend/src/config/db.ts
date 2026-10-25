import { Pool } from 'pg';
import dotenv from 'dotenv';

// Lee el archivo .env y deja sus valores disponibles en process.env
dotenv.config({ quiet: true });

// "Pool" = grupo de conexiones a PostgreSQL que se reutilizan.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Muchos servicios en la nube exigen conexión cifrada. Se activa con DB_SSL=true en .env
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});