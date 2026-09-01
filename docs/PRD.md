# PRD — GNotes

> **Product Requirements Document**
> Versión: 3.0 | Fecha: 2026-06-22 | Autor: Felipe

---

## 1. Resumen Ejecutivo

GNotes es una aplicación web de notas minimalista con dos modos de persistencia: **local** (IndexedDB en el navegador, sin usuario) y **privada** (MongoDB vía API REST, con usuario autenticado). Ofrece una experiencia de edición rápida y silenciosa que prioriza la escritura sobre la gestión visual.

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
- Funcione **offline-first** sin necesidad de cuenta.
- Permita **sincronizar a cloud** opcionalmente con login OAuth.

---

## 3. Usuarios Objetivo

| Tipo | Descripción |
|------|-------------|
| **Persona principal** | Desarrollador/DevOps que quiere notas técnicas, con API REST, sin vendor lock-in. |
| **Persona secundaria** | Usuario técnico que self-hostea servicios y quiere persistencia cloud opcional. |
| **No target** | Usuarios no técnicos que esperan UX tipo Notion con WYSIWYG o app mobile. |

---

## 4. User Stories

### MVP (Actual)

| ID | Historia | Prioridad |
|----|----------|-----------|
| US-01 | Como usuario, quiero crear una nota sin necesidad de cuenta. | P0 |
| US-02 | Como usuario, quiero editar una nota con un editor WYSIWYG. | P0 |
| US-03 | Como usuario, quiero guardar mis cambios de forma manual sin pérdidas. | P0 |
| US-03b | Como usuario, quiero editar el Markdown crudo de mis notas. | P0 |
| US-04 | Como usuario, quiero eliminar una nota que ya no necesito. | P0 |
| US-05 | Como usuario, quiero buscar entre mis notas. | P0 |
| US-06 | Como usuario, quiero etiquetar notas con tags. | P0 |
| US-07 | Como usuario, quiero las notas accesibles vía API REST. | P0 |
| US-08 | Como usuario, quiero login OAuth para persistencia cloud. | P0 |
| US-09 | Como usuario logueado, quiero que mis notas tengan owner y sean privadas. | P0 |
| US-10 | Como usuario, quiero diferenciar visualmente notas locales de privadas. | P0 |

### Fase 2 — Organización

| ID | Historia | Prioridad |
|----|----------|-----------|
| US-11 | Como usuario, quiero agrupar notas en carpetas. | P1 |
| US-12 | Como usuario, quiero mover notas entre carpetas. | P1 |

### Fase 3 — UX

| ID | Historia | Prioridad |
|----|----------|-----------|
| US-13 | Como usuario, quiero atajo de teclado para nueva nota. | P1 |
| US-14 | Como usuario, quiero un editor más cómodo (CodeMirror). | P2 |
| US-15 | Como usuario, quiero drag & drop de imágenes. | P3 |

### Fase 4 — AI

| ID | Historia | Prioridad |
|----|----------|-----------|
| US-16 | Como usuario, quiero resumen IA de mi nota. | P2 |
| US-17 | Como usuario, quiero auto-tagging sugerido por IA. | P2 |
| US-18 | Como usuario, quiero grafo de conocimiento entre notas. | P3 |

---

## 5. Features

### 5.1 MVP (Implementado)

| Feature | Descripción | Estado |
|---------|-------------|--------|
| Crear nota | Local (IndexedDB) o privada (API según login). | ✅ |
| Editar nota | Editor WYSIWYG con barra de formato flotante. | ✅ |
| Editor Markdown | Toggle binario "MD" para editar el Markdown crudo. | ✅ |
| Soporte Markdown completo | markdown-it + GFM (tablas, checkboxes, citas anidadas, H4–H6, autolinks, tachado, escape). | ✅ |
| Guardado manual | Botón "Save" + confirmación de cierre (sin autosave). | ✅ |
| Indicador saved/unsaved | Estado visual de cambios. | ✅ |
| Eliminar nota | DELETE con confirmación modal. | ✅ |
| Búsqueda | Filtra por título + body + tags. | ✅ |
| Tags | Input tipo chips. | ✅ |
| Renombrar | Cambiar título actualiza el slug. | ✅ |
| Dark mode | Tema oscuro por defecto. | ✅ |
| Responsive | Breakpoint 768px. | ✅ |
| API REST | CRUD completo con owner. | ✅ |
| Auth JWT | Token single-use vía POST /auth. | ✅ |
| Login OAuth | Login vía geduma-auth (Google, GitHub, MS). | ✅ |
| Owner hash | SHA-256 del email, identifica notas del usuario. | ✅ |
| Almacenamiento local | IndexedDB nativo sin librerías. | ✅ |
| Dual source | App.jsx con lógica local/privada según auth. | ✅ |
| Spinner global | Loading overlay en llamadas API. | ✅ |
| Spinner providers | Inline en LoginModal (carga y login). | ✅ |

