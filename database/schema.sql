-- ==========================================================
-- Konys Pizza · Esquema de la base de datos (PostgreSQL / Supabase)
-- Se puede ejecutar varias veces sin romper nada (IF NOT EXISTS).
-- ==========================================================

-- Mesas del restaurante
create table if not exists mesas (
  id          bigint generated always as identity primary key,
  nombre      text        not null unique,
  zona        text        not null check (zona in ('terraza', 'salon')),
  capacidad   integer     not null check (capacidad between 1 and 30),
  activa      boolean     not null default true,
  foto_url    text,
  creado_en   timestamptz not null default now()
);

-- Horario de atención: una fila por día y jornada
create table if not exists horarios (
  id             bigint generated always as identity primary key,
  dia_semana     text    not null check (dia_semana in ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')),
  jornada        text    not null check (jornada in ('almuerzo', 'noche')),
  hora_inicio    time    not null,
  hora_fin       time    not null,
  duracion_slot  integer not null default 60 check (duracion_slot between 15 and 240),
  activo         boolean not null default true,
  unique (dia_semana, jornada),
  check (hora_fin > hora_inicio)
);

-- Reservas de los clientes
create table if not exists reservas (
  id                bigint generated always as identity primary key,
  mesa_id           bigint      not null references mesas (id) on delete restrict,
  cliente_nombre    text        not null check (char_length(trim(cliente_nombre)) between 2 and 80),
  cliente_contacto  text,
  num_personas      integer     not null check (num_personas >= 1),
  fecha             date        not null,
  hora_inicio       time        not null,
  hora_fin          time        not null,
  estado            text        not null default 'confirmada' check (estado in ('confirmada', 'cancelada', 'completada')),
  creado_en         timestamptz not null default now(),
  check (hora_fin > hora_inicio)
);

-- Protección contra doble reserva: una sola reserva confirmada por mesa, fecha y hora
create unique index if not exists reservas_slot_unico
  on reservas (mesa_id, fecha, hora_inicio)
  where estado = 'confirmada';

create index if not exists reservas_fecha_idx on reservas (fecha);

-- Platos de la carta digital
create table if not exists platos (
  id           bigint generated always as identity primary key,
  nombre       text        not null,
  categoria    text        not null check (categoria in ('pizzas', 'entradas', 'postres', 'bebidas')),
  descripcion  text,
  precio       integer     check (precio >= 0),   -- en pesos colombianos (COP); vacío = por definir
  disponible   boolean     not null default true,
  creado_en    timestamptz not null default now()
);

-- Detalles de la carta real de Konys: grupo dentro de la categoría
-- (ej. "Konys de autor", "Granizados"), foto del plato y orden en la carta
alter table platos add column if not exists subcategoria text;
alter table platos add column if not exists foto_url     text;
alter table platos add column if not exists orden        integer not null default 0;

-- Usuarios del panel de administración (contraseña cifrada con bcrypt)
create table if not exists administradores (
  id             bigint generated always as identity primary key,
  usuario        text        not null unique,
  password_hash  text        not null,
  creado_en      timestamptz not null default now()
);

-- Seguridad: se activa RLS sin políticas, así la API pública de Supabase
-- (clave anon) no puede leer ni escribir. Solo el backend de Express,
-- que se conecta directo a PostgreSQL, accede a los datos.
alter table mesas           enable row level security;
alter table horarios        enable row level security;
alter table reservas        enable row level security;
alter table platos          enable row level security;
alter table administradores enable row level security;
