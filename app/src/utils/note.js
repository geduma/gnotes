import matter from 'gray-matter'

export function parseNote(content) {
  const { data, content: body } = matter(content)
  return {
    title: data.title || 'Untitled',
    tags: data.tags || [],
    updated: data.updated instanceof Date ? data.updated.toISOString().split('T')[0] : (data.updated || ''),
    body: body.trim()
  }
}

export function serializeNote({ title, tags, updated, body }) {
  const frontmatter = {
    title,
    tags,
    updated
  }
  return `---\n${Object.entries(frontmatter).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`
    }
    return `${key}: ${value}`
  }).join('\n')}\n---\n\n${body}`
}
