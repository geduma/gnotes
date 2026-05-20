import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

export function notesPlugin() {
  return {
    name: 'notes-plugin',
    configureServer(server) {
      server.middlewares.use('/api/notes', async (req, res, next) => {
        if (req.method === 'GET') {
          const notes = getAllNotes()
          const parsed = notes.map(({ slug, content }) => {
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
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(parsed))
        } else {
          next()
        }
      })

      server.middlewares.use('/api/notes', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            const { slug, content } = JSON.parse(body)
            const filePath = path.join(notesDir, `${slug}.md`)
            fs.writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          })
        } else {
          next()
        }
      })

      server.middlewares.use('/api/notes/', async (req, res, next) => {
        const slug = req.url.replace('/', '')
        const filePath = path.join(notesDir, `${slug}.md`)

        if (req.method === 'PUT') {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            const { content, newSlug } = JSON.parse(body)
            
            if (newSlug && newSlug !== slug) {
              const newFilePath = path.join(notesDir, `${newSlug}.md`)
              if (fs.existsSync(filePath)) {
                fs.renameSync(filePath, newFilePath)
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, slug: newSlug }))
            } else {
              fs.writeFileSync(filePath, content, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, slug }))
            }
          })
        } else if (req.method === 'DELETE') {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true }))
        } else {
          next()
        }
      })
    }
  }
}
