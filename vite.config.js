import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, la API de Express corre dentro del mismo servidor de Vite:
// con solo `npm run dev` funcionan el frontend y /api en http://localhost:5173.
// En producción (Vercel) la API sigue saliendo de api/index.js.
function apiExpress() {
  return {
    name: 'api-express',
    apply: 'serve',
    configureServer(servidor) {
      console.log(
        process.env.DATABASE_URL
          ? '  ✔ API de Konys activa en /api (base de datos: Supabase)'
          : '  ✘ Falta DATABASE_URL en el archivo .env: la API no podrá conectarse a la base de datos'
      );

      servidor.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api')) return next();
        try {
          // Se recarga solo cuando cambia algún archivo de server/
          const { default: app } = await servidor.ssrLoadModule('/server/app.js');
          app(req, res, next);
        } catch (error) {
          console.error('No se pudo cargar la API:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'La API no pudo iniciar. Revisa la consola.' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Pasa todas las variables del .env (no solo las VITE_*) al backend
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [react(), apiExpress()],
  };
});
