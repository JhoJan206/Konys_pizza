// RF-12: consulta de reservas con filtros y cambio de estado.
import { Router } from 'express';
import { pool } from '../../db.js';
import { ErrorHttp, PG_DUPLICADO } from '../../utils/errores.js';
import * as validar from '../../utils/validar.js';
import { horaCorta } from '../../utils/horarios.js';

const router = Router();

const ESTADOS = ['confirmada', 'cancelada', 'completada'];

// GET /api/admin/reservas?fecha=2026-11-07&mesa_id=3&estado=confirmada&pagina=1&por_pagina=10
router.get('/', async (req, res) => {
  const q = req.query;
  const condiciones = [];
  const valores = [];
  const agregar = (sql, valor) => {
    valores.push(valor);
    condiciones.push(sql.replace('?', `$${valores.length}`));
  };

  if (q.fecha) agregar('r.fecha = ?', validar.fecha(q.fecha));
  if (q.mesa_id) agregar('r.mesa_id = ?', validar.entero(q.mesa_id, 'mesa', { min: 1 }));
  // El resumen se calcula sin el filtro de estado, para mostrar todos los totales
  const filtrosResumen = condiciones.length ? `where ${condiciones.join(' and ')}` : '';
  const valoresResumen = [...valores];
  if (q.estado) agregar('r.estado = ?', validar.opcion(q.estado, 'estado', ESTADOS));
  const filtros = condiciones.length ? `where ${condiciones.join(' and ')}` : '';

  const pagina = validar.entero(q.pagina ?? 1, 'página', { min: 1 });
  const porPagina = validar.entero(q.por_pagina ?? 10, 'por página', { min: 1, max: 100 });

  const [lista, total, resumen] = await Promise.all([
    pool.query(
      `select r.id, r.cliente_nombre, r.cliente_contacto, r.num_personas, r.fecha,
              r.hora_inicio, r.hora_fin, r.estado, r.creado_en,
              m.id as mesa_id, m.nombre as mesa_nombre, m.zona as mesa_zona
         from reservas r join mesas m on m.id = r.mesa_id
         ${filtros}
        order by r.fecha desc, r.hora_inicio
        limit ${porPagina} offset ${(pagina - 1) * porPagina}`,
      valores
    ),
    pool.query(`select count(*)::int as total from reservas r ${filtros}`, valores),
    pool.query(
      `select count(*)::int as total,
              count(*) filter (where estado = 'confirmada')::int as confirmadas,
              count(*) filter (where estado = 'cancelada')::int  as canceladas,
              count(*) filter (where estado = 'completada')::int as completadas,
              coalesce(sum(num_personas) filter (where estado = 'confirmada'), 0)::int as personas_esperadas
         from reservas r ${filtrosResumen}`,
      valoresResumen
    ),
  ]);

  res.json({
    reservas: lista.rows.map((r) => ({ ...r, hora_inicio: horaCorta(r.hora_inicio), hora_fin: horaCorta(r.hora_fin) })),
    total: total.rows[0].total,
    pagina,
    por_pagina: porPagina,
    resumen: resumen.rows[0],
  });
});

router.patch('/:id/estado', async (req, res) => {
  const id = validar.id(req.params.id);
  const estado = validar.opcion(req.body?.estado, 'estado', ESTADOS);
  try {
    const { rows: [reserva] } = await pool.query(
      'update reservas set estado = $2 where id = $1 returning id, estado',
      [id, estado]
    );
    if (!reserva) throw new ErrorHttp(404, 'La reserva no existe');
    res.json(reserva);
  } catch (error) {
    // Reactivar una reserva cuyo horario ya tomó otra persona
    if (error.code === PG_DUPLICADO) throw new ErrorHttp(409, 'Ese horario ya tiene otra reserva confirmada');
    throw error;
  }
});

export default router;
