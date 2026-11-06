import { useRuta } from './router.js';
import Inicio from './pages/cliente/Inicio.jsx';
import Carta from './pages/cliente/Carta.jsx';
import Confirmacion from './pages/cliente/Confirmacion.jsx';
import Acceso from './pages/admin/Acceso.jsx';
import PanelAdmin from './pages/admin/PanelAdmin.jsx';
import './styles/cliente.css';
import './styles/admin.css';

// Elige la página según la URL.
export default function App() {
  const ruta = useRuta().replace(/\/+$/, '') || '/';

  if (ruta === '/admin') return <Acceso />;
  if (ruta.startsWith('/admin/')) return <PanelAdmin seccion={ruta.split('/')[2]} />;
  if (ruta === '/carta') return <Carta />;
  if (ruta === '/reserva-confirmada') return <Confirmacion />;
  return <Inicio />;
}
