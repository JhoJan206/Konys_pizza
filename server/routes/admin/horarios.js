// RF-11: gestión del horario de atención por día y jornada.
import { Router } from 'express';
import { pool } from '../../db.js';
import { ErrorHttp } from '../../utils/errores.js';
import * as validar from '../../utils/validar.js';
import { DIAS, aMinutos, horaCorta } from '../../utils/horarios.js';

const router = Router();

async function listarHorarios(db = pool) {
  const { rows } = await db.query(
    `select id, dia_semana, jornada, hora_inicio, hora_fin, duracion_slot, activo
       from horarios
      order by array_position($1::text[], dia_semana), hora_inicio`,
    [DIAS]
  );
  return rows.map((h) => ({ ...h, hora_inicio: horaCorta(h.hora_inicio), hora_fin: horaCorta(h.hora_fin) }));
}

router.get('/', async (req, res) => {
  res.json(await listarHorarios());
});

// Guarda todos los cambios de la tabla de horarios de una sola vez
router.put('/', async (req, res) => {
  const lista = req.body?.horarios;
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new ErrorHttp(400, 'Envía la lista de horarios a guardar');
  }
  const cambios = lista.map((h) => {
    const inicio = validar.hora(h.hora_inicio, 'hora de inicio');
    const fin = validar.hora(h.hora_fin, 'hora de fin');
    const duracion = validar.entero(h.duracion_slot, 'duración', { min: 15, max: 240 });
    if (aMinutos(fin) - aMinutos(inicio) < duracion) {
      throw new ErrorHttp(400, 'Cada jornada debe durar al menos lo mismo que una reserva');
    }
    return {
      id: validar.id(h.id),
      inicio, fin, duracion,
      activo: validar.booleano(h.activo, 'activo'),
    };
  });

  const cliente = await pool.connect();
  try {
    await cliente.query('begin');
    for (const h of cambios) {
      const { rowCount } = await cliente.query(
        `update horarios set hora_inicio = $2, hora_fin = $3, duracion_slot = $4, activo = $5
          where id = $1`,
        [h.id, h.inicio, h.fin, h.duracion, h.activo]
      );
      if (rowCount === 0) throw new ErrorHttp(404, `El horario ${h.id} no existe`);
    }
    const actualizados = await listarHorarios(cliente);
    await cliente.query('commit');
    res.json(actualizados);
  } catch (error) {
    await cliente.query('rollback');
    throw error;
  } finally {
    cliente.release();
  }
});

export default router;
