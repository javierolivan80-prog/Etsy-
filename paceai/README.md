# PaceAI — El analista inteligente de rendimiento para corredores

> No es un diario. No es un tracker. Es un entrenador basado en IA que **interpreta** tus
> entrenamientos: qué significan, qué errores cometes, cuándo alcanzarás tu objetivo y qué
> debes hacer mañana.

Aplicación **lista para producción**: registro e inicio de sesión reales (Supabase Auth con
verificación de email y recuperación de contraseña), datos persistidos por usuario en
PostgreSQL con Row Level Security, y despliegue directo en Vercel.

## Qué hace

- **Dashboard de estado de forma** — Fitness score, fatiga, recuperación y tu objetivo con
  probabilidad y fecha estimada. Modelo impulso-respuesta (CTL/ATL/TSB).
- **Informe de entrenador por sesión** — ritmo por km, detección de salidas rápidas, efecto
  fisiológico y consejo para mañana. Con clave de IA, informes narrativos completos.
- **Predicciones** — 5K, 10K, media y maratón (modelo VDOT), VO2max y ritmo umbral.
- **Objetivos** — probabilidad actual, fecha estimada y simulaciones; guárdalos en tu cuenta.
- **Race Predictor** — plan de ritmos km a km con la estrategia explicada.
- **Detección de errores y riesgo de lesión** — ACWR, incrementos semanales, recuperación.
- **Insights** — patrones minados de tus datos.
- **Chat con el entrenador** — streaming, con historial persistente y respuestas fundamentadas
  en TODO tu entrenamiento.
- **Scoring 0–100, logros, calendario interpretado y estadísticas completas.**
- **Importación** — GPX y TCX (parseo + clasificación automática); FIT y conectores OAuth
  (Strava, Garmin, Apple Health, Coros, Polar, Suunto) en el roadmap.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Recharts |
| Backend | Route Handlers + Server Actions (Node.js) · Zod en cliente y servidor |
| Datos | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth: registro, login, logout, verificación de email, recuperación de contraseña, sesiones seguras por cookies (@supabase/ssr) |
| IA | Capa agnóstica: Anthropic (Claude, por defecto `claude-opus-4-8`), OpenAI o Gemini. Sin clave, responde el motor determinista |

## Puesta en marcha (10 minutos)

### 1. Crea el proyecto de Supabase

1. Entra en [supabase.com](https://supabase.com) → **New project** (gratis).
2. En **SQL Editor**, pega y ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
   Esto crea las tablas (`profiles`, `activities`, `goals`, `chat_messages`), las políticas RLS
   y el trigger que crea el perfil al registrarse.
3. En **Settings → API** copia la `Project URL` y la `anon public key`.
4. (Recomendado) En **Authentication → URL Configuration** añade tu dominio a *Redirect URLs*:
   `https://tu-dominio.com/auth/callback` (y `http://localhost:3000/auth/callback` para desarrollo).

### 2. Configura las variables de entorno

```bash
cp .env.example .env.local
# rellena NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Arranca

```bash
npm install
npm run dev     # http://localhost:3000
```

Regístrate, verifica tu email, importa un GPX/TCX y todo queda guardado en tu cuenta.

## Desplegar en Vercel

1. Importa el repositorio en [vercel.com](https://vercel.com) → **Add New → Project**.
2. **Root Directory**: `paceai`.
3. En **Environment Variables** añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (opcional, para el chat de IA conversacional)
4. Deploy. No hace falta ningún cambio adicional.
5. Añade la URL de producción a las *Redirect URLs* de Supabase (paso 1.4).

## Seguridad

- **RLS en todas las tablas**: cada fila lleva `user_id` y las políticas solo permiten
  `select/insert/update/delete` cuando `auth.uid() = user_id`. Ningún usuario puede tocar
  datos de otro, ni siquiera ante un bug de la aplicación.
- **Sesiones**: cookies httpOnly gestionadas por `@supabase/ssr`; el proxy de Next refresca el
  token en cada petición y protege todas las rutas de la aplicación (además de la comprobación
  server-side en el layout y en cada acción).
- **Validación doble**: formularios con restricciones HTML en cliente y Zod en el servidor;
  la base de datos añade una tercera capa con `check constraints`.
- **Sin datos sensibles en localStorage** (solo la preferencia de tema claro/oscuro).

## Arquitectura

```
src/
├── app/                     # landing, login/register/forgot/reset, auth/callback,
│                            # (app)/dashboard|activities|goals|chat|…, api/
├── components/              # ui/ · charts/ · layout/ · chat/ · import/ · auth/ · settings/
├── proxy.ts                 # refresco de sesión + protección de rutas (Next 16)
└── lib/
    ├── engine/              # Motor de análisis puro: TRIMP/CTL/ATL/TSB, VDOT,
    │                        # pacing, ACWR, scoring, errores, goals, race plan, insights…
    ├── ai/                  # Capa LLM agnóstica (anthropic/openai/gemini) + grounding
    ├── parsers/             # GPX, TCX (FIT: seam preparado), clasificación de sesiones
    ├── supabase/            # clientes server/browser + tipos de filas
    ├── auth/actions.ts      # Server Actions: login, registro, recuperación, perfil, objetivos
    └── data.ts              # Capa de acceso a datos (Supabase, RLS)
supabase/schema.sql          # Esquema completo con RLS — ejecutar en Supabase
```

**Principio central**: el motor de análisis es una librería TypeScript pura sobre el tipo
`Activity`; la IA recibe siempre el snapshot del motor como contexto y razona sobre datos
reales del usuario, nunca inventa.

## Roadmap corto

1. OAuth Strava/Garmin + sincronización incremental.
2. Decoder FIT (`src/lib/parsers/fit.ts` es el seam).
3. PWA offline + notificaciones ("tu informe de hoy está listo").
4. Ciclismo, natación, trail y triatlón sobre el mismo motor.
