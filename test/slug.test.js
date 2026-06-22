import { describe, it, expect } from 'vitest'
import { generateSlug, generateUniqueSlug } from '../src/utils/slug'

describe('generateSlug', () => {
  it('converts title to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(generateSlug('Hello! World@')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('My First Note')).toBe('my-first-note')
  })

  it('handles multiple spaces', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world')
  })

  it('trims whitespace', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })
})

describe('generateUniqueSlug', () => {
  it('returns base slug when no conflicts', () => {
    expect(generateUniqueSlug('Hello World', [])).toBe('hello-world')
  })

  it('adds suffix when conflict exists', () => {
    expect(generateUniqueSlug('Hello World', ['hello-world'])).toBe('hello-world-1')
  })

  it('increments suffix for multiple conflicts', () => {
    const existing = ['hello-world', 'hello-world-1', 'hello-world-2']
    expect(generateUniqueSlug('Hello World', existing)).toBe('hello-world-3')
  })
})
