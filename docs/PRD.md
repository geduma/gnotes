# PRD — GNotes

> **Product Requirements Document**
> Version: 3.0 | Date: 2026-06-22 | Author: Felipe

---

## 1. Executive Summary

GNotes is a minimalist web notes application with two persistence modes: **local** (IndexedDB in the browser, no user) and **private** (MongoDB via REST API, with authenticated user). It offers a fast and quiet editing experience that prioritizes writing over visual management.

---

## 2. Problem

Existing note tools (Notion, Obsidian, Evernote, etc.) present issues for a technical profile that values:

- **Portability**: proprietary formats that make it hard to migrate or access from another editor.
- **Complexity**: feature overload, dashboards, widgets, unsolicited AI assistants.
- **Cloud dependency**: data on third-party servers without real control.
- **Friction**: load times, animations, automatic updates that interrupt the flow.

A tool is needed that:

- Is **instant** to open and to write.
- Has a **clean API** that allows integration with external tools and AI agents.
- Works **offline-first** without requiring an account.
- Allows optional **cloud sync** with OAuth login.

---

## 3. Target Users

| Type | Description |
|------|-------------|
| **Primary persona** | Developer/DevOps who wants technical notes, with REST API, no vendor lock-in. |
| **Secondary persona** | Technical user who self-hosts services and wants optional cloud persistence. |
| **Non-target** | Non-technical users who expect Notion-like UX with WYSIWYG or a mobile app. |

---

## 4. User Stories

### MVP (Current)

| ID | Story | Priority |
|----|----------|-----------|
| US-01 | As a user, I want to create a note without needing an account. | P0 |
| US-02 | As a user, I want to edit a note with a WYSIWYG editor. | P0 |
| US-03 | As a user, I want to save my changes manually without loss. | P0 |
| US-03b | As a user, I want to edit the raw Markdown of my notes. | P0 |
| US-04 | As a user, I want to delete a note I no longer need. | P0 |
| US-05 | As a user, I want to search among my notes. | P0 |
| US-06 | As a user, I want to tag notes with tags. | P0 |
| US-07 | As a user, I want notes accessible via REST API. | P0 |
| US-08 | As a user, I want OAuth login for cloud persistence. | P0 |
| US-09 | As a logged-in user, I want my notes to have an owner and be private. | P0 |
| US-10 | As a user, I want to visually distinguish local notes from private ones. | P0 |

### Phase 2 — Organization

| ID | Story | Priority |
|----|----------|-----------|
| US-11 | As a user, I want to group notes into folders. | P1 |
| US-12 | As a user, I want to move notes between folders. | P1 |

### Phase 3 — UX

| ID | Story | Priority |
|----|----------|-----------|
| US-13 | As a user, I want a keyboard shortcut for a new note. | P1 |
| US-14 | As a user, I want a more comfortable editor (CodeMirror). | P2 |
| US-15 | As a user, I want image drag & drop. | P3 |

### Phase 4 — AI

| ID | Story | Priority |
|----|----------|-----------|
| US-16 | As a user, I want an AI summary of my note. | P2 |
| US-17 | As a user, I want AI-suggested auto-tagging. | P2 |
| US-18 | As a user, I want a knowledge graph between notes. | P3 |

---

## 5. Features

### 5.1 MVP (Implemented)

| Feature | Description | Status |
|---------|-------------|--------|
| Create note | Local (IndexedDB) or private (API based on login). | ✅ |
| Edit note | WYSIWYG editor with floating format bar. | ✅ |
| Markdown editor | Binary "MD" toggle to edit raw Markdown. | ✅ |
| Full Markdown support | markdown-it + GFM (tables, checkboxes, nested quotes, H4–H6, autolinks, strikethrough, escape). | ✅ |
| Manual save | "Save" button + close confirmation (no autosave). | ✅ |
| Saved/unsaved indicator | Visual state of changes. | ✅ |
| Delete note | DELETE with modal confirmation. | ✅ |
| Search | Filters by title + body + tags. | ✅ |
| Tags | Chip-style input. | ✅ |
| Rename | Changing the title updates the slug. | ✅ |
| Dark mode | Dark theme by default. | ✅ |
| Responsive | 768px breakpoint. | ✅ |
| REST API | Full CRUD with owner. | ✅ |
| JWT auth | Single-use token via POST /auth. | ✅ |
| OAuth login | Login via geduma-auth (Google, GitHub, MS). | ✅ |
| Owner hash | SHA-256 of the email, identifies the user's notes. | ✅ |
| Local storage | Native IndexedDB without libraries. | ✅ |
| Dual source | App.jsx with local/private logic based on auth. | ✅ |
| Global spinner | Loading overlay on API calls. | ✅ |
| Provider spinners | Inline in LoginModal (loading and login). | ✅ |