### 5.2 Futuras (Roadmap)

| Feature | Descripción | Prioridad |
|---------|-------------|-----------|
| Carpetas | Navegación por directorios. | P1 |
| Atajo crear nota | `CMD + N`. | P1 |
| Editor CodeMirror | Highlighting, line numbers. | P2 |
| Drag & drop imágenes | Subida de imágenes. | P2 |
| Tema claro/oscuro | Toggle. | P2 |
| Resúmenes IA | Vía LLM local. | P2 |
| Auto-tagging IA | Tags sugeridos. | P2 |
| Graph view | Relaciones entre notas. | P3 |

---

## 6. Requerimientos Técnicos

### 6.1 Stack

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React 18 + Vite 5 | Rápido, HMR, ecosistema maduro. |
| Estilos | CSS puro | Sin dependencias, control total. |
| Markdown | markdown-it + markdown-it-task-lists | Markdown→HTML (CommonMark + GFM: tablas, checkboxes, autolinks). |
| Markdown→Markdown | turndown | HTML→Markdown para editor WYSIWYG (round-trip). |
| API | REST (`api.geduma.com`) | MongoDB con owner y JWT. |
| Auth OAuth | geduma-auth | OAuth social centralizado. |
| Auth JWT | POST /auth | Token single-use por operación. |
| Local storage | IndexedDB nativo | Sin librerías externas. |
| Hash | Web Crypto API (SHA-256) | Owner hash del email. |
| Tests | Vitest + jsdom | Mismo bundler que Vite. |

### 6.2 API — Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/auth/providers/{appId}` | Lista providers OAuth disponibles |
| POST | `/auth/login/{appId}/{providerId}` | Inicia login, retorna redirect URL |
| GET | `/auth/session/{sessionToken}` | Obtiene datos del usuario (single-use) |

### 6.3 API — Notas

