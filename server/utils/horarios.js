// Utilidades de fechas y horas. Todo se calcula en la hora de Colombia.

export const ZONA_HORARIA = 'America/Bogota';

export const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

// Máximo de días hacia adelante en que se puede reservar
export const DIAS_MAXIMOS_RESERVA = 60;

// 'HH:MM' o 'HH:MM:SS' -> minutos desde la medianoche
export function aMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

// minutos desde la medianoche -> 'HH:MM'
export function aHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// 'HH:MM:SS' de PostgreSQL -> 'HH:MM'
export const horaCorta = (hora) => hora.slice(0, 5);

// 'AAAA-MM-DD' -> 'lunes' … 'domingo'
export function diaSemanaDe(fecha) {
  const [a, m, d] = fecha.split('-').map(Number);
  const domingoEsCero = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return DIAS[(domingoEsCero + 6) % 7];
}

// Suma días a una fecha 'AAAA-MM-DD'
export function sumarDias(fecha, dias) {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

// Fecha y minutos actuales en Colombia
export function ahoraEnColombia() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA_HORARIA,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
  };
}

// Divide una jornada en bloques del tamaño de la reserva.
// Ej: 12:30–14:30 con 60 min -> [12:30–13:30, 13:30–14:30]
export function generarSlots(horaInicio, horaFin, duracion) {
  const slots = [];
  const fin = aMinutos(horaFin);
  for (let t = aMinutos(horaInicio); t + duracion <= fin; t += duracion) {
    slots.push({ inicio: aHora(t), fin: aHora(t + duracion) });
  }
  return slots;
}

// ¿Se cruzan dos rangos de horas?
export function seCruzan(inicioA, finA, inicioB, finB) {
  return aMinutos(inicioA) < aMinutos(finB) && aMinutos(finA) > aMinutos(inicioB);
}