### 5.2 Future (Roadmap)

| Feature | Description | Priority |
|---------|-------------|-----------|
| Folders | Directory navigation. | P1 |
| New-note shortcut | `CMD + N`. | P1 |
| CodeMirror editor | Highlighting, line numbers. | P2 |
| Image drag & drop | Image upload. | P2 |
| Light/dark theme | Toggle. | P2 |
| AI summaries | Via local LLM. | P2 |
| AI auto-tagging | Suggested tags. | P2 |
| Graph view | Relationships between notes. | P3 |

---

## 6. Technical Requirements

### 6.1 Stack

| Layer | Technology | Justification |
|------|-----------|---------------|
| Frontend | React 18 + Vite 5 | Fast, HMR, mature ecosystem. |
| Styles | Pure CSS | No dependencies, total control. |
| Markdown | markdown-it + markdown-it-task-lists | Markdown→HTML (CommonMark + GFM: tables, checkboxes, autolinks). |
| Markdown→Markdown | turndown | HTML→Markdown for the WYSIWYG editor (round-trip). |
| API | REST (`api.geduma.com`) | MongoDB with owner and JWT. |
| OAuth auth | geduma-auth | Centralized social OAuth. |
| JWT auth | POST /auth | Single-use token per operation. |
| Local storage | Native IndexedDB | No external libraries. |
| Hash | Web Crypto API (SHA-256) | Owner hash of the email. |
| Tests | Vitest + jsdom | Same bundler as Vite. |

### 6.2 API — Auth

| Method | Route | Description |
|--------|------|-------------|
| GET | `/auth/providers/{appId}` | List available OAuth providers |
| POST | `/auth/login/{appId}/{providerId}` | Starts login, returns redirect URL |
| GET | `/auth/session/{sessionToken}` | Gets user data (single-use) |

### 6.3 API — Notes

