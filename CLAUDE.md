# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gesneu** (Gestión Neumáticos Tair) is a tire management admin dashboard for Tair. It handles tire registries, vehicle assignments, inspections, rotations, and reporting. The UI and all domain logic are in Spanish.

## Commands

```bash
npm run dev          # Start dev server on 0.0.0.0:3000
npm run build        # Production build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run typecheck    # TypeScript type check
npm run format:write # Format with Prettier
```

No test suite is configured.

## Environment Variables

Copy `.env.example` and fill in:

```
NEXT_PUBLIC_API_GESNEU_URL=   # Backend API base URL
NEXT_PUBLIC_API_HOST=         # IP for local dev
NEXT_PUBLIC_API_PORT=         # Port for local dev
WEBHOOK_URL=                  # Webhook endpoint
CF_ACCESS_CLIENT_ID=          # Cloudflare Access client ID
CF_ACCESS_CLIENT_SECRET=      # Cloudflare Access client secret
```

## Architecture

### Stack

- **Next.js 14** App Router with TypeScript
- **MUI v5** (+ `@mui/x-date-pickers` / `-pro`) + **shadcn/ui** + **Tailwind CSS 4** — mixed UI layer; MUI handles theme/layout and date pickers, shadcn components live in `src/components/ui/`, Tailwind for utility styling
- **TanStack React Query v5** for server state, **TanStack React Table v8** for the `DataTable` component, **React Hook Form** + **Zod** for forms
- **Axios** for HTTP, with interceptors in `src/lib/auth/axios-interceptors.ts`
- **ApexCharts / Recharts / Plotly.js** for charts; use whichever is already in the relevant module
- **Leaflet / react-leaflet** for workshop map
- **No drag-and-drop in movement flows.** They were migrated to click-to-select (see *Movement modal patterns*). `react-dnd` has no remaining usage in `src/` (the dependency is still in `package.json`, pending removal). `DiagramaVehiculo` still imports `@dnd-kit/core` hooks, but no component mounts a `DndContext`, so they are inert — interaction goes through `onPosicionClick`. `@dnd-kit` remains the choice if drag is ever needed again
- **lucide-react** and **@phosphor-icons/react** for icons (shadcn primitives pull in lucide; feature code mixes both), plus custom SVGs in `src/components/icons/`
- **xlsx-js-style** for Excel export/templates, **xlsx** for reading uploaded Excel files (padrón import, asignación masiva)
- **react-countup** for animated KPI numbers, **cmdk** for command/combobox UI, **class-variance-authority** for shadcn variant styling
- **dayjs** configured for Spanish locale
- **sonner** for toast notifications

### API Layer

All backend calls live in `src/api/Neumaticos.ts`. This single file exports typed functions covering every domain: tires (neumáticos), vehicles (vehículos), assignments, inspections, movements, reports, Excel imports, and bulk/mass assignment (asignación masiva — validate → confirm → report workflow keyed by `batchId`, used by `modal-asignacion-masiva-neumatico.tsx`). Always add new endpoints here.

The Next.js API proxy at `src/app/api/[...path]/route.ts` forwards requests to the backend, injecting Cloudflare Access headers. Client code hits `/api/...` — never the backend URL directly from the browser.

### Authentication

Custom session-based auth (`src/lib/auth/`). `UserContext` (`src/contexts/user-context.tsx`) holds the authenticated user. Protected pages check this context; unauthenticated users are redirected to `/auth/sign-in`. Auth API lives in `src/lib/auth/auth-api.ts`.

`src/components/AxiosInterceptorLoader.tsx` sets up 401 interception globally — mounted once in root layout.

### State Management

No Redux/Zustand. State is split:
- **Server state**: TanStack React Query via custom hooks in `src/hooks/`
- **Client/UI state**: React Context (`UserContext`, `SideBarContext`, `SessionErrorContext`)
- **Form state**: React Hook Form
- **Local UI**: `useState` per component

### Routing & Pages (`src/app/`)

All routes below except `/auth/*`, `/errors/*`, and the API proxy live under the `(app)` route group (`src/app/(app)/...`).

