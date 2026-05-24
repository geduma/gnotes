# PRD — GNotes

> **Product Requirements Document**
> Versión: 1.0 | Fecha: 2026-05-24 | Autor: Felipe

---

## 1. Resumen Ejecutivo

GNotes es una aplicación web autoalojable de notas, minimalista y orientada a archivos. Las notas se almacenan como archivos `.md` plano con frontmatter YAML en el sistema de archivos, sin base de datos ni backend complejo. El objetivo es ofrecer una experiencia de edición rápida y silenciosa que priorice la escritura sobre la gestión visual.

---

## 2. Problema

Las herramientas existentes de notas (Notion, Obsidian, Evernote, etc.) presentan problemas para un perfil técnico que valora:

- **Portabilidad**: formatos propietarios que dificultan migrar o acceder desde otro editor.
- **Complejidad**: sobrecarga de features, dashboards, widgets, AI assistants no solicitados.
- **Dependencia de cloud**: datos en servidores de terceros sin control real.
- **Fricción**: tiempos de carga, animaciones, actualizaciones automáticas que interrumpen el flujo.

Se necesita una herramienta que:

- Sea **instantánea** al abrir y al escribir.
- Almacene notas como archivos de texto plano accesibles desde cualquier editor (vim, VSCode, cat).
- Permita **auto-alojarse** en un homelab o VPS mínimo.
- Sea **IA-friendly**: un agente puede leer/escribir archivos `.md` directamente sin pasar por una API.

---

## 3. Usuarios Objetivo

| Tipo | Descripción |
|------|-------------|
| **Persona principal** | Desarrollador/DevOps que quiere un sistema de notas técnico, versionable con git, y sin vendor lock-in. |
| **Persona secundaria** | Usuario técnico que self-hostea servicios en un homelab (Raspberry Pi, VPS) y quiere integración futura con flujos automatizados. |
| **No target** | Usuarios no técnicos que esperan una experiencia tipo Notion con WYSIWYG, colaboración en tiempo real, o app mobile. |

---

## 4. User Stories

### MVP (Actual)

| ID | Historia | Prioridad |
|----|----------|-----------|
| US-01 | Como usuario, quiero crear una nota para capturar una idea rápidamente. | P0 |
| US-02 | Como usuario, quiero editar una nota en Markdown con vista previa para darle formato. | P0 |
| US-03 | Como usuario, quiero que mi nota se guarde automáticamente para no perder cambios. | P0 |
| US-04 | Como usuario, quiero eliminar una nota que ya no necesito. | P0 |
| US-05 | Como usuario, quiero buscar entre mis notas para encontrar información rápido. | P0 |
| US-06 | Como usuario, quiero etiquetar mis notas con tags para organizarlas. | P0 |
| US-07 | Como usuario, quiero que las notas sean archivos `.md` en el filesystem para poder editarlas con cualquier herramienta. | P0 |
| US-08 | Como usuario, quiero acceder a la app desde cualquier dispositivo en mi red local. | P0 |

### Fase 2 — Organización

| ID | Historia | Prioridad |
|----|----------|-----------|
| US-09 | Como usuario, quiero agrupar notas en carpetas para mantener el filesystem ordenado. | P1 |
| US-10 | Como usuario, quiero mover notas entre carpetas desde la UI. | P1 |
| US-11 | Como usuario, quiero que el sidebar refleje la estructura de directorios del filesystem. | P1 |

### Fase 3 — UX

| ID | Historia | Prioridad |
|----|----------|-----------|
| US-12 | Como usuario, quiero un atajo de teclado para crear una nota sin tocar el mouse. | P1 |
| US-13 | Como usuario, quiero un editor más cómodo (code mirror, syntax highlight). | P2 |
| US-14 | Como usuario, quiero poder cambiar el tamaño del panel de preview. | P2 |
| US-15 | Como usuario, quiero drag & drop de imágenes al editor. | P3 |

### Fase 4 — AI

| ID | Historia | Prioridad |
|----|----------|-----------|
| US-16 | Como usuario, quiero que un agente IA genere un resumen de mi nota. | P2 |
| US-17 | Como usuario, quiero auto-tagging sugerido por IA basado en el contenido. | P2 |
| US-18 | Como usuario, quiero un grafo de conocimiento que relacione mis notas automáticamente. | P3 |

---

## 5. Features

### 5.1 MVP (Implementado)

| Feature | Descripción | Estado |
|---------|-------------|--------|
| Crear nota | Genera slug desde el título, crea archivo `.md` con frontmatter. | ✅ |
| Editar nota | Editor de texto + preview Markdown lado a lado. | ✅ |
| Autosave | Debounce de 2s al cambiar título, contenido o tags. | ✅ |
| Guardado manual | Botón "Save" para guardado explícito. | ✅ |
| Indicador saved/unsaved | Muestra estado visual de cambios no guardados. | ✅ |
| Eliminar nota | DELETE con confirmación implícita. | ✅ |
| Búsqueda | Filtra por título + cuerpo + tags (case-insensitive). | ✅ |
| Tags | Input tipo chips, persistencia en frontmatter. | ✅ |
| Renombrar | Cambiar título actualiza el slug y renombra el archivo. | ✅ |
| Atajo de teclado | `CMD/CTRL + .` toggle preview. | ✅ |
| Dark mode | Tema oscuro por defecto. | ✅ |
| Responsive | Adaptable a mobile (breakpoint 768px). | ✅ |
| API REST | CRUD completo via `/api/notes`. | ✅ |
| Sin dependencias backend | Servidor HTTP nativo (sin Express). | ✅ |

