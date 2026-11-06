// RF-14: gestión de la carta (agregar, editar, ocultar y eliminar platos).
import { Router } from 'express';
import { pool } from '../../db.js';
import { ErrorHttp } from '../../utils/errores.js';
import * as validar from '../../utils/validar.js';

const router = Router();

const CATEGORIAS = ['pizzas', 'entradas', 'postres', 'bebidas'];
const CAMPOS = 'id, nombre, categoria, subcategoria, descripcion, precio, foto_url, disponible, orden, creado_en';

function leerPlato(datos = {}) {
  return {
    nombre: validar.texto(datos.nombre, 'nombre', { max: 80 }),
    categoria: validar.opcion(datos.categoria, 'categoría', CATEGORIAS),
    subcategoria: validar.texto(datos.subcategoria, 'subcategoría', { max: 60, opcional: true }),
    descripcion: validar.texto(datos.descripcion, 'descripción', { max: 800, opcional: true }),
    precio: validar.entero(datos.precio, 'precio', { min: 0, max: 10000000, opcional: true }),
    foto_url: validar.texto(datos.foto_url, 'foto', { max: 500, opcional: true }),
    disponible: datos.disponible === undefined ? true : validar.booleano(datos.disponible, 'disponible'),
  };
}

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `select ${CAMPOS} from platos order by array_position($1::text[], categoria), orden, nombre`,
    [CATEGORIAS]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const p = leerPlato(req.body);
  // Los platos nuevos quedan al final de la carta
  const { rows: [plato] } = await pool.query(
    `insert into platos (nombre, categoria, subcategoria, descripcion, precio, foto_url, disponible, orden)
     values ($1, $2, $3, $4, $5, $6, $7, (select coalesce(max(orden), 0) + 1 from platos))
     returning ${CAMPOS}`,
    [p.nombre, p.categoria, p.subcategoria, p.descripcion, p.precio, p.foto_url, p.disponible]
  );
  res.status(201).json(plato);
});

router.put('/:id', async (req, res) => {
  const id = validar.id(req.params.id);
  const p = leerPlato(req.body);
  const { rows: [plato] } = await pool.query(
    `update platos set nombre = $2, categoria = $3, subcategoria = $4, descripcion = $5,
            precio = $6, foto_url = $7, disponible = $8
      where id = $1 returning ${CAMPOS}`,
    [id, p.nombre, p.categoria, p.subcategoria, p.descripcion, p.precio, p.foto_url, p.disponible]
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
