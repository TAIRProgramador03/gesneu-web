# GESNEU Design System Rules for Figma MCP Integration

> **Project:** GESNEU (Gestión de Neumáticos - Tire Management System)
> **Stack:** Next.js 14.2.4 + React 18.3.1 + TypeScript 5.5.2

---
****
## 1. Token Definitions

### Color Palettes

**Location:** `src/styles/theme/colors.ts`

Eight named palettes, each with 11-step ranges (50–950):

| Token Name    | Role              | Main (500)  | Light (50)  | Dark (950)  |
|---------------|-------------------|-------------|-------------|-------------|
| `tairBlue`    | Primary / Brand   | `#0068a7`   | `#e9f4fb`   | `#00121f`   |
| `nevada`      | Neutral / Secondary | mid-range | `#fbfcfe`   | `#090a0b`   |
| `kepple`      | Success / Teal    | teal        | `#f0fdfa`   | `#042f2c`   |
| `redOrange`   | Error / Danger    | red-orange  | `#fef3f2`   | `#460d09`   |
| `shakespeare` | Info              | blue        | `#ecfdff`   | `#082f44`   |
| `california`  | Warning / Accent  | orange      | `#fffaea`   | `#471701`   |
| `neonBlue`    | Alternative Blue  | neon blue   | `#ecf0ff`   | `#1e1650`   |
| `stormGrey`   | Additional Neutral| grey        | `#f9fafb`   | `#121621`   |

### Color Schemes (Light / Dark)

**Location:** `src/styles/theme/color-schemes.ts`

**Light Mode:**
- Background: `#ffffff`
- Primary: tairBlue (light: 400, main: 500, dark: 600)
- Secondary: nevada (light: 600, main: 700, dark: 800)
- Text Primary: `var(--mui-palette-neutral-900)`
- Text Secondary: `var(--mui-palette-neutral-500)`

**Dark Mode:**
- Background: `#111315`, Paper: `#181C20`
- Primary: tairBlue (light: 300, main: 400, dark: 500)
- Background levels: level1 `#23272B`, level2 `#343A40`, level3 `#495057`

### Tailwind CSS Variables (OKLch Color Space)

**Location:** `src/styles/tailwind.css`

Semantic CSS custom properties used by shadcn/ui components:

```css
--background, --foreground
--card, --card-foreground
--popover, --popover-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring
--chart-1 through --chart-5
--sidebar-* (background, foreground, primary, accent, border, ring)
```

Base radius: `--radius: 0.625rem`

### Typography

**Location:** `src/styles/theme/typography.ts`

- **Font Family:** `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`
- **Global override:** `Fredoka, Inter, sans-serif` (applied in `global.css` with `!important`)

| Token       | Size     | Weight | Line Height |
|-------------|----------|--------|-------------|
| `h1`        | 3.5rem   | 500    | 1.2         |
| `h2`        | 3rem     | 500    | 1.2         |
| `h3`        | 2.25rem  | 500    | 1.2         |
| `h4`        | 2rem     | 500    | 1.2         |
| `h5`        | 1.5rem   | 500    | 1.2         |
| `h6`        | 1.125rem | 500    | 1.2         |
| `body1`     | 1rem     | 400    | 1.5         |
| `body2`     | 0.875rem | 400    | 1.57        |
| `subtitle1` | 1rem     | 500    | 1.75        |
| `subtitle2` | 0.875rem | 500    | 1.57        |
| `caption`   | 0.75rem  | 400    | 1.66        |
| `overline`  | 0.75rem  | 500    | 2.5 (uppercase) |

### Spacing & Layout

- **Breakpoints:** `xs: 0, sm: 600, md: 900, lg: 1200, xl: 1500`
- **Border Radius:** MUI base `8px`, Tailwind base `0.625rem`
- **Sidebar width:** `280px` (desktop), `320px` (mobile)
- **Top nav height:** `56px`

### Shadows

**Location:** `src/styles/theme/shadows.ts`

24 levels, all using `rgba(0, 0, 0, 0.08)` base opacity. Example: `shadow[1] = '0px 1px 2px rgba(0, 0, 0, 0.08)'`

### Icon Size Variables

```css
--icon-fontSize-sm: 1rem;
--icon-fontSize-md: 1.25rem;
--icon-fontSize-lg: 1.5rem;
```

---

## 2. Component Library

### Location & Architecture

**Base UI Components:** `src/components/ui/` (27 components — shadcn/ui + Radix UI)
**Feature Components:** `src/components/dashboard/`, `src/components/padron/`, `src/components/auth/`
**Core/Provider Components:** `src/components/core/`
**Navigation:** `src/components/navegation/`, `src/components/dashboard/layout/`

