# Cartera

CRM para un asesor de seguros. Opinado a propósito: no se configura, se usa.

Lo primero que ves al abrir es tu día — citas, recibos por cobrar, renovaciones
que se acercan y prospectos que quedaste en buscar. Todo lo demás cuelga de ahí.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router) · React 19 · TypeScript estricto · Tailwind 4 |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Autenticación | Supabase Auth, correo y contraseña |
| Deploy | Vercel |

## Arrancar en local

```bash
npm install
cp .env.example .env.local   # llena los valores reales
npm run dev                  # http://localhost:3000
```

Antes de dar cualquier cosa por terminada:

```bash
npm run verify   # typecheck + tests + build
```

## Base de datos

Las migraciones viven en `supabase/migrations/`, numeradas. Se corren pegándolas
en el SQL Editor de Supabase, en orden. **No se re-corre una migración ya aplicada.**

### Aislamiento entre asesores

Cada tabla lleva `asesor_id` y una política de RLS de una línea:

```sql
using (asesor_id = auth.uid())
with check (asesor_id = auth.uid())
```

`auth.uid()` sale del JWT que viaja en cada petición, así que **no se rompe con
connection pooling**. No usamos variables de sesión (`current_setting`,
`SET LOCAL`): con pgbouncer en modo transacción la conexión se recicla entre
peticiones y la variable se pierde o, peor, se contamina con el tenant anterior.

Además de RLS, la app filtra por `asesor_id` en cada consulta. Cinturón y tirantes.

### Reglas no negociables

1. **Toda escritura pasa por `src/lib/db/write.ts`.** Ningún componente llama a
   `.insert()`, `.update()`, `.delete()` o `.rpc()` directo.
2. **Toda escritura lleva `.select()` encadenado.** Sin él no hay forma de saber
   si realmente se guardó: un `update` bloqueado por RLS responde 200 con cero
   filas y sin error. Eso es un guardado silencioso, y `write.ts` lo convierte
   en excepción.
3. **Cada función `SECURITY DEFINER` valida pertenencia a mano.** Salta RLS por
   definición, así que compara contra `auth.uid()` explícitamente o es una fuga.
4. **Ningún secreto en el repo.** Solo `.env.example` con placeholders. La llave
   `sb_secret_...` nunca lleva prefijo `NEXT_PUBLIC_` ni se commitea.

## Modelo de datos

```
contactos ──┬── oportunidades  (el embudo; una por producto cotizado)
            └── polizas ──── recibos        (pago fraccionado)
                   │
                   └── poliza_anterior_id   (cadena de renovación)
actividades  →  agenda y bitácora en una sola tabla
```

Una persona no "se convierte" en cliente: la persona es siempre la misma y lo que
tiene estado es la **oportunidad**. El mismo contacto puede tener un GMM perdido
y un seguro de ahorro vigente al mismo tiempo. Por eso el embudo es de
oportunidades y no de personas.

El embudo termina en *entrega de póliza*. La renovación no es una etapa del
embudo: es un evento del ciclo de vida de la póliza y vive en otra tabla.

Los campos propios de cada ramo van en `polizas.datos` (JSONB): autos guarda
placas y cobertura, GMM guarda suma asegurada y deducible, ahorro guarda plazo y
beneficiarios. Si un campo empieza a doler, se promueve a columna.

## WhatsApp

No usamos la API de WhatsApp Business. La app genera enlaces `wa.me` con el
mensaje ya redactado: el asesor toca, se abre su WhatsApp de siempre y envía.
Sin trámites con Meta, sin costo por conversación, y el cliente reconoce el
número. Los recordatorios *para el asesor* van por notificación push y correo.

## Estado

- [x] Esquema con RLS, probado contra PostgreSQL real
- [x] Autenticación con correo y contraseña
- [x] Panel del día
- [ ] Alta y edición de contactos
- [ ] Embudo de oportunidades
- [ ] Alta de pólizas y generación de recibos
- [ ] Agenda
- [ ] Cron de recordatorios
