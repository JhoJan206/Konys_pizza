# Konys Pizza · Sistema de reservas de mesas

Aplicación web para que los clientes de **Konys Pizza** reserven mesa en línea viendo la disponibilidad en tiempo real, y para que el administrador gestione mesas, horarios, reservas y la carta.

## pruebas en selenium

Ejecutar: python pruebas/selenium/pruebas_e2e.py

## Datos del negocio

| | |
| --- | --- |
| Local | Konys Pizza Kono · Carrera 36 #38-41, El Prado, Bucaramanga |
| Horario | Lun a vie: 12:00 m. – 2:30 p. m. y 5:00 – 10:30 p. m. · Sáb y dom: 12:00 m. – 2:30 p. m. y 5:00 – 11:00 p. m. |
| WhatsApp | 322 460 3184 (contacto y detalles personalizados) |
| Domicilios | [soyclubify.com/d/konys](https://soyclubify.com/d/konys) |
| Instagram | @konys_pizza |

La carta (67 platos con foto) y las imágenes del local se tomaron de los canales oficiales de Konys en Clubify el 6 de noviembre de 2026. Están en `database/carta-konys.json` y `public/img/carta/` y, después de cargarlas, se mantienen desde el panel de administración (Carta).

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
npm run db:preparar     # crea las tablas y carga mesas y horarios en Supabase
npm run db:carta        # carga la carta real de Konys (reemplaza los platos actuales)
npm run crear-admin     # crea el usuario del panel (pide la contraseña)
npm run dev             # Web completa (frontend + API) en http://localhost:5173
```

`npm run dev` levanta el frontend y la API de Express en el mismo servidor, conectados a la base de datos de Supabase indicada en `.env`. Los cambios en `src/` y en `server/` se aplican sin reiniciar.

Si solo se necesita la API (por ejemplo para probarla con curl): `npm run dev:api`, en http://localhost:3001.

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

Las rutas `/api/admin/*` (excepto el login) requieren la cookie de sesión `konys_sesion`, que el servidor entrega al iniciar sesión (httpOnly, SameSite=Strict, Secure en producción). `POST /api/admin/logout` la borra.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL de Supabase (Transaction pooler, puerto 6543) |
| `JWT_SECRET` | Clave para firmar los tokens del panel de administración |
| `PORT` | Puerto de la API en desarrollo (por defecto 3001) |

Nunca se suben al repositorio: en local van en `.env` (ignorado por git) y en producción se configuran en Vercel.

## Despliegue en Vercel

1. Importar el repositorio de GitHub en Vercel (el preset Vite y las rutas se leen de `vercel.json`).
2. En *Settings › Environment Variables* agregar `DATABASE_URL` y `JWT_SECRET`.
3. Cada push a `main` despliega automáticamente. El frontend se sirve desde `dist/` y la API corre como función serverless desde `api/index.js`.

## Seguridad

- Contraseñas del panel cifradas con bcryptjs; sesiones con JWT de 8 horas.
- La sesión viaja en una cookie httpOnly: no se guarda nada en localStorage y el JavaScript de la página no puede leer el token.
- Las rutas del panel se verifican en el servidor: escribir la URL de `/admin/...` sin sesión devuelve al inicio de sesión.
- Row Level Security activado en Supabase: la API pública de Supabase no puede leer ni escribir; solo el backend accede a los datos.
- Doble protección contra reservas duplicadas: bloqueo de la mesa dentro de una transacción e índice único en la base de datos.

## Enlaces

- Aplicación desplegada: https://konys.vercel.app
- Panel de administración: https://konys.vercel.app/admin
- Video explicativo: _pendiente_
