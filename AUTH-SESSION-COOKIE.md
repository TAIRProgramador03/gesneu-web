# AUTH · SESSION · COOKIE — Notas del sistema de autenticación

> Documentación del flujo de autenticación de Gesneu (frontend Next.js + backend Node/Express)
> y de los problemas resueltos. Palabras clave: **auth, sesión, cookie, connect.sid, proxy, 401**.

---

## 1. Arquitectura de autenticación (cómo funciona)

```
Browser (axios, /api/*, withCredentials)
   │  cookie connect.sid
   ▼
Next.js proxy  src/app/api/[...path]/route.ts   (runtime edge)
   │  reenvía Cookie + inyecta CF-Access-Client-Id/Secret
   ▼
Backend Express  (localhost:3001)  — 1 solo proceso (node server.js)
   │  express-session  →  session store
   ▼
Session store (en disco con session-file-store)
```

- **Sesión por cookie:** el backend setea `connect.sid` al hacer login (`req.session.user`).
- El frontend **nunca** pega al backend directo: usa rutas relativas `/api/...` que pasan por el proxy de Next.
- El proxy reenvía la cookie del request al backend y devuelve los `Set-Cookie` al browser.
- El middleware de auth del backend devuelve **401** cuando `!req.session.user`.

---

## 2. Problemas que tuvimos y cómo se diagnosticaron

| Síntoma | Causa raíz |
|---|---|
| Errores ODBC al cortar/reconectar WiFi | Pool ODBC del backend con conexiones muertas (no frontend) |
| Sesión "se caía" sola, 401 en todo | **MemoryStore en RAM** + reinicios del proceso la borraban |
| `sid` distinto en cada request, `user: NINGUNO` | El `connect.sid` del browser no existía en el store (store vacío) |
| Reinicios espontáneos del backend en dev | **nodemon vigilaba la carpeta `sessions/`** → cada escritura reiniciaba |
| 401 spam en el terminal de dev | Queries del dashboard disparando sin sesión (inofensivo, solo dev) |

**Clave del diagnóstico:** un log temporal en el backend que imprimía
`cookie SÍ/NO | sid | user` por request. Mostró que la cookie llegaba pero el
`sid` cambiaba cada vez → el store no la reconocía → store vacío por reinicio.

---

## 3. Cambios aplicados

### Frontend (este repo)

- **`src/app/api/[...path]/route.ts`** — proxy: reenvío de cookies con
  `response.headers.getSetCookie()` (array) en vez de `.get('set-cookie')`
  (que junta/corrompe cookies en runtime edge). GET y POST.
- **`src/app/layout.tsx`** — `QueryClient` con `retry` que NO reintenta en 4xx
  (cliente) y 1 vez en red/5xx. Montado `<AxiosInterceptorLoader />`.
- **`src/lib/auth/axios-interceptors.ts`** — interceptor global: al recibir **401**
  → toast "sesión expiró" + redirect a `/auth/sign-in`. Ignora `/api/login` y
  `/api/session` y no redirige si ya estás en `/auth/*`. Guard anti-loop.
- **`src/components/AxiosInterceptorLoader.tsx`** — monta el interceptor (antes
  era código muerto, nunca corría).
- **Indicador de conexión:** `src/hooks/use-connection-status.ts` +
  `src/components/dashboard/layout/connection-status.tsx` (badge en `main-nav.tsx`).
  Heartbeat a `/api/health`: online / baja señal / sin conexión.

### Backend (repo GESNEU_B)

- **session-file-store**: sesiones en disco (`./sessions/`), sobreviven reinicios.
  Config: `resave:false`, `saveUninitialized:false`, `rolling` off,
  `cookie.maxAge: 8h`, `secure:false` (HTTP interno), `sameSite:'lax'`, `httpOnly:true`.
- **`nodemon.json`**: ignora `sessions/` para que escribir sesiones no reinicie el proceso.
- **`/api/health`**: endpoint liviano (devuelve JSON 200) para el heartbeat.
  Importante: el proxy hace `response.json()` → el backend DEBE devolver JSON, no 204.
- Logs con timestamp en arranque y pool ODBC para detectar reinicios.

---

## 4. Qué resuelve a futuro

- **Deploys / reinicios:** los usuarios ya NO se deslogean cuando el backend reinicia.
- **Expiración de sesión (8h) o logout forzado:** el frontend redirige limpio a login
  con aviso, sin pantallas rotas ni spam de errores.
- **Cookies múltiples** (CSRF, refresh, etc.): el proxy ya las reenvía bien.
- **Menos carga al backend:** sin reintentos inútiles en errores 4xx.
- **Base para escalar:** si se crece a varios servidores, migrar de file-store a
  Redis (`connect-redis`) es directo. NO usar la BD IBM DB2 para sesiones (lenta).

---

## 5. Notas / gotchas para el próximo que toque esto

- El backend corre con **1 proceso** (`node server.js`). Si algún día se mete
  **pm2 cluster** o `cluster.fork()`, el file-store local NO se comparte entre
  workers → volverían los 401 intermitentes. En ese caso: Redis.
- El `connect.sid` se guarda para el **origen del proxy** (Next), no del backend.
- 401 en el terminal de dev **antes de loguear** = normal (no hay sesión).
  No sale en producción.
- El proxy corre en `runtime = 'edge'`: usar `getSetCookie()`, no `.get('set-cookie')`.
- `/api/health` debe responder **JSON** (el proxy hace `.json()` siempre).
