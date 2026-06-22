# PRD — GNotes

> **Product Requirements Document**
> Versión: 2.0 | Fecha: 2026-06-22 | Autor: Felipe

---

## 1. Resumen Ejecutivo

GNotes es una aplicación web de notas minimalista con persistencia vía API REST externa con MongoDB. Las notas se almacenan en una base de datos externa, ofreciendo una experiencia de edición rápida y silenciosa que prioriza la escritura sobre la gestión visual.

---

## 2. Problema

Las herramientas existentes de notas (Notion, Obsidian, Evernote, etc.) presentan problemas para un perfil técnico que valora:

- **Portabilidad**: formatos propietarios que dificultan migrar o acceder desde otro editor.
- **Complejidad**: sobrecarga de features, dashboards, widgets, AI assistants no solicitados.
- **Dependencia de cloud**: datos en servidores de terceros sin control real.
- **Fricción**: tiempos de carga, animaciones, actualizaciones automáticas que interrumpen el flujo.

Se necesita una herramienta que:

- Sea **instantánea** al abrir y al escribir.
- Tenga una **API limpia** que permita integración con herramientas externas y agentes IA.
- Permita **auto-alojarse** en un homelab o VPS mínimo.

---

## 3. Usuarios Objetivo

| Tipo | Descripción |
|------|-------------|
| **Persona principal** | Desarrollador/DevOps que quiere un sistema de notas técnico, con API REST, y sin vendor lock-in. |
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
| US-07 | Como usuario, quiero que las notas sean accesibles vía API REST para integración con otras herramientas. | P0 |
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
| Crear nota | Genera slug desde el título, envía vía API. | ✅ |
| Editar nota | Editor de texto + preview Markdown lado a lado. | ✅ |
| Autosave | Debounce de 2s al cambiar título, contenido o tags. | ✅ |
| Guardado manual | Botón "Save" para guardado explícito. | ✅ |
| Indicador saved/unsaved | Muestra estado visual de cambios no guardados. | ✅ |
| Eliminar nota | DELETE con confirmación implícita. | ✅ |
| Búsqueda | Filtra por título + cuerpo + tags (case-insensitive). | ✅ |
| Tags | Input tipo chips, persistencia vía API. | ✅ |
| Renombrar | Cambiar título actualiza el slug (newSlug). | ✅ |
| Atajo de teclado | `CMD/CTRL + .` toggle preview. | ✅ |
| Dark mode | Tema oscuro por defecto. | ✅ |
| Responsive | Adaptable a mobile (breakpoint 768px). | ✅ |
| API REST externa | CRUD completo vía API externa con JWT. | ✅ |
| Autenticación JWT | Token single-use vía POST /auth. | ✅ |

### 5.2 Futuras (Roadmap)

| Feature | Descripción | Prioridad |
|---------|-------------|-----------|
| Estructura de carpetas | Navegación y organización por directorios. | P1 |
| Drag & drop imágenes | Subida de imágenes. | P2 |
| Editor mejorado | CodeMirror, highlighting, line numbers. | P2 |
| Atajo crear nota | `CMD + N` para nueva nota. | P1 |
| Modo oscuro/claro | Toggle de tema. | P2 |
| Resúmenes IA | Generación de resúmenes vía LLM local. | P2 |
| Auto-tagging IA | Tags sugeridos según contenido. | P2 |
| Graph view | Visualización de relaciones entre notas. | P3 |
| HTTPS | Soporte TLS nativo. | P2 |

---

## 6. Requerimientos Técnicos

### 6.1 Stack

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React 18 + Vite 5 | Renderizado rápido, HMR, ecosistema maduro. |
| Estilos | CSS puro (376 líneas) | Sin dependencias, control total, rendimiento. |
| Markdown | react-markdown 9 | Renderizado de preview del lado del cliente. |
| API | API REST externa (`api.geduma.com`) | Persistencia en MongoDB con auth JWT. |
| Auth | JWT single-use vía POST /auth | Token por operación, sin sesión persistente. |
| Tests | Vitest + jsdom | Mismo bundler que Vite, configuración mínima. |

### 6.2 API

| Método | Ruta | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/auth` | ❌ | `{ name, user, key }` | `{ ok, msg, data: { token } }` |
| `GET` | `/gnotes` | Bearer | — | `{ ok, msg, data: Note[] }` |
| `POST` | `/gnotes` | Bearer | `{ slug, title, body, tags, updated }` | `{ ok, msg, data: { success, slug } }` |
| `PUT` | `/gnotes/:slug` | Bearer | `{ title?, body?, tags?, updated?, newSlug? }` | `{ ok, msg, data: { success, slug } }` |
| `DELETE` | `/gnotes/:slug` | Bearer | — | `{ ok, msg, data: { success } }` |

### 6.3 Formato de Nota

```json
{
  "slug": "mi-nota",
  "title": "Mi nota",
  "body": "Contenido en **markdown**",
  "tags": ["tag1", "tag2"],
  "updated": "2026-06-22"
}
```

Persistencia en MongoDB vía API externa.

### 6.4 Performance

| Métrica | Objetivo |
|---------|----------|
| Time to Interactive | < 1.5s |
| Tamaño bundle JS | < 300 KB (gzip ~85 KB) |
| Sin framework CSS | 0 KB adicionales |

### 6.5 Seguridad

- Autenticación JWT single-use en cada operación.
- API Key fija configurada en el frontend.
- Comunicación vía HTTPS en producción.

---

## 7. Principios de Diseño

1. **Silencioso**: sin notificaciones, sin modales, sin animaciones intrusivas.
2. **Rápido**: respuesta instantánea en escritura y navegación.
3. **API-first**: las notas se consumen y persisten vía API REST.
4. **AI-friendly**: API limpia para integración con agentes IA.
5. **Sin vendor lock-in**: migrar es conectar otra API compatible.
6. **Minimalista**: cada feature debe justificar su existencia.

---

## 8. Arquitectura

```
Browser (React SPA)
     │
     │ POST /auth → JWT
     │ GET/POST/PUT/DELETE /gnotes
     ▼
┌──────────────────────────┐
│ API Externa (MongoDB)    │
│ api.geduma.com           │
└──────────────────────────┘
```

- **Dev**: `npm run dev` → Vite en puerto 5173, consume API en `localhost:3000`.
- **Build**: `npm run build` → Vite genera `dist/` con SPA estática.
- **Prod**: Se sirve `dist/` con cualquier servidor estático (nginx, caddy, etc.).

---

## 9. Criterios de Release

### MVP (v0.1.0)

- [x] CRUD completo de notas vía UI.
- [x] Autosave funcional con debounce.
- [x] Búsqueda por título, cuerpo y tags.
- [x] Tags persistidos vía API.
- [x] Preview Markdown.
- [x] Dark mode funcional.
- [x] Tests de utilidades (slugs, API client).
- [x] API externa con MongoDB.
- [x] Autenticación JWT single-use.

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
- Landing page / marketing site.
