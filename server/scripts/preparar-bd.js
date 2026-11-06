// Crea las tablas y carga los datos iniciales en Supabase.
// Uso: npm run db:preparar   (se puede ejecutar varias veces sin duplicar datos)
import { readFile } from 'node:fs/promises';
import { pool } from '../db.js';

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en el archivo .env');
  process.exit(1);
}

const leer = (archivo) => readFile(new URL(`../../database/${archivo}`, import.meta.url), 'utf8');

try {
  await pool.query(await leer('schema.sql'));
  console.log('✔ Tablas creadas o actualizadas');
  await pool.query(await leer('seed.sql'));
  console.log('✔ Datos iniciales cargados');

  const { rows } = await pool.query(`
    select 'mesas' as tabla, count(*)::int as filas from mesas
    union all select 'horarios', count(*)::int from horarios
    union all select 'reservas', count(*)::int from reservas
    union all select 'platos', count(*)::int from platos
    union all select 'administradores', count(*)::int from administradores`);
  console.table(rows);
} catch (error) {
  console.error('✘ No se pudo preparar la base de datos:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