### 5.2 Futuras (Roadmap)

| Feature | Descripción | Prioridad |
|---------|-------------|-----------|
| Estructura de carpetas | Navegación y organización por directorios. | P1 |
| Drag & drop imágenes | Subida de imágenes al filesystem. | P2 |
| Editor mejorado | CodeMirror, highlighting, line numbers. | P2 |
| Atajo crear nota | `CMD + N` para nueva nota. | P1 |
| Modo oscuro/claro | Toggle de tema. | P2 |
| Resúmenes IA | Generación de resúmenes vía LLM local. | P2 |
| Auto-tagging IA | Tags sugeridos según contenido. | P2 |
| Graph view | Visualización de relaciones entre notas. | P3 |
| Auth básica | Autenticación para exposición en internet. | P2 |
| HTTPS | Soporte TLS nativo. | P2 |

---

## 6. Requerimientos Técnicos

### 6.1 Stack

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React 18 + Vite 5 | Renderizado rápido, HMR, ecosistema maduro. |
| Estilos | CSS puro (376 líneas) | Sin dependencias, control total, rendimiento. |
| Markdown | react-markdown 9 | Renderizado de preview del lado del cliente. |
| Frontmatter | gray-matter 4 | Parsing YAML probado y liviano. |
| API (dev) | Vite plugin (middleware) | Misma API sin levantar servidor adicional. |
| API (prod) | Node HTTP nativo | Cero dependencias, 145 líneas, fácil de mantener. |
| Tests | Vitest + jsdom | Mismo bundler que Vite, configuración mínima. |
| Proxy (prod) | Nginx | Proxy reverso, SSL, SPA fallback. |

### 6.2 API

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| `GET` | `/api/notes` | — | `{ slug, title, body, updated, tags }[]` |
| `POST` | `/api/notes` | `{ slug, content }` | `{ success: true }` |
| `PUT` | `/api/notes/:slug` | `{ content, newSlug? }` | `{ success, slug }` |
| `DELETE` | `/api/notes/:slug` | — | `{ success: true }` |

### 6.3 Formato de Nota

```markdown
---
title: Mi nota
tags:
  - tag1
  - tag2
updated: 2026-05-20
---

Contenido markdown aquí...
```

- Archivos `.md` con frontmatter YAML obligatorio.
- Nombre de archivo = slug derivado del título (ej: `mi-nota.md`).
- Almacenamiento en `notes/` (raíz del proyecto en dev; `app/notes/` en prod).

### 6.4 Performance

| Métrica | Objetivo |
|---------|----------|
| Time to Interactive | < 1.5s en LAN |
| Tamaño bundle JS | < 300 KB (gzip ~85 KB) |
| Latencia API (local) | < 10ms |
| Sin framework CSS | 0 KB adicionales |

### 6.5 Seguridad (MVP)

- Sin autenticación (solo red local).
- Sin exposición a internet sin proxy.
- Sin sanitización de entradas (entorno controlado).

---

## 7. Principios de Diseño

1. **Silencioso**: sin notificaciones, sin modales, sin animaciones intrusivas.
2. **Rápido**: respuesta instantánea en escritura y navegación.
3. **Filesystem-first**: las notas son archivos reales, no entradas en una DB.
4. **AI-friendly**: cualquier agente puede leer/escribir `.md` directamente.
5. **Sin vendor lock-in**: migrar es copiar los archivos.
6. **Minimalista**: cada feature debe justificar su existencia.

---

## 8. Arquitectura

```
Browser (React SPA)
     │
     │ fetch('/api/notes')
     ▼
┌─────────────────────┐
│ Vite Dev Server     │  (dev — puerto 3000)
│ vite-notes-plugin   │
│                     │
│ Node HTTP Server    │  (prod — puerto 3001)
│ server.js           │
└─────────┬───────────┘
          │
    ┌─────▼─────┐
    │  notes/   │
    │  *.md     │
    └───────────┘
```

- **Dev**: `npm run dev` → Vite con plugin integrado, lee/escribe `notes/`.
- **Build**: `npm run build` → Vite genera `dist/` y copia `server.js`.
- **Prod**: `npm start` → `server.js` sirve API en puerto 3001, `notes/` junto al binario.
- **Proxy**: Nginx sirve `dist/` como estático y proxy inverso `/api/` a `:3001`.

---

## 9. Criterios de Release

### MVP (v0.1.0)

- [x] CRUD completo de notas vía UI.
- [x] Autosave funcional con debounce.
- [x] Búsqueda por título, cuerpo y tags.
- [x] Tags persistidos en frontmatter.
- [x] Preview Markdown.
- [x] Dark mode funcional.
- [x] Tests de utilidades (slugs, parsing).
- [x] Build producible (dist/ con server.js).
- [x] Docker-compose funcional.

### Próximo release (v0.2.0)

- [ ] Estructura de carpetas en sidebar.
- [ ] Atajo `CMD + N` para nueva nota.
- [ ] Tests de componentes (Sidebar, Editor).
- [ ] Toggle tema claro/oscuro.

---

## 10. Fuera de Alcance (v1.0)

- Editor WYSIWYG (el Markdown raw es intencional).
- Colaboración multiusuario en tiempo real.
- Aplicación mobile nativa.
- Sincronización con servicios cloud (Dropbox, iCloud).
- Plugins / extensiones.
- Base de datos (PostgreSQL, SQLite).
- Integración con API externas.
- Landing page / marketing site.
