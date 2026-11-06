// Comprobante de la reserva (RF-06), con diseño de ticket de Konys.
import Encabezado from '../../components/Encabezado.jsx';
import Enlace from '../../components/Enlace.jsx';
import { Cono, Sello } from '../../components/Decoracion.jsx';
import { ZONAS, fechaLarga, rangoHoras } from '../../utils/formato.js';

function leerReserva() {
  try {
    return JSON.parse(sessionStorage.getItem('konys_reserva'));
  } catch {
    return null;
  }
}

export default function Confirmacion() {
  const reserva = leerReserva();
  const primerNombre = reserva?.cliente_nombre.split(' ')[0];

  return (
    <>
      <div className="zona-azul garabatos confirmacion__zona">
        <span className="contorno confirmacion__listo" aria-hidden="true">¡LISTO!</span>
        <Cono className="confirmacion__cono-1" />
        <Cono className="confirmacion__cono-2" />
        <Encabezado activo="" />
      </div>

      <main className="confirmacion__principal contenedor">
        {reserva ? (
          <section className="ticket" aria-labelledby="titulo-ticket">
            <Sello className="ticket__sello" texto="RESERVA CONFIRMADA ✦ KONYS PIZZA ✦" conCheck />
            <div className="ticket__cabeza">
              <span className="antetitulo">Comprobante de reserva</span>
              <h1 id="titulo-ticket" className="ticket__titulo">¡Te esperamos, {primerNombre}!</h1>
              <p className="ticket__parrafo">Tu mesa quedó separada. Guarda o toma captura de este ticket.</p>
            </div>
            <div className="ticket__perforacion" aria-hidden="true"><span className="ticket__linea" /></div>
            <dl className="ticket__datos">
              <div><dt>Nombre</dt><dd>{reserva.cliente_nombre}</dd></div>
              <div><dt>Mesa</dt><dd>{reserva.mesa.nombre} · {ZONAS[reserva.mesa.zona]}</dd></div>
              <div><dt>Fecha</dt><dd>{fechaLarga(reserva.fecha)}</dd></div>
              <div><dt>Hora</dt><dd>{rangoHoras(reserva.hora_inicio, reserva.hora_fin)}</dd></div>
              <div><dt>Personas</dt><dd>{reserva.num_personas}</dd></div>
              <div><dt>Reserva</dt><dd>N.º {reserva.id}</dd></div>
            </dl>
            <p className="ticket__aviso">
              Te esperamos en la Cra. 36 con calle 41, Bucaramanga. Si necesitas cambiar o cancelar, escríbenos por WhatsApp o Instagram (@konys_pizza).
            </p>
            <div className="ticket__acciones">
              <Enlace href="/" className="boton boton--azul">Volver al inicio</Enlace>
              <Enlace href="/carta" className="boton">Ver el menú</Enlace>
            </div>
            <div className="ticket__pie" aria-hidden="true"><span>Konys · Bucaramanga</span><span>✦ ✦ ✦</span></div>
          </section>
        ) : (
          <section className="ticket">
            <div className="ticket__cabeza">
              <h1 className="ticket__titulo">No encontramos tu reserva</h1>
              <p className="ticket__parrafo">Esta página muestra el comprobante justo después de reservar.</p>
            </div>
            <div className="ticket__acciones">
              <Enlace href="/#mesas" className="boton">Reservar una mesa</Enlace>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
