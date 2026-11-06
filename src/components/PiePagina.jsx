// Pie de página: dirección, horario (el configurado en el panel) y canales reales de Konys.
import Icono from './Icono.jsx';
import { Cono } from './Decoracion.jsx';
import { MENSAJES, NEGOCIO, enlaceWhatsapp, useHorario } from '../utils/negocio.js';

export default function PiePagina() {
  const horario = useHorario();
  return (
    <footer id="contacto" className="pie garabatos">
      <span className="contorno pie__fondo" aria-hidden="true">KONYS</span>
      <Cono className="pie__cono" />
      <div className="contenedor pie__contenido">
        <div className="pie__columnas">
          <div className="pie__marca">
            <span className="wordmark pie__logo">KONYS</span>
            <p className="eslogan">· {NEGOCIO.eslogan} ·</p>
          </div>
          <div>
            <h2 className="pie__titulo">Visítanos</h2>
            <a className="pie__dato" href={NEGOCIO.mapas} target="_blank" rel="noreferrer">
              <Icono nombre="pin" /> {NEGOCIO.local} · {NEGOCIO.direccion}, {NEGOCIO.ciudad}
            </a>
          </div>
          <div>
            <h2 className="pie__titulo">Horario</h2>
            {horario.map((h) => (
              <p key={h.dias} className="pie__dato"><Icono nombre="reloj" /> {h.dias} · {h.texto}</p>
            ))}
          </div>
          <div>
            <h2 className="pie__titulo">Contacto</h2>
            <a className="pie__dato" href={enlaceWhatsapp(MENSAJES.reservar)} target="_blank" rel="noreferrer">
              <Icono nombre="whatsapp" /> WhatsApp {NEGOCIO.whatsappVisible}
            </a>
            <a className="pie__dato" href={NEGOCIO.instagram} target="_blank" rel="noreferrer">
              <Icono nombre="instagram" /> {NEGOCIO.instagramUsuario}
            </a>
            <a className="pie__dato" href={NEGOCIO.domicilios} target="_blank" rel="noreferrer">
              <Icono nombre="flecha" /> Pide a domicilio
            </a>
          </div>
        </div>
        <div className="pie__final">
          <span>© {new Date().getFullYear()} Konys Pizza · Bucaramanga</span>
          <span>{NEGOCIO.esloganLargo}</span>
        </div>
      </div>
    </footer>
  );
}
