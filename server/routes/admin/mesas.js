// RF-09, RF-10 y RF-13: gestión de mesas.
import { Router } from 'express';
import { pool } from '../../db.js';
import { ErrorHttp, PG_DUPLICADO, PG_REFERENCIADO } from '../../utils/errores.js';
import * as validar from '../../utils/validar.js';

const router = Router();

const CAMPOS = 'id, nombre, zona, capacidad, activa, foto_url, creado_en';

function leerMesa(datos = {}) {
  return {
    nombre: validar.texto(datos.nombre, 'nombre', { max: 40 }),
    zona: validar.opcion(datos.zona, 'zona', ['terraza', 'salon']),
    capacidad: validar.entero(datos.capacidad, 'capacidad', { min: 1, max: 30 }),
    activa: datos.activa === undefined ? true : validar.booleano(datos.activa, 'activa'),
    foto_url: validar.texto(datos.foto_url, 'foto', { max: 500, opcional: true }),
  };
}

function errorDeMesa(error) {
  if (error.code === PG_DUPLICADO) return new ErrorHttp(409, 'Ya existe una mesa con ese nombre');
  return error;
}

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`select ${CAMPOS} from mesas order by id`);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const m = leerMesa(req.body);
  try {
    const { rows: [mesa] } = await pool.query(
      `insert into mesas (nombre, zona, capacidad, activa, foto_url)
       values ($1, $2, $3, $4, $5) returning ${CAMPOS}`,
      [m.nombre, m.zona, m.capacidad, m.activa, m.foto_url]
    );
    res.status(201).json(mesa);
  } catch (error) {
    throw errorDeMesa(error);
  }
});

router.put('/:id', async (req, res) => {
  const id = validar.id(req.params.id);
  const m = leerMesa(req.body);
  try {
    const { rows: [mesa] } = await pool.query(
      `update mesas set nombre = $2, zona = $3, capacidad = $4, activa = $5, foto_url = $6
        where id = $1 returning ${CAMPOS}`,
      [id, m.nombre, m.zona, m.capacidad, m.activa, m.foto_url]
    );
    if (!mesa) throw new ErrorHttp(404, 'La mesa no existe');
    res.json(mesa);
  } catch (error) {
    throw errorDeMesa(error);
  }
});

// Toggle activa / inactiva
router.patch('/:id/estado', async (req, res) => {
  const id = validar.id(req.params.id);
  const activa = validar.booleano(req.body?.activa, 'activa');
  const { rows: [mesa] } = await pool.query(
    `update mesas set activa = $2 where id = $1 returning ${CAMPOS}`,
    [id, activa]
  );
  if (!mesa) throw new ErrorHttp(404, 'La mesa no existe');
  res.json(mesa);
});

router.delete('/:id', async (req, res) => {
  const id = validar.id(req.params.id);
  try {
    const { rowCount } = await pool.query('delete from mesas where id = $1', [id]);
    if (rowCount === 0) throw new ErrorHttp(404, 'La mesa no existe');
    res.status(204).end();
  } catch (error) {
    if (error.code === PG_REFERENCIADO) {
      throw new ErrorHttp(409, 'La mesa tiene reservas registradas. Desactívala en lugar de borrarla.');
    }
    throw error;
  }
});

export default router;
