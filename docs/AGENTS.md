# GNotes — Instrucciones para Agentes

## Stack

- React 18 + Vite 5 + Vitest
- CSS puro (sin Tailwind, sin CSS-in-JS)
- Markdown: turndown (HTML→Markdown para editor WYSIWYG)
- API externa: `https://api.geduma.com`
- Auth: JWT single-use vía `POST /auth` + OAuth social vía `geduma-auth`
- Almacenamiento local: IndexedDB nativo (sin librerías)
- Hash: Web Crypto API (SubtleCrypto) para SHA-256
- Idioma: Español (UI, commits, docs)

## Convenciones de Código

- Extensiones `.jsx` para componentes React, `.js` para el resto.
- Nombres de componentes en PascalCase, funciones/variables en camelCase.
- Sin TypeScript.
- Sin comentarios en código.
- CSS en `index.css` con custom properties para el tema oscuro.
- Estados con `useState`, efectos con `useEffect`, refs con `useRef`.
- Props desestructuradas en la firma del componente.

## Estructura

```
gnotes/
├── src/
│   ├── components/   # Sidebar.jsx, Editor.jsx, LoginModal.jsx, ConfirmModal.jsx, Spinner.jsx
│   ├── hooks/        # useAuth.js — login, session, localStorage
│   ├── utils/        # slug.js, api.js, hash.js, local-db.js
│   ├── App.jsx       # Estado global, orquestación, lógica dual
│   ├── main.jsx      # Entry point
│   └── index.css     # Todos los estilos
├── test/             # api.test.js, slug.test.js, hash.test.js
├── vite.config.js
├── package.json
├── index.html
└── public/
```

## Patrones

- **Sidebar + Editor**: componentes puramente presentacionales, reciben props. `App.jsx` maneja todo el estado y la lógica de negocio.
- **Autosave**: `Editor.jsx` maneja debounce de 2s con `useEffect` + `setTimeout`. Compara con `prevSlugRef` y `lastSavedRef` para detectar cambios reales.
- **Key en Editor**: `<Editor key={activeNote.slug}>` fuerza remount al cambiar de nota.
- **useCallback en props de Editor**: `updateExistingNote`, `saveNewNote` y `deleteExistingNote` están envueltas en `useCallback` para evitar reseteos del debounce del Editor en cada render de App.
- **Errores visibles**: toda operación API que falle debe llamar a `setError()` para que el usuario vea el error. Nunca silenciar con `console.error` únicamente.
- **API calls**: fetch nativo desde `utils/api.js`, JWT single-use (refresh antes de cada request). Owner se pasa en cada endpoint.
- **Slugs**: `generateUniqueSlug(title, existingSlugs)` desde `utils/slug.js`.
- **Búsqueda**: client-side (filtra por title + body + tags).
- **Dos fuentes de datos**: sin usuario logueado usa IndexedDB local; logueado usa API con ownerHash.
- **Notas nuevas**: se crean localmente (sin API). Se persisten al primer edit (autosave).
- **LoginModal con spinner**: al cargar providers (inline) y al hacer clic en un provider (spinner en botón + deshabilitar todos los demás).

## API - Auth (geduma-auth)

```
GET  /auth/providers/{appId}        → Lista de providers OAuth disponibles
POST /auth/login/{appId}/{providerId} → URL de redirección al provider
GET  /auth/session/{sessionToken}   → Datos del usuario (single-use)
```

Base URL: `https://api.geduma.com`
APP_ID: desde `VITE_APP_ID` en `.env`

⚠️ El `session_token` se recibe como **fragmento (hash)** de la URL, no como query param. Se lee desde el cliente con `window.location.hash` + `URLSearchParams`, sin viajar al servidor. Ej: `https://miapp.com/callback#session_token=uuid-xxx`

## API - Notas

| Método | Ruta | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/gnotes?owner=&q=` | Bearer | query params opcionales |
| POST | `/gnotes` | Bearer | `{ slug, title, body, tags, updated, owner }` |
| PUT | `/gnotes/:slug` | Bearer | `{ title?, body?, tags?, updated?, newSlug?, owner }` |
| DELETE | `/gnotes/:slug?owner=` | Bearer | query param `owner` |

- `owner` = SHA-256 del email del usuario.
- GET sin `?owner=` retorna todas las notas.
- PUT/DELETE validan ownership (403 si no coincide).

## Almacenamiento Local (IndexedDB)

Base: `gnotes-local` / Store: `notes` (keyPath: `slug`)
Funciones en `src/utils/local-db.js`:
- `getAllNotes()` — retorna todas ordenadas por updated descendente
- `createNote(data)` — add al store
- `updateNote(slug, fields)` — merge con existente + put
- `deleteNote(slug)` — delete del store

## Variables de Entorno

```
VITE_API_AUTH_KEY=...          # API key para POST /auth
VITE_APP_ID=app_mqpon84ym0hbvi # App ID para geduma-auth
```

## Tests

```bash
npm run test         # watch mode
npm run test:run     # una vez
```

- Test files: `test/*.test.js`
- Framework: Vitest + jsdom.
- Sin Testing Library — lógica pura sin DOM en tests unitarios.

## Reglas para Agentes

1. NO agregues comentarios al código.
2. NO agregues TypeScript ni cambies extensiones a `.tsx`.
3. NO añadas dependencias nuevas sin verificar que valen la pena.
4. Los mensajes de commit deben ir en español, cortos y descriptivos.
5. Prefiere CSS puro + custom properties sobre librerías de UI.
6. Prefiere fetch nativo sobre librerías HTTP.
