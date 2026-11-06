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
npm run db:preparar     # crea las tablas y carga los datos iniciales en Supabase
npm run crear-admin     # crea el usuario del panel (pide la contraseña)
npm run dev:api         # API en http://localhost:3001
npm run dev             # Frontend en http://localhost:5173
```

El frontend reenvía las peticiones `/api` al servidor local.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/salud` | Estado de la API y de la base de datos |
| GET | `/api/mesas` | Mesas activas con su estado actual |
| GET | `/api/horarios` | Días y jornadas de atención |
| GET | `/api/mesas/:id/disponibilidad?fecha=AAAA-MM-DD` | Bloques libres, ocupados y pasados |
| POST | `/api/reservas` | Crea una reserva (evita la doble reserva) |
| GET | `/api/platos` | Carta por categorías |
| POST | `/api/admin/login` | Inicio de sesión del administrador (JWT) |
| GET/POST/PUT/PATCH/DELETE | `/api/admin/mesas` | Gestión de mesas |
| GET/PUT | `/api/admin/horarios` | Gestión de horarios |
| GET/PATCH | `/api/admin/reservas` | Consulta con filtros y cambio de estado |
| GET/POST/PUT/PATCH/DELETE | `/api/admin/platos` | Gestión de la carta |

Las rutas `/api/admin/*` (excepto el login) requieren el encabezado `Authorization: Bearer <token>`.

## Enlaces

- Aplicación desplegada: _pendiente_
- Video explicativo: _pendiente_
