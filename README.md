# GNotes

Aplicación personal de notas minimalista, rápida y autoalojable.

## Características

- Markdown puro con vista previa renderizada
- Autoguardado con debounce de 2s
- Búsqueda de notas por título, cuerpo y tags
- Dark mode por defecto
- API externa con persistencia en MongoDB
- CSS puro, sin frameworks de UI

## Stack

- React + Vite
- CSS puro
- react-markdown (preview)
- Vitest (tests)
- API REST externa (`https://api.geduma.com`)

## Estructura

```
gnotes/
├── src/
│   ├── components/     # Sidebar, Editor
│   ├── utils/          # Slugs, API client
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
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

## Atajos

| Atajo | Acción |
|-------|--------|
| `CMD/CTRL + .` | Toggle preview markdown |

## API

La app consume una API REST externa. Documentación completa en `docs/02-migracion-api-externa.md`.

## Filosofía

- Minimalista: sin dashboards, sin widgets, sin iconografía recargada
- Rápida: respuesta instantánea en escritura y navegación
- Sin vendor lock-in: datos portables en MongoDB
