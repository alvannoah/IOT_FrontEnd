# Electricity & Water Monitor

React dashboard for the Group 4 IoT project. It shows live readings, usage and cost
history, controls the solenoid valve and sets prices, all through the FastAPI backend in
`IOTProj`.

Built with Vite, React, TypeScript, TanStack Query, Recharts and Tailwind CSS.

## Run it

Start the backend first (from `IOTProj`):

```bash
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```

Then start the dashboard:

```bash
npm install
npm run dev
```

Open http://localhost:5173. The dev server forwards `/api` to `http://127.0.0.1:8000`;
to point it somewhere else, set `API_PROXY_TARGET` in `.env` (see `.env.example`).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm test` | Run the unit tests |
| `npm run gen:api` | Regenerate `src/api/schema.d.ts` from the running backend |

Run `npm run gen:api` after changing `schemas.py`; the type-checker then flags any
frontend code the change breaks.

## How data refreshes

| Data | Every |
| --- | --- |
| Water and LED state, sensors, latest readings, water changes | 5 s |
| Today, month and projected figures | 30 s |
| Graphs | 20 s for the last hour, otherwise 60 s |

## Notes

TypeScript stays on version 5 because `openapi-typescript` crashes on version 7.
