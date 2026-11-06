// Calendario del flujo de reserva (RF-03): solo habilita los días en que
// el restaurante atiende, desde hoy hasta el máximo de días permitido.
import { useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { MESES, diaSemanaDe, fechaLarga, hoy, indiceDia, pad2, partesFecha, sumarDias } from '../../utils/formato.js';

const SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

export default function Calendario({ diasAbiertos, diasMaximos, fecha, onElegir }) {
  const fechaHoy = hoy();
  const fechaMaxima = sumarDias(fechaHoy, diasMaximos);
  const inicial = partesFecha(fecha || fechaHoy);
  const [mes, setMes] = useState({ a: inicial.a, m: inicial.m });

  const habilitado = (f) => f >= fechaHoy && f <= fechaMaxima && diasAbiertos.includes(diaSemanaDe(f));

  const primerDia = `${mes.a}-${pad2(mes.m)}-01`;
  const diasEnMes = new Date(Date.UTC(mes.a, mes.m, 0)).getUTCDate();
  const huecos = indiceDia(primerDia);
  const dias = Array.from({ length: diasEnMes }, (_, i) => `${mes.a}-${pad2(mes.m)}-${pad2(i + 1)}`);

  const mover = (delta) => {
    const nuevo = new Date(Date.UTC(mes.a, mes.m - 1 + delta, 1));
    setMes({ a: nuevo.getUTCFullYear(), m: nuevo.getUTCMonth() + 1 });
  };
  const hayAnterior = primerDia > fechaHoy.slice(0, 8) + '01';
  const haySiguiente = dias[dias.length - 1] < fechaMaxima;

  return (
    <div className="calendario">
      <div className="calendario__cabecera">
        <h3 className="paso-titulo"><span className="paso-titulo__numero">1.</span> Elige la fecha</h3>
        <div className="calendario__mes-nav">
          <button type="button" className="boton-flecha" aria-label="Mes anterior" disabled={!hayAnterior} onClick={() => mover(-1)}>
            <Icono nombre="izquierda" tam={16} grosor={2.2} />
          </button>
          <span className="calendario__mes" aria-live="polite">{MESES[mes.m - 1]} {mes.a}</span>
          <button type="button" className="boton-flecha" aria-label="Mes siguiente" disabled={!haySiguiente} onClick={() => mover(1)}>
            <Icono nombre="derecha" tam={16} grosor={2.2} />
          </button>
        </div>
      </div>
      <div className="calendario__semana" aria-hidden="true">
        {SEMANA.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="calendario__dias">
        {Array.from({ length: huecos }, (_, i) => <span key={`h${i}`} />)}
        {dias.map((f) => (
          <button
            key={f} type="button" disabled={!habilitado(f)}
            className={`dia ${f === fechaHoy ? 'dia--hoy' : ''}`}
            aria-pressed={f === fecha} aria-label={fechaLarga(f)}
            onClick={() => onElegir(f)}
          >
            {Number(f.slice(8))}
          </button>
        ))}
      </div>
    </div>
  );
}
