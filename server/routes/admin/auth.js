// RF-08: inicio de sesión del administrador.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../db.js';
import { ErrorHttp } from '../../utils/errores.js';
import * as validar from '../../utils/validar.js';
import { requiereAdmin } from '../../middleware/auth.js';

const router = Router();

const DURACION_SESION = '8h';

router.post('/login', async (req, res) => {
  const usuario = validar.texto(req.body?.usuario, 'usuario', { max: 50 });
  const password = validar.texto(req.body?.password, 'contraseña', { max: 200 });
  if (!process.env.JWT_SECRET) throw new Error('Falta configurar JWT_SECRET');

  const { rows: [admin] } = await pool.query(
    'select id, usuario, password_hash from administradores where usuario = $1',
    [usuario.toLowerCase()]
  );
  // Mismo mensaje si falla el usuario o la contraseña, para no dar pistas
  const valido = admin && (await bcrypt.compare(password, admin.password_hash));
  if (!valido) throw new ErrorHttp(401, 'Usuario o contraseña incorrectos');

  const token = jwt.sign({ id: admin.id, usuario: admin.usuario }, process.env.JWT_SECRET, {
    expiresIn: DURACION_SESION,
  });
  res.json({ token, usuario: admin.usuario });
});

// Permite al frontend comprobar si el token guardado sigue vigente
router.get('/sesion', requiereAdmin, (req, res) => {
  res.json({ usuario: req.admin.usuario });
});

export default router;
