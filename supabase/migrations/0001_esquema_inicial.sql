-- =====================================================================
-- CRM para asesor de seguros — Migración 0001: esquema inicial
--
-- Correr completo en: Supabase → SQL Editor → New query → Run
-- Es idempotente en su mayoría, pero está pensado para correrse UNA vez
-- sobre un proyecto limpio.
--
-- Aislamiento: cada fila lleva asesor_id = auth.users.id.
-- RLS usa auth.uid(), que viaja en el JWT de cada request y por lo tanto
-- NO se rompe con connection pooling (a diferencia de current_setting()).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 0. Utilidades
-- ---------------------------------------------------------------------

create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 1. asesores  (perfil 1:1 con auth.users — el tenant)
-- ---------------------------------------------------------------------

create table if not exists public.asesores (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre          text not null,
  email           text not null,
  telefono        text,
  clave_agente    text,                       -- clave ante la aseguradora
  zona_horaria    text not null default 'America/Mexico_City',
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create trigger trg_asesores_actualizado
  before update on public.asesores
  for each row execute function public.set_actualizado_en();

-- Alta automática del perfil al registrarse en Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.asesores (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  -- Reglas de recordatorio por defecto (opinadas, editables desde la app)
  insert into public.reglas_recordatorio (asesor_id, ramo, evento, dias_antes)
  values
    (new.id, 'ahorro', 'renovacion', 90),
    (new.id, 'ahorro', 'renovacion', 5),
    (new.id, 'gmm',    'renovacion', 90),
    (new.id, 'gmm',    'renovacion', 30),
    (new.id, 'gmm',    'renovacion', 5),
    (new.id, 'autos',  'renovacion', 30),
    (new.id, 'autos',  'renovacion', 5),
    (new.id, null,     'recibo',     5),
    (new.id, null,     'recibo',     0),
    (new.id, null,     'cumpleanos', 0)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 2. aseguradoras  (catálogo global, sólo lectura para el asesor)
-- ---------------------------------------------------------------------

create table if not exists public.aseguradoras (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null unique,
  activa    boolean not null default true,
  orden     int not null default 100
);

insert into public.aseguradoras (nombre, orden) values
  ('Seguros Monterrey New York Life', 1),
  ('Quálitas', 10),
  ('GNP Seguros', 20),
  ('AXA Seguros', 30),
  ('HDI Seguros', 40),
  ('Chubb Seguros', 50),
  ('Mapfre México', 60),
  ('Zurich México', 70),
  ('Seguros Banorte', 80),
  ('Otra', 999)
on conflict (nombre) do nothing;


-- ---------------------------------------------------------------------
-- 3. contactos  (prospectos Y clientes — la misma persona)
-- ---------------------------------------------------------------------

create table if not exists public.contactos (
  id                        uuid primary key default gen_random_uuid(),
  asesor_id                 uuid not null references public.asesores(id) on delete cascade,

  tipo_persona              text not null default 'fisica'
                              check (tipo_persona in ('fisica','moral')),
  nombre                    text not null,          -- razón social si es moral
  apellido_paterno          text,
  apellido_materno          text,

  fecha_nacimiento          date,                   -- alarma de cumpleaños + tarificación
  genero                    text check (genero in ('m','f','otro')),

  email                     text,
  telefono_movil            text,
  telefono_alterno          text,

  rfc                       text,
  curp                      text,
  ocupacion                 text,
  domicilio                 jsonb not null default '{}'::jsonb,

  origen                    text not null default 'otro'
                              check (origen in ('referido','red_social','contacto_personal','evento','otro')),
  referido_por_contacto_id  uuid references public.contactos(id) on delete set null,
  origen_detalle            text,

  notas                     text,
  archivado                 boolean not null default false,

  creado_en                 timestamptz not null default now(),
  actualizado_en            timestamptz not null default now()
);

create index if not exists idx_contactos_asesor        on public.contactos(asesor_id) where archivado = false;
create index if not exists idx_contactos_referido      on public.contactos(referido_por_contacto_id);
create index if not exists idx_contactos_cumple        on public.contactos(asesor_id, fecha_nacimiento);

create trigger trg_contactos_actualizado
  before update on public.contactos
  for each row execute function public.set_actualizado_en();


-- ---------------------------------------------------------------------
-- 4. oportunidades  (EL EMBUDO — una por producto cotizado)
-- ---------------------------------------------------------------------

create table if not exists public.oportunidades (
  id                  uuid primary key default gen_random_uuid(),
  asesor_id           uuid not null references public.asesores(id) on delete cascade,
  contacto_id         uuid not null references public.contactos(id) on delete cascade,

  ramo                text not null check (ramo in ('ahorro','gmm','autos','vida','danos')),
  subtipo             text,   -- 'retiro' | 'segubeca' | 'ahorro_puro' | ...
  aseguradora_id      uuid references public.aseguradoras(id),

  etapa               text not null default 'primer_contacto'
                        check (etapa in (
                          'primer_contacto',
                          'cita_agendada',
                          'analisis_necesidades',
                          'cotizacion_presentada',
                          'firma',
                          'entrega'
                        )),
  etapa_cambiada_en   timestamptz not null default now(),

  prima_estimada      numeric(12,2),
  moneda              text not null default 'MXN' check (moneda in ('MXN','USD','UDI')),

  -- null = abierta
  resultado           text check (resultado in ('ganada','perdida')),
  cerrada_en          timestamptz,
  motivo_perdida      text check (motivo_perdida in (
                        'no_responde','precio','ya_tiene_seguro',
                        'no_le_interesa','no_califica','renueva_despues','otro'
                      )),
  motivo_detalle      text,
  recontactar_en      date,      -- alimenta el panel del día

  poliza_id           uuid,      -- FK agregada más abajo (dependencia circular)
  notas               text,

  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),

  constraint chk_perdida_con_motivo
    check (resultado is distinct from 'perdida' or motivo_perdida is not null)
);

create index if not exists idx_oport_abiertas
  on public.oportunidades(asesor_id, etapa) where resultado is null;
create index if not exists idx_oport_recontactar
  on public.oportunidades(asesor_id, recontactar_en) where recontactar_en is not null;
create index if not exists idx_oport_contacto
  on public.oportunidades(contacto_id);

create trigger trg_oport_actualizado
  before update on public.oportunidades
  for each row execute function public.set_actualizado_en();

-- Marca automáticamente cuándo cambió de etapa (para medir estancamiento)
create or replace function public.marcar_cambio_etapa()
returns trigger language plpgsql as $$
begin
  if new.etapa is distinct from old.etapa then
    new.etapa_cambiada_en = now();
  end if;
  if new.resultado is not null and old.resultado is null then
    new.cerrada_en = now();
  end if;
  return new;
end;
$$;

create trigger trg_oport_etapa
  before update on public.oportunidades
  for each row execute function public.marcar_cambio_etapa();


-- ---------------------------------------------------------------------
-- 5. polizas
-- ---------------------------------------------------------------------

create table if not exists public.polizas (
  id                  uuid primary key default gen_random_uuid(),
  asesor_id           uuid not null references public.asesores(id) on delete cascade,
  contacto_id         uuid not null references public.contactos(id) on delete restrict,
  aseguradora_id      uuid not null references public.aseguradoras(id),
  oportunidad_id      uuid references public.oportunidades(id) on delete set null,

  numero_poliza       text not null,
  ramo                text not null check (ramo in ('ahorro','gmm','autos','vida','danos')),
  subtipo             text,
  producto            text,               -- nombre comercial del producto

  fecha_inicio        date not null,
  fecha_fin           date not null,      -- vencimiento / renovación
  estado              text not null default 'vigente'
                        check (estado in ('vigente','vencida','cancelada','renovada','saldada')),

  prima_total         numeric(12,2),
  moneda              text not null default 'MXN' check (moneda in ('MXN','USD','UDI')),
  forma_pago          text not null default 'anual'
                        check (forma_pago in ('anual','semestral','trimestral','mensual')),

  -- Renovación: 'continua' = misma póliza sigue viva (ahorro, vida)
  --             'nueva_poliza' = se emite otra cada año (gmm, autos)
  tipo_renovacion     text not null default 'nueva_poliza'
                        check (tipo_renovacion in ('continua','nueva_poliza')),
  poliza_anterior_id  uuid references public.polizas(id) on delete set null,

  comision_pct        numeric(5,2),
  comision_monto      numeric(12,2),

  -- Campos propios del ramo:
  --   autos  -> {placas, marca, modelo, anio, vin, cobertura}
  --   gmm    -> {suma_asegurada, deducible, coaseguro, hospital, dependientes:[]}
  --   ahorro -> {plazo_anios, aportacion, beneficiarios:[{nombre,parentesco,pct}]}
  datos               jsonb not null default '{}'::jsonb,

  archivo_caratula    text,               -- ruta en Supabase Storage
  notas               text,

  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),

  constraint uq_poliza_por_asesor unique (asesor_id, numero_poliza),
  constraint chk_vigencia check (fecha_fin > fecha_inicio)
);