| Método | Ruta | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/gnotes?owner=&q=` | Bearer | Filtros opcionales |
| POST | `/gnotes` | Bearer | `{ slug, title, body, tags, updated, owner }` |
| PUT | `/gnotes/:slug` | Bearer | `{ title?, body?, tags?, updated?, newSlug?, owner }` |
| DELETE | `/gnotes/:slug` | Bearer | query `?owner=` o body `{ owner }` |

- `owner` = SHA-256 del email del usuario.
- GET sin `?owner=` retorna todas las notas.
- PUT/DELETE validan ownership (403 si no coincide).

### 6.4 Formato de Nota

```json
{
  "slug": "mi-nota",
  "title": "Mi nota",
  "body": "Contenido en **markdown**",
  "tags": ["tag1", "tag2"],
  "updated": "2026-06-22",
  "owner": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

### 6.5 Performance

| Métrica | Objetivo |
|---------|----------|
| Time to Interactive | < 1.5s |
| Bundle JS | < 300 KB (gzip ~85 KB) |
| Sin framework CSS | 0 KB adicionales |

### 6.6 Seguridad

- JWT single-use en cada operación API.
- Login OAuth vía geduma-auth (session_token single-use).
- Owner hash SHA-256 del email.
- API Key en frontend (`VITE_API_AUTH_KEY`).
- HTTPS en producción.

---

## 7. Principios de Diseño

1. **Silencioso**: sin notificaciones, modales ni animaciones intrusivas.
2. **Rápido**: respuesta instantánea en escritura y navegación.
3. **API-first**: notas consumibles y persistibles vía API REST.
4. **AI-friendly**: API limpia para integración con agentes IA.
5. **Sin vendor lock-in**: migrar es conectar otra API compatible.
6. **Offline-first**: funciona sin cuenta, persistencia local opcional.
7. **Minimalista**: cada feature debe justificar su existencia.

---

## 8. Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React SPA)               │
│                                                      │
│  ┌──────────┐  ┌──────────────────────────────────┐ │
│  │ Sidebar   │  │  Editor / Empty                  │ │
│  │ (notas)   │  │                                  │ │
│  │ Login/User│  │  Footer: by @geduma ☕           │ │
│  └──────────┘  └──────────────────────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            Fuente de datos                     │   │
│  │                                                │   │
│  │  ┌── sin usuario ──────────────────────────┐  │   │
│  │  │  IndexedDB (gnotes-local)               │  │   │
│  │  │  CRUD local, sin API                    │  │   │
│  │  └──────────────────────────────────────────┘  │   │
│  │                                                │   │
│  │  ┌── con usuario ───────────────────────────┐  │   │
│  │  │  GET/POST/PUT/DELETE /gnotes             │  │   │
│  │  │  con owner=hash (SHA-256 del email)      │  │   │
│  │  └──────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            Auth Flow                          │   │
│  │                                                │   │
│  │  1. GET /auth/providers/{appId} → providers   │   │
│  │  2. POST /auth/login/{appId}/{providerId}     │   │
│  │  3. Redirect → OAuth provider                 │   │
│  │  4. Callback → session_token en URL           │   │
│  │  5. GET /auth/session/{token} → user data     │   │
│  │  6. sha256(email) → ownerHash                 │   │
│  │  7. Guardar en localStorage                   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
┌─────────────────┐     ┌──────────────────────┐
│ geduma-auth     │     │ API gnotes           │
│ (OAuth proxy)   │     │ (MongoDB + JWT auth) │
│ api.geduma.com  │     │ api.geduma.com       │
└─────────────────┘     └──────────────────────┘
```

- **Dev**: `npm run dev` → Vite en puerto 5173.
- **Build**: `npm run build` → `dist/` con SPA estática.
- **Prod**: Se sirve `dist/` con cualquier servidor estático.

---

## 9. Criterios de Release

### MVP (v0.1.0)

- [x] CRUD completo de notas vía UI.
- [x] Búsqueda por título, cuerpo y tags.
- [x] Tags persistidos.
- [x] Dark mode.
- [x] Tests unitarios (slugs, API client).
- [x] API externa con MongoDB.
- [x] Auth JWT single-use.

### v0.2.0 (Actual)

- [x] Login OAuth vía geduma-auth.
- [x] Owner hash SHA-256 en cada nota.
- [x] Almacenamiento local IndexedDB.
- [x] Lógica dual local/privada en App.jsx.
- [x] Modal de providers OAuth dinámicos.
- [x] Spinner global en llamadas API.
- [x] Footer "by @geduma ☕".
- [x] Tests de hash.

### v0.3.0

- [x] Editor WYSIWYG con barra de formato flotante (Bold, Italic, listas, blockquote, link, code).
- [x] Turndown para conversión HTML→Markdown al guardar.
- [x] Modal de link (URL + text) en toolbar.
- [x] Eliminada dependencia react-markdown (~79 paquetes menos).

### v0.3.1 (Soporte Markdown completo)

- [x] Parser Markdown→HTML reemplazado por markdown-it + markdown-it-task-lists (CommonMark + GFM).
- [x] Encabezados H1–H6 y sintaxis subrayada (`=`/`-`).
- [x] Citas anidadas y de varios párrafos.
- [x] Listas ordenadas/desordenadas/anidadas/mezcladas.
- [x] Código de bloque (vallas y 4 espacios), código inline.
- [x] Tablas GFM con alineación.
- [x] Casillas de verificación (task lists).
- [x] Tachado, negrita/cursiva combinadas, imágenes (inline y referencia).
- [x] Enlaces de referencia, automáticos y autolinks (URLs/emails desnudos).
- [x] Escape de caracteres (`\*`, `\#`, etc.).
- [x] XSS-safe vía `html:false` (escapa HTML crudo).
- [x] Toggle binario "MD" para editar el Markdown crudo (mantiene `body` como fuente única).
- [x] Turndown con `addRule` de tablas para round-trip al guardar.
- [x] Tests `test/markdown.test.js` cubriendo toda la guía.

### Próximo release (v0.4.0)

- [ ] Estructura de carpetas en sidebar.
- [ ] Atajo `CMD + N` para nueva nota.
- [ ] Tests de componentes (Sidebar, Editor).
- [ ] Toggle tema claro/oscuro.

---

## 10. Fuera de Alcance (v1.0)

- Colaboración multiusuario en tiempo real.
- Aplicación mobile nativa.
- Sincronización entre local y cloud.
- Plugins / extensiones.
- Landing page / marketing site.
