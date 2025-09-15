# Beelup‑lite (MVP)

Un MVP ultra simple para clubes que quieran subir partidos y que sus jugadores marquen y compartan highlights al instante.

## Stack
- **Next.js 14 (App Router)**
- **Supabase** (Auth + Postgres + Storage opcional)
- UI sin framework (componentes básicos con CSS inline para que sea portable)

## Qué incluye
- Login por **magic link** (Supabase).
- CRUD mínimo: **clubs**, **courts**, **matches**, **highlights**.
- **Tagger**: ver un video MP4/HLS, marcar inicio/fin y guardar highlight.
- Página de **visualización** /m/[matchId] con lista de highlights y links compartibles (?t=SEGUNDOS).
- Políticas RLS de ejemplo (SQL) para lectura pública y escritura para usuarios del club.

## Puesta en marcha (20–30 min)
1) Crear proyecto en **Supabase** y copiar las variables a `.env.local` (ver `.env.example`).
2) En Supabase -> SQL Editor, pegar el contenido de `supabase/migrations/001_schema.sql`.
3) (Opcional) Crear un **bucket** en Storage llamado `videos` (acceso público).
4) `npm i` y luego `npm run dev`.
5) Abrir `http://localhost:3000` y loguearte con tu email.
6) Crea un **Club**, al menos una **Court**, crea un **Match** y pega la **URL del video** (MP4/HLS).

## Despliegue rápido
- **Vercel** (recomendado): importar repo, configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Railway/Render** también funcionan.

## Flujo de highlights
- En la página del match puedes reproducir el video, **marcar IN/OUT** y guardar el highlight.
- Cada highlight te da un link compartible que arranca en el segundo `t` definido.

## Limitaciones del MVP
- No hace recortes físicos de video (usa el mismo archivo y salta a timestamp).
- No hay auto‑detección de jugadas. (Se puede agregar con workers luego).
- No hay multi‑club roles avanzados (hay un campo `owner_id` en `clubs`).

## Seguridad / RLS
- Lectura pública de `matches` y `highlights` (para que puedan ver los partidos).
- Escritura sólo para usuarios autenticados; opcionalmente limitar por `club_id`.

## Estructura
- **app/(auth)/login** → login con magic link.
- **app/dashboard** → CRUD mínimo de clubes, canchas, partidos.
- **app/m/[id]** → ver partido + tagger.
- **lib/supabaseClient** → cliente Supabase (browser).

---

Hecho para levantar algo **hoy** y empezar a vender. Mejora y modulariza a tu gusto.
