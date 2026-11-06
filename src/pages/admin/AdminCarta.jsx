// Sección Carta (RF-14): agregar, editar, ocultar y eliminar platos.
import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Icono from '../../components/Icono.jsx';
import Interruptor from '../../components/Interruptor.jsx';
import { TituloSeccion } from '../../components/Decoracion.jsx';
import { CATEGORIAS, precio } from '../../utils/formato.js';

const VACIO = { id: null, nombre: '', categoria: 'pizzas', descripcion: '', precio: '', disponible: true };

export default function AdminCarta() {
  const [platos, setPlatos] = useState(null);
  const [categoria, setCategoria] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [borrando, setBorrando] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => api('/admin/platos').then(setPlatos).catch((e) => setMensaje({ tipo: 'error', texto: e.message }));
  useEffect(() => { cargar(); }, []);

  const avisar = (tipo, texto) => setMensaje({ tipo, texto });

  const cambiarDisponible = async (plato, disponible) => {
    try {
      await api(`/admin/platos/${plato.id}/disponible`, { metodo: 'PATCH', datos: { disponible } });
      setPlatos(platos.map((p) => (p.id === plato.id ? { ...p, disponible } : p)));
      avisar('ok', `${plato.nombre} ${disponible ? 'ya se muestra' : 'quedó oculto'} en la carta.`);
    } catch (e) {
      avisar('error', e.message);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const datos = {
      ...formulario,
      descripcion: formulario.descripcion || null,
      precio: formulario.precio === '' ? null : Number(formulario.precio),
    };
    try {
      if (formulario.id) await api(`/admin/platos/${formulario.id}`, { metodo: 'PUT', datos });
      else await api('/admin/platos', { metodo: 'POST', datos });
      avisar('ok', `${formulario.nombre} guardado.`);
      setFormulario(null);
      cargar();
    } catch (err) {
      avisar('error', err.message);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (plato) => {
    try {
      await api(`/admin/platos/${plato.id}`, { metodo: 'DELETE' });
      avisar('ok', `${plato.nombre} eliminado de la carta.`);
      cargar();
    } catch (e) {
      avisar('error', e.message);
    } finally {
      setBorrando(null);
    }
  };

  const editar = (p) => { setFormulario({ ...p, descripcion: p.descripcion ?? '', precio: p.precio ?? '' }); setMensaje(null); };

  const texto = busqueda.trim().toLowerCase();
  const visibles = (platos ?? []).filter((p) =>
    (categoria === 'todas' || p.categoria === categoria) && (!texto || p.nombre.toLowerCase().includes(texto)));
  const ocultos = platos?.filter((p) => !p.disponible).length ?? 0;
  const contar = (c) => (platos ?? []).filter((p) => c === 'todas' || p.categoria === c).length;

  const Acciones = ({ p }) => (borrando === p.id ? (
    <div className="confirmar-borrado">
      ¿Borrar?
      <button type="button" className="boton-accion boton-accion--peligro-lleno" onClick={() => borrar(p)}>Sí</button>
      <button type="button" className="boton-accion" onClick={() => setBorrando(null)}>No</button>
    </div>
  ) : (
    <div className="acciones">
      <button type="button" className="boton-accion" aria-label={`Editar ${p.nombre}`} onClick={() => editar(p)}><Icono nombre="lapiz" tam={16} /></button>
      <button type="button" className="boton-accion boton-accion--peligro" aria-label={`Borrar ${p.nombre}`} onClick={() => setBorrando(p.id)}><Icono nombre="basura" tam={16} /></button>
    </div>
  ));

  return (
    <>
      <div className="admin__cabecera">
        <div className="titulo-panel">
          <TituloSeccion fondo="CARTA" como="h1">Carta</TituloSeccion>
          <p className="admin__descripcion">
            {platos ? `${platos.length} platos · ${ocultos} ${ocultos === 1 ? 'oculto' : 'ocultos'}.` : ''} Los platos ocultos no aparecen en la carta del cliente.
          </p>
        </div>
        <button type="button" className="boton boton--pequeno" onClick={() => { setFormulario({ ...VACIO }); setMensaje(null); }}>
          <Icono nombre="mas" grosor={2.6} /> Nuevo plato
        </button>
      </div>

      {mensaje && <p className={`alerta ${mensaje.tipo === 'ok' ? 'alerta--ok' : ''}`} role="status"><Icono nombre={mensaje.tipo === 'ok' ? 'check' : 'alerta'} />{mensaje.texto}</p>}

      <div className="barra-herramientas">
        <div className="selector-pastilla" role="group" aria-label="Filtrar por categoría">
          {[['todas', 'Todas'], ...Object.entries(CATEGORIAS)].map(([valor, nombre]) => (
            <button key={valor} type="button" className="selector-pastilla__opcion" aria-pressed={categoria === valor} onClick={() => setCategoria(valor)}>
              {nombre} {platos && <span style={{ opacity: 0.7 }}>{contar(valor)}</span>}
            </button>
          ))}
        </div>
        <label className="buscador">
          <Icono nombre="buscar" />
          <input className="entrada" type="search" placeholder="Buscar plato" aria-label="Buscar plato" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
      </div>

      {!platos && <p className="cargando">Cargando carta…</p>}

      {platos && (
        <div className="panel-doble">
          <div className="panel-doble__principal">
            <div className="tarjeta solo-escritorio">
              <div className="tabla-caja">
                <table className="tabla">
                  <thead><tr><th>Plato</th><th>Categoría</th><th>Precio</th><th>Disponible</th><th className="tabla__derecha">Acciones</th></tr></thead>
                  <tbody>
                    {visibles.length === 0 && <tr><td colSpan="5" className="tabla__vacia">No hay platos que coincidan.</td></tr>}
                    {visibles.map((p) => (
                      <tr key={p.id} className={formulario?.id === p.id ? 'tabla__fila--seleccionada' : ''}>
                        <td>
                          <div className="tabla__fuerte" style={{ color: p.disponible ? 'inherit' : '#5C6873' }}>{p.nombre}</div>
                          {p.descripcion && <div className="tabla__suave" style={{ fontSize: 13 }}>{p.descripcion}</div>}
                        </td>
                        <td>{CATEGORIAS[p.categoria]}</td>
                        <td className="tabla__fuerte" style={{ whiteSpace: 'nowrap' }}>{precio(p.precio)}</td>
                        <td>
                          <span className={`con-interruptor ${p.disponible ? 'con-interruptor--activo' : 'con-interruptor--inactivo'}`}>
                            <Interruptor activo={p.disponible} etiqueta={`${p.nombre} disponible`} onCambio={(v) => cambiarDisponible(p, v)} />
                            {p.disponible ? 'Visible' : 'Oculto'}
                          </span>
                        </td>
                        <td>{Acciones({ p })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lista-tarjetas">
              {visibles.map((p) => (
                <article key={p.id} className="tarjeta tarjeta-item">
                  <div className="tarjeta-item__fila" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <h2 className="tarjeta-item__titulo" style={{ color: p.disponible ? 'inherit' : '#5C6873' }}>{p.nombre}</h2>
                      {p.descripcion && <p className="tabla__suave" style={{ margin: '3px 0 0', fontSize: 13 }}>{p.descripcion}</p>}
                    </div>
                    <span className="tabla__fuerte" style={{ color: 'var(--naranja-oscuro)', whiteSpace: 'nowrap' }}>{precio(p.precio)}</span>
                  </div>
                  <div className="tarjeta-item__fila tarjeta-item__acciones">
                    <span className={`con-interruptor ${p.disponible ? 'con-interruptor--activo' : 'con-interruptor--inactivo'}`}>
                      <Interruptor activo={p.disponible} etiqueta={`${p.nombre} disponible`} onCambio={(v) => cambiarDisponible(p, v)} />
                      {p.disponible ? 'Visible' : 'Oculto'}
                    </span>
                    {Acciones({ p })}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {formulario && (
            <form className="tarjeta formulario-lateral" onSubmit={guardar} aria-labelledby="titulo-form-plato">
              <div className="formulario-lateral__cabeza">
                <h2 id="titulo-form-plato" className="formulario-lateral__titulo">{formulario.id ? 'Editar plato' : 'Nuevo plato'}</h2>
                <button type="button" className="boton-cerrar" aria-label="Cerrar formulario" onClick={() => setFormulario(null)}><Icono nombre="cerrar" /></button>
              </div>
              <label className="campo">
                Nombre
                <input className="entrada" required maxLength={80} value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} />
              </label>
              <label className="campo">
                Categoría
                <select className="entrada" value={formulario.categoria} onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}>
                  {Object.entries(CATEGORIAS).map(([valor, nombre]) => <option key={valor} value={valor}>{nombre}</option>)}
                </select>
              </label>
              <label className="campo">
                <span>Descripción <span className="campo__opcional">(opcional)</span></span>
                <textarea className="entrada" rows="3" maxLength={300} placeholder="Ingredientes principales" value={formulario.descripcion} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} />
              </label>
              <label className="campo">
                <span>Precio (COP) <span className="campo__opcional">(vacío = por definir)</span></span>
                <input className="entrada" type="number" min="0" step="100" placeholder="0" value={formulario.precio} onChange={(e) => setFormulario({ ...formulario, precio: e.target.value })} />
              </label>
              <div className="caja-interruptor">
                <span className="caja-interruptor__texto">Disponible<small>Visible en la carta del cliente</small></span>
                <Interruptor activo={formulario.disponible} etiqueta="Plato disponible" onCambio={(v) => setFormulario({ ...formulario, disponible: v })} />
              </div>
              <div className="formulario-lateral__botones">
                <button type="button" className="boton boton--contorno boton--pequeno" onClick={() => setFormulario(null)}>Cancelar</button>
                <button type="submit" className="boton boton--azul boton--pequeno" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar plato'}</button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
