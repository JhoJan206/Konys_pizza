// Carta digital (RF-07): platos disponibles por categoría y, dentro de cada una,
// por grupo (Konys de autor, Granizados…), con su foto, descripción y precio.
import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Encabezado from '../../components/Encabezado.jsx';
import PiePagina from '../../components/PiePagina.jsx';
import Icono from '../../components/Icono.jsx';
import { Cono, Destello, Goteo, TituloSeccion } from '../../components/Decoracion.jsx';
import { CATEGORIAS, pad2, precio } from '../../utils/formato.js';
import { NEGOCIO } from '../../utils/negocio.js';

// Notas oficiales de Konys que acompañan algunas partes de la carta
const NOTAS_CATEGORIA = { pizzas: 'Todas nuestras konys traen papitas al horno.' };
const NOTAS_GRUPO = { 'Menú Almuerzos': 'Disponible solo de 12:00 m. a 2:30 p. m.' };

// Separa la descripción de las líneas de opciones y adicionales, que se muestran aparte
function partir(descripcion) {
  const lineas = (descripcion ?? '').split('\n');
  const esExtra = (l) => l.startsWith('Adicionales:') || l.startsWith('Opciones:');
  return { texto: lineas.filter((l) => !esExtra(l)).join('\n'), extras: lineas.filter(esExtra) };
}

const lineaAdicionales = (p) => p.descripcion?.split('\n').find((l) => l.startsWith('Adicionales:'));

// Agrupa los platos de una categoría por subcategoría, respetando el orden de la carta.
// Si todos los platos de un grupo tienen los mismos adicionales, se muestran una sola vez.
function agrupar(platos) {
  const grupos = [];
  for (const p of platos) {
    const nombre = p.subcategoria || '';
    const grupo = grupos.find((g) => g.nombre === nombre);
    if (grupo) grupo.platos.push(p);
    else grupos.push({ nombre, platos: [p] });
  }
  return grupos.map((g) => {
    const comun = lineaAdicionales(g.platos[0]);
    if (g.platos.length < 2 || !comun || !g.platos.every((p) => lineaAdicionales(p) === comun)) return g;
    return {
      ...g,
      adicionales: comun,
      platos: g.platos.map((p) => ({
        ...p,
        descripcion: p.descripcion.split('\n').filter((l) => l !== comun).join('\n') || null,
      })),
    };
  });
}

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
          <p className="eslogan">· {NEGOCIO.eslogan} ·</p>
          <h1 className="carta__titulo">Nuestro menú</h1>
          <p className="carta__parrafo">{NEGOCIO.esloganLargo}. Precios en pesos colombianos (COP).</p>
          <div className="carta__acciones">
            <a className="boton boton--pequeno" href={NEGOCIO.domicilios} target="_blank" rel="noreferrer">
              Pide a domicilio <Icono nombre="flecha" tam={16} grosor={2.6} />
            </a>
          </div>
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
            {NOTAS_CATEGORIA[c.categoria] && (
              <p className="nota-carta"><Icono nombre="info" tam={16} /> {NOTAS_CATEGORIA[c.categoria]}</p>
            )}

            <div className="lista-platos">
              {agrupar(c.platos).map((g) => (
                <div key={g.nombre} className="grupo-platos">
                  {g.nombre && (
                    <div className="grupo-platos__cabeza">
                      <h3 className="grupo-platos__titulo">{g.nombre}</h3>
                      {NOTAS_GRUPO[g.nombre] && <span className="grupo-platos__nota">{NOTAS_GRUPO[g.nombre]}</span>}
                    </div>
                  )}
                  {g.adicionales && <p className="grupo-platos__adicionales">{g.adicionales}</p>}
                  <div className="grupo-platos__lista">
                    {g.platos.map((p, i) => (
                      <article key={p.id} className="plato">
                        <div className="plato__foto">
                          {p.foto_url
                            ? <img src={p.foto_url} alt={p.nombre} loading="lazy" width="96" height="96" />
                            : <span className="contorno plato__numero" aria-hidden="true">{pad2(i + 1)}</span>}
                        </div>
                        <div className="plato__info">
                          <div className="plato__fila">
                            <h4 className="plato__nombre">{p.nombre}</h4>
                            <span className="plato__puntos" aria-hidden="true" />
                            <span className={`plato__precio ${p.precio === null ? 'plato__precio--pendiente' : ''}`}>{precio(p.precio)}</span>
                          </div>
                          {partir(p.descripcion).texto && <p className="plato__descripcion">{partir(p.descripcion).texto}</p>}
                          {partir(p.descripcion).extras.map((l) => <p key={l} className="plato__extra">{l}</p>)}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <PiePagina />
    </>
  );
}
