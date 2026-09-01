# GNotes — Agent Instructions

## Stack

- React 18 + Vite 5 + Vitest
- Pure CSS (no Tailwind, no CSS-in-JS)
- Markdown: markdown-it + markdown-it-task-lists (Markdown→HTML) and turndown (HTML→Markdown for WYSIWYG editor)
- External API: `https://api.geduma.com`
- Auth: single-use JWT via `POST /auth` + social OAuth via `geduma-auth`
- Local storage: native IndexedDB (no libraries)
- Hash: Web Crypto API (SubtleCrypto) for SHA-256
- Language: English (UI, commits, docs)

## Code Conventions

- `.jsx` extensions for React components, `.js` for everything else.
- Component names in PascalCase, functions/variables in camelCase.
- No TypeScript.
- No code comments.
- CSS in `index.css` with custom properties for the dark theme.
- State with `useState`, effects with `useEffect`, refs with `useRef`.
- Props destructured in the component signature.

## Structure

```
gnotes/
├── src/
│   ├── components/   # Sidebar.jsx, Editor.jsx, LoginModal.jsx, ConfirmModal.jsx, Spinner.jsx
│   ├── hooks/        # useAuth.js — login, session, localStorage
│   ├── utils/        # slug.js, api.js, hash.js, local-db.js, markdown.js
│   ├── App.jsx       # Global state, orchestration, dual logic
│   ├── main.jsx      # Entry point
│   └── index.css     # All styles
├── test/             # api.test.js, slug.test.js, hash.test.js, markdown.test.js
├── vite.config.js
├── package.json
├── index.html
└── public/
```

## Patterns

- **Sidebar + Editor**: purely presentational components, receive props. `App.jsx` handles all state and business logic.
- **Editor (no autosave)**: no debounce or automatic autosave. Saving is manual ("Save" button or close confirmation). `Editor.jsx` compares against `lastSavedRef` to detect real changes and activate the `saved` indicator.
- **Editor — Markdown**: `body` (Markdown) is the single source of truth. Two editable modes with a binary toggle in the toolbar ("MD" button): `edit` (WYSIWYG contentEditable) and `markdown` (raw textarea). Both mutate the same `body` → `saved`, "Save" and the close confirmation work the same in both modes. `src/utils/markdown.js` exports `renderMarkdown()` (markdown-it + markdown-it-task-lists, `html:false`).
- **Editor — round-trip**: in `edit` mode, `syncFromEditor()` converts the contentEditable HTML to Markdown with Turndown on save. A table `addRule` was added to Turndown to not lose tables.
- **Editor key**: `<Editor key={activeNote.slug}>` forces a remount when switching notes.
- **useCallback on Editor props**: `updateExistingNote`, `saveNewNote` and `deleteExistingNote` are wrapped in `useCallback` to prevent Editor effect resets on every App render.
- **Visible errors**: every failing API operation must call `setError()` so the user sees the error. Never silence with `console.error` only.
- **API calls**: native fetch from `utils/api.js`, single-use JWT (refresh before each request). Owner is sent on each endpoint.
- **Slugs**: `generateUniqueSlug(title, existingSlugs)` from `utils/slug.js`.
- **Search**: client-side (filters by title + body + tags).
- **Two data sources**: without a logged-in user uses local IndexedDB; logged in uses the API with ownerHash.
- **New notes**: created locally (no API). Persisted on the first manual save ("Save").
- **LoginModal with spinner**: when loading providers (inline) and when clicking a provider (spinner in the button + disable all the others).

## API - Auth (geduma-auth)

```
GET  /auth/providers/{appId}        → List of available OAuth providers
POST /auth/login/{appId}/{providerId} → Redirect URL to the provider
GET  /auth/session/{sessionToken}   → User data (single-use)
```

Base URL: `https://api.geduma.com`
APP_ID: from `VITE_APP_ID` in `.env`

⚠️ The `session_token` is received as a **URL fragment (hash)**, not as a query param. It is read client-side with `window.location.hash` + `URLSearchParams`, without reaching the server. E.g.: `https://miapp.com/callback#session_token=uuid-xxx`

## API - Notes

| Method | Route | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/gnotes?owner=&q=` | Bearer | optional query params |
| POST | `/gnotes` | Bearer | `{ slug, title, body, tags, updated, owner }` |
| PUT | `/gnotes/:slug` | Bearer | `{ title?, body?, tags?, updated?, newSlug?, owner }` |
| DELETE | `/gnotes/:slug?owner=` | Bearer | `owner` query param |

- `owner` = SHA-256 of the user's email.
- GET without `?owner=` returns all notes.
- PUT/DELETE validate ownership (403 if it doesn't match).

## Local Storage (IndexedDB)

Database: `gnotes-local` / Store: `notes` (keyPath: `slug`)
Functions in `src/utils/local-db.js`:
- `getAllNotes()` — returns all sorted by updated descending
- `createNote(data)` — add to the store
- `updateNote(slug, fields)` — merge with existing + put
- `deleteNote(slug)` — delete from the store

## Environment Variables

```
VITE_API_AUTH_KEY=...          # API key for POST /auth
VITE_APP_ID=app_mqpon84ym0hbvi # App ID for geduma-auth
```

## Tests

```bash
npm run test         # watch mode
npm run test:run     # run once
```

- Test files: `test/*.test.js`
- Framework: Vitest + jsdom.
- No Testing Library — pure logic without DOM in unit tests.

## Agent Rules

1. Do NOT add comments to code.
2. Do NOT add TypeScript or change extensions to `.tsx`.
3. Do NOT add new dependencies without verifying they are worth it.
4. Commit messages must be in English, short and descriptive.
5. Prefer pure CSS + custom properties over UI libraries.
6. Prefer native fetch over HTTP libraries.