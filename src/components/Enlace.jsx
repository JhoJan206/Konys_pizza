// Enlace interno que cambia de página sin recargar el sitio.
import { navegar } from '../router.js';

export default function Enlace({ href, onClick, children, ...resto }) {
  const alHacerClic = (evento) => {
    onClick?.(evento);
    // Permite abrir en otra pestaña con Ctrl/Cmd + clic
    if (evento.defaultPrevented || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
    evento.preventDefault();
    navegar(href);
  };
  return <a href={href} onClick={alHacerClic} {...resto}>{children}</a>;
}
