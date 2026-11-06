// Sección Reservas (RF-12): filtros por fecha, mesa y estado, resumen y cambio de estado.
import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Icono from '../../components/Icono.jsx';
import { TituloSeccion } from '../../components/Decoracion.jsx';
import { fechaCorta, fechaNumerica, hoy, hora12 } from '../../utils/formato.js';

const ESTADOS = { confirmada: 'Confirmada', cancelada: 'Cancelada', completada: 'Completada' };
const POR_PAGINA = 10;

export default function AdminReservas() {
  const [mesas, setMesas] = useState([]);
  const [filtros, setFiltros] = useState({ fecha: hoy(), mesa_id: '', estado: '' });
  const [aplicados, setAplicados] = useState(filtros);
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/admin/mesas').then(setMesas).catch(() => {}); }, []);

  const cargar = () => {
    const parametros = new URLSearchParams({ pagina, por_pagina: POR_PAGINA });
    Object.entries(aplicados).forEach(([clave, valor]) => valor && parametros.set(clave, valor));
    setError('');
    api(`/admin/reservas?${parametros}`).then(setDatos).catch((e) => setError(e.message));
  };

  useEffect(cargar, [aplicados, pagina]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrar = (e) => { e.preventDefault(); setPagina(1); setAplicados(filtros); };
  const limpiar = () => { const vacios = { fecha: '', mesa_id: '', estado: '' }; setFiltros(vacios); setPagina(1); setAplicados(vacios); };

  const cambiarEstado = async (id, estado) => {
    try {
      await api(`/admin/reservas/${id}/estado`, { metodo: 'PATCH', datos: { estado } });
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / POR_PAGINA)) : 1;
  const resumen = datos?.resumen;

  const SelectorEstado = ({ r }) => (
    <select
      className={`selector-estado selector-estado--${r.estado}`} value={r.estado}
      aria-label={`Estado de la reserva de ${r.cliente_nombre}`}
      onChange={(e) => cambiarEstado(r.id, e.target.value)}
    >
      {Object.entries(ESTADOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
    </select>
  );

  return (
    <>
      <div className="admin__cabecera">
        <div className="titulo-panel">
          <TituloSeccion fondo="RESERVAS" como="h1">Reservas</TituloSeccion>
          <p className="admin__descripcion">Consulta y filtra las reservas hechas desde la web.</p>
        </div>
      </div>

      {resumen && (
        <div className="estadisticas">
          <div className="tarjeta estadistica">
            <span className="estadistica__etiqueta">{aplicados.fecha ? `Reservas ${fechaCorta(aplicados.fecha, { conAnio: false }).toLowerCase()}` : 'Reservas en total'}</span>
            <span className="estadistica__valor">{resumen.total}</span>
          </div>
          <div className="tarjeta estadistica">
            <span className="estadistica__etiqueta">Confirmadas</span>
            <span className="estadistica__valor estadistica__valor--libre">{resumen.confirmadas}</span>
          </div>
          <div className="tarjeta estadistica">
            <span className="estadistica__etiqueta">Canceladas</span>
            <span className="estadistica__valor estadistica__valor--error">{resumen.canceladas}</span>
          </div>
          <div className="tarjeta estadistica">
            <span className="estadistica__etiqueta">Personas esperadas</span>
            <span className="estadistica__valor">{resumen.personas_esperadas}</span>
          </div>
        </div>
      )}

      <form className="tarjeta filtros" onSubmit={filtrar}>
        <label className="campo">
          Fecha
          <input className="entrada" type="date" value={filtros.fecha} onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })} />
        </label>
        <label className="campo">
          Mesa
          <select className="entrada" value={filtros.mesa_id} onChange={(e) => setFiltros({ ...filtros, mesa_id: e.target.value })}>
            <option value="">Todas las mesas</option>
            {mesas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </label>
        <label className="campo">
          Estado
          <select className="entrada" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
        </label>
        <button type="submit" className="boton boton--azul boton--pequeno"><Icono nombre="buscar" tam={16} /> Filtrar</button>
        <button type="button" className="boton-texto" onClick={limpiar}>Ver todas</button>
      </form>

      {error && <p className="alerta" role="alert"><Icono nombre="alerta" />{error}</p>}
      {!datos && !error && <p className="cargando">Cargando reservas…</p>}

      {datos && (
        <>
          <div className="tarjeta solo-escritorio">
            <div className="tabla-caja">
              <table className="tabla">
                <thead>
                  <tr><th>Cliente</th><th>Mesa</th><th>Fecha</th><th>Hora</th><th>Pers.</th><th>Contacto</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {datos.reservas.length === 0 && (
                    <tr><td colSpan="7" className="tabla__vacia">No hay reservas con estos filtros.</td></tr>
                  )}
                  {datos.reservas.map((r) => (
                    <tr key={r.id}>
                      <td className="tabla__fuerte">{r.cliente_nombre}</td>
                      <td>{r.mesa_nombre}</td>
                      <td>{fechaNumerica(r.fecha)}</td>
                      <td>{hora12(r.hora_inicio)}</td>
                      <td>{r.num_personas}</td>
                      <td className="tabla__suave">{r.cliente_contacto || '—'}</td>
                      <td>{SelectorEstado({ r })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PieTabla datos={datos} pagina={pagina} totalPaginas={totalPaginas} setPagina={setPagina} />
          </div>

          <div className="lista-tarjetas">
            {datos.reservas.length === 0 && <p className="tarjeta tabla__vacia">No hay reservas con estos filtros.</p>}
            {datos.reservas.map((r) => (
              <article key={r.id} className="tarjeta tarjeta-item">
                <div className="tarjeta-item__fila">
                  <h2 className="tarjeta-item__titulo">{r.cliente_nombre}</h2>
                  <span className={`insignia insignia--${r.estado}`}>{ESTADOS[r.estado]}</span>
                </div>
                <div className="tarjeta-item__datos">
                  <span><Icono nombre="mesas" tam={15} />{r.mesa_nombre}</span>
                  <span><Icono nombre="calendario" tam={15} />{fechaNumerica(r.fecha)}</span>
                  <span><Icono nombre="reloj" tam={15} />{hora12(r.hora_inicio)}</span>
                  <span><Icono nombre="personas" tam={15} />{r.num_personas} pers.</span>
                </div>
                <div className="tarjeta-item__fila tarjeta-item__acciones">
                  <span className="tabla__suave">{r.cliente_contacto || 'Sin contacto'}</span>
                  {SelectorEstado({ r })}
                </div>
              </article>
            ))}
            {datos.total > POR_PAGINA && <PieTabla datos={datos} pagina={pagina} totalPaginas={totalPaginas} setPagina={setPagina} />}
          </div>
        </>
      )}
    </>
  );
}

function PieTabla({ datos, pagina, totalPaginas, setPagina }) {
  const desde = datos.total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(pagina * POR_PAGINA, datos.total);
  return (
    <div className="pie-tabla">
      <span>Mostrando {desde}–{hasta} de {datos.total} reservas</span>
      {totalPaginas > 1 && (
        <nav className="paginacion" aria-label="Paginación">
          <button type="button" aria-label="Página anterior" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}><Icono nombre="izquierda" tam={16} /></button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).slice(Math.max(0, pagina - 3), pagina + 2).map((n) => (
            <button key={n} type="button" aria-current={n === pagina ? 'page' : undefined} onClick={() => setPagina(n)}>{n}</button>
          ))}
          <button type="button" aria-label="Página siguiente" disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}><Icono nombre="derecha" tam={16} /></button>
        </nav>
      )}
    </div>
  );
}
