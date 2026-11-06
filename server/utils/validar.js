// Validaciones de los datos que llegan en las peticiones.
// Cada función devuelve el valor limpio o lanza un ErrorHttp 400.
import { ErrorHttp } from './errores.js';

const vacio = (valor) => valor === undefined || valor === null || valor === '';

export function texto(valor, campo, { min = 1, max = 200, opcional = false } = {}) {
  if (vacio(valor) || (typeof valor === 'string' && valor.trim() === '')) {
    if (opcional) return null;
    throw new ErrorHttp(400, `El campo ${campo} es obligatorio`);
  }
  if (typeof valor !== 'string') throw new ErrorHttp(400, `El campo ${campo} debe ser texto`);
  const limpio = valor.trim();
  if (limpio.length < min || limpio.length > max) {
    throw new ErrorHttp(400, `El campo ${campo} debe tener entre ${min} y ${max} caracteres`);
  }
  return limpio;
}

export function entero(valor, campo, { min = 0, max = Number.MAX_SAFE_INTEGER, opcional = false } = {}) {
  if (vacio(valor)) {
    if (opcional) return null;
    throw new ErrorHttp(400, `El campo ${campo} es obligatorio`);
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < min || numero > max) {
    throw new ErrorHttp(400, `El campo ${campo} debe ser un número entero entre ${min} y ${max}`);
  }
  return numero;
}

export function booleano(valor, campo) {
  if (typeof valor !== 'boolean') throw new ErrorHttp(400, `El campo ${campo} debe ser verdadero o falso`);
  return valor;
}

export function opcion(valor, campo, opciones) {
  if (!opciones.includes(valor)) {
    throw new ErrorHttp(400, `El campo ${campo} debe ser uno de: ${opciones.join(', ')}`);
  }
  return valor;
}

export function fecha(valor, campo = 'fecha') {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new ErrorHttp(400, `El campo ${campo} debe tener el formato AAAA-MM-DD`);
  }
  const [a, m, d] = valor.split('-').map(Number);
  const real = new Date(Date.UTC(a, m - 1, d));
  if (real.getUTCMonth() !== m - 1 || real.getUTCDate() !== d) {
    throw new ErrorHttp(400, `La ${campo} no existe`);
  }
  return valor;
}

export function hora(valor, campo) {
  if (typeof valor !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(valor)) {
    throw new ErrorHttp(400, `El campo ${campo} debe tener el formato HH:MM`);
  }
  return valor;
}

// Id numérico de la URL (/:id)
export const id = (valor) => entero(valor, 'id', { min: 1 });
