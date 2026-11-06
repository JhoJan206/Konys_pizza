// Página principal del cliente (RF-01, RF-02): hero, pasos, mesas, menú y pie.
import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Encabezado from '../../components/Encabezado.jsx';
import PiePagina from '../../components/PiePagina.jsx';
import PlanoMesa from '../../components/PlanoMesa.jsx';
import Icono from '../../components/Icono.jsx';
import Enlace from '../../components/Enlace.jsx';
import { Cono, Destello, Franja, Goteo, Sello, TituloSeccion } from '../../components/Decoracion.jsx';
import { ZONAS, fechaCorta, hoy, hora12, pad2 } from '../../utils/formato.js';
import { MENSAJES, NEGOCIO, enlaceWhatsapp, useHorario } from '../../utils/negocio.js';
import ModalReserva from './ModalReserva.jsx';

const PASOS = [
  { titulo: 'Elige tu mesa', texto: 'Terraza o salón, según el plan y el tamaño del grupo.' },
  { titulo: 'Escoge día y hora', texto: 'Ves en tiempo real qué horarios siguen libres.' },
  { titulo: 'Confirma y listo', texto: 'Recibes tu comprobante al instante.' },
];

export default function Inicio() {
  const [mesas, setMesas] = useState(null);
  const [error, setError] = useState('');
  const [zona, setZona] = useState('todas');
  const [mesaElegida, setMesaElegida] = useState(null);
  const horario = useHorario();

  const cargarMesas = () => {
    api('/mesas')
      .then(setMesas)
      .catch(() => setError('No pudimos cargar las mesas. Intenta de nuevo en un momento.'));
  };

  useEffect(cargarMesas, []);

  // Si se llega con /#mesas o /#contacto, baja hasta esa sección
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id || !mesas) return;
    // Espera a que se pinten las tarjetas para calcular bien la posición
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'auto' }));
  }, [mesas]);

  const visibles = (mesas ?? []).filter((m) => zona === 'todas' || m.zona === zona);

  return (
    <>
      <div className="zona-azul garabatos">
        <Cono className="hero__decor-cono" />
        <Destello className="hero__destello-1" />
        <Destello className="hero__destello-2" />
        <Destello className="hero__destello-3" />
        <span className="hero__vertical" aria-hidden="true">BUCARAMANGA · SANTANDER</span>

        <Encabezado activo="inicio" />

        <section className="hero contenedor">
          <div className="hero__texto">
            <a className="pill-direccion" href={NEGOCIO.mapas} target="_blank" rel="noreferrer">
              <Icono nombre="pin" tam={16} /> {NEGOCIO.direccion} · Bucaramanga
            </a>
            <h1 className="hero__titulo">
              <span className="wordmark hero__wordmark">KONYS</span>
              <span className="eslogan hero__eslogan">· {NEGOCIO.eslogan} ·</span>
            </h1>
            <p className="hero__parrafo">{NEGOCIO.esloganLargo}. Separa tu mesa en un minuto: elige la mesa, el día y la hora, y te la tenemos lista.</p>
            <div className="hero__acciones">
              <a href="#mesas" className="boton">Reserva tu mesa <Icono nombre="flecha" grosor={2.6} /></a>
              <Enlace href="/carta" className="boton boton--claro">Ver el menú</Enlace>
              <a href={NEGOCIO.domicilios} target="_blank" rel="noreferrer" className="boton boton--claro">Pide a domicilio</a>
            </div>
            <div className="hero__chips">
              {horario.map((h) => (
                <div key={h.dias} className="chip-horario">
                  <span className="chip-horario__titulo">{h.dias}</span>
                  <span className="chip-horario__valor">{h.texto}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero__visual">
            <span className="contorno hero__pizza" aria-hidden="true">PIZZA</span>
            <Cono className="hero__cono" />
            <figure className="hero__foto">
              <img src="/img/konys-conos.png" alt="Dos pizzas en cono de Konys con queso gratinado" />
            </figure>
            <Sello className="hero__sello" />
            <span className="hero__etiqueta">Pizza en cono</span>
          </div>
        </section>
      </div>
      <Goteo />
      <Franja />

      <main>
        <section className="seccion contenedor" aria-labelledby="titulo-pasos">
          <TituloSeccion fondo="3 PASOS" antetitulo="Sin llamadas · sin registro">
            <span id="titulo-pasos">Así de fácil reservas</span>
          </TituloSeccion>
          <ol className="pasos" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="paso">
                <span className="contorno paso__numero" aria-hidden="true">{pad2(i + 1)}</span>
                <h3 className="paso__titulo">{p.titulo}</h3>
                <p className="paso__texto">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="mesas" className="seccion mesas contenedor" aria-labelledby="titulo-mesas">
          <div className="mesas__cabecera">
            <TituloSeccion fondo="MESAS" antetitulo={`Disponibilidad hoy · ${fechaCorta(hoy(), { conAnio: false }).toLowerCase()}`}>
              <span id="titulo-mesas">Nuestras mesas</span>
            </TituloSeccion>
            <div className="selector-pastilla" role="group" aria-label="Filtrar por zona">
              {[['todas', 'Todas'], ['terraza', 'Terraza'], ['salon', 'Salón']].map(([valor, texto]) => (
                <button
                  key={valor} type="button" className="selector-pastilla__opcion"
                  aria-pressed={zona === valor} onClick={() => setZona(valor)}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="alerta" role="alert"><Icono nombre="alerta" />{error}</p>}
          {!mesas && !error && <p className="cargando">Cargando mesas…</p>}
          {mesas && visibles.length === 0 && (
            <p className="mesas__vacio">No hay mesas disponibles en esta zona por ahora.</p>
          )}

          <div className="grilla-mesas">
            {visibles.map((mesa, i) => (
              <article key={mesa.id} className={`tarjeta-mesa ${mesa.ocupada_ahora ? 'tarjeta-mesa--ocupada' : ''}`}>
                <div className="tarjeta-mesa__plano">
                  <PlanoMesa mesa={mesa} />
                  <span className="contorno tarjeta-mesa__numero" aria-hidden="true">{pad2(i + 1)}</span>
                  <span className="tarjeta-mesa__zona">{ZONAS[mesa.zona]}</span>
                </div>
                <div className="tarjeta-mesa__cuerpo">
                  <div className="tarjeta-mesa__fila">
                    <div>
                      <h3 className="tarjeta-mesa__nombre">{mesa.nombre}</h3>
                      <span className="tarjeta-mesa__capacidad">{ZONAS[mesa.zona]} · hasta {mesa.capacidad} personas</span>
                    </div>
                    <span className={`estado ${mesa.ocupada_ahora ? 'estado--ocupada' : 'estado--libre'}`}>
                      {mesa.ocupada_ahora ? 'Ocupada' : 'Libre'}
                    </span>
                  </div>
                  <button
                    type="button" onClick={() => setMesaElegida(mesa)}
                    className={`boton boton--bloque tarjeta-mesa__accion ${mesa.ocupada_ahora ? 'boton--contorno' : ''}`}
                  >
                    {mesa.ocupada_ahora ? `Libre desde ${hora12(mesa.libre_desde)}` : 'Ver horarios'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="seccion contenedor visitanos" aria-labelledby="titulo-visitanos">
          <div className="visitanos__fotos">
            <img className="visitanos__fachada" src="/img/konys/fachada.webp" alt="Fachada iluminada de Konys Pizza en El Prado, Bucaramanga" loading="lazy" />
            <img className="visitanos__mesa" src="/img/konys/mesa-reservada.jpg" alt="Mesa de Konys reservada y decorada para un cumpleaños" loading="lazy" />
          </div>
          <div className="visitanos__texto">
            <TituloSeccion fondo="EL PRADO" antetitulo="Visítanos">
              <span id="titulo-visitanos">{NEGOCIO.local}</span>
            </TituloSeccion>
            <p className="visitanos__dato"><Icono nombre="pin" /> {NEGOCIO.direccion}, {NEGOCIO.ciudad}</p>
            <ul className="visitanos__horario">
              {horario.map((h) => (
                <li key={h.dias}><Icono nombre="reloj" /><span><strong>{h.dias}</strong> · {h.texto}</span></li>
              ))}
            </ul>
            <p className="visitanos__parrafo">¿Celebras algo? Separa tu mesa en línea o escríbenos por WhatsApp y te ayudamos.</p>
            <div className="visitanos__acciones">
              <a className="boton boton--azul" href={NEGOCIO.mapas} target="_blank" rel="noreferrer">
                <Icono nombre="pin" /> Cómo llegar
              </a>
              <a className="boton boton--contorno" href={enlaceWhatsapp(MENSAJES.reservar)} target="_blank" rel="noreferrer">
                <Icono nombre="whatsapp" /> Reserva por WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="seccion contenedor">
          <div className="antojo">
            <span className="contorno antojo__fondo" aria-hidden="true">ANTOJO</span>
            <img className="antojo__foto" src="/img/konys/kono-queso.webp" alt="" aria-hidden="true" loading="lazy" />
            <div className="antojo__texto">
              <span className="antetitulo">El menú</span>
              <h2 className="antojo__titulo">¿Ya sabes qué vas a pedir?</h2>
              <p className="antojo__parrafo">Konys de autor, clásicas e ikónicas, entradas, granizados, sodas y postres. Míralo antes de llegar.</p>
            </div>
            <div className="antojo__acciones">
              <Enlace href="/carta" className="boton boton--azul">Ver el menú <Icono nombre="flecha" grosor={2.6} /></Enlace>
              <a href={NEGOCIO.domicilios} target="_blank" rel="noreferrer" className="boton boton--contorno">Pide a domicilio</a>
            </div>
          </div>
        </section>

        <section className="seccion contenedor" aria-labelledby="titulo-detalles">
          <div className="detalles zona-azul garabatos">
            <span className="contorno detalles__fondo" aria-hidden="true">DETALLES</span>
            <div className="detalles__texto">
              <span className="antetitulo detalles__antetitulo">Productos para la casa</span>
              <h2 id="titulo-detalles" className="detalles__titulo">Congelados y detalles</h2>
              <p className="detalles__parrafo">
                Lleva tus konys congelados y la lasaña prelista para disfrutar en casa, o arma un detalle personalizado para sorprender a alguien.
              </p>
              <a className="boton" href={enlaceWhatsapp(MENSAJES.detalle)} target="_blank" rel="noreferrer">
                <Icono nombre="whatsapp" /> Arma tu detalle
              </a>
            </div>
            <img className="detalles__foto" src="/img/konys/caja-detalle.jpg" alt="Caja de regalo de Konys con konys congelados, bebida y tarjeta de cumpleaños" loading="lazy" />
          </div>
        </section>
      </main>

      <PiePagina />

      {mesaElegida && (
        <ModalReserva
          mesa={mesaElegida}
          onCerrar={() => { setMesaElegida(null); cargarMesas(); }}
        />
      )}
    </>
  );
}
