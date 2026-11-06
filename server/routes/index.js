// Enrutador principal de la API.
import { Router } from 'express';
import { pool } from '../db.js';
import publico from './publico.js';
import admin from './admin/index.js';

const router = Router();

// Comprueba que la API responde y si hay conexión con la base de datos
router.get('/salud', async (req, res) => {
  let baseDeDatos = 'sin configurar';
  if (process.env.DATABASE_URL) {
    try {
      await pool.query('select 1');
      baseDeDatos = 'conectada';
    } catch {
      baseDeDatos = 'error de conexión';
    }
  }
  res.json({ estado: 'ok', baseDeDatos });
});

router.use('/', publico);
router.use('/admin', admin);

export default router;
