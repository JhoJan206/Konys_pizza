// Carta digital (RF-07): platos disponibles agrupados por categoría.
import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Encabezado from '../../components/Encabezado.jsx';
import PiePagina from '../../components/PiePagina.jsx';
import Icono from '../../components/Icono.jsx';
import { Cono, Destello, Goteo, TituloSeccion } from '../../components/Decoracion.jsx';
import { CATEGORIAS, pad2, precio } from '../../utils/formato.js';

export default function Carta() {
  const [categorias, setCategorias] = useState(null);
  const [error, setError] = useState('');
  const [activa, setActiva] = useState('pizzas');

  useEffect(() => {
    api('/platos')
      .then((datos) => setCategorias(datos.filter((c) => c.platos.length > 0)))
      .catch(() => setError('No pudimos cargar la carta. Intenta de nuevo en un momento.'));
  }, []);

  return (
    <>
      <div className="zona-azul garabatos">
        <span className="contorno carta__fondo" aria-hidden="true">MENÚ</span>
        <Cono className="carta__cono" />
        <Destello className="carta__destello-1" />
        <Destello className="carta__destello-2" />
        <Encabezado activo="carta" />
        <div className="contenedor carta__cabeza">
          <p className="eslogan">· La pizza más icónica de la ciudad ·</p>
          <h1 className="carta__titulo">Nuestro menú</h1>
          <p className="carta__parrafo">Precios en pesos colombianos (COP). Domicilios por WhatsApp.</p>
        </div>
      </div>
      <Goteo />

      {categorias && categorias.length > 0 && (
        <nav className="categorias" aria-label="Categorías">
          <div className="contenedor categorias__lista">
            {categorias.map((c) => (
              <a
                key={c.categoria} href={`#${c.categoria}`} onClick={() => setActiva(c.categoria)}
                className={`categoria-pastilla ${activa === c.categoria ? 'categoria-pastilla--activa' : ''}`}
                aria-current={activa === c.categoria ? 'true' : undefined}
              >
                {CATEGORIAS[c.categoria]}
              </a>
            ))}
          </div>
        </nav>
      )}

      <main className="contenedor carta__secciones">
        {error && <p className="alerta" role="alert"><Icono nombre="alerta" />{error}</p>}
        {!categorias && !error && <p className="cargando">Cargando la carta…</p>}
        {categorias?.length === 0 && <p className="mesas__vacio">La carta se está actualizando. Vuelve pronto.</p>}

        {categorias?.map((c) => (
          <section key={c.categoria} id={c.categoria} className="seccion-carta" aria-labelledby={`titulo-${c.categoria}`}>
            <div className="seccion-carta__cabeza">
              <TituloSeccion fondo={CATEGORIAS[c.categoria].toUpperCase()}>
                <span id={`titulo-${c.categoria}`}>{CATEGORIAS[c.categoria]}</span>
              </TituloSeccion>
              <span className="antetitulo">{c.platos.length} platos</span>
            </div>
            <div className="lista-platos">
              {c.platos.map((p, i) => (
                <article key={p.id} className="plato">
                  <span className="contorno plato__numero" aria-hidden="true">{pad2(i + 1)}</span>
                  <div className="plato__info">
                    <div className="plato__fila">
                      <h3 className="plato__nombre">{p.nombre}</h3>
                      <span className="plato__puntos" aria-hidden="true" />
                      <span className={`plato__precio ${p.precio === null ? 'plato__precio--pendiente' : ''}`}>{precio(p.precio)}</span>
                    </div>
                    {p.descripcion && <p className="plato__descripcion">{p.descripcion}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>

      <PiePagina />
    </>
  );
}
