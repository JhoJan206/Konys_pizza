// Íconos de línea en SVG (sin librerías). Uso: <Icono nombre="reloj" />
const TRAZOS = {
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  reloj: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  personas: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  calendario: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  flecha: <path d="M5 12h14M12 5l7 7-7 7" />,
  atras: <path d="M19 12H5M12 19l-7-7 7-7" />,
  cerrar: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="M20 6 9 17l-5-5" />,
  candado: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  ojo: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  mesas: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  carta: <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />,
  salir: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  mas: <path d="M12 5v14M5 12h14" />,
  menos: <path d="M5 12h14" />,
  lapiz: <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" />,
  basura: <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  izquierda: <path d="m15 18-6-6 6-6" />,
  derecha: <path d="m9 18 6-6-6-6" />,
  buscar: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  whatsapp: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 20l1.1-4.6A8.4 8.4 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />,
  instagram: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
  alerta: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>,
};

export default function Icono({ nombre, tam = 18, grosor = 2, ...resto }) {
  return (
    <svg
      width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...resto}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
