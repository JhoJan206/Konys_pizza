// Conexión a PostgreSQL (Supabase) con un pool de conexiones.
// La cadena de conexión llega por la variable de entorno DATABASE_URL.
import pg from 'pg';

// Las fechas (DATE) se devuelven como texto 'AAAA-MM-DD' para evitar
// corrimientos por zona horaria, y los ids (BIGINT) como números.
pg.types.setTypeParser(1082, (valor) => valor);
pg.types.setTypeParser(20, (valor) => parseInt(valor, 10));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase exige SSL
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  // Pocas conexiones: en Vercel cada función abre su propio pool
  max: 3,
});
