// Interruptor tipo switch (activa/inactiva, visible/oculto)
export default function Interruptor({ activo, onCambio, etiqueta, deshabilitado = false }) {
  return (
    <button
      type="button" role="switch" aria-checked={activo} aria-label={etiqueta}
      className={`interruptor ${activo ? 'interruptor--activo' : ''}`}
      onClick={() => onCambio(!activo)} disabled={deshabilitado}
    >
      <span className="interruptor__perilla" />
    </button>
  );
}
