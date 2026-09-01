import { describe, it, expect } from 'vitest'
import {
  isCompletedBlockPattern,
  isCompletedInlinePattern,
  resolveCaretOffset,
  isTableHeader,
  isTableSeparator,
  buildTableMarkdown
} from '../src/utils/autoformat'

describe('isCompletedBlockPattern', () => {
  it('detects headings', () => {
    expect(isCompletedBlockPattern('# One')).toBe('heading')
    expect(isCompletedBlockPattern('## Two')).toBe('heading')
    expect(isCompletedBlockPattern('###### Six')).toBe('heading')
  })

  it('does not detect # without a space', () => {
    expect(isCompletedBlockPattern('#no')).toBe(null)
    expect(isCompletedBlockPattern('#')).toBe(null)
    expect(isCompletedBlockPattern('##')).toBe(null)
  })

  it('detects blockquotes', () => {
    expect(isCompletedBlockPattern('> a quote')).toBe('blockquote')
  })

  it('detects unordered lists', () => {
    expect(isCompletedBlockPattern('- item')).toBe('ul')
    expect(isCompletedBlockPattern('* item')).toBe('ul')
    expect(isCompletedBlockPattern('+ item')).toBe('ul')
  })

  it('detects ordered lists', () => {
    expect(isCompletedBlockPattern('1. item')).toBe('ol')
    expect(isCompletedBlockPattern('10. item')).toBe('ol')
    expect(isCompletedBlockPattern('3) item')).toBe('ol')
  })

  it('does not detect isolated markers', () => {
    expect(isCompletedBlockPattern('-')).toBe(null)
    expect(isCompletedBlockPattern('--')).toBe(null)
    expect(isCompletedBlockPattern('1.')).toBe(null)
  })

  it('detects horizontal rules', () => {
    expect(isCompletedBlockPattern('***')).toBe('hr')
    expect(isCompletedBlockPattern('---')).toBe('hr')
    expect(isCompletedBlockPattern('___')).toBe('hr')
    expect(isCompletedBlockPattern('- - -')).toBe('hr')
  })

  it('detects a table separator row', () => {
    expect(isCompletedBlockPattern('|---|---|')).toBe('table')
    expect(isCompletedBlockPattern('|:---|:---:|')).toBe('table')
  })

  it('does not detect a header row as a block conversion', () => {
    expect(isCompletedBlockPattern('| A | B |')).toBe(null)
  })
})

describe('table helpers', () => {
  it('identifies table header rows', () => {
    expect(isTableHeader('| A | B |')).toBe(true)
    expect(isTableHeader('| A | B |')).toBe(true)
  })

  it('rejects non-table lines as headers', () => {
    expect(isTableHeader('plain text')).toBe(false)
    expect(isTableHeader('|---|---|')).toBe(false)
    expect(isTableHeader('---')).toBe(false)
  })

  it('identifies table separator rows', () => {
    expect(isTableSeparator('|---|---|')).toBe(true)
    expect(isTableSeparator('|:---:|---:|')).toBe(true)
    expect(isTableSeparator('|---|')).toBe(false)
  })

  it('builds the GFM source for a table with an empty body row', () => {
    const src = buildTableMarkdown('| A | B |', '|---|---|')
    expect(src).toBe('| A | B |\n|---|---|\n|  |  |')
  })
})

describe('isCompletedInlinePattern', () => {
  it('detects bold with a closed delimiter', () => {
    const r = isCompletedInlinePattern('**hello**', 9)
    expect(r).not.toBe(null)
    expect(r.type).toBe('strong')
    expect(r.content).toBe('hello')
  })

  it('does not detect unclosed bold', () => {
    expect(isCompletedInlinePattern('**hello', 6)).toBe(null)
  })

  it('detects italics', () => {
    const r = isCompletedInlinePattern('*hello*', 7)
    expect(r).not.toBe(null)
    expect(r.type).toBe('em')
    expect(r.content).toBe('hello')
  })

  it('detects strikethrough', () => {
    const r = isCompletedInlinePattern('~~hello~~', 9)
    expect(r).not.toBe(null)
    expect(r.type).toBe('s')
    expect(r.content).toBe('hello')
  })

  it('detects inline code', () => {
    const r = isCompletedInlinePattern('`hello`', 7)
    expect(r).not.toBe(null)
    expect(r.type).toBe('code')
    expect(r.content).toBe('hello')
  })

  it('detects the last pair on a line', () => {
    const r = isCompletedInlinePattern('text **bold**', 13)
    expect(r).not.toBe(null)
    expect(r.type).toBe('strong')
    expect(r.content).toBe('bold')
  })

  it('does not detect when the caret is not at the end', () => {
    expect(isCompletedInlinePattern('**bold** rest', 8)).toBe(null)
  })

  it('does not detect a delimiter without content', () => {
    expect(isCompletedInlinePattern('****', 4)).toBe(null)
  })
})

describe('resolveCaretOffset', () => {
  it('maps the offset after removing block markers', () => {
    expect(resolveCaretOffset('# Heading', 12, 'Heading')).toBe(7)
  })

  it('maps the offset at the end of a block', () => {
    expect(resolveCaretOffset('# Hello', 5, 'Hello')).toBe(3)
  })

  it('maps inline content after removing asterisks', () => {
    expect(resolveCaretOffset('text **bold**', 16, 'text bold')).toBe(9)
  })

  it('supports an empty offset at the end', () => {
    expect(resolveCaretOffset('**hello**', 9, 'hello')).toBe(5)
  })

  it('does not go out of range', () => {
    expect(resolveCaretOffset('hello', 3, 'x')).toBe(1)
  })
})