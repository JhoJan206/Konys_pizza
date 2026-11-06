// Estructura del panel: menú lateral (escritorio) o barra inferior (móvil)
// y la sección elegida. Comprueba la sesión antes de mostrar nada.
import { useEffect, useState } from 'react';
import { api, sesion } from '../../services/api.js';
import { navegar } from '../../router.js';
import Enlace from '../../components/Enlace.jsx';
import Icono from '../../components/Icono.jsx';
import { Cono, Destello } from '../../components/Decoracion.jsx';
import AdminReservas from './AdminReservas.jsx';
import AdminMesas from './AdminMesas.jsx';
import AdminHorarios from './AdminHorarios.jsx';
import AdminCarta from './AdminCarta.jsx';

const SECCIONES = [
  { clave: 'mesas', texto: 'Mesas', icono: 'mesas', Componente: AdminMesas },
  { clave: 'horarios', texto: 'Horarios', icono: 'reloj', Componente: AdminHorarios },
  { clave: 'reservas', texto: 'Reservas', icono: 'calendario', Componente: AdminReservas },
  { clave: 'carta', texto: 'Carta', icono: 'carta', Componente: AdminCarta },
];

export default function PanelAdmin({ seccion }) {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!sesion.obtener()) { navegar('/admin'); return; }
    api('/admin/sesion').then(() => setListo(true)).catch(() => navegar('/admin'));
  }, []);

  const actual = SECCIONES.find((s) => s.clave === seccion) ?? SECCIONES[2];
  const salir = () => { sesion.cerrar(); navegar('/admin'); };

  if (!listo) return <p className="cargando">Verificando sesión…</p>;

  return (
    <div className="admin">
      <aside className="admin__lateral garabatos">
        <span className="contorno admin__lateral-fondo" aria-hidden="true">KONYS</span>
        <Enlace href="/" className="wordmark admin__marca">KONYS <small>Admin</small></Enlace>
        <nav className="admin__nav" aria-label="Secciones del panel">
          {SECCIONES.map((s) => (
            <Enlace
              key={s.clave} href={`/admin/${s.clave}`}
              className={`admin__enlace ${s.clave === actual.clave ? 'admin__enlace--activo' : ''}`}
              aria-current={s.clave === actual.clave ? 'page' : undefined}
            >
              <Icono nombre={s.icono} tam={20} /> {s.texto}
            </Enlace>
          ))}
        </nav>
        <Cono className="admin__cono" />
        <button type="button" className="admin__salir" onClick={salir}><Icono nombre="salir" tam={20} /> Cerrar sesión</button>
      </aside>

      <header className="admin__barra garabatos">
        <Destello className="admin__barra-destello" />
        <span className="wordmark">KONYS <small>Admin</small></span>
        <button type="button" className="admin__salir" aria-label="Cerrar sesión" onClick={salir}><Icono nombre="salir" tam={20} /></button>
      </header>

      <main className="admin__contenido">
        <actual.Componente />
      </main>

      <nav className="admin__inferior" aria-label="Secciones del panel">
        {SECCIONES.map((s) => (
          <Enlace key={s.clave} href={`/admin/${s.clave}`} aria-current={s.clave === actual.clave ? 'page' : undefined}>
            <Icono nombre={s.icono} tam={22} /> {s.texto}
          </Enlace>
        ))}
      </nav>
    </div>
  );
}
