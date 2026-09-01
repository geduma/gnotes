# GNotes

Minimalist, fast, self-hosted personal notes application.

## Features

- WYSIWYG editor with floating format bar and link modal
- Manual save (no autosave) with unsaved-changes confirmation
- Note search by title, body and tags
- Dark mode by default
- OAuth login (Google, GitHub, Microsoft) for cloud persistence
- Offline local storage (IndexedDB)
- REST API with owner (email SHA-256)
- Pure CSS, no UI frameworks

## Stack

- React + Vite
- Pure CSS
- turndown (HTML → Markdown for the WYSIWYG editor)
- Vitest (tests)
- External REST API (`https://api.geduma.com`)
- Auth: OAuth (geduma-auth) + single-use JWT
- Native IndexedDB (local storage)
- Web Crypto API (SHA-256)

## Structure

```
gnotes/
├── src/
│   ├── components/     # Sidebar, Editor, LoginModal, ConfirmModal, Spinner
│   ├── hooks/          # useAuth
│   ├── utils/          # slug.js, api.js, hash.js, local-db.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── test/               # api.test.js, slug.test.js, hash.test.js
├── vite.config.js
├── package.json
├── index.html
└── public/
```

## Development

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173/`.

## Tests

```bash
npm run test        # watch mode
npm run test:run    # run once
```

## Environment Variables

```
VITE_AUTH_KEY=...              # API key for POST /auth
VITE_APP_ID=app_mqpon84ym0hbvi # App ID for geduma-auth
```

## API

The app consumes an external REST API. Full documentation in `PRD.md`.

## Philosophy

- Minimalist: no dashboards or widgets
- Fast: instant response
- Offline-first: no account required, local persistence
- No vendor lock-in: portable data
