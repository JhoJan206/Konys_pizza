// Página de inicio del cliente.
// Fase 1: portada provisional que comprueba la conexión con la API.
// En la fase 3 se reemplaza por el diseño completo (hero, mesas, carta).
import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { navegar } from '../../router.js';
import './Inicio.css';

export default function Inicio() {
  const [salud, setSalud] = useState('comprobando…');

  useEffect(() => {
    api('/salud')
      .then((r) => setSalud(`API ok · base de datos: ${r.baseDeDatos}`))
      .catch(() => setSalud('API sin respuesta'));
  }, []);

  return (
    <main className="inicio garabatos">
      <span className="contorno inicio__fondo" aria-hidden="true">PIZZA</span>
      <h1 className="inicio__titulo">
        <span className="wordmark inicio__wordmark">KONYS</span>
        <span className="inicio__eslogan">· La pizza más icónica de la ciudad ·</span>
      </h1>
      <p className="inicio__estado" role="status">{salud}</p>
      <button type="button" className="boton" onClick={() => navegar('/admin')}>
        Ir al panel admin
      </button>
    </main>
  );
}
