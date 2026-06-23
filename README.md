# GNotes

Aplicación personal de notas minimalista, rápida y autoalojable.

## Características

- Editor WYSIWYG con barra de formato flotante y modal para links
- Autoguardado con debounce de 2s
- Búsqueda de notas por título, cuerpo y tags
- Dark mode por defecto
- Login OAuth (Google, GitHub, Microsoft) para persistencia cloud
- Almacenamiento local offline (IndexedDB)
- API REST con owner (SHA-256 del email)
- CSS puro, sin frameworks de UI

## Stack

- React + Vite
- CSS puro
- turndown (HTML → Markdown para el editor WYSIWYG)
- Vitest (tests)
- API REST externa (`https://api.geduma.com`)
- Auth: OAuth (geduma-auth) + JWT single-use
- IndexedDB nativo (local storage)
- Web Crypto API (SHA-256)

## Estructura

```
gnotes/
├── src/
│   ├── components/     # Sidebar, Editor, LoginModal, ConfirmModal, Spinner
│   ├── hooks/          # useAuth
│   ├── utils/          # slug.js, api.js, hash.js, local-db.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── test/               # api.test.js, slug.test.js, hash.test.js
├── vite.config.js
├── package.json
├── index.html
└── public/
```

## Desarrollo

```bash
npm install
npm run dev
```

La app se abre en `http://localhost:5173/`.

## Tests

```bash
npm run test        # watch mode
npm run test:run    # una vez
```

## Variables de Entorno

```
VITE_AUTH_KEY=...              # API key para POST /auth
VITE_APP_ID=app_mqpon84ym0hbvi # App ID para geduma-auth
```

## API

La app consume una API REST externa. Documentación completa en `PRD.md`.

## Filosofía

- Minimalista: sin dashboards ni widgets
- Rápida: respuesta instantánea
- Offline-first: sin cuenta, persistencia local
- Sin vendor lock-in: datos portables
