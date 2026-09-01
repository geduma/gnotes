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

  it('keeps all content when toggling MD mode back and forth', () => {
    const c = mountEditor('# H1\n\n**Bold**')
    const editor = c.container.querySelector('.editor-wysiwyg')
    expect(editor.innerHTML).toContain('<h1>H1</h1>')
    const input = c.container.querySelector('.md-toggle-input')
    act(() => { input.click() })
    const ta = c.container.querySelector('.md-textarea')
    expect(ta).toBeTruthy()
    expect(ta.value).toBe('# H1\n\n**Bold**')
    act(() => { input.click() })
    const editor2 = c.container.querySelector('.editor-wysiwyg')
    expect(editor2.innerHTML).toContain('<h1>H1</h1>')
    expect(editor2.innerHTML).toContain('<strong>Bold</strong>')
  })

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

  it('converts a header + separator row into a table', () => {
    const c = mountEditor('')
    const editor = c.container.querySelector('.editor-wysiwyg')
    editor.innerHTML = '<p>| A | B |</p>'
    setCaret(editor, false)
    const sepP = document.createElement('p')
    sepP.textContent = '|---|---|'
    editor.appendChild(sepP)
    setCaret(sepP, false)
    act(() => {
      editor.dispatchEvent(new window.Event('input', { bubbles: true }))
    })
    act(() => {
      window.dispatchEvent(new window.Event('mount'))
    })
    const table = editor.querySelector('table')
    expect(table).toBeTruthy()
    const cells = editor.querySelectorAll('table th, table td')
    expect(table.querySelector('th').textContent).toBe('A')
    expect(table.querySelector('td').textContent).toBe('')
  })

  it('shows an add-row handle on the bottom edge and inserts a row', () => {
    const c = mountEditor('')
    const editor = c.container.querySelector('.editor-wysiwyg')
    editor.innerHTML = '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table><p><br></p>'
    const table = editor.querySelector('table')
    const origRowCount = table.querySelectorAll('tr').length
    table.getBoundingClientRect = () => ({ left: 100, right: 300, top: 100, bottom: 200, width: 200, height: 100 })
    act(() => {
      table.dispatchEvent(new window.MouseEvent('mousemove', {
        bubbles: true,
        clientX: 200,
        clientY: 195
      }))
    })
    act(() => {
      window.dispatchEvent(new window.Event('mount'))
    })
    const handles = document.querySelectorAll('.table-add-handle')
    expect(handles.length).toBe(1)
    act(() => { handles[0].click() })
    act(() => {
      window.dispatchEvent(new window.Event('mount'))
    })
    expect(table.querySelectorAll('tr').length).toBe(origRowCount + 1)
  })

  it('does not show a handle when hovering left of the table', () => {
    const c = mountEditor('')
    const editor = c.container.querySelector('.editor-wysiwyg')
    editor.innerHTML = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table><p><br></p>'
    const table = editor.querySelector('table')
    table.getBoundingClientRect = () => ({ left: 100, right: 300, top: 100, bottom: 200, width: 200, height: 100 })
    act(() => {
      editor.dispatchEvent(new window.MouseEvent('mousemove', {
        bubbles: true,
        clientX: 200,
        clientY: 150
      }))
    })
    act(() => {
      window.dispatchEvent(new window.Event('mount'))
    })
    expect(document.querySelectorAll('.table-add-handle').length).toBe(0)
  })
})
