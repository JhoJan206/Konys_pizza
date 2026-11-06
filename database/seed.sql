-- ==========================================================
-- Konys Pizza · Datos iniciales
-- Mesas y horario real del negocio. La carta real (67 platos con
-- foto) se carga aparte con: npm run db:carta
-- ==========================================================

insert into mesas (nombre, zona, capacidad, activa) values
  ('Mesa 1', 'terraza', 4, true),
  ('Mesa 2', 'terraza', 2, true),
  ('Mesa 3', 'salon',   6, true),
  ('Mesa 4', 'salon',   4, true),
  ('Mesa 5', 'salon',   8, false)
on conflict (nombre) do nothing;

-- Horario real de Konys, con reservas de 60 minutos:
--   Lunes a viernes:   12:00 m. – 2:30 p. m.  y  5:00 – 10:30 p. m.
--   Sábado y domingo:  12:00 m. – 2:30 p. m.  y  5:00 – 11:00 p. m.
insert into horarios (dia_semana, jornada, hora_inicio, hora_fin, duracion_slot)
select d.dia, j.jornada, j.inicio,
       case when j.jornada = 'noche' and d.dia in ('sabado', 'domingo') then time '23:00' else j.fin end,
       60
from (values ('lunes'), ('martes'), ('miercoles'), ('jueves'), ('viernes'), ('sabado'), ('domingo')) as d (dia)
cross join (values ('almuerzo', time '12:00', time '14:30'), ('noche', time '17:00', time '22:30')) as j (jornada, inicio, fin)
on conflict (dia_semana, jornada) do nothing;