create index if not exists idx_polizas_vencimiento
  on public.polizas(asesor_id, fecha_fin) where estado = 'vigente';
create index if not exists idx_polizas_contacto on public.polizas(contacto_id);
create index if not exists idx_polizas_cadena   on public.polizas(poliza_anterior_id);

create trigger trg_polizas_actualizado
  before update on public.polizas
  for each row execute function public.set_actualizado_en();

alter table public.oportunidades
  drop constraint if exists fk_oport_poliza;
alter table public.oportunidades
  add constraint fk_oport_poliza
  foreign key (poliza_id) references public.polizas(id) on delete set null;


-- ---------------------------------------------------------------------
-- 6. recibos  (pago fraccionado)
-- ---------------------------------------------------------------------

create table if not exists public.recibos (
  id                  uuid primary key default gen_random_uuid(),
  asesor_id           uuid not null references public.asesores(id) on delete cascade,
  poliza_id           uuid not null references public.polizas(id) on delete cascade,

  numero              int not null,          -- 1..n dentro de la vigencia
  fecha_vencimiento   date not null,
  monto               numeric(12,2),
  moneda              text not null default 'MXN' check (moneda in ('MXN','USD','UDI')),

  estado              text not null default 'pendiente'
                        check (estado in ('pendiente','pagado','vencido','en_pausa','cancelado')),
  fecha_pago          date,
  notas               text,

  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),

  constraint uq_recibo unique (poliza_id, numero)
);

