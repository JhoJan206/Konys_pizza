// Sección Horarios (RF-11): jornadas por día de la semana y duración de cada reserva.
import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Icono from '../../components/Icono.jsx';
import Interruptor from '../../components/Interruptor.jsx';
import { TituloSeccion } from '../../components/Decoracion.jsx';
import { DIAS, NOMBRES_DIA, generarSlots, hora12 } from '../../utils/formato.js';

const DURACIONES = [30, 60, 90, 120];
const JORNADAS = { almuerzo: 'Almuerzo', noche: 'Noche' };

export default function AdminHorarios() {
  const [original, setOriginal] = useState(null);
  const [horarios, setHorarios] = useState(null);
  const [diaPrevia, setDiaPrevia] = useState('sabado');
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api('/admin/horarios')
      .then((lista) => { setOriginal(lista); setHorarios(lista); })
      .catch((e) => setMensaje({ tipo: 'error', texto: e.message }));
  }, []);

  const pendientes = JSON.stringify(original) !== JSON.stringify(horarios);
  const duracion = horarios?.[0]?.duracion_slot ?? 60;

  const cambiar = (id, cambios) => setHorarios(horarios.map((h) => (h.id === id ? { ...h, ...cambios } : h)));
  const cambiarDuracion = (minutos) => setHorarios(horarios.map((h) => ({ ...h, duracion_slot: minutos })));

  const guardar = async () => {
    setGuardando(true);
    try {
      const lista = await api('/admin/horarios', { metodo: 'PUT', datos: { horarios } });
      setOriginal(lista);
      setHorarios(lista);
      setMensaje({ tipo: 'ok', texto: 'Horarios guardados. Los clientes ya ven los cambios.' });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setGuardando(false);
    }
  };

  const delDia = (dia) => horarios.filter((h) => h.dia_semana === dia);
  const slotsDe = (h) => (h.activo ? generarSlots(h.hora_inicio, h.hora_fin, h.duracion_slot) : []);

  const Jornada = ({ h }) => (
    <div className="jornada-celda">
      <Interruptor activo={h.activo} etiqueta={`${JORNADAS[h.jornada]} del ${h.dia_semana} activo`} onCambio={(v) => cambiar(h.id, { activo: v })} />
      <input
        className="entrada entrada-hora" type="time" value={h.hora_inicio} disabled={!h.activo}
        aria-label={`Inicio ${h.jornada} ${h.dia_semana}`} onChange={(e) => cambiar(h.id, { hora_inicio: e.target.value })}
      />
      <span className="tabla__suave">–</span>
      <input
        className="entrada entrada-hora" type="time" value={h.hora_fin} disabled={!h.activo}
        aria-label={`Fin ${h.jornada} ${h.dia_semana}`} onChange={(e) => cambiar(h.id, { hora_fin: e.target.value })}
      />
    </div>
  );

  return (
    <>
      <div className="admin__cabecera">
        <div className="titulo-panel">
          <TituloSeccion fondo="HORARIOS" como="h1">Horarios</TituloSeccion>
          <p className="admin__descripcion">Define cuándo atiende Konys. Con esto se generan los horarios que ven los clientes.</p>
        </div>
        <div className="acciones" style={{ alignItems: 'center' }}>
          {pendientes && <span className="cambios-pendientes">Cambios sin guardar</span>}
          <button type="button" className="boton boton--azul boton--pequeno" onClick={guardar} disabled={!pendientes || guardando}>
            <Icono nombre="check" grosor={2.6} /> {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {mensaje && <p className={`alerta ${mensaje.tipo === 'ok' ? 'alerta--ok' : ''}`} role="status"><Icono nombre={mensaje.tipo === 'ok' ? 'check' : 'alerta'} />{mensaje.texto}</p>}
      {!horarios && !mensaje && <p className="cargando">Cargando horarios…</p>}

      {horarios && (
        <>
          <div className="tarjeta duracion">
            <div className="duracion__info">
              <span className="icono-cuadro"><Icono nombre="reloj" tam={22} /></span>
              <div>
                <h2 className="duracion__titulo">Duración de cada reserva</h2>
                <p className="duracion__texto">Cada mesa queda ocupada este tiempo por reserva.</p>
              </div>
            </div>
            <div className="segmentado" style={{ '--opciones': DURACIONES.length }} role="group" aria-label="Duración de la reserva">
              {DURACIONES.map((m) => (
                <button key={m} type="button" aria-pressed={duracion === m} onClick={() => cambiarDuracion(m)}>{m} min</button>
              ))}
            </div>
          </div>

          <div className="tarjeta solo-escritorio">
            <div className="tabla-caja">
              <table className="tabla">
                <thead><tr><th>Día</th><th>Almuerzo</th><th>Noche</th><th className="tabla__derecha">Horarios generados</th></tr></thead>
                <tbody>
                  {DIAS.map((dia, i) => {
                    const filas = delDia(dia);
                    const total = filas.reduce((n, h) => n + slotsDe(h).length, 0);
                    return (
                      <tr key={dia} className={diaPrevia === dia ? 'tabla__fila--seleccionada' : ''} onClick={() => setDiaPrevia(dia)}>
                        <th scope="row" style={{ background: 'none', textTransform: 'none', letterSpacing: 0, fontSize: 15, color: 'inherit' }}>{NOMBRES_DIA[i]}</th>
                        {['almuerzo', 'noche'].map((j) => {
                          const h = filas.find((x) => x.jornada === j);
                          return <td key={j}>{h ? Jornada({ h }) : '—'}</td>;
                        })}
                        <td className="tabla__derecha">
                          <span className={`insignia ${total ? 'insignia--confirmada' : 'insignia--cancelada'}`}>{total ? `${total} horarios` : 'Cerrado'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lista-tarjetas">
            {DIAS.map((dia, i) => (
              <article key={dia} className="tarjeta tarjeta-item">
                <h2 className="tarjeta-item__titulo">{NOMBRES_DIA[i]}</h2>
                {delDia(dia).map((h) => (
                  <div key={h.id} className="tarjeta-item__fila" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                    <span style={{ width: 70, fontWeight: 600, fontSize: 14 }}>{JORNADAS[h.jornada]}</span>
                    {Jornada({ h })}
                  </div>
                ))}
              </article>
            ))}
          </div>

          <div className="tarjeta vista-previa">
            <h2 className="duracion__titulo">Vista previa · así lo verá el cliente el {NOMBRES_DIA[DIAS.indexOf(diaPrevia)].toLowerCase()}</h2>
            {delDia(diaPrevia).map((h) => (
              <div key={h.id} className="vista-previa__fila">
                <span className="vista-previa__jornada">{JORNADAS[h.jornada]}</span>
                {slotsDe(h).length === 0 && <span className="tabla__suave">Sin reservas</span>}
                {slotsDe(h).map((s) => <span key={s} className="vista-previa__slot">{hora12(s)}</span>)}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
