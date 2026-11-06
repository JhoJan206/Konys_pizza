// Elementos decorativos de la marca Konys (sello, goteo de queso, cono, destellos).
import { useId } from 'react';

// Borde inferior de las zonas azules: queso derritiéndose
export function Goteo() {
  return (
    <svg className="goteo" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0 H1440 V22 H1344 C1338 22 1338 26 1338 32 V40 A8 8 0 0 1 1322 40 V32 C1322 26 1322 22 1316 22 H1167 C1161 22 1161 26 1161 32 V48 A11 11 0 0 1 1139 48 V32 C1139 26 1139 22 1133 22 H1003 C997 22 997 26 997 32 V36 A7 7 0 0 1 983 36 V32 C983 26 983 22 977 22 H816 C810 22 810 26 810 32 V46 A10 10 0 0 1 790 46 V32 C790 26 790 22 784 22 H634 C628 22 628 26 628 32 V38 A8 8 0 0 1 612 38 V32 C612 26 612 22 606 22 H448 C442 22 442 26 442 32 V50 A12 12 0 0 1 418 50 V32 C418 26 418 22 412 22 H273 C267 22 267 26 267 32 V36 A7 7 0 0 1 253 36 V32 C253 26 253 22 247 22 H116 C110 22 110 26 110 32 V44 A10 10 0 0 1 90 44 V32 C90 26 90 22 84 22 H0 Z" />
    </svg>
  );
}

// Sello circular naranja con texto alrededor
export function Sello({ texto = 'LA PIZZA MÁS ICÓNICA ✦ DE LA CIUDAD ✦', conCheck = false, className = '' }) {
  const id = useId();
  return (
    <svg className={`sello ${className}`} viewBox="0 0 200 200" aria-hidden="true">
      <defs><path id={id} d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" /></defs>
      <circle cx="100" cy="100" r="98" fill="#F28C28" />
      <circle cx="100" cy="100" r="50" fill="none" stroke="#0E3A45" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      <text fill="#0E3A45" fontFamily="Rubik, sans-serif" fontWeight="800" fontSize="15" letterSpacing="2.2">
        <textPath href={`#${id}`}>{texto}</textPath>
      </text>
      {conCheck ? (
        <path d="M72 102 l18 18 l38 -40" fill="none" stroke="#0E3A45" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <text x="100" y="110" textAnchor="middle" fill="#0E3A45" fontFamily="Rubik, sans-serif" fontWeight="900" fontSize="30">KONYS</text>
      )}
    </svg>
  );
}

// Cono de pizza en contorno naranja
export function Cono({ className = '' }) {
  return <img className={`cono ${className}`} src="/img/cono-linea.svg" alt="" aria-hidden="true" />;
}

// Destello ✦ en contorno
export function Destello({ className = '' }) {
  return <span className={`destello ${className}`} aria-hidden="true">✦</span>;
}

// Franja naranja inclinada con texto corrido
export function Franja() {
  const texto = 'Pizza en cono ✦ La más icónica de la ciudad ✦ Bucaramanga ✦ Domicilios y eventos ✦ ';
  return (
    <div className="franja" aria-hidden="true">
      <span>{texto.repeat(3)}</span>
    </div>
  );
}

// Título de sección con una palabra gigante en contorno detrás
export function TituloSeccion({ fondo, antetitulo, children, como: Etiqueta = 'h2' }) {
  return (
    <div className="titulo-seccion">
      <span className="titulo-seccion__fondo" aria-hidden="true">{fondo}</span>
      {antetitulo && <span className="antetitulo">{antetitulo}</span>}
      <Etiqueta className="titulo-seccion__texto">{children}</Etiqueta>
    </div>
  );
}
