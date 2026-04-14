# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project

React 19 + Vite + TypeScript + Tailwind CSS admin dashboard for property/report management (bienes inmuebles). Built on the TailAdmin v2.0.2 template, adapted for Spanish-language real-estate data and report generation. Deployed via Docker + Nginx.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run lint` — ESLint
- `npm run preview` — preview production build

Docker: `docker-compose up` (see `Dockerfile`, `nginx.conf`, `docker-compose.yml`).

## Stack

- React 19, React Router v7 (`react-router`, not `react-router-dom`)
- Tailwind CSS 4 (via `@tailwindcss/postcss`), Styled Components
- PrimeReact v10 + PrimeIcons (primary UI kit), ApexCharts / react-apexcharts
- Axios for HTTP, XLSX for Excel export
- FullCalendar, Swiper, react-dnd, react-dropzone, jVectorMap

## Structure

- `src/App.tsx` — routes; views inside `<AppLayout>` share sidebar + header
- `src/pages/` — route views
  - `Dashboard/Home.tsx`
  - `Reporte/` — `MyReporte`, `BienesInmuebles`, `Comprobante`, `Recaudacion`
- `src/components/actions/` — API call functions (one file per resource: `get-bienes-inmuebles`, `get-comprobante`, `get-reporte-async`, `get-reporte-cv`, `get-reporte-recaudacion`, `get-titulos`)
- `src/components/{common,header,ui}/` — shared UI
- `src/hooks/` — `useReporte`, `useAsyncReporte`, `useRecaudacion`, `useExcelExport`
- `src/interfaces/` — TypeScript response/request types (e.g. `reporte.response.ts`)
- `src/utils/` — helpers (`buildBienesInmueblesXml`, `reporteColumns`, etc.)
- `src/layout/AppLayout.tsx` — main layout wrapper
- `src/context/` — React contexts

## API conventions

All backend calls go through `src/components/actions/*`. They read config from Vite env vars:

- `VITE_API_BASE_URL` (fallback `http://localhost:8000`)
- `VITE_API_KEY` or `VITE_API_TOKEN` — sent as `x-api-key` header
- Some endpoints are overridable (e.g. `VITE_API_CT_VENCIDA_TITULO`)

Recaudación uses an async Celery flow: `startRecaudacion` → poll `getRecaudacionStatus(taskId)` → `getRecaudacionDatos`. See `get-reporte-recaudacion.ts` and `useAsyncReporte` / `useRecaudacion`.

Report types supported include Cartera Vencida CIU, Cartera Vencida Impuesto, Bienes Inmuebles, Comprobante, and Recaudación (with by-year and date-range variants). Endpoints are documented in `CONFIGURACION_ENDPOINTS_REPORTES.txt`.

## Conventions

- Domain language is Spanish (`reporte`, `titulos`, `bienes_inmuebles`, `recaudacion`, `rubro`, `anio`). Match existing naming in new code.
- New routes: add the page under `src/pages/`, import and register it in `src/App.tsx` inside the `<AppLayout>` route.
- New API calls: add a function under `src/components/actions/`, type the response in `src/interfaces/`, and expose via a hook in `src/hooks/` if it has state/lifecycle.
- Excel export goes through `useExcelExport` + `xlsx`; async exports must paginate through all backend pages, not just the current one.
- Path alias: imports use relative paths (no `@/` alias configured by default — check `tsconfig.app.json` and `vite.config.ts` before assuming).