| Path | Description |
|---|---|
| `/` | Redirects to dashboard |
| `/auth/*` | Sign-in, sign-up, reset-password |
| `/dashboard` | Main analytics dashboard with KPI cards and charts |
| `/dashboard/settings` | Notification and password settings |
| `/account` | User profile page |
| `/padron` | Tire catalog listing (DataTable + filters) |
| `/padron/neumatico/[codigo]` | Individual tire detail page |
| `/padron/placa/[placa]` | Vehicle detail page |
| `/integrations` | Tire movements, assignments, relocations |
| `/mapa` | Workshop map (Leaflet) |
| `/fichas-tecnicas` | Technical specification sheets |
| `/analisis-rendimiento` | Performance analysis + decommissioned-tire (bajas) reports (`src/components/reportes/`) |
| `/analisis-consumos` | Consumption analysis reports (`ReporteConsumos.tsx`) |
| `/errors/not-found` | 404 page |

Route constants are centralized in `src/paths.ts`.

### Component Organization (`src/components/`)

**`auth/`** — sign-in/sign-up/reset forms, `auth-guard.tsx`, `guest-guard.tsx`, `permission-guard.tsx`, `layout.tsx`

**`core/`** — theme provider, `no-ssr.tsx`, `logo.tsx`, `modal-inspeccion-aver.tsx`, `chart.tsx`, `localization-provider.tsx`
- `core/modal-aviso.tsx` — **shared base for every warning/confirmation modal.** Takes `{tono: 'ambar'|'azul'|'rojo', icono, titulo, mensaje, detalle?, imagen?, acciones, bloquearCierre?}` and owns the responsive layout (no fixed widths, buttons stack full-width on mobile with the primary on top). Build new warning modals on top of it instead of hand-rolling a `<Dialog>`
- `core/theme-provider/` — MUI Emotion cache, theme provider
- `core/theme-provider/modal-desasignar/` — unassignment flow modals (warning, confirm, mandatory inspection) — all three wrap `ModalAviso`
- `core/theme-provider/modal-reubicar/` — relocation flow modals (warning, confirm, mandatory inspection, previous/old inspection views) — all wrap `ModalAviso`

**`dashboard/`**
- `dashboard/overview/` — KPI cards (`KpiCard`, `cantidad-neu*.tsx`), chart components (`Chart3D`, `FlotaDonut`, `MarcasDonut`, `DisenosDonut`, `MedidasChart`, `DesgasteVehiculos`, `DesgasteNeumaticos`, `VidaUtilDistribucion`, `CostoPorTaller`, `ProximosVencer`), `ActividadReciente`, `TablaCriticos`, `PlacasSinNeumaticosCard`, `inspeccion-neu.tsx`
- `dashboard/integrations/` — movement modals (`modal-asignacion-neu`, `modal-avert-asig-neu`, `modal-reubicar`, `modal-desasignar`, `modal-inspeccion-neu`, `modal-actualizar-kilometraje`, `modal-delete-neu`, `modal-inputs-neu`, `modal-informacion-asignacion`, `modal-informacion-inspeccion`, `modal-informacion-reubicacion`, `modal-todas-placas`, `modal-ver-inspecciones`), plus `NeumaticosAsignadosCards.tsx` (installed-tire list on `/integrations`, pure Tailwind), `empty-state-placa.tsx`, `integrations-filters.tsx`, `integrations-card.tsx`
- `dashboard/customer/` — `customers-table.tsx`, `customers-filters.tsx`, `PadronFilterChips.tsx`, `modal-insert-excel.tsx`
- `dashboard/layout/` — `side-nav.tsx`, `main-nav.tsx`, `mobile-nav.tsx`, `nav-icons.tsx`, `user-popover.tsx`, `connection-status.tsx`, `config.ts` (nav menu items)
- `dashboard/account/` — `account-details-form.tsx`, `account-info.tsx`
- `dashboard/settings/` — `notifications.tsx`, `update-password-form.tsx`
- `dashboard/mapa/` — `MapaTalleres.tsx` (Leaflet map)
- `dashboard/padron/` — `modal-reubicar-neumatico.tsx`, `modal-asignacion-masiva-neumatico.tsx` (bulk Excel assignment), `modal-venta-neumatico.tsx` (tire sale)
- `CollapsibleCard.tsx`

Top-level (siblings of `AxiosInterceptorLoader.tsx`, not under `dashboard/`): `ChatWidget.tsx`, `SessionErrorSnackbar.tsx`

**`padron/neumatico/`** — tire detail sub-components: `FichaTecnica.tsx`, `FichaItem.tsx`, `MiniKpi.tsx`, `ComparisonBar.tsx`, `RemanenteChart.tsx`, `SemiGauge.tsx`, `Sparkline.tsx`, `HeroHeader.tsx`, `KilometrajeChart.tsx`, `StatCard.tsx`, `Timeline.tsx`, `TimelineEventCard.tsx`, `VidaUtilCard.tsx`

