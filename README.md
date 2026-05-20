# GNotes

Aplicación personal de notas minimalista, rápida y autoalojable.

## Características

- Markdown puro con vista previa renderizada
- Autoguardado con debounce de 2s
- Frontmatter obligatorio en cada nota
- Nomenclatura de archivos basada en slug del título
- Búsqueda de notas
- Dark mode por defecto
- Sin backend — archivos `.md` directos en filesystem
- CSS puro, sin frameworks de UI

## Stack

- React + Vite
- CSS puro
- gray-matter (frontmatter)
- react-markdown (preview)
- Vitest (tests)

## Estructura

```
project/
├── app/                    # Aplicación frontend
│   ├── src/
│   │   ├── components/     # Sidebar, Editor
│   │   ├── utils/          # Slugs, parsing de notas
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── vite-notes-plugin.js
│   └── package.json
├── notes/                  # Notas en formato .md
│   ├── personal/
│   ├── proyectos/
│   └── inbox/
└── README.md
```

## Desarrollo

```bash
cd app
npm install
npm run dev
```

La app se abre en `http://localhost:3000/`.

## Tests

```bash
npm run test        # watch mode
npm run test:run    # una vez
```

## Atajos

| Atajo | Acción |
|-------|--------|
| `CMD/CTRL + .` | Toggle preview markdown |

## Formato de notas

Cada nota es un archivo `.md` con frontmatter obligatorio:

```md
---
title: Mi nota
tags:
  - tag1
  - tag2
updated: 2026-05-20
---

Contenido en markdown aquí...
```

El nombre del archivo se genera automáticamente desde el título (`mi-nota.md`).

## Docker (opcional)

Para self-hosted en homelab:

```yaml
services:
  gnotes:
    build: ./app
    ports:
      - "3000:3000"
    volumes:
      - ./notes:/app/notes
```

## Filosofía

- Sin backend, sin base de datos, sin API
- Tus notas son archivos que puedes abrir con cualquier editor
- IA-friendly: acceso directo al filesystem
- Minimalista: sin dashboards, sin widgets, sin iconografía recargada
