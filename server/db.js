// Conexión a PostgreSQL (Supabase) con un pool de conexiones.
// La cadena de conexión llega por la variable de entorno DATABASE_URL.
import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase exige SSL
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  // Pocas conexiones: en Vercel cada función abre su propio pool
  max: 3,
});
