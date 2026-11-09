// Protege las rutas del panel de administración.
// La sesión viaja en una cookie httpOnly con un JWT: el JavaScript del navegador
// no puede leerla, así que no queda nada en localStorage ni sessionStorage.
import jwt from 'jsonwebtoken';

export const COOKIE_SESION = 'konys_sesion';
export const DURACION_SESION_MS = 8 * 60 * 60 * 1000; // 8 horas

// Opciones de la cookie: solo HTTPS en producción, nunca se envía desde otros sitios
export const opcionesCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
  sameSite: 'strict',
  path: '/api',
};

// Lee una cookie del encabezado "Cookie" sin librerías extra
function leerCookie(req, nombre) {
  const par = (req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${nombre}=`));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
}

export function requiereAdmin(req, res, next) {
  const token = leerCookie(req, COOKIE_SESION);
  if (!token) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.clearCookie(COOKIE_SESION, opcionesCookie);
    res.status(401).json({ error: 'Sesión vencida o inválida' });
  }
}
