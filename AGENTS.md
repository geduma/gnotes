# GNotes — Instrucciones para Agentes

## Stack

- React 18 + Vite 5 + Vitest
- CSS puro (sin Tailwind, sin CSS-in-JS)
- Markdown: react-markdown 9
- Frontmatter: gray-matter 4
- API: Node HTTP nativo (sin Express)
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
app/
├── src/
│   ├── components/   # Sidebar.jsx, Editor.jsx
│   ├── utils/        # slug.js, note.js (+ .test.js)
│   ├── hooks/        # (vacio — reservado)
│   ├── App.jsx       # Estado global, orquestación
│   ├── main.jsx      # Entry point
│   └── index.css     # Todos los estilos
├── server.js         # API server (Node http nativo)
├── vite-notes-plugin.js  # API en dev (Vite middleware)
├── vite.config.js
└── package.json
```

## Patrones

- **Sidebar + Editor**: componentes puramente presentacionales, reciben props. `App.jsx` maneja todo el estado y la lógica de negocio.
- **Autosave**: `Editor.jsx` maneja debounce de 2s con `useEffect` + `setTimeout`. Compara con `prevSlugRef` y `lastSavedRef` para detectar cambios reales.
- **Key en Editor**: `<Editor key={activeNote.slug}>` fuerza remount al cambiar de nota.
- **API calls**: fetch nativo, sin axios ni react-query.
- **Slugs**: `generateUniqueSlug(title, existingSlugs)` desde `utils/slug.js`. Se usa tanto en frontend como en server.

## API

| Método | Ruta | Body |
|--------|------|------|
| GET | `/api/notes` | — |
| POST | `/api/notes` | `{ slug, content }` |
| PUT | `/api/notes/:slug` | `{ content, newSlug? }` |
| DELETE | `/api/notes/:slug` | — |

En dev las rutas las sirve `vite-notes-plugin.js` (lee de `notes/` en raíz del proyecto). En prod las sirve `server.js` (lee de `app/notes/`).

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
4. NO toques `vite-notes-plugin.js` a menos que el cambio lo requiera explícitamente.
5. NO borres archivos `.md` de notas del proyecto — están en `.gitignore` y son contenido del usuario.
6. Prefiere CSS puro + custom properties sobre librerías de UI.
7. Prefiere fetch nativo sobre librerías HTTP.
8. Prefiere el filesystem como almacenamiento sobre bases de datos.
9. Si modificas `server.js`, verifica que los cambios tengan equivalente en `vite-notes-plugin.js` para que dev y prod se mantengan sincronizados.
10. Los mensajes de commit deben ir en español, cortos y descriptivos.
