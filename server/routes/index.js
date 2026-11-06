// Enrutador principal de la API. En la fase 2 se agregan aquí
// las rutas de mesas, horarios, reservas, platos y administración.
import { Router } from 'express';
import { pool } from '../db.js';

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

export default router;
