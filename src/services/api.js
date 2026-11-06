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
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error || 'No se pudo completar la acción');
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}
