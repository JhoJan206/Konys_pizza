// Enrutador mínimo basado en la URL del navegador (sin librerías).
import { useEffect, useState } from 'react';

// Cambia de página sin recargar. Si la ruta trae una sección (/#mesas),
// baja hasta ella; si es la misma página, solo hace el desplazamiento.
export function navegar(ruta) {
  const destino = new URL(ruta, window.location.origin);
  const mismaPagina = destino.pathname === window.location.pathname;
  window.history.pushState({}, '', destino.pathname + destino.search + destino.hash);
  if (!mismaPagina) window.dispatchEvent(new PopStateEvent('popstate'));

  if (destino.hash) {
    // En otra página, la sección se busca cuando termina de cargar (ver Inicio.jsx)
    requestAnimationFrame(() => {
      document.getElementById(destino.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    });
  } else {
    window.scrollTo(0, 0);
  }
}

// Devuelve la ruta actual y se actualiza al navegar o usar atrás/adelante
export function useRuta() {
  const [ruta, setRuta] = useState(window.location.pathname);
  useEffect(() => {
    const alCambiar = () => setRuta(window.location.pathname);
    window.addEventListener('popstate', alCambiar);
    return () => window.removeEventListener('popstate', alCambiar);
  }, []);
  return ruta;
}
