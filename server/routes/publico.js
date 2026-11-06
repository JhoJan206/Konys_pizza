// Rutas públicas (módulo cliente): no requieren iniciar sesión.
import { Router } from 'express';
import { pool } from '../db.js';
import { ErrorHttp, PG_DUPLICADO } from '../utils/errores.js';
import * as validar from '../utils/validar.js';
import {
  DIAS, DIAS_MAXIMOS_RESERVA, aHora, aMinutos, ahoraEnColombia, diaSemanaDe,
  generarSlots, horaCorta, seCruzan, sumarDias,
} from '../utils/horarios.js';

const router = Router();

const MENSAJE_OCUPADO = 'Ese horario acaba de ser reservado. Elige otro, por favor.';

// Revisa que la fecha esté dentro del rango permitido para reservar
function validarRangoFecha(fecha) {
  const hoy = ahoraEnColombia().fecha;
  if (fecha < hoy) throw new ErrorHttp(400, 'No se puede reservar en una fecha pasada');
  if (fecha > sumarDias(hoy, DIAS_MAXIMOS_RESERVA)) {
    throw new ErrorHttp(400, `Solo se puede reservar con ${DIAS_MAXIMOS_RESERVA} días de anticipación como máximo`);
  }
}

// RF-01: mesas activas con su estado en este momento (libre u ocupada)
router.get('/mesas', async (req, res) => {
  const { fecha, minutos } = ahoraEnColombia();
  const { rows } = await pool.query(
    `select distinct on (m.id) m.id, m.nombre, m.zona, m.capacidad, m.foto_url,
            r.hora_fin as libre_desde
       from mesas m
       left join reservas r
         on r.mesa_id = m.id and r.estado = 'confirmada' and r.fecha = $1
        and r.hora_inicio <= $2 and r.hora_fin > $2
      where m.activa
      order by m.id`,
    [fecha, aHora(minutos)]
  );
  res.json(rows.map((m) => ({
    ...m,
    ocupada_ahora: m.libre_desde !== null,
    libre_desde: m.libre_desde ? horaCorta(m.libre_desde) : null,
  })));
});

// RF-03: días y jornadas en que atiende el restaurante (para el calendario)
router.get('/horarios', async (req, res) => {
  const { rows } = await pool.query(
    `select dia_semana, jornada, hora_inicio, hora_fin, duracion_slot
       from horarios where activo
      order by array_position($1::text[], dia_semana), hora_inicio`,
    [DIAS]
  );
  const horarios = rows.map((h) => ({ ...h, hora_inicio: horaCorta(h.hora_inicio), hora_fin: horaCorta(h.hora_fin) }));
  res.json({
    dias_abiertos: [...new Set(horarios.map((h) => h.dia_semana))],
    dias_maximos_reserva: DIAS_MAXIMOS_RESERVA,
    horarios,
  });
});

// RF-02 y RF-04: horarios libres, ocupados y pasados de una mesa en una fecha
router.get('/mesas/:id/disponibilidad', async (req, res) => {
  const mesaId = validar.id(req.params.id);
  const fecha = validar.fecha(req.query.fecha);
  validarRangoFecha(fecha);

  const { rows: [mesa] } = await pool.query(
    'select id, nombre, zona, capacidad from mesas where id = $1 and activa',
    [mesaId]
  );
  if (!mesa) throw new ErrorHttp(404, 'La mesa no existe o no está disponible');

  const dia = diaSemanaDe(fecha);
  const [{ rows: horarios }, { rows: reservas }] = await Promise.all([
    pool.query(
      `select jornada, hora_inicio, hora_fin, duracion_slot
         from horarios where dia_semana = $1 and activo order by hora_inicio`,
      [dia]
    ),
    pool.query(
      `select hora_inicio, hora_fin from reservas
        where mesa_id = $1 and fecha = $2 and estado = 'confirmada'`,
      [mesaId, fecha]
    ),
  ]);

  const ahora = ahoraEnColombia();
  const esHoy = fecha === ahora.fecha;

  const jornadas = horarios.map((h) => ({
    jornada: h.jornada,
    slots: generarSlots(h.hora_inicio, h.hora_fin, h.duracion_slot).map((s) => {
      let estado = 'libre';
      if (esHoy && aMinutos(s.inicio) <= ahora.minutos) estado = 'pasado';
      else if (reservas.some((r) => seCruzan(s.inicio, s.fin, r.hora_inicio, r.hora_fin))) estado = 'ocupado';
      return { ...s, estado };
    }),
  }));

  res.json({ mesa, fecha, dia, abierto: horarios.length > 0, jornadas });
});

