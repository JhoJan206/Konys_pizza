// Rutas del panel de administración (/api/admin/...).
// El login es público; todo lo demás exige la cookie de sesión con un JWT válido.
import { Router } from 'express';
import { requiereAdmin } from '../../middleware/auth.js';
import auth from './auth.js';
import mesas from './mesas.js';
import horarios from './horarios.js';
import reservas from './reservas.js';
import platos from './platos.js';

const router = Router();

router.use(auth);
router.use('/mesas', requiereAdmin, mesas);
router.use('/horarios', requiereAdmin, horarios);
router.use('/reservas', requiereAdmin, reservas);
router.use('/platos', requiereAdmin, platos);

export default router;
