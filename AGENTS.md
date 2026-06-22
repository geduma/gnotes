# GNotes — Instrucciones para Agentes

## Stack

- React 18 + Vite 5 + Vitest
- CSS puro (sin Tailwind, sin CSS-in-JS)
- Markdown: react-markdown 9
- API externa: `https://api.geduma.com`
- Auth: JWT single-use vía `POST /auth`
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
│   ├── components/   # Sidebar.jsx, Editor.jsx
│   ├── utils/        # slug.js, api.js (+ .test.js)
│   ├── hooks/        # (vacio — reservado)
│   ├── App.jsx       # Estado global, orquestación
│   ├── main.jsx      # Entry point
│   └── index.css     # Todos los estilos
├── vite.config.js
├── package.json
├── index.html
└── public/
```

## Patrones

- **Sidebar + Editor**: componentes puramente presentacionales, reciben props. `App.jsx` maneja todo el estado y la lógica de negocio.
- **Autosave**: `Editor.jsx` maneja debounce de 2s con `useEffect` + `setTimeout`. Compara con `prevSlugRef` y `lastSavedRef` para detectar cambios reales.
- **Key en Editor**: `<Editor key={activeNote.slug}>` fuerza remount al cambiar de nota.
- **API calls**: fetch nativo desde `utils/api.js`, JWT single-use (refresh antes de cada request).
- **Slugs**: `generateUniqueSlug(title, existingSlugs)` desde `utils/slug.js`.
- **Búsqueda**: client-side (filtra por title + body + tags).

## API

| Método | Ruta | Auth | Body |
|--------|------|------|------|
| POST | `/auth` | ❌ | `{ name, user, key }` |
| GET | `/gnotes` | Bearer | — |
| GET | `/gnotes?q=` | Bearer | — |
| POST | `/gnotes` | Bearer | `{ slug, title, body, tags, updated }` |
| PUT | `/gnotes/:slug` | Bearer | `{ title?, body?, tags?, updated?, newSlug? }` |
| DELETE | `/gnotes/:slug` | Bearer | — |

Base URL: `https://api.geduma.com` (producción) o `http://localhost:3000` (desarrollo).

## Tests

```bash
npm run test         # watch mode
npm run test:run     # una vez
```

- Test files: `*.test.js` junto al módulo.
- Framework: Vitest + jsdom.
- Sin Testing Library — lógica pura sin DOM en tests unitarios.

## Reglas para Agentes

1. NO agregues comentarios al código.
2. NO agregues TypeScript ni cambies extensiones a `.tsx`.
3. NO añadas dependencias nuevas sin verificar que valen la pena.
4. Los mensajes de commit deben ir en español, cortos y descriptivos.
5. Prefiere CSS puro + custom properties sobre librerías de UI.
6. Prefiere fetch nativo sobre librerías HTTP.
