// Formato de fechas, horas y precios en español de Colombia.
// Las fechas viajan como texto 'AAAA-MM-DD' y las horas como 'HH:MM'.

export const ZONA_HORARIA = 'America/Bogota';
export const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
export const NOMBRES_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const pad2 = (n) => String(n).padStart(2, '0');

// Fecha de hoy en Colombia
export const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());

export function partesFecha(fecha) {
  const [a, m, d] = fecha.split('-').map(Number);
  return { a, m, d };
}

export function sumarDias(fecha, dias) {
  const { a, m, d } = partesFecha(fecha);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

// 0 = lunes … 6 = domingo
export function indiceDia(fecha) {
  const { a, m, d } = partesFecha(fecha);
  return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
}

export const diaSemanaDe = (fecha) => DIAS[indiceDia(fecha)];

// 'Sáb 7 nov 2026'
export function fechaCorta(fecha, { conAnio = true } = {}) {
  const { a, m, d } = partesFecha(fecha);
  return `${DIAS_CORTOS[indiceDia(fecha)]} ${d} ${MESES[m - 1].slice(0, 3)}${conAnio ? ` ${a}` : ''}`;
}

// 'Sábado 7 de noviembre de 2026'
export function fechaLarga(fecha) {
  const { a, m, d } = partesFecha(fecha);
  return `${NOMBRES_DIA[indiceDia(fecha)]} ${d} de ${MESES[m - 1]} de ${a}`;
}

// '07/11/2026'
export function fechaNumerica(fecha) {
  const { a, m, d } = partesFecha(fecha);
  return `${pad2(d)}/${pad2(m)}/${a}`;
}

// '18:00' -> '6:00 p. m.'
export function hora12(hora) {
  const [h, m] = hora.split(':').map(Number);
  const sufijo = h < 12 ? 'a. m.' : 'p. m.';
  return `${h % 12 === 0 ? 12 : h % 12}:${pad2(m)} ${sufijo}`;
}

// '18:00','19:00' -> '6:00 – 7:00 p. m.'
export function rangoHoras(inicio, fin) {
  const a = hora12(inicio);
  const b = hora12(fin);
  return a.slice(-5) === b.slice(-5) ? `${a.slice(0, -6)} – ${b}` : `${a} – ${b}`;
}

// Precio en pesos colombianos
export const precio = (valor) =>
  valor === null || valor === undefined ? 'Consultar' : `$ ${Number(valor).toLocaleString('es-CO')}`;

export const aMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};
export const aHora = (minutos) => `${pad2(Math.floor(minutos / 60))}:${pad2(minutos % 60)}`;

// Bloques de una jornada (igual que en el servidor, para la vista previa del panel)
export function generarSlots(inicio, fin, duracion) {
  const slots = [];
  for (let t = aMinutos(inicio); t + duracion <= aMinutos(fin); t += duracion) slots.push(aHora(t));
  return slots;
}

export const ZONAS = { terraza: 'Terraza', salon: 'Salón' };
export const CATEGORIAS = { pizzas: 'Pizzas', entradas: 'Entradas', postres: 'Postres', bebidas: 'Bebidas' };