**`padron/placa/`** — vehicle detail sub-components (backs `/padron/placa/[placa]`): `PlacaHeroHeader.tsx`, `PlacaFichaTecnica.tsx`, `NeumaticosActualesCard.tsx`, `PlacaTimeline.tsx`, `PlacaTimelineEventCard.tsx`

**`reportes/`** — report dialogs/pages used by `/analisis-rendimiento` and `/analisis-consumos`: `Reporteneumaticobaja.tsx`, `NeumaticosBajaDialog.tsx`, `NeumaticosDespachadosDialog.tsx`, `NeumaticosTerrenoDialog.tsx`, `ReporteConsumos.tsx`

**`ui/`** — shadcn/ui primitives plus domain-specific badges:
- `data-table/` — `data-table.tsx` (core `DataTableNeumaticos` component), `data-table-column-header.tsx`, `data-table-pagination.tsx`
- Badges: `TipoTerrenoBadge.tsx`, `TipoRetenBadge.tsx`, `TipoMovimientoBadge.tsx`, `EsRecuperadoBadge.tsx`, `TextoRecuperadoBadge.tsx`
- `LinearProgress.tsx`, `spinner.tsx`, `sonner.tsx`, `CustomBreadcrumb.tsx`, `CollapsibleSection.tsx`, `TableFilterChips.tsx`, `Spec.tsx`, `empty-state.tsx`, `bar-chart-skeleton.tsx`, `donut-chart-skeleton.tsx`

**`navegation/`** — `SideBarMain.tsx`

**`icons/`** — `Dashboard.tsx`, `Tyre.tsx`

### Hooks (`src/hooks/`)

Custom React Query hooks — always prefer these over calling `src/api/Neumaticos.ts` directly:

| Hook | Purpose |
|---|---|
| `use-neu-stats.tsx` | Batch-fetch all tire/vehicle KPI counts |
| `use-neumatico-detail.tsx` | Fetch single tire by código |
| `use-placa-detail.tsx` | Fetch vehicle + its tire history |
| `use-existe-neumatico.tsx` | Check if a tire code exists |
| `use-select-padron.tsx` | Padron selection state |
| `use-connection-status.ts` | WebSocket/API connection monitoring |
| `use-combo-filter.ts` | Combined filter state |
| `use-multi-select-filter.ts` | Multi-select filter state |
| `use-table-filter.ts` | Table filter management |
| `use-user.ts` | Access `UserContext` |
| `use-side-bar.tsx` | Sidebar open/close state |
| `use-popover.ts` | Popover anchor management |
| `use-selection.ts` | Row checkbox selection state |

### Contexts (`src/contexts/`)

| Context | File | Provides |
|---|---|---|
| `UserContext` | `user-context.tsx` | `user`, `error`, `isLoading`, `checkSession` |
| `SideBarContext` | `side-bar.context.tsx` | Sidebar open/close state |
| `SessionErrorContext` | `session-error-context.tsx` | Session expiry error notification state |

### Types (`src/types/`)

| File | Contents |
|---|---|
| `types.ts` | Primary: `Neumatico` (40+ props), `Vehiculo`, `User` |
| `neumatico.ts` | Table row types: `NeuDisponibleTable`, `NeuAsignadoTable`, `NeuAsignarTable`, `NeuTemporalTable`, `NeuInspeccionTable` |
| `padron.ts` | `PadronMapped`, `PadronExcel` |
| `inspecciones.ts` | `InspeccionTable` |
| `user.ts` | `User` interface (id, name, avatar, email, usuario) |
| `nav.d.ts` | Navigation type definitions |
| `react-plotly.js.d.ts` | Plotly type shims |
| `css.d.ts` | CSS module type shim |

### Utilities