### shadcn/ui Configuration

**File:** `components.json`

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/tailwind.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Key UI Components (shadcn/ui based)

| Component        | File                          | Notes                              |
|------------------|-------------------------------|------------------------------------|
| Button           | `ui/button.tsx`               | CVA variants: default, destructive, outline, secondary, primary, ghost, life, teal, indigo, warning, link |
| Dialog           | `ui/dialog.tsx`               | Radix UI Dialog                    |
| Select           | `ui/select.tsx`               | Radix UI Select                    |
| Checkbox         | `ui/checkbox.tsx`             | Radix UI Checkbox                  |
| Input            | `ui/input.tsx`                | Tailwind styled input              |
| DataTable        | `ui/data-table/data-table.tsx`| TanStack React Table wrapper       |
| Alert Dialog     | `ui/alert-dialog.tsx`         | Radix UI AlertDialog               |
| Dropdown Menu    | `ui/dropdown-menu.tsx`        | Radix UI DropdownMenu              |
| Tooltip          | `ui/tooltip.tsx`              | Radix UI Tooltip                   |
| Toaster          | `ui/sonner.tsx`               | Sonner with next-themes            |
| Spinner          | `ui/spinner.tsx`              | Lucide LoaderCircle animation      |
| Linear Progress  | `ui/LinearProgress.tsx`       | Custom progress bar                |

### Custom Badge Components

| Badge                  | Purpose                        | Values                                      |
|------------------------|--------------------------------|----------------------------------------------|
| `TipoMovimientoBadge` | Movement type status           | BAJA (red), ASIGNADO (blue), DISPONIBLE (green), TEMPORAL, REQUERIDO |
| `EsRecuperadoBadge`   | Recovery status                | SI (green) / NO (red)                        |
| `TipoRetenBadge`      | Retention type                 | Varies                                       |
| `TipoTerrenoBadge`    | Terrain type                   | Varies                                       |

### MUI Component Overrides

**Location:** `src/styles/theme/components/`

| Component       | Key Override                                        |
|-----------------|-----------------------------------------------------|
| `MuiButton`     | `borderRadius: 12px`, `textTransform: none`          |
| `MuiCard`       | `borderRadius: 20px`                                 |
| `MuiCardContent`| `padding: 32px 24px`                                 |
| `MuiAvatar`     | `fontSize: 14px`, `fontWeight: 600`                  |
| `MuiTab`        | `fontSize: 14px`, `fontWeight: 500`, margin `24px`   |
| `MuiLink`       | `underline: hover`                                   |

### Utility Function

**File:** `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**No Storybook or component documentation exists.**

---

## 3. Frameworks & Libraries

### Core Stack

| Category           | Library                          | Version    |
|--------------------|----------------------------------|------------|
| Framework          | Next.js (App Router)             | 14.2.4     |
| UI Library         | React                            | 18.3.1     |
| Language           | TypeScript                       | 5.5.2      |
| Build System       | Next.js built-in (SWC compiler)  | —          |

### UI & Styling

| Category           | Library                          | Version    |
|--------------------|----------------------------------|------------|
| Component Library  | Material-UI (MUI)                | 5.15.20    |
| Headless Components| Radix UI (via shadcn/ui)         | Latest     |
| CSS Framework      | Tailwind CSS                     | 4.1.18     |
| CSS-in-JS          | Emotion                          | 11.11.4    |
| Class Utilities    | clsx + tailwind-merge            | —          |
| Variants           | class-variance-authority (CVA)   | 0.7.1      |
| Theme Switching    | next-themes                      | 0.4.6      |
| Animations         | tailwindcss-animate              | 1.0.7      |

### Data & State

| Category           | Library                          | Version    |
|--------------------|----------------------------------|------------|
| Server State       | TanStack React Query             | 5.90.20    |
| HTTP Client        | Axios                            | 1.8.4      |
| Forms              | React Hook Form                  | 7.52.0     |
| Validation         | Zod                              | 3.23.8     |
| Date/Time          | Day.js                           | 1.11.11    |

### Charts & Visualization

| Library            | Version    |
|--------------------|------------|
| Recharts           | 3.0.0      |
| ApexCharts         | 3.49.2     |
| Plotly.js          | 3.0.1      |

### Drag & Drop

| Library             | Version   |
|---------------------|-----------|
| @dnd-kit/core       | 6.3.1     |
| @dnd-kit/sortable   | 10.0.0    |
| react-dnd           | 16.0.1    |

---

## 4. Asset Management

### Static Assets

**Location:** `public/assets/`

All assets are self-hosted — no CDN. Images referenced via Next.js `<Image>` component or HTML `<img>` tags.

**Asset Categories:**
- **Logos:** `logo.svg`, `logo--dark.svg`, `logo-emblem.svg`, `logo-emblem--dark.svg`
- **Domain Images:** `tire.png`, `neumatico.png`, `vehiculo.png`, `car-diagram.png`, etc.
- **Branding:** `tair_renting.png`, `icon-tair-2.png`
- **Error Pages:** `error-401.png`, `error-404.png`, `error-500.png`
- **Auth:** `gemini-login.png`, `gemini-login2.png`

**Favicon:** `public/favicon.ico` (also uses `public/assets/icon-tair-2.png` via link tag)

### Image Usage Pattern

```tsx
import Image from 'next/image';

