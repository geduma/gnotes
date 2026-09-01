import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import React, { act } from 'react'
import Editor from '../src/components/Editor'

function flush() {
  return act(async () => { await Promise.resolve() })
}

function mountEditor(bodyText) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const calls = []
  act(() => {
    root.render(
      React.createElement(Editor, {
        note: { slug: 'n1', title: 'T', body: bodyText, tags: [] },
        onUpdate: async (s, d) => { calls.push(d) },
        onDelete: () => {},
        onCloseNote: () => {},
        persisted: true
      })
    )
  })
  return { container, root, calls }
}

function setCaret(editor, start) {
  const sel = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(!!start)
  sel.removeAllRanges()
  sel.addRange(range)
}

function typeIn(editor, html, start = false) {
  editor.innerHTML = html
  setCaret(editor, start)
  act(() => {
    editor.dispatchEvent(new window.Event('input', { bubbles: true }))
  })
  act(() => {
    window.dispatchEvent(new window.Event('mount'))
  })
}

describe('live auto-format', () => {
  beforeEach(() => { document.body.innerHTML = '' })
  afterEach(() => { window.getSelection().removeAllRanges() })

  it('converts "# Hello" into h1', () => {
    const c = mountEditor('')
    const editor = c.container.querySelector('.editor-wysiwyg')
    expect(editor).toBeTruthy()
    typeIn(editor, '# Hello', false)
    expect(editor.innerHTML).toContain('<h1>Hello</h1>')
  })

  it('converts "- item" into a list', () => {
    const c = mountEditor('')
    const editor = c.container.querySelector('.editor-wysiwyg')
    typeIn(editor, '- item', false)
    const li = editor.querySelector('ul li')
    expect(li).toBeTruthy()
    expect(li.textContent).toBe('item')
  })

  it('converts "**hello**" into strong', () => {
    const c = mountEditor('')
    const editor = c.container.querySelector('.editor-wysiwyg')
    typeIn(editor, '**hello**', false)
    const strong = editor.querySelector('strong')
    expect(strong).toBeTruthy()
    expect(strong.textContent).toBe('hello')
  })

  it('does not format "hello world"', () => {
    const c = mountEditor('')
    const editor = c.container.querySelector('.editor-wysiwyg')
    typeIn(editor, 'hello world', false)
    expect(editor.querySelector('h1, ul, strong, li')).toBeFalsy()
  })

  it('does not format when the caret is not at the end', () => {
    const c = mountEditor('')
    const editor = c.container.querySelector('.editor-wysiwyg')
    typeIn(editor, '# Hello', true)
    expect(editor.querySelector('h1')).toBeFalsy()
  })

  it('converts "- item" after an existing paragraph', () => {
    const c = mountEditor('')
    const editor = c.container.querySelector('.editor-wysiwyg')
    editor.innerHTML = '<p>Previous paragraph</p>'
    setCaret(editor, false)
    const newP = document.createElement('p')
    newP.textContent = '- item'
    editor.appendChild(newP)
    setCaret(newP, false)
    act(() => {
      editor.dispatchEvent(new window.Event('input', { bubbles: true }))
    })
    act(() => {
      window.dispatchEvent(new window.Event('mount'))
    })
    const items = editor.querySelectorAll('ul li')
    expect(items.length).toBe(1)
    expect(items[0].textContent).toBe('item')
    expect(editor.querySelector('p').textContent).toBe('Previous paragraph')
  })
})