- `src/utils/configuraciones-neumaticos.ts` — **the source of truth for which positions a vehicle has.** `obtenerConfiguracionNeumaticos(cantidad)` maps `CANTIDAD_NEUMATICOS` → `{cantidad, nombre, posiciones[]}`, where each position is `{codigo, eje, lado, repuesto}`. Configured: 2 (moto), 5 (auto/camioneta), 7 (camión, rear dual axle). Returns `null` for unknown counts
- `src/utils/posiciones-imagen-vehiculo.ts` — pixel coordinates of each wheel over the PNGs in `public/assets/vehiculos/`. `anchoNatural`/`altoNatural` **must match the real file size** or the image gets letterboxed inside the box and every marker shifts. Real sizes: `camion.png` 388×889, `carro.png` 436×970, `moto.png` 520×847. The moto entry still declares 554×1080; its two markers were tuned by hand against that distorted box and look right, so correcting the numbers means re-measuring both — leave it unless asked. Markers may set `repuesto: true` (drawn on the image instead of in a separate row) and `etiqueta: 'IZQ'|'DER'|'ARRIBA'|'ABAJO'` to override where the code/remanente label goes — used by the truck's dual wheels and the moto. **The user maintains these coordinates by hand; don't change them without asking**
- `src/utils/helpers.ts` — color helpers keyed on tire life %: `vidaColor()`, `borderColor()`, `vidaBgBar()`, `vidaBgGradient()`, `vidaRingColor()`, `vidaTrackColor()`, `timelineDotColor()`
- `src/utils/tire-utils.ts` — tire-specific calculations
- `src/utils/export-to-excel.ts` — Excel export using `xlsx-js-style`
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge), `convertToDateHuman()`, `convertDateAndHour()`, and the date helpers `parsearFechaLocal()` / `diasDesdeFecha()` (see *Dates from the backend*)
- `src/lib/logger.ts` + `src/lib/default-logger.ts` — structured logging

### Theme System (`src/styles/theme/`)

MUI theme is built in `create-theme.ts` using:
- `colors.ts` — brand color palette
- `color-schemes.ts` — light/dark scheme tokens
- `typography.ts` — Inter/Fredoka/Roboto Mono fonts
- `shadows.ts` — shadow definitions
- `components/` — per-component MUI overrides

### Special Components

- `src/styles/theme/components/DiagramaVehiculo.tsx` — the vehicle diagram used by `/integrations` and every movement modal (`modal-asignacion-neu`, `modal-reubicar`, `modal-desasignar`, `modal-inspeccion-neu`). It is **config-driven**: give it `cantidadNeumaticos` and it derives the positions from `obtenerConfiguracionNeumaticos` and the silhouette from `obtenerConfiguracionImagen`, falling back to a generic per-axle row layout when a count has no image mapped. Key props:

| Prop | Purpose |
|---|---|
| `neumaticosAsignados` | Tires to draw; matched to markers by `POSICION_NEU \|\| POSICION` |
| `cantidadNeumaticos` | Vehicle's `CANTIDAD_NEUMATICOS` — decides which positions exist |
| `layout` / `tipoModal` | Preset container widths (`dashboard`, `modal` + `inspeccion`/`mantenimiento`) |
| `anchoMax` | Overrides that width in px for compact instances (modals pass `150`) |
| `onPosicionClick(neumatico, codigoPosicion)` | Fires on **every** position, empty ones included — this is how all modals interact now |
| `posicionResaltada` | Highlights one position |
| `posicionesCompletadas` | Position codes to mark with a check (e.g. inspections captured locally) |

The component reserves ~78 px of horizontal margin on each side for the code/remanente labels, so a 150 px diagram needs ~306 px of room in its container.

- `src/styles/theme/components/calculo-km-recorrido.tsx` — kilometer calculation display

## Vehicle positions — the one rule that breaks things

**Never hardcode a list of positions.** Always derive them from `obtenerConfiguracionNeumaticos(vehiculo.CANTIDAD_NEUMATICOS)`.

Most of this codebase was written when every vehicle had 5 positions, so literal arrays like `['POS01','POS02','POS03','POS04','RES01']` and comparisons like `length >= 5` are scattered through its history. Each one silently drops data for a 2-wheel moto or a 7-wheel truck: tires assigned to `POS05`/`POS06` were being filtered out on load, so the diagram showed empty wheels while the database was correct. The same class of bug existed in the backend (`poMantenimientoController.js` fixed its own hardcoded `posicionesRequeridas`).

If you find one, replace it with the configuration. When a vehicle's count is missing or unrecognized, prefer **not filtering** over dropping rows — showing extra data is safer than hiding tires that are really mounted.

## Movement modal patterns

The assignment, relocation, inspection and unassignment modals were rebuilt to share one interaction model. Follow it for new work in this area.

**Click-to-select, not drag.** Choosing a tire and clicking a position replaced drag-and-drop everywhere. Tires are picked from a table (desktop) or cards (mobile), then placed. In `modal-asignacion-neu` the selection state travels through a React **context** (`SeleccionContext`) rather than column props, so the `ColumnDef[]` stays referentially stable and the table doesn't remount on every selection.