<Image src="/assets/logo.svg" width={120} height={40} alt="Gesneu Logo" />
```

### Fonts (Self-Hosted via @fontsource)

| Font                  | Package                         | Weights     |
|-----------------------|---------------------------------|-------------|
| Inter                 | `@fontsource/inter`             | 100–900     |
| Fredoka               | `@fontsource/fredoka`           | 300–700     |
| Plus Jakarta Sans     | `@fontsource/plus-jakarta-sans` | (available) |
| Roboto Mono           | `@fontsource/roboto-mono`       | (available) |

---

## 5. Icon System

### Three Icon Libraries Used

**1. Phosphor Icons** (Most prevalent — 31 files)
```tsx
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
// SSR variant preferred for server components
```

**2. Lucide React** (Default for shadcn/ui — 16 files)
```tsx
import { Car, User2Icon, LayoutDashboardIcon } from 'lucide-react';
```

**3. MUI Icons Material** (17 files)
```tsx
import WarningIcon from '@mui/icons-material/Warning';
```

**4. Custom SVG Icons** (2 components)
- `src/components/icons/Dashboard.tsx`
- `src/components/icons/Tyre.tsx`

### Navigation Icon Registry

**File:** `src/components/dashboard/layout/nav-icons.tsx`

Maps string keys to icon components for navigation configuration:
```
'chart-pie' → ChartPieIcon
'users' → UsersIcon
'plugs-connected' → PlugsConnectedIcon
'user' → UserIcon
// etc.
```

---

## 6. Styling Approach

### Hybrid System

The project uses **three styling approaches** simultaneously:

#### A. Tailwind CSS (Primary for new components)

Used via utility classes with `cn()` helper for class merging:
```tsx
<div className={cn("flex items-center gap-2 rounded-lg p-4", className)}>
```

#### B. Material-UI / Emotion (Dashboard and legacy components)

Used with MUI's `sx` prop and Emotion `styled()`:
```tsx
<Box sx={{ p: 2, display: 'flex', gap: 1 }}>
<Card sx={{ borderRadius: '20px' }}>
```

#### C. Emotion styled components (Modals and overlays)

```tsx
const ModalOverlay = styled('div')({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 1300,
});
```

### Global Styles

**File:** `src/styles/global.css`
- Font imports (Inter, Fredoka)
- Global font-family override
- Icon size CSS variables
- Focus styling (2px solid primary outline)
- Smooth scrolling, 100% height

**File:** `src/styles/tailwind.css`
- Tailwind v4 directives
- CSS custom properties (light/dark modes)
- Custom radius tokens
- Semantic color tokens

### Responsive Design

- **MUI Breakpoints:** `xs: 0, sm: 600, md: 900, lg: 1200, xl: 1500`
- **Tailwind Breakpoints:** Default Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
- **Sidebar:** Desktop fixed sidebar (280px) collapses; Mobile uses drawer (320px)
- **CSS Variables:** `--SideNav-width: 280px`, `--MainNav-height: 56px`

---

## 7. Project Structure

```
src/
├── api/                    # API client functions (Axios-based)
│   └── Neumaticos.ts      # Tire management API (470 lines, 30+ endpoints)
│
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Redirects to /dashboard
│   ├── auth/               # Authentication pages (sign-in, sign-up, reset)
│   ├── dashboard/          # Dashboard overview + settings
│   ├── padron/             # Tire registry (padrón) pages
│   │   └── neumatico/[codigo]/  # Dynamic tire detail route
│   ├── account/            # User profile
│   ├── integrations/       # Tire movements management
│   ├── errors/             # Error pages
│   └── api/[...path]/      # API proxy route (Edge Runtime)
│
├── components/
│   ├── ui/                 # shadcn/ui base components (27 files)
│   │   └── data-table/     # Advanced data table (TanStack React Table)
│   ├── auth/               # Auth guards and forms
│   ├── core/               # Providers, logo, theme, utility components
│   ├── dashboard/
│   │   ├── layout/         # SideNav, MainNav, MobileNav, UserPopover
│   │   ├── overview/       # Dashboard stat cards
│   │   ├── integrations/   # 15 modal components for tire operations
│   │   ├── customer/       # Customer/data table components
│   │   └── account/        # Account forms
│   ├── navegation/         # SideBarMain layout wrapper
│   ├── icons/              # Custom SVG icons (Dashboard, Tyre)
│   └── padron/             # Tire registry components
│
├── contexts/               # React Context **providers**
│   ├── user-context.tsx    # Authentication state
│   ├── side-bar.context.tsx # Sidebar UI state
│   └── session-error-context.tsx
│
├── hooks/                  # Custom React hooks
│   ├── use-user.ts         # UserContext consumer
│   ├── use-neu-stats.tsx   # Batch statistics queries (useQueries)
│   ├── use-existe-neumatico.tsx # Tire verification
│   ├── use-side-bar.tsx    # Sidebar state
│   ├── use-popover.ts      # Popover UI state
│   └── use-selection.ts    # Multi-select state
│
├── lib/
│   ├── utils.ts            # cn(), date formatters
│   ├── auth/               # Auth API client, Axios interceptors
│   ├── logger.ts           # Logging
│   └── is-nav-item-active.ts
│
├── styles/
│   ├── global.css          # Global CSS + font imports
│   ├── tailwind.css        # Tailwind directives + CSS variables
│   └── theme/              # MUI theme system
│       ├── create-theme.ts # Theme factory
│       ├── colors.ts       # Color palettes (8 palettes, 11 steps each)
│       ├── color-schemes.ts # Light/dark scheme mapping
│       ├── typography.ts   # Typography tokens
│       ├── shadows.ts      # Shadow tokens (24 levels)
│       └── components/     # MUI component overrides
│
├── types/                  # TypeScript type definitions
│   ├── neumatico.ts        # Tire types (30+ properties)
│   ├── padron.ts           # Registry types
│   ├── inspecciones.ts     # Inspection types
│   └── user.ts             # User types
│
├── utils/
│   ├── export-to-excel.ts  # Excel export utility
│   └── tire-utils.ts       # Tire-specific utilities
│
├── config.ts               # App config (site name: "Gesneu")
└── paths.ts                # Route path definitions
```

### Feature Organization Pattern

- **Page-level:** Each route has its own directory under `src/app/`
- **Layout wrapping:** Protected routes use `SideBarMain` → `AuthGuard`
- **Components by feature:** Domain components in `src/components/dashboard/integrations/` (modal-heavy)
- **Shared components:** `src/components/ui/` for reusable primitives
- **Data layer:** API functions in `src/api/`, consumed via React Query hooks

### Provider Nesting Order (Root Layout)

```
QueryClientProvider (staleTime: 60s)
  └── LocalizationProvider
  └── UserProvider
  └── ThemeProvider (MUI CssVarsProvider + Emotion)
  └── TooltipProvider (Radix)
  └── SideBarProvider
  └── children
  └── Toaster (Sonner)
  └── ReactQueryDevtools
```

---

## Integration Guidelines for Figma → Code

### When converting Figma designs to code:

1. **Use shadcn/ui components** (`src/components/ui/`) for new UI elements — they are the modern standard in this project
2. **Use Tailwind CSS** utility classes as the primary styling approach for new components
3. **Use `cn()` utility** from `src/lib/utils.ts` for conditional/merged class names
4. **Use Lucide icons** as default (configured in `components.json`); Phosphor Icons for SSR contexts
5. **Map Figma colors** to the existing palette tokens in `src/styles/theme/colors.ts` or Tailwind CSS variables
6. **Follow MUI overrides** for Card (20px radius), Button (12px radius, no text-transform) when using MUI components
7. **Use `next/image`** for images, referencing `/assets/` path
8. **Font:** Fredoka primary, Inter secondary — both self-hosted via @fontsource
9. **Responsive:** Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) and MUI breakpoints
10. **Data tables:** Use the existing DataTable component in `src/components/ui/data-table/`
11. **Forms:** Use React Hook Form + Zod for form management
12. **Toasts:** Use Sonner via `toast()` from `sonner` package
13. **Path aliases:** Use `@/` prefix (maps to `src/`) for all imports
