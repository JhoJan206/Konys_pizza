// RF-14: gestión de la carta (agregar, editar, ocultar y eliminar platos).
import { Router } from 'express';
import { pool } from '../../db.js';
import { ErrorHttp } from '../../utils/errores.js';
import * as validar from '../../utils/validar.js';

const router = Router();

const CATEGORIAS = ['pizzas', 'entradas', 'postres', 'bebidas'];
const CAMPOS = 'id, nombre, categoria, descripcion, precio, disponible, creado_en';

function leerPlato(datos = {}) {
  return {
    nombre: validar.texto(datos.nombre, 'nombre', { max: 80 }),
    categoria: validar.opcion(datos.categoria, 'categoría', CATEGORIAS),
    descripcion: validar.texto(datos.descripcion, 'descripción', { max: 300, opcional: true }),
    precio: validar.entero(datos.precio, 'precio', { min: 0, max: 10000000, opcional: true }),
    disponible: datos.disponible === undefined ? true : validar.booleano(datos.disponible, 'disponible'),
  };
}

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `select ${CAMPOS} from platos order by array_position($1::text[], categoria), nombre`,
    [CATEGORIAS]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const p = leerPlato(req.body);
  const { rows: [plato] } = await pool.query(
    `insert into platos (nombre, categoria, descripcion, precio, disponible)
     values ($1, $2, $3, $4, $5) returning ${CAMPOS}`,
    [p.nombre, p.categoria, p.descripcion, p.precio, p.disponible]
  );
  res.status(201).json(plato);
});

router.put('/:id', async (req, res) => {
  const id = validar.id(req.params.id);
  const p = leerPlato(req.body);
  const { rows: [plato] } = await pool.query(
    `update platos set nombre = $2, categoria = $3, descripcion = $4, precio = $5, disponible = $6
      where id = $1 returning ${CAMPOS}`,
    [id, p.nombre, p.categoria, p.descripcion, p.precio, p.disponible]
  );
  if (!plato) throw new ErrorHttp(404, 'El plato no existe');
  res.json(plato);
});

// Mostrar u ocultar en la carta
router.patch('/:id/disponible', async (req, res) => {
  const id = validar.id(req.params.id);
  const disponible = validar.booleano(req.body?.disponible, 'disponible');
  const { rows: [plato] } = await pool.query(
    `update platos set disponible = $2 where id = $1 returning ${CAMPOS}`,
    [id, disponible]
  );
  if (!plato) throw new ErrorHttp(404, 'El plato no existe');
  res.json(plato);
});

router.delete('/:id', async (req, res) => {
  const id = validar.id(req.params.id);
  const { rowCount } = await pool.query('delete from platos where id = $1', [id]);
  if (rowCount === 0) throw new ErrorHttp(404, 'El plato no existe');
  res.status(204).end();
});

export default router;
