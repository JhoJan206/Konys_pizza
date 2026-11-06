// Sección Mesas (RF-09, RF-10, RF-13): listado, alta, edición, borrado y activa/inactiva.
import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Icono from '../../components/Icono.jsx';
import Interruptor from '../../components/Interruptor.jsx';
import { TituloSeccion } from '../../components/Decoracion.jsx';
import { ZONAS } from '../../utils/formato.js';

const VACIA = { id: null, nombre: '', zona: 'terraza', capacidad: 4, activa: true, foto_url: '' };

export default function AdminMesas() {
  const [mesas, setMesas] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [borrando, setBorrando] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => api('/admin/mesas').then(setMesas).catch((e) => setMensaje({ tipo: 'error', texto: e.message }));
  useEffect(() => { cargar(); }, []);

  const avisar = (tipo, texto) => setMensaje({ tipo, texto });

  const cambiarEstado = async (mesa, activa) => {
    try {
      await api(`/admin/mesas/${mesa.id}/estado`, { metodo: 'PATCH', datos: { activa } });
      setMesas(mesas.map((m) => (m.id === mesa.id ? { ...m, activa } : m)));
      avisar('ok', `${mesa.nombre} ahora está ${activa ? 'activa' : 'inactiva'}.`);
    } catch (e) {
      avisar('error', e.message);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const datos = { ...formulario, capacidad: Number(formulario.capacidad), foto_url: formulario.foto_url || null };
    try {
      if (formulario.id) await api(`/admin/mesas/${formulario.id}`, { metodo: 'PUT', datos });
      else await api('/admin/mesas', { metodo: 'POST', datos });
      avisar('ok', `${formulario.nombre} guardada.`);
      setFormulario(null);
      cargar();
    } catch (err) {
      avisar('error', err.message);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (mesa) => {
    try {
      await api(`/admin/mesas/${mesa.id}`, { metodo: 'DELETE' });
      avisar('ok', `${mesa.nombre} eliminada.`);
      cargar();
    } catch (e) {
      avisar('error', e.message);
    } finally {
      setBorrando(null);
    }
  };

  const activas = mesas?.filter((m) => m.activa).length ?? 0;

  const Acciones = ({ m }) => (borrando === m.id ? (
    <div className="confirmar-borrado">
      ¿Borrar?
      <button type="button" className="boton-accion boton-accion--peligro-lleno" onClick={() => borrar(m)}>Sí, borrar</button>
      <button type="button" className="boton-accion" onClick={() => setBorrando(null)}>No</button>
    </div>
  ) : (
    <div className="acciones">
      <button type="button" className="boton-accion" onClick={() => { setFormulario({ ...m, foto_url: m.foto_url ?? '' }); setMensaje(null); }}>
        <Icono nombre="lapiz" tam={15} /> Editar
      </button>
      <button type="button" className="boton-accion boton-accion--peligro" onClick={() => setBorrando(m.id)}>
        <Icono nombre="basura" tam={15} /> Borrar
      </button>
    </div>
  ));

  return (
    <>
      <div className="admin__cabecera">
        <div className="titulo-panel">
          <TituloSeccion fondo="MESAS" como="h1">Mesas</TituloSeccion>
          <p className="admin__descripcion">
            {mesas ? `${mesas.length} mesas registradas · ${activas} activas.` : ''} Las inactivas no aparecen para los clientes.
          </p>
        </div>
        <button type="button" className="boton boton--pequeno" onClick={() => { setFormulario({ ...VACIA }); setMensaje(null); }}>
          <Icono nombre="mas" grosor={2.6} /> Nueva mesa
        </button>
      </div>

      {mensaje && <p className={`alerta ${mensaje.tipo === 'ok' ? 'alerta--ok' : ''}`} role="status"><Icono nombre={mensaje.tipo === 'ok' ? 'check' : 'alerta'} />{mensaje.texto}</p>}
      {!mesas && <p className="cargando">Cargando mesas…</p>}

      {mesas && (
        <div className="panel-doble">
          <div className="panel-doble__principal">
            <div className="tarjeta solo-escritorio">
              <div className="tabla-caja">
                <table className="tabla">
                  <thead><tr><th>Mesa</th><th>Zona</th><th>Capacidad</th><th>Estado</th><th className="tabla__derecha">Acciones</th></tr></thead>
                  <tbody>
                    {mesas.length === 0 && <tr><td colSpan="5" className="tabla__vacia">Aún no hay mesas. Crea la primera.</td></tr>}
                    {mesas.map((m) => (
                      <tr key={m.id} className={formulario?.id === m.id ? 'tabla__fila--seleccionada' : ''}>
                        <td>
                          <span className="con-interruptor tabla__fuerte" style={{ color: 'inherit' }}>
                            <span className={`mesa-miniatura mesa-miniatura--${m.zona}`} aria-hidden="true">{m.nombre.replace(/\D/g, '') || '#'}</span>
                            {m.nombre}
                          </span>
                        </td>
                        <td>{ZONAS[m.zona]}</td>
                        <td>{m.capacidad} personas</td>
                        <td>
                          <span className={`con-interruptor ${m.activa ? 'con-interruptor--activo' : 'con-interruptor--inactivo'}`}>
                            <Interruptor activo={m.activa} etiqueta={`${m.nombre} activa`} onCambio={(v) => cambiarEstado(m, v)} />
                            {m.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td>{Acciones({ m })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lista-tarjetas">
              {mesas.map((m) => (
                <article key={m.id} className="tarjeta tarjeta-item">
                  <div className="tarjeta-item__fila">
                    <span className="con-interruptor" style={{ color: 'inherit' }}>
                      <span className={`mesa-miniatura mesa-miniatura--${m.zona}`} aria-hidden="true">{m.nombre.replace(/\D/g, '') || '#'}</span>
                      <span>
                        <h2 className="tarjeta-item__titulo">{m.nombre}</h2>
                        <span className="tabla__suave">{ZONAS[m.zona]} · {m.capacidad} personas</span>
                      </span>
                    </span>
                    <Interruptor activo={m.activa} etiqueta={`${m.nombre} activa`} onCambio={(v) => cambiarEstado(m, v)} />
                  </div>
                  <div className="tarjeta-item__fila tarjeta-item__acciones">
                    <span className={`con-interruptor ${m.activa ? 'con-interruptor--activo' : 'con-interruptor--inactivo'}`}>
                      {m.activa ? 'Activa · visible para clientes' : 'Inactiva · oculta'}
                    </span>
                    {Acciones({ m })}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {formulario && (
            <form className="tarjeta formulario-lateral" onSubmit={guardar} aria-labelledby="titulo-form-mesa">
              <div className="formulario-lateral__cabeza">
                <h2 id="titulo-form-mesa" className="formulario-lateral__titulo">{formulario.id ? 'Editar mesa' : 'Nueva mesa'}</h2>
                <button type="button" className="boton-cerrar" aria-label="Cerrar formulario" onClick={() => setFormulario(null)}><Icono nombre="cerrar" /></button>
              </div>
              <label className="campo">
                Nombre o número
                <input className="entrada" required maxLength={40} value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} />
              </label>
              <fieldset className="campo" style={{ border: 'none', margin: 0, padding: 0 }}>
                <legend style={{ marginBottom: 7 }}>Zona</legend>
                <div className="segmentado">
                  {Object.entries(ZONAS).map(([valor, texto]) => (
                    <button key={valor} type="button" aria-pressed={formulario.zona === valor} onClick={() => setFormulario({ ...formulario, zona: valor })}>{texto}</button>
                  ))}
                </div>
              </fieldset>
              <label className="campo">
                Capacidad (personas)
                <input className="entrada" type="number" min="1" max="30" required value={formulario.capacidad} onChange={(e) => setFormulario({ ...formulario, capacidad: e.target.value })} />
              </label>
              <label className="campo">
                <span>Enlace de la foto <span className="campo__opcional">(opcional)</span></span>
                <input className="entrada" type="url" placeholder="https://…" value={formulario.foto_url} onChange={(e) => setFormulario({ ...formulario, foto_url: e.target.value })} />
              </label>
              <div className="caja-interruptor">
                <span className="caja-interruptor__texto">Activa para reservas<small>Los clientes podrán reservarla</small></span>
                <Interruptor activo={formulario.activa} etiqueta="Mesa activa" onCambio={(v) => setFormulario({ ...formulario, activa: v })} />
              </div>
              <div className="formulario-lateral__botones">
                <button type="button" className="boton boton--contorno boton--pequeno" onClick={() => setFormulario(null)}>Cancelar</button>
                <button type="submit" className="boton boton--azul boton--pequeno" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar mesa'}</button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
