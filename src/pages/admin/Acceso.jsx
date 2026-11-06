// Pantalla de acceso al panel de administración (/admin).
// Fase 1: solo la estructura. El login real con JWT llega en la fase 3.
import { navegar } from '../../router.js';

export default function Acceso() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ textAlign: 'center', display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>
          <span className="wordmark" style={{ fontSize: 48 }}>KONYS</span> Admin
        </h1>
        <p style={{ margin: 0, color: 'var(--texto-suave)' }}>Panel de administración · próximamente</p>
        <button type="button" className="boton" onClick={() => navegar('/')}>Volver al sitio</button>
      </div>
    </main>
  );
}
