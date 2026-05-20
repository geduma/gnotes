import { describe, it, expect } from 'vitest'
import { parseNote, serializeNote } from '../utils/note'

describe('parseNote', () => {
  it('parses frontmatter and body', () => {
    const content = `---
title: Test Note
tags:
  - test
  - demo
updated: 2026-05-20
---

This is the body content.`

    const result = parseNote(content)
    expect(result.title).toBe('Test Note')
    expect(result.tags).toEqual(['test', 'demo'])
    expect(result.updated).toBe('2026-05-20')
    expect(result.body).toBe('This is the body content.')
  })

  it('handles missing frontmatter gracefully', () => {
    const content = 'Just body content'
    const result = parseNote(content)
    expect(result.title).toBe('Untitled')
    expect(result.body).toBe('Just body content')
  })
})

describe('serializeNote', () => {
  it('serializes note with frontmatter', () => {
    const note = {
      title: 'Test Note',
      tags: ['test', 'demo'],
      updated: '2026-05-20',
      body: 'Body content'
    }

    const result = serializeNote(note)
    expect(result).toContain('title: Test Note')
    expect(result).toContain('updated: 2026-05-20')
    expect(result).toContain('- test')
    expect(result).toContain('- demo')
    expect(result).toContain('Body content')
  })

  it('handles empty tags', () => {
    const note = {
      title: 'No Tags',
      tags: [],
      updated: '2026-05-20',
      body: 'Content'
    }

    const result = serializeNote(note)
    expect(result).toContain('tags:')
  })
})
