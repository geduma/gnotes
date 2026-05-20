# App Personal de Notas — Especificación Técnica y Plan de Desarrollo

## Objetivo

Construir una aplicación personal de notas:

* Minimalista
* Rápida
* Fácil de mantener
* Basada en Markdown
* Compatible con integración futura con agentes de IA
* Autoalojable en homelab
* Sin complejidad innecesaria
* Sin backend — todo se ejecuta en el navegador

La prioridad NO es competir con Notion, Obsidian o Evernote.
La prioridad es tener un sistema propio, entendible y extensible.

---

# Visión del Producto

La aplicación debe sentirse:

* silenciosa
* rápida
* limpia
* sobria
* extremadamente minimalista

La referencia visual es:

* Apple Notes
* Bear
* editor markdown puro

Pero eliminando:

* efectos innecesarios
* dashboards
* widgets
* gamificación
* iconografía colorida
* elementos visuales recargados

La UI debe priorizar:

* tipografía
* espaciado
* contraste
* velocidad
* foco en escritura

---

# Filosofía del Proyecto

## Principios

1. Simplicidad primero
2. Stack pequeño y fácil de depurar
3. Sin dependencias excesivas
4. Datos portables
5. Arquitectura clara
6. Compatible con IA desde el diseño inicial
7. Sin backend — filesystem directo desde el navegador o Vite server plugin

---

# Funcionalidades MVP

## Funciones iniciales

### Gestión de notas

* Crear nota
* Editar nota
* Eliminar nota
* Listar notas
* Buscar notas

### Contenido

* Markdown puro
* Vista previa renderizada
* Autoguardado

### Organización

* Tags simples
* Carpetas opcionales
* Orden por fecha

### UX

* Interfaz limpia
* Dark mode
* Navegación rápida
* Sin animaciones pesadas

---

# Restricciones Técnicas del Proyecto

## Reglas obligatorias

### Sin dependencias innecesarias

Evitar:

* frameworks complejos
* librerías visuales pesadas
* componentes UI externos
* SDKs innecesarios
* ORMs
* builders complejos

---

## Dependencias permitidas

Solo dependencias extremadamente justificadas.

Ejemplo:

* React
* Vite
* gray-matter (frontmatter)
* marked o react-markdown (preview)

Todo lo demás debe implementarse manualmente.

---

## Objetivo arquitectónico

Que cualquier desarrollador pueda entender el proyecto completo en menos de 1 hora.

---

# Arquitectura Recomendada

## Stack Sugerido

### Frontend (único componente)

#### Stack aprobado

* React
* Vite
* JavaScript puro
* CSS puro

---

## Filosofía Frontend

### Sin librerías UI

NO usar:

* Material UI
* Chakra
* Ant Design
* shadcn
* Bootstrap
* DaisyUI

---

### Sin Tailwind

La UI debe escribirse manualmente con:

```txt
CSS puro
```

Objetivos:

* control absoluto
* menos dependencias
* menor complejidad
* estilos extremadamente consistentes

---

### Sin Redux

Estado simple usando:

```txt
React hooks
```

---

### Sin editor markdown complejo

Inicialmente usar:

```txt
textarea nativo
```

con preview markdown.

Nada más.

---

## Diseño Visual

### Principios visuales

* fondo limpio
* tipografía sobria
* mucho espacio negativo
* líneas finas
* bordes suaves
* contraste moderado
* cero saturación visual

---

### Paleta recomendada

#### Dark mode

```txt
Background: #111111
Surface: #1A1A1A
Border: #2A2A2A
Primary text: #EAEAEA
Secondary text: #8B8B8B
Accent: #CFCFCF
```

---

### Tipografía

Usar tipografía del sistema:

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

---

### Layout

Distribución simple:

```txt
┌────────────┬──────────────────────┐
│ Sidebar    │ Editor               │
│ notas      │ markdown             │
│             │                      │
└────────────┴──────────────────────┘
```

---

### Sidebar

Debe contener únicamente:

* lista de notas
* búsqueda
* botón nueva nota

Nada más.

---

### Editor

Sin toolbars.

Sin botones markdown.

Markdown puro.

La filosofía es:

```txt
escribir primero
```

---

### Preview

Panel opcional.

Puede activarse con:

```txt
CMD/CTRL + .
```

---

### Animaciones

Casi inexistentes.

Solo:

* hover suaves
* transiciones rápidas
* fade mínimo

---

### Iconografía

Minimalista.

Idealmente:

* sin iconos
* o iconos monocromáticos SVG

Nunca:

* emojis
* colores fuertes
* ilustraciones

---

### Responsive

Desktop-first.

Mobile simple pero funcional.

---

# Decisión Crítica: Base de Datos vs Archivos Markdown

Esta es la decisión arquitectónica más importante.

---

