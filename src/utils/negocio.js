// Datos reales de Konys Pizza (tomados de sus canales oficiales en Clubify).
// Si cambia la dirección, el WhatsApp o los enlaces, se actualizan aquí.
import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { DIAS, hora12 } from './formato.js';

export const NEGOCIO = {
  eslogan: 'La pizza más ikónica de la ciudad',
  esloganLargo: 'La conopizzería más ikónica de Colombia pal mundo',
  local: 'Konys Pizza Kono',
  direccion: 'Carrera 36 #38-41, El Prado',
  ciudad: 'Bucaramanga, Santander',
  mapas: 'https://www.google.com/maps/search/?api=1&query=Konys%20pizza%20kono%2C%20Carrera%2036%20%2338-41%2C%20El%20Prado%2C%20Bucaramanga%2C%20Santander%2C%20Colombia',
  whatsapp: '573224603184',
  whatsappVisible: '322 460 3184',
  instagram: 'https://www.instagram.com/konys_pizza',
  instagramUsuario: '@konys_pizza',
  domicilios: 'https://soyclubify.com/d/konys',
};

export const MENSAJES = {
  reservar: 'Hola, quisiera reservar!',
  detalle: 'Hola, quisiera armar un detalle personalizado 🎁',
  reserva: (numero) => `Hola, tengo la reserva N.º ${numero} y necesito hacer un cambio.`,
};

// Enlace de WhatsApp con un mensaje ya escrito
export const enlaceWhatsapp = (mensaje) =>
  `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(mensaje)}`;

const CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Horario mientras carga la API (el real del restaurante)
const HORARIO_INICIAL = [
  { dias: 'Lun a vie', texto: '12:00 – 2:30 p. m. y 5:00 – 10:30 p. m.' },
  { dias: 'Sáb y dom', texto: '12:00 – 2:30 p. m. y 5:00 – 11:00 p. m.' },
];

// Agrupa los días seguidos que tienen el mismo horario: "Lun a vie", "Sáb y dom"
export function resumirHorarios(horarios) {
  const porDia = DIAS.map((dia) => horarios
    .filter((h) => h.dia_semana === dia)
    .map((h) => `${hora12(h.hora_inicio).replace(' p. m.', '')} – ${hora12(h.hora_fin)}`)
    .join(' y '));

  const grupos = [];
  porDia.forEach((texto, i) => {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.texto === texto) ultimo.fin = i;
    else grupos.push({ inicio: i, fin: i, texto });
  });

  return grupos.filter((g) => g.texto).map((g) => ({
    dias: g.inicio === g.fin ? CORTOS[g.inicio]
      : g.fin - g.inicio === 1 ? `${CORTOS[g.inicio]} y ${CORTOS[g.fin].toLowerCase()}`
        : `${CORTOS[g.inicio]} a ${CORTOS[g.fin].toLowerCase()}`,
    texto: g.texto,
  }));
}

// Horario vigente (el que configura el administrador en el panel)
export function useHorario() {
  const [horario, setHorario] = useState(HORARIO_INICIAL);
  useEffect(() => {
    api('/horarios').then((datos) => setHorario(resumirHorarios(datos.horarios))).catch(() => {});
  }, []);
  return horario;
}