// RF-05 y RF-06: crear una reserva y devolver el comprobante
router.post('/reservas', async (req, res) => {
  const datos = req.body ?? {};
  const mesaId = validar.entero(datos.mesa_id, 'mesa', { min: 1 });
  const fecha = validar.fecha(datos.fecha);
  const horaInicio = validar.hora(datos.hora_inicio, 'hora');
  const nombre = validar.texto(datos.cliente_nombre, 'nombre', { min: 2, max: 80 });
  const contacto = validar.texto(datos.cliente_contacto, 'contacto', { max: 30, opcional: true });
  const personas = validar.entero(datos.num_personas, 'número de personas', { min: 1, max: 30 });
  validarRangoFecha(fecha);

  const ahora = ahoraEnColombia();
  if (fecha === ahora.fecha && aMinutos(horaInicio) <= ahora.minutos) {
    throw new ErrorHttp(400, 'Esa hora ya pasó. Elige un horario más tarde.');
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('begin');

    // Bloquea la mesa mientras dura la transacción: dos clientes que reservan
    // la misma mesa al mismo tiempo quedan en fila (evita la condición de carrera)
    const { rows: [mesa] } = await cliente.query(
      'select id, nombre, zona, capacidad, activa from mesas where id = $1 for update',
      [mesaId]
    );
    if (!mesa || !mesa.activa) throw new ErrorHttp(404, 'La mesa no existe o no está disponible');
    if (personas > mesa.capacidad) {
      throw new ErrorHttp(400, `Esta mesa admite máximo ${mesa.capacidad} personas`);
    }

    // La hora elegida debe ser un bloque válido del horario de ese día
    const { rows: horarios } = await cliente.query(
      'select hora_inicio, hora_fin, duracion_slot from horarios where dia_semana = $1 and activo',
      [diaSemanaDe(fecha)]
    );
    const slot = horarios
      .flatMap((h) => generarSlots(h.hora_inicio, h.hora_fin, h.duracion_slot))
      .find((s) => s.inicio === horaInicio);
    if (!slot) throw new ErrorHttp(400, 'El restaurante no recibe reservas en ese horario');

    // Verificación final de disponibilidad (doble verificación del documento)
    const { rowCount } = await cliente.query(
      `select 1 from reservas
        where mesa_id = $1 and fecha = $2 and estado = 'confirmada'
          and hora_inicio < $4 and hora_fin > $3`,
      [mesaId, fecha, slot.inicio, slot.fin]
    );
    if (rowCount > 0) throw new ErrorHttp(409, MENSAJE_OCUPADO);

    const { rows: [reserva] } = await cliente.query(
      `insert into reservas (mesa_id, cliente_nombre, cliente_contacto, num_personas, fecha, hora_inicio, hora_fin)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, cliente_nombre, cliente_contacto, num_personas, fecha, hora_inicio, hora_fin, estado`,
      [mesaId, nombre, contacto, personas, fecha, slot.inicio, slot.fin]
    );
    await cliente.query('commit');

    res.status(201).json({
      ...reserva,
      hora_inicio: horaCorta(reserva.hora_inicio),
      hora_fin: horaCorta(reserva.hora_fin),
      mesa: { id: mesa.id, nombre: mesa.nombre, zona: mesa.zona },
    });
  } catch (error) {
    await cliente.query('rollback');
    // Si dos reservas llegaron a la vez, el índice único rechaza la segunda
    if (error.code === PG_DUPLICADO) throw new ErrorHttp(409, MENSAJE_OCUPADO);
    throw error;
  } finally {
    cliente.release();
  }
});

// RF-07: carta digital agrupada por categoría (solo platos disponibles)
router.get('/platos', async (req, res) => {
  const categorias = ['pizzas', 'entradas', 'postres', 'bebidas'];
  const { rows } = await pool.query(
    `select id, nombre, categoria, subcategoria, descripcion, precio, foto_url from platos
      where disponible
      order by array_position($1::text[], categoria), orden, nombre`,
    [categorias]
  );
  res.json(categorias.map((categoria) => ({
    categoria,
    platos: rows.filter((p) => p.categoria === categoria),
  })));
});

export default router;
