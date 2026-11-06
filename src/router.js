// Enrutador mínimo basado en la URL del navegador (sin librerías).
import { useEffect, useState } from 'react';

// Cambia de página sin recargar
export function navegar(ruta) {
  window.history.pushState({}, '', ruta);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
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
