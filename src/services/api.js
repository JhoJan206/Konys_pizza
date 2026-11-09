// Cliente HTTP para hablar con la API de Express (/api/...).
// La sesión del administrador vive en una cookie httpOnly que pone el servidor:
// el navegador la envía sola y este código nunca la ve ni la guarda.

export const sesion = {
  // Pregunta al servidor si la cookie sigue vigente (lanza error si no)
  comprobar: () => api('/admin/sesion'),
  cerrar: () => api('/admin/logout', { metodo: 'POST' }).catch(() => {}),
};

// Rutas que pueden responder 401 sin que haya que redirigir al login
const SIN_REDIRECCION = ['/admin/login', '/admin/sesion'];

export async function api(ruta, { metodo = 'GET', datos } = {}) {
  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: datos ? JSON.stringify(datos) : undefined,
  });

  const cuerpo = await respuesta.json().catch(() => ({}));
  // Sesión de administrador vencida en medio del panel: se vuelve al login
  if (respuesta.status === 401 && ruta.startsWith('/admin/') && !SIN_REDIRECCION.includes(ruta)) {
    window.location.assign('/admin');
  }
  if (!respuesta.ok) {
    const porDefecto = respuesta.status >= 500
      ? 'No pudimos conectar con el servidor. Intenta de nuevo en un momento.'
      : 'No se pudo completar la acción';
    const error = new Error(cuerpo.error || porDefecto);
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}
