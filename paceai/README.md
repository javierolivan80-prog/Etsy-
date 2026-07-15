# PaceAI — El analista inteligente de rendimiento para corredores

> No es un diario. No es un tracker. Es un entrenador basado en IA que **interpreta** tus
> entrenamientos: qué significan, qué errores cometes, cuándo alcanzarás tu objetivo y qué
> debes hacer mañana.

## Qué hace

- **Dashboard de estado de forma** — Fitness score, fatiga, recuperación, objetivo con
  probabilidad y fecha estimada. Modelo impulso-respuesta (CTL/ATL/TSB) sobre toda tu carga.
- **Informe IA por entrenamiento** — cada sesión recibe un análisis de entrenador: ritmo por
  kilómetro, detección de salidas rápidas ("si hubieras salido 10 s/km más lento habrías
  terminado 48 s antes"), efecto fisiológico y consejo para mañana.
- **Análisis mensual** — volumen, distribución de tipos de sesión y conclusiones.
- **Predicciones** — 5K, 10K, media y maratón vía modelo VDOT (Jack Daniels), VO2max estimado
  y ritmo umbral, actualizados automáticamente.
- **Objetivos** — "quiero 10K en 45:00" → probabilidad actual, fecha estimada y simulaciones
  (¿y si subes volumen un 15%? ¿y si añades series?).
- **Race Predictor** — plan de ritmos km a km en split negativo, con la estrategia explicada.
- **Detección de errores** — sales demasiado rápido, no haces rodajes suaves, no recuperas,
  mucho volumen/poca intensidad…
- **Riesgo de lesión** — ACWR (acute:chronic workload ratio), incrementos semanales y descanso,
  con explicación del porqué.
- **Insights** — patrones minados de tus datos ("los jueves rindes mejor", "cuando descansas
  dos días corres un 6% más rápido").
- **Chat con el entrenador** — respuestas en streaming fundamentadas en TODO tu historial.
- **Scoring 0–100** — Fitness, Recovery, Endurance, Speed, Consistency, Race Readiness,
  Efficiency y Running IQ.
- **Logros, calendario interpretado, estadísticas completas** con gráficos animados.
- **Importación** — GPX y TCX (parseo + clasificación automática del tipo de sesión); FIT y
  conectores OAuth (Strava, Garmin, Apple Health, Coros, Polar, Suunto) previstos en el esquema.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Recharts |
| Backend | Route Handlers (Node.js) · Zod |
| Datos | PostgreSQL + Prisma (esquema listo; modo demo sin base de datos) |
| Auth | Auth.js (NextAuth v5) con proveedor demo; preparado para OAuth + Prisma adapter |
| IA | Capa agnóstica de proveedor: Anthropic (Claude, por defecto `claude-opus-4-8`), OpenAI o Gemini. Sin clave, el motor determinista responde igualmente |

## Arranque

```bash
npm install
npm run dev        # http://localhost:3000 — funciona sin configurar nada (modo demo)
```

Producción:

```bash
npm run build && npm start
```

### Activar la IA conversacional

```bash
cp .env.example .env.local
# añade ANTHROPIC_API_KEY (u OPENAI_API_KEY / GEMINI_API_KEY)
```

### Activar la base de datos

```bash
# con DATABASE_URL configurada:
npx prisma migrate dev
npx prisma generate
```

y sustituye el interior de `src/lib/data.ts` por consultas Prisma (la interfaz ya está aislada).

## Arquitectura

```
src/
├── app/                    # App Router: landing, (app)/dashboard|activities|goals|…, api/
├── components/             # ui/ · charts/ · layout/ · chat/ · import/ · landing/
└── lib/
    ├── engine/             # Motor de análisis puro (sin framework):
    │   ├── training-load   #   TRIMP, CTL/ATL/TSB
    │   ├── vdot            #   VDOT/VO2max, predicciones, umbral
    │   ├── pacing          #   splits, fades, estrategia
    │   ├── injury          #   ACWR, riesgo de lesión
    │   ├── scoring         #   8 puntuaciones 0–100
    │   ├── errors          #   detección de errores de entrenamiento
    │   ├── goals           #   probabilidad + simulaciones
    │   ├── race-plan       #   plan km a km
    │   ├── insights        #   patrones minados
    │   └── …               #   monthly, report, achievements, calendar
    ├── ai/                 # Capa LLM agnóstica (anthropic/openai/gemini) + coach grounding
    ├── parsers/            # GPX, TCX (FIT: seam preparado), clasificación de sesiones
    ├── demo/               # Atleta demo determinista (26 semanas)
    └── data.ts             # Capa de acceso a datos (demo hoy, Prisma mañana)
```

**Principios**: el motor de análisis es una librería pura de TypeScript sobre el tipo
`Activity` — funciona igual con datos demo, archivos importados o filas de Postgres, y es el
punto de extensión para ciclismo/natación/trail (`sport` ya existe en el modelo). La IA nunca
inventa: recibe el snapshot del motor como contexto y razona sobre datos reales.

## Roadmap corto

1. OAuth Strava/Garmin + sincronización incremental (modelo `Connection` listo).
2. Decoder FIT (`src/lib/parsers/fit.ts` es el seam).
3. Persistencia Prisma + multiusuario (esquema listo).
4. PWA offline + notificaciones ("tu informe de hoy está listo").
5. Ciclismo, natación, trail y triatlón sobre el mismo motor.
