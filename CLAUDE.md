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
- **MUI v5** + **shadcn/ui** + **Tailwind CSS 4** — mixed UI layer; MUI handles theme/layout, shadcn components live in `src/components/ui/`, Tailwind for utility styling
- **TanStack React Query v5** for server state, **React Hook Form** + **Zod** for forms
- **Axios** for HTTP, with interceptors in `src/lib/auth/axios-interceptors.ts`
- **ApexCharts / Recharts / Plotly.js** for charts; use whichever is already in the relevant module
- **dayjs** configured for Spanish locale

### API Layer

All backend calls live in `src/api/Neumaticos.ts`. This single file exports typed functions covering every domain: tires (neumáticos), vehicles (vehículos), assignments, inspections, movements, reports, and Excel imports. Always add new endpoints here.

The Next.js API proxy at `src/app/api/[...path]/route.ts` forwards requests to the backend, injecting Cloudflare Access headers. Client code hits `/api/...` — never the backend URL directly from the browser.

### Authentication

Custom session-based auth (`src/lib/auth/`). `UserContext` (`src/contexts/user-context.tsx`) holds the authenticated user. Protected pages check this context; unauthenticated users are redirected to `/auth/sign-in`. Auth API lives in `src/lib/auth/auth-api.ts`.

### Routing & Pages (`src/app/`)

| Path | Description |
|---|---|
| `/` | Redirects to dashboard |
| `/auth/*` | Sign-in, sign-up, reset-password |
| `/dashboard` | Main analytics dashboard |
| `/padron/neumatico/[codigo]` | Individual tire detail page |

Route constants are centralized in `src/paths.ts`.

### Component Organization (`src/components/`)

- `padron/neumatico/` — tire detail components (hero, charts, KPI cards, technical specs)
- `dashboard/` — dashboard section components
- `ui/` — shadcn/ui primitives (data-table, etc.)
- `navegation/` — sidebar and nav components
- `auth/` — authentication forms and guards
- `core/` — theme provider, settings

### Types

`src/types/types.ts` is the primary type file. Domain-specific types for `Neumatico`, `Vehiculo`, `User`, inspections, and padron are split across `src/types/`.

### Utilities

- `src/utils/helpers.ts` — general helpers
- `src/utils/tire-utils.ts` — tire-specific calculations
- `src/utils/export-to-excel.ts` — Excel export using `xlsx-js-style`
- `src/lib/utils.ts` — shadcn/ui `cn()` helper

## Key Conventions

- Almost all feature components use `'use client'` — server components are rare.
- Path alias `@/*` maps to `src/*`.
- UI text, variable names, and comments are in **Spanish**.
- Tire lists use TanStack React Table wrapped in the `DataTable` component from `src/components/ui/`.
- Modals for tire operations (assign, relocate, unassign, recover) follow a consistent pattern: a trigger button opens a controlled `<Dialog>` containing a React Hook Form.
