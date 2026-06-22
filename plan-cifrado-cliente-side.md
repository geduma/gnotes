# Plan: Cifrado Cliente-Side (AES-GCM)

> Solo aplica a notas privadas (usuario logueado → MongoDB).
> Notas locales (IndexedDB, sin login) no se modifican.

---

## Alcance

- Se cifra solo el campo **`body`** (contenido Markdown).
- `title`, `tags`, `slug`, `updated` quedan en texto plano (búsqueda y sidebar intactos).
- `encrypted: true` e `iv` se agregan como campos nuevos en el documento.

---

## 🔵 Frontend

### 1. `src/utils/crypto.js` — Nuevo

Funciones:
- `deriveKey(email)` → PBKDF2 con salt fijo `gnotes-cipher-v1`, 100k iteraciones → AES-GCM 256
- `encryptBody(body, email)` → `{ ciphertext (base64), iv (base64) }`
- `decryptBody({ ciphertext, iv }, email)` → plaintext

### 2. `src/utils/api.js` — Modificar 3 funciones

- **`createNote`**: recibe `email`, encripta body antes de enviar, agrega `encrypted: true` e `iv` al payload
- **`updateNote`**: misma lógica, encripta body si cambió
- **`fetchNotes`**: recibe `email`, desencripta body de cada nota si `note.encrypted === true`
- **`deleteNote`**: sin cambios

Firmas actualizadas:
```js
createNote({ slug, title, body, tags, updated, owner, email })
fetchNotes(owner, query, email)
updateNote(slug, fields)  // fields incluye email
```

### 3. `src/App.jsx` — Pasar `user.email`

- `saveNewNote`: `createNote({ ..., email: user.email })`
- `updateExistingNote`: pasar `email` dentro de `updatedFields`
- `loadNotes`: `fetchNotes(user.ownerHash, undefined, user.email)`

### 4. `src/hooks/useAuth.js` — Sin cambios

`userData.email` ya se guarda en localStorage y se expone.

### 5. `test/crypto.test.js` — Nuevo

Tests:
- encripta/desencripta correctamente
- ciphertext diferente cada vez (IV aleatorio)
- body vacío retorna `{ ciphertext: '', iv: '' }`

---

## 🟢 Backend (API /gnotes)

### POST /gnotes

Aceptar dos campos nuevos opcionales:

```json
{
  "slug": "mi-nota",
  "title": "Mi nota",
  "body": "ciphertext-base64",
  "tags": ["tag1"],
  "updated": "2026-06-22",
  "owner": "sha256-email",
  "encrypted": true,
  "iv": "iv-base64"
}
```

- No inspeccionar, validar ni modificar `body`.
- Almacenar `encrypted` e `iv` tal cual.

### GET /gnotes

Retornar los campos almacenados sin transformación:

```json
{
  "slug": "mi-nota",
  "title": "Mi nota",
  "body": "ciphertext-base64",
  "tags": ["tag1"],
  "updated": "2026-06-22",
  "owner": "sha256-email",
  "encrypted": true,
  "iv": "iv-base64"
}
```

### PUT /gnotes/:slug

Aceptar y almacenar `encrypted` e `iv` si vienen en el body.

### DELETE /gnotes/:slug

Sin cambios.

### Esquema MongoDB

```diff
 {
   slug: "mi-nota",
   title: "Mi nota",
   body: "ciphertext-base64",
   tags: [],
   updated: "2026-06-22",
   owner: "sha256-email",
+  encrypted: true,
+  iv: "iv-base64"
 }
```

---

## 📦 Orden de implementación

| Paso | Archivo | Lado |
|------|---------|------|
| 1 | Schema MongoDB: agregar `encrypted` e `iv` | Backend |
| 2 | Endpoints: pasar campos nuevos sin validación | Backend |
| 3 | `crypto.js` — deriveKey, encryptBody, decryptBody | Frontend |
| 4 | `api.js` — encriptar en create/update, desencriptar en fetch | Frontend |
| 5 | `App.jsx` — pasar `user.email` | Frontend |
| 6 | `test/crypto.test.js` | Frontend |
| 7 | Build + deploy | Ambos |

---

## ⚠️ Notas

- **Búsqueda** server-side (`?q=`): no indexa body cifrado. Para privadas se puede filtrar client-side.
- **Slug/Tags**: texto plano, búsqueda funciona.
- **Recuperación**: si el usuario pierde el email, las notas cifradas son irrecuperables.
- **Locales (IndexedDB)**: sin cambios, no se cifran.
