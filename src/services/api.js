// Cliente HTTP para hablar con la API de Express (/api/...).
// Si hay sesión de administrador, envía el JWT en cada petición.

const CLAVE_TOKEN = 'konys_token';

export const sesion = {
  obtener: () => localStorage.getItem(CLAVE_TOKEN),
  guardar: (token) => localStorage.setItem(CLAVE_TOKEN, token),
  cerrar: () => localStorage.removeItem(CLAVE_TOKEN),
};

export async function api(ruta, { metodo = 'GET', datos } = {}) {
  const encabezados = { 'Content-Type': 'application/json' };
  const token = sesion.obtener();
  if (token) encabezados.Authorization = `Bearer ${token}`;

  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: encabezados,
    body: datos ? JSON.stringify(datos) : undefined,
  });

  const cuerpo = await respuesta.json().catch(() => ({}));
  // Sesión de administrador vencida: se cierra y se vuelve al login
  if (respuesta.status === 401 && token) {
    sesion.cerrar();
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
