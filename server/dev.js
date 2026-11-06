// Servidor local para desarrollo: npm run dev:api
import app from './app.js';

const puerto = process.env.PORT || 3001;

app.listen(puerto, () => {
  console.log(`API de Konys escuchando en http://localhost:${puerto}`);
});
