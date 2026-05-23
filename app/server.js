import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const notesDir = path.resolve(__dirname, '../notes')

function ensureNotesDir() {
  if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true })
  }
}

function getAllNotes() {
  ensureNotesDir()
  const notes = []

  function readDir(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relPath = path.join(relativePath, entry.name)

      if (entry.isDirectory()) {
        readDir(fullPath, relPath)
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const slug = relPath.replace(/\.md$/, '')
        notes.push({ slug, content, path: fullPath })
      }
    }
  }

  readDir(notesDir)
  return notes
}

function parseNotes(notes) {
  return notes.map(({ slug, content }) => {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!match) return { slug, title: 'Untitled', body: content, updated: '', tags: [] }
    const frontmatter = match[1]
    const body = match[2]
    const titleMatch = frontmatter.match(/title: (.+)/)
    const updatedMatch = frontmatter.match(/updated: (.+)/)
    const tagsMatch = frontmatter.match(/tags:\n([\s\S]*?)(?=\n\w|$)/)
    const tags = tagsMatch ? tagsMatch[1].trim().split('\n').map(t => t.replace(/^\s*- /, '')).filter(Boolean) : []
    return {
      slug,
      title: titleMatch ? titleMatch[1] : 'Untitled',
      updated: updatedMatch ? updatedMatch[1] : '',
      tags,
      body: body.trim()
    }
  })
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch (e) {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname

  // GET /api/notes
  if (pathname === '/api/notes' && req.method === 'GET') {
    const notes = getAllNotes()
    const parsed = parseNotes(notes)
    return sendJSON(res, 200, parsed)
  }

  // POST /api/notes
  if (pathname === '/api/notes' && req.method === 'POST') {
    try {
      const { slug, content } = await readBody(req)
      const filePath = path.join(notesDir, `${slug}.md`)
      ensureNotesDir()
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, content, 'utf-8')
      return sendJSON(res, 200, { success: true })
    } catch (e) {
      return sendJSON(res, 400, { error: e.message })
    }
  }

  // PUT /api/notes/:slug
  const putMatch = pathname.match(/^\/api\/notes\/(.+)$/)
  if (putMatch && req.method === 'PUT') {
    try {
      const slug = putMatch[1]
      const { content, newSlug } = await readBody(req)
      const filePath = path.join(notesDir, `${slug}.md`)

      if (newSlug && newSlug !== slug) {
        const newFilePath = path.join(notesDir, `${newSlug}.md`)
        const dir = path.dirname(newFilePath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        if (fs.existsSync(filePath)) fs.renameSync(filePath, newFilePath)
        fs.writeFileSync(newFilePath, content, 'utf-8')
        return sendJSON(res, 200, { success: true, slug: newSlug })
      } else {
        fs.writeFileSync(filePath, content, 'utf-8')
        return sendJSON(res, 200, { success: true, slug })
      }
    } catch (e) {
      return sendJSON(res, 400, { error: e.message })
    }
  }

  // DELETE /api/notes/:slug
  const deleteMatch = pathname.match(/^\/api\/notes\/(.+)$/)
  if (deleteMatch && req.method === 'DELETE') {
    const slug = deleteMatch[1]
    const filePath = path.join(notesDir, `${slug}.md`)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    return sendJSON(res, 200, { success: true })
  }

  sendJSON(res, 404, { error: 'Not found' })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Gnotes API server running on http://localhost:${PORT}`)
})
