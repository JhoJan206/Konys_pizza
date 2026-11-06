// Pie de página con dirección, horario y redes (RF del diseño: footer).
import Icono from './Icono.jsx';
import { Cono } from './Decoracion.jsx';

export default function PiePagina() {
  return (
    <footer id="contacto" className="pie garabatos">
      <span className="contorno pie__fondo" aria-hidden="true">KONYS</span>
      <Cono className="pie__cono" />
      <div className="contenedor pie__contenido">
        <div className="pie__columnas">
          <div className="pie__marca">
            <span className="wordmark pie__logo">KONYS</span>
            <p className="eslogan">· La pizza más icónica de la ciudad ·</p>
          </div>
          <div>
            <h2 className="pie__titulo">Visítanos</h2>
            <p className="pie__dato"><Icono nombre="pin" /> Cra. 36 con calle 41, Bucaramanga, Santander</p>
          </div>
          <div>
            <h2 className="pie__titulo">Horario</h2>
            <p className="pie__dato"><Icono nombre="reloj" /> Almuerzo · 12:30 – 2:30 p. m.</p>
            <p className="pie__dato"><Icono nombre="reloj" /> Noche · 5:00 – 11:00 p. m.</p>
          </div>
          <div>
            <h2 className="pie__titulo">Contacto</h2>
            <a className="pie__dato" href="https://www.instagram.com/konys_pizza" target="_blank" rel="noreferrer">
              <Icono nombre="instagram" /> @konys_pizza
            </a>
            <p className="pie__dato"><Icono nombre="whatsapp" /> Domicilios y eventos por WhatsApp</p>
          </div>
        </div>
        <div className="pie__final">
          <span>© {new Date().getFullYear()} Konys Pizza · Bucaramanga</span>
          <span>Reservas sin registro ni pagos anticipados</span>
        </div>
      </div>
    </footer>
  );
}
