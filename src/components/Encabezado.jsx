// Cabecera del sitio del cliente (va dentro de una zona azul con garabatos).
import { useState } from 'react';
import Enlace from './Enlace.jsx';
import Icono from './Icono.jsx';

const ENLACES = [
  { href: '/', texto: 'Inicio', clave: 'inicio' },
  { href: '/#mesas', texto: 'Mesas', clave: 'mesas' },
  { href: '/carta', texto: 'Carta', clave: 'carta' },
  { href: '/#contacto', texto: 'Contacto', clave: 'contacto' },
];

export default function Encabezado({ activo = 'inicio' }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <header className="encabezado contenedor">
      <Enlace href="/" className="wordmark encabezado__logo" aria-label="Konys Pizza, inicio">KONYS</Enlace>
      <button
        type="button" className="encabezado__menu-boton" aria-expanded={abierto}
        aria-controls="menu-principal" aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setAbierto(!abierto)}
      >
        <Icono nombre={abierto ? 'cerrar' : 'menu'} tam={22} />
      </button>
      <nav id="menu-principal" aria-label="Principal" className={`encabezado__nav ${abierto ? 'encabezado__nav--abierto' : ''}`}>
        {ENLACES.map((e) => (
          <Enlace
            key={e.clave} href={e.href} onClick={() => setAbierto(false)}
            className={`encabezado__enlace ${activo === e.clave ? 'encabezado__enlace--activo' : ''}`}
            aria-current={activo === e.clave ? 'page' : undefined}
          >
            {e.texto}
          </Enlace>
        ))}
        <Enlace href="/#mesas" onClick={() => setAbierto(false)} className="boton boton--pequeno">Reservar</Enlace>
        <Enlace href="/admin" className="encabezado__admin">
          <Icono nombre="candado" tam={15} /> Admin
        </Enlace>
      </nav>
    </header>
  );
}