**Responsive structure, not just breakpoints.** Every modal:
- `fullScreen={useMediaQuery(theme.breakpoints.down('lg'))}` (or `'md'` for the smaller confirmation dialogs)
- `<Stack direction={{ xs: 'column-reverse', lg: 'row' }}>` so the diagram lands on top on mobile and to the side on desktop
- an X close button in the `DialogTitle`
- `DialogActions` with `flexDirection: { xs: 'column-reverse', sm: 'row' }` and `'& > button': { width: { xs: '100%', sm: 'auto' }, m: '0 !important' }`
- `minWidth: 0` on any flex child that contains a table, or it forces horizontal scroll

**Multi-step when one screen isn't enough.** `modal-desasignar` is the reference: a single modal with steps *Qué sale → Qué entra → Confirmar*, a clickable stepper in the header (backwards only), and the diagram pinned alongside showing the resulting state. It replaced two separate modals that passed data through `page.tsx` with a `setTimeout` race. **If one backend call covers the whole operation, keep it in one modal** — `desasignarConReemplazo` receives `{desasignaciones, asignaciones}` together, which is why splitting the UI caused the problem.

**Confirmation screens are cards, not tables.** The three `modal-informacion-*` modals show summary tiles plus one card per position instead of a `DataTable`. (Their old `columnsNeuPorAsignar` / `columnsNeuPorInspeccionar` / `columnsNeuPorReubicar` exports in `integrations/columns.tsx` are now unused.)

**One modal per job, parameterized.** `modal-inputs-neu` is the single "datos de instalación" dialog (remanente / presión / torque / fecha) for both assignment and unassignment. Its `fechaFija` prop switches the date between a `DatePicker` (assignment) and a read-only value imposed by the flow (unassignment uses the placa's last inspection). It replaced a near-identical copy whose only real difference was that date.

**Warning modals go through `ModalAviso`** (see `core/`).

## Dates from the backend

The API returns dates as `'AAAA-MM-DD'`. **Never pass that straight to `new Date()`**: the language spec says a date-only string is parsed as midnight **UTC**, which in Peru (UTC-5) lands on the previous day and makes every day-count off by one. This shipped as a real bug — an inspection done today counted as 1 day old, and the "no older than 4 days" rule blocked at the wrong boundary.

Use `parsearFechaLocal(fecha)` (local-midnight `Date`, or `null`) and `diasDesdeFecha(fecha)` (whole days elapsed, `0` = today) from `src/lib/utils.ts`.

Business rule, applied identically in relocation and unassignment: an inspection is usable **today and the 3 previous days**; from day 4 a new one is required (`diasDiferencia >= 4`).

## Key Conventions

- Almost all feature components use `'use client'` — server components are rare.
- Path alias `@/*` maps to `src/*`.
- UI text, variable names, and comments are in **Spanish**.
- Tire lists use TanStack React Table wrapped in the `DataTable` component from `src/components/ui/`.
- Modals for tire operations (assign, relocate, unassign, recover) follow a consistent pattern: a trigger button opens a controlled `<Dialog>` containing a React Hook Form.
- **Shell in MUI, content in shadcn/Tailwind.** `Dialog`/`DialogTitle`/`DialogContent`/`DialogActions`/`Stack`/`Card` come from MUI; everything inside uses shadcn primitives (`Field`, `Select`, `Input`, `Textarea`, `Button`, `InputGroup`, `DatePicker`) and Tailwind classes.
- Tailwind v4 syntax: gradients are `bg-linear-to-br`, **not** `bg-gradient-to-br`.
- `LoadingButton2` derives its own spinner from the `onClick` promise — don't pass it a `loading` prop or keep a parallel saving flag.
- **Scrollable flex lists need `shrink-0` on their items.** In a `flex flex-col` with `max-h-*` + `overflow-auto`, children shrink instead of letting the container scroll. Normally the automatic minimum size protects them — but **not when the child sets `overflow: hidden`**, which is common here (rounded cards with a colored left stripe, progress bars). Those get squashed and silently clipped. It happened in `modal-ver-inspecciones` (cards cut mid-badge) and in `MapaTalleres` (the summary bar collapsed from 7 px to 1 px).
- Navigation menu items are defined in `src/components/dashboard/layout/config.ts`.
- Color/status helpers in `src/utils/helpers.ts` drive all tire life visual indicators — use them consistently instead of hardcoding colors.
- Column definitions for tables live in `columns.tsx` files co-located with their route (`src/app/(app)/padron/columns.tsx`, `src/app/(app)/integrations/columns.tsx`, etc.).