# Opción 1 — Guardar Notas como Archivos `.md`

## Estructura

```txt
/notes
  personal/
    ideas.md
    diario.md
  proyectos/
    app-notas.md
```

---

## Cómo funcionaría

Cada nota es un archivo físico `.md`.

La aplicación:

* Lee archivos directamente desde el filesystem
* Escribe archivos directamente
* Lista carpetas
* Renderiza metadata desde frontmatter

---

## Ventajas

### Extremadamente simple

No existe complejidad de base de datos.

---

### Compatible naturalmente con IA

Tu agente puede:

* Leer archivos directamente
* Editarlos
* Indexarlos
* Embedding/vectorización futura

Sin capas intermedias.

---

### Portable

Tus notas siguen existiendo incluso si la app muere.

Puedes abrirlas con:

* VSCode
* Obsidian
* Vim
* Nano
* Git
* Scripts

---

### Git Friendly

Puedes versionar todo fácilmente.

```bash
git init
```

Y ya tienes historial completo.

---

### Backup trivial

Solo respaldar una carpeta.

---

### Ideal para homelab

Muy alineado con filosofía self-hosted.

---

## Desventajas

### Búsqueda avanzada más difícil

Full-text search requiere:

* indexado
* librerías
* escaneo de archivos

Aunque para uso personal esto rara vez es problema.

---

### Escalabilidad limitada

Si algún día tienes:

* cientos de miles de notas
* colaboración multiusuario
* locking complejo

podría complicarse.

Pero para una app personal esto probablemente nunca ocurra.

---

## Compatibilidad IA

### Excelente

Tu futuro agente podría:

* modificar notas
* generar resúmenes
* crear enlaces automáticos
* reorganizar contenido
* ejecutar RAG
* indexar embeddings

simplemente teniendo acceso filesystem.

---

# Opción 2 — Base de Datos

## Posibles motores

### SQLite

La opción simple.

### PostgreSQL

Más robusta.

---

## Estructura

```txt
notes
- id
- title
- content
- created_at
- updated_at
- tags
```

---

## Ventajas

### Búsqueda más eficiente

Especialmente con:

* índices
* full text search

---

### Mejor estructura

Más control sobre:

* relaciones
* metadata
* permisos
* usuarios

---

### APIs más limpias

CRUD tradicional.

---

## Desventajas

### Mayor complejidad

Necesitas:

* ORM opcional
* migraciones
* backups DB
* mantenimiento

---

### Menor portabilidad humana

Tus notas viven encerradas en una DB.

---

### IA menos directa

Tu agente necesitaría:

* API
* acceso DB
* capa extra

---

# Decisión Final — Opción 1: Solo Archivos Markdown

## La mejor solución para tu caso

Todo se guarda como archivos `.md` con frontmatter.

Sin base de datos.
Sin backend.
Sin API.

---

## Ejemplo

### Archivo real

```txt
/notes/proyectos/app.md
```

### Contenido

```md
---
title: App de notas
tags:
  - proyectos
  - software
updated: 2026-05-20
---

Contenido aquí...
```

---

## Ventajas

### Mantienes portabilidad

Las notas siguen siendo archivos.

### Sin complejidad de servidor

Todo corre en el navegador.

### Excelente integración IA

El agente puede leer y escribir markdown directo.

### Muy fácil de mantener

Cero infraestructura.

---

# Arquitectura Técnica Recomendada

## Frontend (único componente)

### Stack

```txt
React
Vite
CSS puro
```

---

## Acceso al filesystem

### Opción A — Vite plugin

Un plugin de Vite que expone endpoints para leer/escribir archivos `.md` durante desarrollo y en producción self-hosted.

### Opción B — File System Access API

API del navegador para acceso directo a carpetas locales (Chrome/Edge).

### Opción C — Ambos

File System Access API como primary, Vite plugin como fallback para self-hosted.

---

## Estructura General

## Arquitectura Simple

La aplicación debe poder ejecutarse completamente con:

```bash
npm install
npm run dev
```

Sin configuraciones adicionales.

---

```txt
/app
/notes
```

---

# Estructura de Carpetas Recomendada

```txt
project/
├── app/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── notes/
│   ├── personal/
│   ├── proyectos/
│   └── inbox/
├── docker-compose.yml (opcional para self-hosted)
└── README.md
```

---

# Formato Interno de las Notas

## Obligatorio: Frontmatter

```md
---
title: App ideas
tags:
  - ideas
  - software
updated: 2026-05-20
---

# Idea principal

Contenido aquí...
```

---

# Nomenclatura de Archivos

## Slug del título

El nombre del archivo se genera a partir del título:

* lowercase
* espacios → guiones
* caracteres especiales eliminados
* extensión `.md`

Ejemplos:

