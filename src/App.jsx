import { useRuta } from './router.js';
import Inicio from './pages/cliente/Inicio.jsx';
import Acceso from './pages/admin/Acceso.jsx';

// Elige la página según la URL: /admin para el panel, el resto para el cliente.
export default function App() {
  const ruta = useRuta();
  if (ruta.startsWith('/admin')) return <Acceso />;
  return <Inicio />;
}
