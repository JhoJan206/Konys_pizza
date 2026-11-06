// Pantalla de acceso al panel (RF-08): usuario y contraseña -> JWT.
import { useEffect, useState } from 'react';
import { api, sesion } from '../../services/api.js';
import { navegar } from '../../router.js';
import Enlace from '../../components/Enlace.jsx';
import Icono from '../../components/Icono.jsx';
import { Cono } from '../../components/Decoracion.jsx';

export default function Acceso() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Si ya hay una sesión vigente, entra directo al panel
  useEffect(() => {
    if (sesion.obtener()) api('/admin/sesion').then(() => navegar('/admin/reservas')).catch(() => {});
  }, []);

  const ingresar = async (e) => {
    e.preventDefault();
    if (!usuario.trim() || !password) { setError('Escribe tu usuario y tu contraseña.'); return; }
    setEnviando(true);
    setError('');
    try {
      const { token } = await api('/admin/login', { metodo: 'POST', datos: { usuario, password } });
      sesion.guardar(token);
      navegar('/admin/reservas');
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="acceso">
      <div className="acceso__marca zona-azul garabatos">
        <span className="contorno acceso__fondo" aria-hidden="true">ADMIN</span>
        <Cono className="acceso__cono" />
        <Enlace href="/" className="acceso__volver"><Icono nombre="atras" /> Volver al sitio</Enlace>
        <div className="acceso__textos">
          <span className="wordmark acceso__logo">KONYS <small>Admin</small></span>
          <h1 className="acceso__titulo">Mesas, horarios y reservas en un solo lugar.</h1>
          <p className="acceso__parrafo">Panel exclusivo para el personal de Konys Pizza.</p>
        </div>
        <span className="acceso__ruta">/admin</span>
      </div>

      <div className="acceso__lado">
        <form className="acceso__formulario" onSubmit={ingresar} noValidate>
          <span className="icono-cuadro"><Icono nombre="candado" tam={24} /></span>
          <div>
            <h2 className="acceso__formulario-titulo">Panel de administración</h2>
            <p className="acceso__formulario-texto">Ingresa tus datos para continuar.</p>
          </div>
          <label className="campo">
            Usuario
            <input className="entrada" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoCapitalize="none" />
          </label>
          <div className="campo">
            <label htmlFor="clave">Contraseña</label>
            <div className="campo-clave">
              <input
                id="clave" className="entrada" type={verClave ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" aria-invalid={Boolean(error)}
              />
              <button type="button" aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVerClave(!verClave)}>
                <Icono nombre="ojo" tam={20} />
              </button>
            </div>
          </div>
          {error && <p className="alerta" role="alert"><Icono nombre="alerta" />{error}</p>}
          <button type="submit" className="boton boton--bloque" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'} <Icono nombre="flecha" grosor={2.6} />
          </button>
          <p className="acceso__nota"><Icono nombre="info" tam={16} /> Solo personal autorizado.</p>
        </form>
      </div>
    </div>
  );
}