* "App ideas" → `app-ideas.md`
* "Mi primera nota!" → `mi-primera-nota.md`
* "Ideas para Q2 2026" → `ideas-para-q2-2026.md`

Si existe un archivo con el mismo slug, se agrega un sufijo numérico:

* `app-ideas.md`
* `app-ideas-1.md`
* `app-ideas-2.md`

---

# Librerías Recomendadas

## Frontend

### Markdown preview

```txt
react-markdown
```

### Manejo de frontmatter

```txt
gray-matter
```

### Testing

```txt
vitest
```

---

# Autoguardado

## Recomendación: Debounce de 2 segundos

### Justificación

| Criterio | 1s | 2s | 5s |
|----------|-----|-----|-----|
| Frecuencia de writes | Alta | Media | Baja |
| Riesgo de pérdida | Bajo | Bajo | Medio |
| Impacto en I/O | Moderado | Mínimo | Ninguno |
| UX (percepción) | Imperceptible | Natural | Notable |

**2 segundos es el punto óptimo porque:**

* Suficiente tiempo para que el usuario haga pausas naturales al escribir
* No genera writes excesivos al filesystem
* Si la app crashea, se pierden máximo 2 segundos de escritura
* No interrumpe el flujo de escritura (a diferencia de 1s que puede sentirse agresivo)
* Compatible con la filosofía "silenciosa" de la app

### Implementación

```js
useEffect(() => {
  const timer = setTimeout(() => {
    saveNote(content)
  }, 2000)
  return () => clearTimeout(timer)
}, [content])
```

---

# Integración Futura con IA

## Capacidades futuras

### RAG

El agente puede:

* indexar notas
* responder preguntas
* resumir contenido
* encontrar relaciones

---

### Auto-tagging

IA agrega tags automáticamente.

---

### Resúmenes automáticos

Notas largas resumidas.

---

### Knowledge Graph futuro

Opcional.

---

## Arquitectura IA Recomendada

```txt
LLM
  ↓
Acceso directo al filesystem
  ↓
Archivos Markdown
```

---

# Seguridad

## MVP

Inicialmente:

* sin autenticación
* solo LAN
* acceso interno homelab

---

## Futuro

Agregar:

* login
* JWT
* reverse proxy
* HTTPS
* backups automáticos

---

# Dockerización

## Opcional para self-hosted

### Servicio

```txt
app servida estáticamente
notes montado como volume
```

---

## Docker Compose

Simple y portable.

---

# Testing

## Framework

```txt
vitest
```

## Qué testear

* Parsing de frontmatter
* Generación de slugs
* Búsqueda de notas
* Componentes críticos de UI

---

# Roadmap de Desarrollo

# Fase 1 — MVP

## Objetivo

Tener app funcional local.

## Features

* CRUD notas (archivos `.md`)
* Textarea simple con preview markdown
* Frontmatter obligatorio
* Slug del título como nombre de archivo
* Sidebar con lista de notas
* Autoguardado (debounce 2s)
* CSS puro

## Duración estimada

1–3 días

---

# Fase 2 — Organización

## Features

* tags
* carpetas
* búsqueda full-text en archivos

## Duración

2–4 días

---

# Fase 3 — UX

## Features

* dark mode
* shortcuts (CMD/CTRL + . para preview)
* autosave refinado
* responsive

---

# Fase 4 — IA

## Features

* embeddings
* búsqueda semántica
* resúmenes
* chat sobre notas

---

# Lo Que NO Recomiendo

## No usar inicialmente

### Microservicios

Innecesario.

---

### Kubernetes

Completamente excesivo.

---

### MongoDB

No aporta valor aquí.

---

### Electron

Primero haz versión web.

---

### Next.js

Puede ser demasiado para este caso.

Vite + React es suficiente.

---

### Firebase/Supabase

Pierdes simplicidad local.

---

### Backend / API / Base de datos

No es necesario para una app personal self-hosted.

---

### TailwindCSS

CSS puro es suficiente y más mantenible.

---

# Stack Final Recomendado

## Mi recomendación concreta

```txt
Frontend:
- React
- Vite
- CSS puro

Storage:
- Archivos Markdown con frontmatter
- Nomenclatura: slug del título

Testing:
- Vitest

Infra:
- Docker Compose (opcional para self-hosted)
```

---

# Arquitectura Ideal Final

```txt
Usuario
   ↓
React UI (Vite)
   ↓
Filesystem (.md con frontmatter)
   ↓
Agente IA futuro (acceso directo a archivos)
```

---

# Conclusión

Tu caso encaja perfectamente con:

* markdown-first
* filesystem-first
* sin backend
* sin base de datos
* app autocontenido

Es:

* mantenible
* portable
* IA-friendly
* simple
* durable
* ideal para homelab

Y lo más importante:

No terminarás atrapado manteniendo infraestructura innecesaria.
