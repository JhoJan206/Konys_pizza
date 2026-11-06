# Konys Pizza · Sistema de reservas de mesas

Aplicación web para que los clientes de **Konys Pizza** (Cra. 36 con calle 41, Bucaramanga) reserven mesa en línea viendo la disponibilidad en tiempo real, y para que el administrador gestione mesas, horarios, reservas y la carta.

## Tecnologías

- **Frontend:** HTML, CSS y JavaScript con React (compilado con Vite)
- **Backend:** Node.js con Express 5
- **Base de datos:** PostgreSQL en Supabase (driver `pg`)
- **Autenticación del panel:** bcryptjs + jsonwebtoken
- **Despliegue:** Vercel (frontend y API en el mismo proyecto)

## Estructura

```text
konys-reservas-app/
├── api/index.js          # Entrada de la API en Vercel (función serverless)
├── server/
│   ├── app.js            # App de Express (rutas bajo /api)
│   ├── db.js             # Conexión a PostgreSQL (Supabase)
│   ├── dev.js            # Servidor local de desarrollo
│   ├── middleware/       # Protección de rutas admin (JWT)
│   └── routes/           # Endpoints de la API
├── src/                  # Aplicación React
│   ├── pages/cliente/    # Inicio, reserva, confirmación, carta
│   ├── pages/admin/      # Acceso y panel de administración
│   ├── components/       # Componentes reutilizables
│   ├── services/api.js   # Cliente HTTP hacia /api
│   └── styles/           # Estilos globales y tokens de marca
├── public/img/           # Imágenes y recursos gráficos
├── database/             # Scripts SQL (esquema y datos iniciales)
├── docs/                 # Documentación del proyecto y mockups
├── index.html            # Página base de Vite
├── vite.config.js
└── vercel.json
```

## Cómo ejecutarlo en local

Requisitos: Node.js 20 o superior.

```bash
npm install
cp .env.example .env    # completar DATABASE_URL y JWT_SECRET
npm run dev:api         # API en http://localhost:3001
npm run dev             # Frontend en http://localhost:5173
```

El frontend reenvía las peticiones `/api` al servidor local.

## Enlaces

- Aplicación desplegada: _pendiente_
- Video explicativo: _pendiente_
