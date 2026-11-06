// Protege las rutas del panel de administración.
// Espera el encabezado "Authorization: Bearer <token>" con un JWT válido.
import jwt from 'jsonwebtoken';

export function requiereAdmin(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión vencida o inválida' });
  }
}
