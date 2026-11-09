// Flujo de reserva (RF-02 a RF-05 y CU-02): fecha, hora y datos del cliente.
// En escritorio es una ventana sobre el inicio; en móvil ocupa toda la pantalla.
import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api.js';
import { navegar } from '../../router.js';
import Icono from '../../components/Icono.jsx';
import PlanoMesa from '../../components/PlanoMesa.jsx';
import Calendario from './Calendario.jsx';
import { ZONAS, diaSemanaDe, fechaCorta, hoy, hora12, rangoHoras, sumarDias } from '../../utils/formato.js';

const JORNADAS = { almuerzo: 'Almuerzo', noche: 'Noche' };

export default function ModalReserva({ mesa, onCerrar }) {
  const [info, setInfo] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [slot, setSlot] = useState(null);
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [personas, setPersonas] = useState(Math.min(2, mesa.capacidad));
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fondoRef = useRef(null);

  // Bloquea el scroll de la página y enfoca la ventana al abrirla
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    fondoRef.current?.focus();
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Días de atención y primera fecha disponible
  useEffect(() => {
    api('/horarios').then((datos) => {
      setInfo(datos);
      for (let i = 0; i <= datos.dias_maximos_reserva; i++) {
        const f = sumarDias(hoy(), i);
        if (datos.dias_abiertos.includes(diaSemanaDe(f))) { setFecha(f); break; }
      }
    }).catch(() => setAviso('No pudimos cargar los horarios. Intenta de nuevo.'));
  }, []);

  const cargarDisponibilidad = (f) => {
    setDisponibilidad(null);
    api(`/mesas/${mesa.id}/disponibilidad?fecha=${f}`)
      .then(setDisponibilidad)
      .catch((e) => setAviso(e.message));
  };

  useEffect(() => {
    if (fecha) { setSlot(null); cargarDisponibilidad(fecha); }
  }, [fecha]); // eslint-disable-line react-hooks/exhaustive-deps

  const elegirSlot = (s) => {
    if (s.estado === 'ocupado') {
      setAviso('Ese horario ya está ocupado. Elige otro, por favor.');
      return;
    }
    setAviso('');
    setSlot(s);
  };

  const confirmar = async (evento) => {
    evento.preventDefault();
    const nuevosErrores = {};
    if (nombre.trim().length < 2) nuevosErrores.nombre = 'Escribe tu nombre completo.';
    if (personas < 1 || personas > mesa.capacidad) nuevosErrores.personas = `Esta mesa admite máximo ${mesa.capacidad} personas.`;
    setErrores(nuevosErrores);
    if (!slot) { setAviso('Elige una hora para tu reserva.'); return; }
    if (Object.keys(nuevosErrores).length) return;

    setEnviando(true);
    setAviso('');
    try {
      const reserva = await api('/reservas', {
        metodo: 'POST',
        datos: {
          mesa_id: mesa.id, fecha, hora_inicio: slot.inicio,
          cliente_nombre: nombre, cliente_contacto: contacto, num_personas: personas,
        },
      });
      sessionStorage.setItem('konys_reserva', JSON.stringify(reserva));
      document.body.style.overflow = '';
      navegar('/reserva-confirmada');
    } catch (error) {
      setAviso(error.message);
      // Otro cliente tomó el horario: se actualiza la grilla (flujo alternativo del CU-02)
      if (error.status === 409) { setSlot(null); cargarDisponibilidad(fecha); }
    } finally {
      setEnviando(false);
    }
  };

  const cerrarConFondo = (e) => { if (e.target === e.currentTarget) onCerrar(); };

  return (
    <div
      className="modal-fondo" ref={fondoRef} tabIndex={-1} onMouseDown={cerrarConFondo}
      onKeyDown={(e) => e.key === 'Escape' && onCerrar()}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-reserva">
        <header className="modal__cabecera">
          <span className="contorno modal__fondo" aria-hidden="true">{mesa.nombre.toUpperCase()}</span>
          <div className="modal__mesa">
            <div className="modal__miniatura"><PlanoMesa mesa={mesa} /></div>
            <div>
              <h2 id="titulo-reserva" className="modal__titulo">Reservar · {mesa.nombre}</h2>
              <span className="modal__subtitulo">{ZONAS[mesa.zona]} · hasta {mesa.capacidad} personas</span>
            </div>
          </div>
          <button type="button" className="boton-cerrar" aria-label="Cerrar" onClick={onCerrar}>
            <Icono nombre="cerrar" tam={20} grosor={2.2} />
          </button>
        </header>

        <form className="modal__cuerpo" onSubmit={confirmar} noValidate>
          <div className="modal__izquierda">
            {info ? (
              <Calendario
                diasAbiertos={info.dias_abiertos} diasMaximos={info.dias_maximos_reserva}
                fecha={fecha} onElegir={setFecha}
              />
            ) : <p className="cargando">Cargando calendario…</p>}

            <div className="horas">
              <div className="horas__cabecera">
                <h3 className="paso-titulo">
                  <span className="paso-titulo__numero">2.</span> Elige la hora
                  {fecha && <span className="paso-titulo__extra"> · {fechaCorta(fecha, { conAnio: false }).toLowerCase()}</span>}
                </h3>
                <div className="leyenda" aria-hidden="true">
                  <span><i className="leyenda__libre" />Libre</span>
                  <span><i className="leyenda__ocupado" />Ocupado</span>
                  <span><i className="leyenda__elegido" />Elegido</span>
                </div>
              </div>
              {fecha && !disponibilidad && <p className="cargando">Buscando horarios…</p>}
              {disponibilidad && !disponibilidad.abierto && (
                <p className="horas__vacio">Ese día no atendemos. Elige otra fecha.</p>
              )}
              {disponibilidad?.jornadas.map((j) => (
                <div key={j.jornada} className="horas">
                  <span className="jornada__titulo">{JORNADAS[j.jornada]}</span>
                  <div className="slots">
                    {j.slots.map((s) => (
                      <button
                        key={s.inicio} type="button"
                        className={`slot ${s.estado === 'ocupado' ? 'slot--ocupado' : ''} ${s.estado === 'pasado' ? 'slot--pasado' : ''}`}
                        aria-pressed={slot?.inicio === s.inicio}
                        aria-disabled={s.estado !== 'libre'}
                        disabled={s.estado === 'pasado'}
                        aria-label={`${hora12(s.inicio)}, ${s.estado}`}
                        onClick={() => elegirSlot(s)}
                      >
                        {hora12(s.inicio)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal__derecha">
            <h3 className="paso-titulo"><span className="paso-titulo__numero">3.</span> Tus datos</h3>
            <label className="campo">
              Nombre completo
              <input
                className="entrada" value={nombre}
                onChange={(e) => { setNombre(e.target.value.replace(/[^\p{L}\s'.-]/gu, '')); setErrores({ ...errores, nombre: undefined }); }}
                autoComplete="name" maxLength={80} aria-invalid={Boolean(errores.nombre)}
              />
              {errores.nombre && <span className="texto-error"><Icono nombre="alerta" tam={16} />{errores.nombre}</span>}
            </label>
            <label className="campo">
              <span>Teléfono / WhatsApp <span className="campo__opcional">(opcional)</span></span>
              <input
                className="entrada" type="tel" value={contacto} onChange={(e) => setContacto(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric" autoComplete="tel" maxLength={15} placeholder="300 000 0000"
              />
            </label>
            <div className="campo">
              <label htmlFor="personas">Número de personas</label>
              <div className="contador">
                <button type="button" className="contador__boton" aria-label="Quitar una persona" onClick={() => setPersonas(Math.max(1, personas - 1))}>
                  <Icono nombre="menos" grosor={2.4} />
                </button>
                <input
                  id="personas" className="entrada contador__valor" type="number" min="1" max={mesa.capacidad}
                  value={personas}
                  onChange={(e) => { setPersonas(Number(e.target.value)); setErrores({ ...errores, personas: undefined }); }}
                  aria-invalid={Boolean(errores.personas)}
                />
                <button
                  type="button" className="contador__boton" aria-label="Agregar una persona"
                  disabled={personas >= mesa.capacidad} onClick={() => setPersonas(Math.min(mesa.capacidad, personas + 1))}
                >
                  <Icono nombre="mas" grosor={2.4} />
                </button>
                <span className="contador__nota">Máximo {mesa.capacidad} en esta mesa</span>
              </div>
              {errores.personas && <span className="texto-error"><Icono nombre="alerta" tam={16} />{errores.personas}</span>}
            </div>

            <div className="resumen">
              <span className="resumen__titulo">Resumen</span>
              <dl className="resumen__datos">
                <div><dt>Mesa</dt><dd>{mesa.nombre} · {ZONAS[mesa.zona]}</dd></div>
                <div><dt>Fecha</dt><dd>{fecha ? fechaCorta(fecha) : '—'}</dd></div>
                <div><dt>Hora</dt><dd>{slot ? rangoHoras(slot.inicio, slot.fin) : '—'}</dd></div>
                <div><dt>Personas</dt><dd>{personas}</dd></div>
              </dl>
            </div>

            {aviso && <p className="alerta" role="alert"><Icono nombre="alerta" />{aviso}</p>}

            <div className="modal__confirmar">
              <button type="submit" className="boton boton--bloque" disabled={enviando}>
                {enviando ? 'Confirmando…' : 'Confirmar reserva'} <Icono nombre="check" grosor={2.6} />
              </button>
            </div>
            <p className="modal__nota">Sin pagos ni registro. Cada reserva dura 1 hora.</p>
          </div>
        </form>
      </section>
    </div>
  );
}