create index if not exists idx_recibos_pendientes
  on public.recibos(asesor_id, fecha_vencimiento) where estado in ('pendiente','vencido');

create trigger trg_recibos_actualizado
  before update on public.recibos
  for each row execute function public.set_actualizado_en();


-- ---------------------------------------------------------------------
-- 7. actividades  (agenda + bitácora: una sola tabla)
-- ---------------------------------------------------------------------

create table if not exists public.actividades (
  id                  uuid primary key default gen_random_uuid(),
  asesor_id           uuid not null references public.asesores(id) on delete cascade,

  contacto_id         uuid references public.contactos(id) on delete cascade,
  oportunidad_id      uuid references public.oportunidades(id) on delete cascade,
  poliza_id           uuid references public.polizas(id) on delete cascade,
  recibo_id           uuid references public.recibos(id) on delete cascade,

  tipo                text not null check (tipo in (
                        'cita','llamada','whatsapp','email','seguimiento',
                        'entrega','renovacion','cobranza','cumpleanos','nota','personal'
                      )),
  titulo              text not null,
  descripcion         text,
  lugar               text,

  inicia_en           timestamptz not null,
  termina_en          timestamptz,
  todo_el_dia         boolean not null default false,

  estado              text not null default 'pendiente'
                        check (estado in ('pendiente','completada','cancelada','reagendada')),
  completada_en       timestamptz,

  origen              text not null default 'manual'
                        check (origen in ('manual','automatica')),
  -- Evita que el cron duplique alertas si corre dos veces
  clave_idempotencia  text,

  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),

  constraint uq_actividad_automatica unique (asesor_id, clave_idempotencia)
);

create index if not exists idx_actividades_agenda
  on public.actividades(asesor_id, inicia_en) where estado = 'pendiente';
create index if not exists idx_actividades_contacto on public.actividades(contacto_id);

create trigger trg_actividades_actualizado
  before update on public.actividades
  for each row execute function public.set_actualizado_en();


-- ---------------------------------------------------------------------
-- 8. reglas_recordatorio  (offsets configurables por ramo y evento)
-- ---------------------------------------------------------------------

create table if not exists public.reglas_recordatorio (
  id           uuid primary key default gen_random_uuid(),
  asesor_id    uuid not null references public.asesores(id) on delete cascade,
  ramo         text check (ramo in ('ahorro','gmm','autos','vida','danos')),  -- null = todos
  evento       text not null check (evento in ('renovacion','recibo','cumpleanos','seguimiento')),
  dias_antes   int not null default 0 check (dias_antes >= 0),
  activa       boolean not null default true,
  creado_en    timestamptz not null default now(),

  constraint uq_regla unique (asesor_id, ramo, evento, dias_antes)
);

create index if not exists idx_reglas_asesor on public.reglas_recordatorio(asesor_id) where activa;


-- ---------------------------------------------------------------------
-- 9. Vista del panel del día  (lo primero que ve al abrir el CRM)
-- ---------------------------------------------------------------------

