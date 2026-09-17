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
- **@dnd-kit** (core + sortable) for drag-and-drop interactions in `DiagramaVehiculo`/movement flows; a couple of older assignment modals still use **react-dnd** — prefer `@dnd-kit` for new work
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
- `core/theme-provider/` — MUI Emotion cache, theme provider
- `core/theme-provider/modal-desasignar/` — unassignment flow modals (warning, confirm, mandatory inspection)
- `core/theme-provider/modal-reubicar/` — relocation flow modals (warning, confirm, mandatory inspection, previous/old inspection views)

**`dashboard/`**
- `dashboard/overview/` — KPI cards (`KpiCard`, `cantidad-neu*.tsx`), chart components (`Chart3D`, `FlotaDonut`, `MarcasDonut`, `DisenosDonut`, `MedidasChart`, `DesgasteVehiculos`, `DesgasteNeumaticos`, `VidaUtilDistribucion`, `CostoPorTaller`, `ProximosVencer`), `ActividadReciente`, `TablaCriticos`, `PlacasSinNeumaticosCard`, `inspeccion-neu.tsx`
- `dashboard/integrations/` — movement modals (`modal-asignacion-neu`, `modal-asignacion-neu-desde-desasignacion`, `modal-avert-asig-neu`, `modal-reubicar`, `modal-desasignar`, `modal-inspeccion-neu`, `modal-actualizar-kilometraje`, `modal-delete-neu`, `modal-inputs-neu`, `modal-inputs-neu-desasignacion`, `modal-informacion-asignacion`, `modal-informacion-inspeccion`, `modal-informacion-reubicacion`, `modal-todas-placas`, `modal-ver-inspecciones`, etc.), `integrations-filters.tsx`, `integrations-card.tsx`
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

- `src/utils/helpers.ts` — color helpers keyed on tire life %: `vidaColor()`, `borderColor()`, `vidaBgBar()`, `vidaBgGradient()`, `vidaRingColor()`, `vidaTrackColor()`, `timelineDotColor()`
- `src/utils/tire-utils.ts` — tire-specific calculations
- `src/utils/export-to-excel.ts` — Excel export using `xlsx-js-style`
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge), `convertToDateHuman()`, `convertDateAndHour()`
- `src/lib/logger.ts` + `src/lib/default-logger.ts` — structured logging

### Theme System (`src/styles/theme/`)

MUI theme is built in `create-theme.ts` using:
- `colors.ts` — brand color palette
- `color-schemes.ts` — light/dark scheme tokens
- `typography.ts` — Inter/Fredoka/Roboto Mono fonts
- `shadows.ts` — shadow definitions
- `components/` — per-component MUI overrides

### Special Components

- `src/styles/theme/components/DiagramaVehiculo.tsx` — vehicle diagram (dnd-kit draggable/droppable positions) for tire position visualization, used in dashboard, `modal-desasignar`, `modal-reubicar`, `modal-inspeccion-neu`
- `src/styles/theme/components/calculo-km-recorrido.tsx` — kilometer calculation display

## Key Conventions

- Almost all feature components use `'use client'` — server components are rare.
- Path alias `@/*` maps to `src/*`.
- UI text, variable names, and comments are in **Spanish**.
- Tire lists use TanStack React Table wrapped in the `DataTable` component from `src/components/ui/`.
- Modals for tire operations (assign, relocate, unassign, recover) follow a consistent pattern: a trigger button opens a controlled `<Dialog>` containing a React Hook Form.
- Navigation menu items are defined in `src/components/dashboard/layout/config.ts`.
- Color/status helpers in `src/utils/helpers.ts` drive all tire life visual indicators — use them consistently instead of hardcoding colors.
- Column definitions for tables live in `columns.tsx` files co-located with their route (`src/app/(app)/padron/columns.tsx`, `src/app/(app)/integrations/columns.tsx`, etc.).
