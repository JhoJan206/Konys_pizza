// Carga la carta real de Konys (database/carta-konys.json, tomada de su
// tienda en Clubify) y deja el horario real del restaurante.
// Uso: npm run db:carta
// Reemplaza todos los platos actuales; las fotos están en public/img/carta/.
import { readFile } from 'node:fs/promises';
import { pool } from '../db.js';

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en el archivo .env');
  process.exit(1);
}

const leer = async (archivo) => readFile(new URL(`../../database/${archivo}`, import.meta.url), 'utf8');
const carta = JSON.parse(await leer('carta-konys.json'));

const cliente = await pool.connect();
try {
  await cliente.query('begin');

  // Columnas nuevas de la tabla platos (por si la base se creó antes)
  await cliente.query(await leer('schema.sql'));

  await cliente.query('delete from platos');
  for (const p of carta.platos) {
    await cliente.query(
      `insert into platos (nombre, categoria, subcategoria, descripcion, precio, foto_url, orden)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [p.nombre, p.categoria, p.subcategoria, p.descripcion, p.precio, p.foto ? `/img/carta/${p.foto}` : null, p.orden]
    );
  }

  // Horario real: almuerzo 12:00–14:30; noche hasta 22:30 entre semana y 23:00 el fin de semana
  await cliente.query(`update horarios set hora_inicio = '12:00', hora_fin = '14:30' where jornada = 'almuerzo'`);
  await cliente.query(
    `update horarios set hora_inicio = '17:00',
            hora_fin = case when dia_semana in ('sabado', 'domingo') then time '23:00' else time '22:30' end
      where jornada = 'noche'`
  );

  await cliente.query('commit');

  const { rows } = await pool.query(
    `select categoria, count(*)::int as platos, count(foto_url)::int as con_foto
       from platos group by categoria order by min(orden)`
  );
  console.log(`✔ Carta de Konys cargada (${carta.platos.length} platos, capturada el ${carta.capturado})`);
  console.table(rows);
  console.log('✔ Horario real aplicado');
} catch (error) {
  await cliente.query('rollback');
  console.error('✘ No se pudo cargar la carta:', error.message);
  process.exitCode = 1;
} finally {
  cliente.release();
  await pool.end();
}