create or replace view public.v_panel_dia as
  -- Citas y seguimientos agendados
  select
    a.asesor_id,
    'actividad'::text            as tipo_alerta,
    a.id                         as referencia_id,
    a.contacto_id,
    a.titulo,
    a.tipo                       as detalle,
    a.inicia_en::date            as fecha,
    case when a.inicia_en::date < current_date then 'vencida' else 'hoy' end as urgencia
  from public.actividades a
  where a.estado = 'pendiente'
    and a.inicia_en::date <= current_date

  union all

  -- Recibos por cobrar o vencidos
  select
    r.asesor_id,
    'recibo',
    r.id,
    p.contacto_id,
    'Recibo ' || r.numero || ' — póliza ' || p.numero_poliza,
    r.estado,
    r.fecha_vencimiento,
    case when r.fecha_vencimiento < current_date then 'vencida' else 'proxima' end
  from public.recibos r
  join public.polizas p on p.id = r.poliza_id
  where r.estado in ('pendiente','vencido')
    and r.fecha_vencimiento <= current_date + 15

  union all

  -- Renovaciones próximas (ventana amplia; la app filtra por reglas_recordatorio)
  select
    p.asesor_id,
    'renovacion',
    p.id,
    p.contacto_id,
    'Renovación — póliza ' || p.numero_poliza,
    p.ramo,
    p.fecha_fin,
    case when p.fecha_fin < current_date then 'vencida' else 'proxima' end
  from public.polizas p
  where p.estado = 'vigente'
    and p.fecha_fin <= current_date + 90

  union all

  -- Oportunidades marcadas para recontactar
  select
    o.asesor_id,
    'recontacto',
    o.id,
    o.contacto_id,
    'Recontactar — ' || o.ramo,
    coalesce(o.motivo_perdida, 'seguimiento'),
    o.recontactar_en,
    case when o.recontactar_en < current_date then 'vencida' else 'hoy' end
  from public.oportunidades o
  where o.recontactar_en is not null
    and o.recontactar_en <= current_date;


-- ---------------------------------------------------------------------
-- 10. RLS — aislamiento por asesor
-- ---------------------------------------------------------------------

alter table public.asesores            enable row level security;
alter table public.contactos           enable row level security;
alter table public.oportunidades       enable row level security;
alter table public.polizas             enable row level security;
alter table public.recibos             enable row level security;
alter table public.actividades         enable row level security;
alter table public.reglas_recordatorio enable row level security;
alter table public.aseguradoras        enable row level security;

-- El asesor sólo se ve a sí mismo
drop policy if exists asesores_self on public.asesores;
create policy asesores_self on public.asesores
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Catálogo de aseguradoras: lectura para cualquier usuario autenticado
drop policy if exists aseguradoras_lectura on public.aseguradoras;
create policy aseguradoras_lectura on public.aseguradoras
  for select to authenticated
  using (true);

-- Todas las tablas de datos: aislamiento por asesor_id = auth.uid()
do $$
declare t text;
begin
  foreach t in array array[
    'contactos','oportunidades','polizas','recibos','actividades','reglas_recordatorio'
  ] loop
    execute format('drop policy if exists %I_por_asesor on public.%I', t, t);
    execute format(
      'create policy %I_por_asesor on public.%I
         for all to authenticated
         using (asesor_id = auth.uid())
         with check (asesor_id = auth.uid())', t, t);
  end loop;
end;
$$;

-- La vista hereda RLS de las tablas base (security_invoker)
alter view public.v_panel_dia set (security_invoker = on);


-- ---------------------------------------------------------------------
-- 11. Generación automática de recibos según forma de pago
-- ---------------------------------------------------------------------

create or replace function public.generar_recibos(p_poliza_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poliza    public.polizas%rowtype;
  v_n         int;
  v_meses     int;
  v_monto     numeric(12,2);
  i           int;
begin
  select * into v_poliza from public.polizas where id = p_poliza_id;
  if not found then
    raise exception 'Póliza % no existe', p_poliza_id;
  end if;

  -- La función es SECURITY DEFINER (salta RLS), así que el chequeo de
  -- pertenencia tiene que ser explícito aquí.
  if v_poliza.asesor_id is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  v_meses := case v_poliza.forma_pago
               when 'anual'      then 12
               when 'semestral'  then 6
               when 'trimestral' then 3
               when 'mensual'    then 1
             end;
  v_n     := 12 / v_meses;
  v_monto := round(coalesce(v_poliza.prima_total, 0) / v_n, 2);

  for i in 1..v_n loop
    insert into public.recibos (asesor_id, poliza_id, numero, fecha_vencimiento, monto, moneda)
    values (
      v_poliza.asesor_id,
      v_poliza.id,
      i,
      (v_poliza.fecha_inicio + ((i - 1) * v_meses || ' months')::interval)::date,
      v_monto,
      v_poliza.moneda
    )
    on conflict (poliza_id, numero) do nothing;
  end loop;

  return v_n;
end;
$$;

revoke all on function public.generar_recibos(uuid) from public;
grant execute on function public.generar_recibos(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 12. Marcar recibos vencidos (para el cron diario)
-- ---------------------------------------------------------------------

create or replace function public.marcar_recibos_vencidos()
returns int
language sql
security definer
set search_path = public
as $$
  with actualizados as (
    update public.recibos
       set estado = 'vencido'
     where estado = 'pendiente'
       and fecha_vencimiento < current_date
    returning 1
  )
  select count(*)::int from actualizados;
$$;

-- =====================================================================
-- Fin de la migración 0001
-- =====================================================================
