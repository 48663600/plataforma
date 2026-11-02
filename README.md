# AcademiQ — Sistema de Gestión Escolar

Plataforma escolar para el colegio Wellmann: alumnos, calificaciones por bimestre, asistencia,
boletines imprimibles, cuadros generales en Excel, reportes de conducta, avisos y chat docente.
Tiene tres perfiles: **Director**, **Docente** y **Alumno**.

## Dos modos de funcionamiento

| Modo | Cuándo se usa | Dónde se guardan los datos |
|---|---|---|
| **Demostración** | Sin `VITE_API_URL` (así se publica en GitHub Pages) | En el navegador de cada usuario (`localStorage`) |
| **Servidor** | Con `VITE_API_URL` apuntando al backend | PostgreSQL (Supabase), compartido entre todos |

GitHub Pages solo sirve archivos estáticos, así que ahí la app corre completa en el navegador.
Para que varios docentes trabajen sobre los **mismos datos** hay que publicar el backend
(ver más abajo) y definir `VITE_API_URL`.

### Credenciales de demostración

| Perfil | Usuario | Contraseña |
|---|---|---|
| Director | `admin@academiq.edu` | `admin2026` |
| Docente | `ana.garcia@academiq.edu` | `Ana2026` |
| Alumno | `valentina.perez` | `Valentina2026` |

En la pantalla de inicio, "Restablecer datos" vuelve a los datos de ejemplo.

## Publicar en GitHub Pages

1. **Settings → Pages → Build and deployment → Source: "GitHub Actions"** (una sola vez).
2. Haz merge a `main`. El workflow `.github/workflows/static.yml` ejecuta las pruebas, compila
   `frontend/` y publica `frontend/dist`.
3. El sitio queda en `https://<usuario>.github.io/plataforma/`.

Opcional: en **Settings → Secrets and variables → Actions → Variables** crea `VITE_API_URL`
con la URL pública del backend para que el sitio use el modo servidor.

## Desarrollo local

Requisitos: Node.js 20.

```bash
# Solo frontend (modo demostración)
cd frontend
npm install
npm run dev          # http://localhost:5173
npm test             # pruebas unitarias
```

```bash
# Backend
cd backend
cp .env.example .env   # completa JWT_SECRET; DATABASE_URL es opcional
npm install
npm run db:setup       # con DATABASE_URL: crea la tabla y carga datos iniciales
# o, sin base de datos:
npm run db:seed        # guarda en backend/data/state.json
npm run dev            # http://localhost:3000
npm test
```

Luego, en `frontend/.env`: `VITE_API_URL=http://localhost:3000`.

`npm run db:seed` genera contraseñas aleatorias para las cuentas iniciales y las muestra **una
sola vez** en consola. Si ya hay datos no hace nada; `npm run db:seed -- --force` los reemplaza.

Con Docker: `cp backend/.env.example backend/.env`, completa `JWT_SECRET` y ejecuta
`docker compose up --build`.

## Estructura

```
frontend/                 React 18 + Vite
  src/
    App.jsx               Estructura general: sesión, menú, guardado automático
    config/navigation.js  Menú por rol
    pages/                Una página por sección (Alumnos, Calificaciones, Boletines…)
    components/           Avatar, fondo, panel de notificaciones
    lib/                  Cálculo de notas, roles, contraseñas, reglas de acceso
    services/             dataService (elige el modo), api.js, localBackend.js
    data/initialData.js   Datos de demostración
    styles/theme.js       Estilos (claro/oscuro, móvil, impresión)
  tests/                  Pruebas (Vitest)
backend/                  Express + Prisma
  src/server.js           API: /api/auth/login, /api/state (GET/PUT)
  src/stateRules.js       Qué puede ver y modificar cada rol
  src/password.js         Verificación bcrypt / PBKDF2
  src/state.js            PostgreSQL (con DATABASE_URL) o archivo JSON
  prisma/                 Esquema y datos iniciales
  tests/                  Pruebas de la API (node:test)
```

## Seguridad

- Las contraseñas se guardan cifradas (bcrypt en el servidor, PBKDF2 en el navegador) y
  **nunca** se envían al navegador. El director no puede verlas: solo restablecerlas (🔑), y la
  nueva se muestra una sola vez. Al importar alumnos desde Excel se descarga un archivo con sus
  credenciales iniciales.
- El servidor aplica los permisos: un docente solo modifica tareas, notas, asistencia, reportes,
  avisos y chat; no puede tocar usuarios, alumnos, grados ni cursos. Un alumno solo recibe sus
  propios datos y no puede guardar nada.
- El login se bloquea temporalmente tras 10 intentos fallidos desde la misma IP.
- Los secretos van en `backend/.env` (ignorado por git), nunca en el código.
- En modo demostración todo vive en el navegador: sirve para probar, **no** para datos reales
  de alumnos.

## Limitaciones conocidas

- En modo servidor todo el estado del colegio es un solo documento JSON: si dos personas guardan
  al mismo tiempo, gana el último guardado. Para muchos usuarios simultáneos conviene migrar a
  tablas normalizadas (el modelo `Usuario` del esquema está reservado para eso).
- `xlsx@0.18.5` (SheetJS en npm) tiene vulnerabilidades conocidas al leer archivos manipulados.
  Las versiones corregidas solo se publican en `https://cdn.sheetjs.com`. Importa solo archivos
  de confianza.
