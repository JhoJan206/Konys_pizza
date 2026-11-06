-- ==========================================================
-- Konys Pizza · Datos iniciales
-- Mesas y horario reales del negocio; platos de ejemplo cuyo
-- precio queda vacío para que el administrador lo complete.
-- ==========================================================

insert into mesas (nombre, zona, capacidad, activa) values
  ('Mesa 1', 'terraza', 4, true),
  ('Mesa 2', 'terraza', 2, true),
  ('Mesa 3', 'salon',   6, true),
  ('Mesa 4', 'salon',   4, true),
  ('Mesa 5', 'salon',   8, false)
on conflict (nombre) do nothing;

-- Dos jornadas todos los días: almuerzo 12:30–14:30 y noche 17:00–23:00, reservas de 60 min
insert into horarios (dia_semana, jornada, hora_inicio, hora_fin, duracion_slot)
select d.dia, j.jornada, j.inicio, j.fin, 60
from (values ('lunes'), ('martes'), ('miercoles'), ('jueves'), ('viernes'), ('sabado'), ('domingo')) as d (dia)
cross join (values ('almuerzo', time '12:30', time '14:30'), ('noche', time '17:00', time '23:00')) as j (jornada, inicio, fin)
on conflict (dia_semana, jornada) do nothing;

-- Carta de ejemplo (solo si todavía no hay platos)
insert into platos (nombre, categoria, descripcion, precio)
select * from (values
  ('Pizza Konys Especial', 'pizzas',   'Especial de la casa.',                         null::integer),
  ('Margarita',            'pizzas',   'Salsa de tomate, mozzarella y albahaca.',      null),
  ('Pepperoni',            'pizzas',   'Salsa de tomate, mozzarella y pepperoni.',     null),
  ('Hawaiana',             'pizzas',   'Jamón, piña y mozzarella.',                    null),
  ('Pollo y champiñones',  'pizzas',   'Pollo desmechado, champiñones y mozzarella.',  null),
  ('Vegetariana',          'pizzas',   'Pimentón, cebolla, champiñones y aceitunas.',  null),
  ('Pan de ajo',           'entradas', 'Pan horneado con mantequilla de ajo y queso.', null),
  ('Palitos de queso',     'entradas', 'Masa de la casa rellena de queso fundido.',    null),
  ('Ensalada de la casa',  'entradas', 'Lechugas, tomate, queso y vinagreta.',         null),
  ('Brownie con helado',   'postres',  'Brownie tibio con helado de vainilla.',        null),
  ('Tiramisú',             'postres',  'Bizcocho, café y crema de mascarpone.',        null),
  ('Limonada natural',     'bebidas',  'Limón recién exprimido.',                      null),
  ('Gaseosa personal',     'bebidas',  'Varios sabores.',                              null),
  ('Cerveza nacional',     'bebidas',  'Botella 330 ml.',                              null)
) as p (nombre, categoria, descripcion, precio)
where not exists (select 1 from platos);
