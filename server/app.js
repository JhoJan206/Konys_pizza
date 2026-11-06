// Aplicación Express de Konys Pizza.
// Se usa igual en local (server/dev.js) y en Vercel (api/index.js).
import express from 'express';
import rutas from './routes/index.js';

const app = express();

app.use(express.json());

// Todas las rutas del backend viven bajo /api
app.use('/api', rutas);

// Ruta de la API que no existe
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo central de errores (Express 5 captura también los errores de funciones async)
app.use((err, req, res, next) => {
  console.error(err);
  const estado = err.status || 500;
  res.status(estado).json({ error: estado === 500 ? 'Error interno del servidor' : err.message });
});

export default app;