| Method | Route | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/gnotes?owner=&q=` | Bearer | Optional filters |
| POST | `/gnotes` | Bearer | `{ slug, title, body, tags, updated, owner }` |
| PUT | `/gnotes/:slug` | Bearer | `{ title?, body?, tags?, updated?, newSlug?, owner }` |
| DELETE | `/gnotes/:slug` | Bearer | `?owner=` query or `{ owner }` body |

- `owner` = SHA-256 of the user's email.
- GET without `?owner=` returns all notes.
- PUT/DELETE validate ownership (403 if it doesn't match).

### 6.4 Note Format

```json
{
  "slug": "my-note",
  "title": "My note",
  "body": "Content in **markdown**",
  "tags": ["tag1", "tag2"],
  "updated": "2026-06-22",
  "owner": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

### 6.5 Performance

| Metric | Goal |
|---------|----------|
| Time to Interactive | < 1.5s |
| JS bundle | < 300 KB (gzip ~85 KB) |
| No CSS framework | 0 additional KB |

### 6.6 Security

- Single-use JWT on every API operation.
- OAuth login via geduma-auth (single-use session_token).
- SHA-256 owner hash of the email.
- API Key in the frontend (`VITE_API_AUTH_KEY`).
- HTTPS in production.

---

## 7. Design Principles

1. **Quiet**: no notifications, modals or intrusive animations.
2. **Fast**: instant response when writing and navigating.
3. **API-first**: notes consumable and persistable via REST API.
4. **AI-friendly**: clean API for integration with AI agents.
5. **No vendor lock-in**: migrating means connecting another compatible API.
6. **Offline-first**: works without an account, optional local persistence.
7. **Minimalist**: every feature must justify its existence.

---

## 8. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React SPA)               │
│                                                      │
│  ┌──────────┐  ┌──────────────────────────────────┐ │
│  │ Sidebar   │  │  Editor / Empty                  │ │
│  │ (notes)   │  │                                  │ │
│  │ Login/User│  │  Footer: by @geduma ☕           │ │
│  └──────────┘  └──────────────────────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            Data source                        │   │
│  │                                                │   │
│  │  ┌── no user ────────────────────────────┐  │   │
│  │  │  IndexedDB (gnotes-local)               │  │   │
│  │  │  Local CRUD, no API                    │  │   │
│  │  └──────────────────────────────────────────┘  │   │
│  │                                                │   │
│  │  ┌── with user ───────────────────────────┐  │   │
│  │  │  GET/POST/PUT/DELETE /gnotes             │  │   │
│  │  │  with owner=hash (email SHA-256)      │  │   │
│  │  └──────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            Auth Flow                          │   │
│  │                                                │   │
│  │  1. GET /auth/providers/{appId} → providers   │   │
│  │  2. POST /auth/login/{appId}/{providerId}     │   │
│  │  3. Redirect → OAuth provider                 │   │
│  │  4. Callback → session_token in URL           │   │
│  │  5. GET /auth/session/{token} → user data     │   │
│  │  6. sha256(email) → ownerHash                 │   │
│  │  7. Save in localStorage                      │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
┌─────────────────┐     ┌──────────────────────┐
│ geduma-auth     │     │ gnotes API           │
│ (OAuth proxy)   │     │ (MongoDB + JWT auth) │
│ api.geduma.com  │     │ api.geduma.com       │
└─────────────────┘     └──────────────────────┘
```

- **Dev**: `npm run dev` → Vite on port 5173.
- **Build**: `npm run build` → `dist/` with static SPA.
- **Prod**: `dist/` is served with any static server.

---

## 9. Release Criteria

### MVP (v0.1.0)

- [x] Full note CRUD via UI.
- [x] Search by title, body and tags.
- [x] Persisted tags.
- [x] Dark mode.
- [x] Unit tests (slugs, API client).
- [x] External API with MongoDB.
- [x] Single-use JWT auth.

### v0.2.0 (Current)

- [x] OAuth login via geduma-auth.
- [x] SHA-256 owner hash on each note.
- [x] IndexedDB local storage.
- [x] Dual local/private logic in App.jsx.
- [x] Dynamic OAuth provider modal.
- [x] Global spinner on API calls.
- [x] "by @geduma ☕" footer.
- [x] Hash tests.

### v0.3.0

- [x] WYSIWYG editor with floating format bar (Bold, Italic, lists, blockquote, link, code).
- [x] Turndown for HTML→Markdown conversion on save.
- [x] Link modal (URL + text) in the toolbar.
- [x] Removed react-markdown dependency (~79 fewer packages).

### v0.3.1 (Full Markdown support)

- [x] Markdown→HTML parser replaced with markdown-it + markdown-it-task-lists (CommonMark + GFM).
- [x] H1–H6 headings and underlined syntax (`=`/`-`).
- [x] Nested and multi-paragraph quotes.
- [x] Ordered/unordered/nested/mixed lists.
- [x] Block code (fences and 4 spaces), inline code.
- [x] GFM tables with alignment.
- [x] Checkboxes (task lists).
- [x] Strikethrough, combined bold/italic, images (inline and reference).
- [x] Reference links, automatic links and autolinks (bare URLs/emails).
- [x] Character escaping (`\*`, `\#`, etc.).
- [x] XSS-safe via `html:false` (escapes raw HTML).
- [x] Binary "MD" toggle to edit raw Markdown (keeps `body` as single source).
- [x] Turndown with table `addRule` for round-trip on save.
- [x] `test/markdown.test.js` tests covering the full guide.

### Next release (v0.4.0)

- [ ] Folder structure in the sidebar.
- [ ] `CMD + N` shortcut for new note.
- [ ] Component tests (Sidebar, Editor).
- [ ] Light/dark theme toggle.

---

## 10. Out of Scope (v1.0)

- Real-time multi-user collaboration.
- Native mobile application.
- Sync between local and cloud.
- Plugins / extensions.
- Landing page / marketing site.