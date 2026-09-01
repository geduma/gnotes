import { useState, useEffect, useCallback, useRef } from 'react'
import TurndownService from 'turndown'
import ConfirmModal from './ConfirmModal'
import { renderMarkdown } from '../utils/markdown'
import { isCompletedBlockPattern, isCompletedInlinePattern, resolveCaretOffset } from '../utils/autoformat'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  bulletListMarker: '-'
})

turndown.addRule('strikethrough', {
  filter: ['s', 'del'],
  replacement: function (content) {
    return '~~' + content + '~~'
  }
})

turndown.addRule('taskListCheckbox', {
  filter: node => node.nodeName === 'INPUT' && node.getAttribute('type') === 'checkbox',
  replacement: function (content, node) {
    return node.checked ? '[x] ' : '[ ] '
  }
})

turndown.addRule('table', {
  filter: node => node.nodeName === 'TABLE',
  replacement: function (content) {
    const rows = []
    nodeLoop: for (let i = 0; i < node.children.length; i++) {
      const tr = node.children[i]
      if (tr.nodeName === 'THEAD' || tr.nodeName === 'TBODY') {
        for (let j = 0; j < tr.children.length; j++) {
          rows.push(cellsToRow(tr.children[j]))
        }
      } else if (tr.nodeName === 'TR') {
        rows.push(cellsToRow(tr))
      }
    }
    if (!rows.length) return ''
    let output = '| ' + rows[0].map((c) => c.text).join(' | ') + ' |\n'
    output += '| ' + rows[0].map((c) => c.align).join(' | ') + ' |\n'
    for (let i = 1; i < rows.length; i++) {
      output += '| ' + rows[i].map((c) => c.text).join(' | ') + ' |\n'
    }
    return output.trim() + '\n\n'
  }
})

function cellsToRow(tr) {
  const cells = []
  for (let i = 0; i < tr.children.length; i++) {
    const cell = tr.children[i]
    const align = cell.align || ''
    const alignDelimiter = align === 'left' ? ':---' : align === 'right' ? '---:' : align === 'center' ? ':---:' : '---'
    cells.push({
      text: inlineToMarkdown(cell.innerHTML),
      align: alignDelimiter
    })
  }
  return cells
}

function inlineToMarkdown(html) {
  if (!html) return ''
  return html
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<em>/g, '*')
    .replace(/<\/em>/g, '*')
    .replace(/<code>/g, '`')
    .replace(/<\/code>/g, '`')
    .replace(/<a[^>]*>(.*?)<\/a>/g, '[$1](url)')
    .replace(/<[^>]+>/g, '')
}

function fixListDom(root) {
  const lists = root.querySelectorAll('ul, ol')
  for (let i = lists.length - 1; i >= 0; i--) {
    const list = lists[i]
    const children = list.children
    for (let j = 0; j < children.length; j++) {
      const child = children[j]
      if (child.tagName === 'UL' || child.tagName === 'OL') {
        const prev = child.previousElementSibling
        if (prev && prev.tagName === 'LI') {
          prev.appendChild(child)
        } else {
          const li = document.createElement('li')
          list.insertBefore(li, child)
          li.appendChild(child)
        }
        j--
      }
    }
  }
}

function getActiveListItem() {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return null
  let node = sel.anchorNode
  if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode
  while (node && node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'LI') {
    node = node.parentNode
  }
  return node && node.nodeName === 'LI' ? node : null
}

function placeCaretInLi(li) {
  const sel = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(li)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

function getNodeAndOffset() {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return null
  const range = sel.getRangeAt(0)
  if (!range.collapsed) return null
  const node = range.startContainer
  const offset = range.startOffset
  const text = node.nodeType === Node.TEXT_NODE ? node : null
  if (text) {
    return { container: node, text, offset }
  }
  const child = node.childNodes[offset - 1]
  if (child && child.nodeType === Node.TEXT_NODE) {
    return { container: child, text: child, offset: child.data.length }
  }
  const next = node.childNodes[offset]
  if (next && next.nodeType === Node.TEXT_NODE) {
    return { container: next, text: next, offset: 0 }
  }
  return null
}

function isBlockElement(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false
  const tag = el.tagName
  if (tag === 'P' || tag === 'LI' || tag === 'BLOCKQUOTE' || tag === 'PRE' || /^H[1-6]$/.test(tag)) return true
  return el.classList && el.classList.contains('editor-wysiwyg')
}

function getBlockGoal() {
  const g = getNodeAndOffset()
  if (!g) return null
  let block = g.text
  while (block && block.parentNode && block.parentNode.nodeType === Node.ELEMENT_NODE) {
    block = block.parentNode
    if (isBlockElement(block)) break
  }
  let blockText = ''
  let caretInBlock = 0
  let found = false
  const walk = (node) => {
    if (found) return
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.data
      if (node === g.text) {
        blockText += txt.slice(0, g.offset)
        caretInBlock = blockText.length
        blockText += txt.slice(g.offset)
        found = true
        return
      }
      blockText += txt
    } else {
      for (let i = 0; i < node.childNodes.length && !found; i++) {
        walk(node.childNodes[i])
      }
    }
  }
  walk(block)
  if (!found) blockText = block.textContent || ''
  return { block, blockText, caretInBlock }
}

function restoreCaretInBlock(block, offset, atEnd) {
  const sel = window.getSelection()
  const range = document.createRange()
  const target = lastTextNode(block)
  if (target) {
    const idx = atEnd ? target.data.length : Math.max(0, Math.min(offset, target.data.length))
    range.setStart(target, idx)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

function lastTextNode(root) {
  let last = null
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      last = node
      return
    }
    for (let i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i])
  }
  walk(root)
  return last
}

function caretInsideCode() {
  const g = getNodeAndOffset()
  if (!g) return false
  let node = g.text
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CODE') return true
    node = node.parentNode
  }
  return false
}

function indentListItem() {
  const li = getActiveListItem()
  if (!li) return
  const list = li.parentNode
  if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) return
  const prev = li.previousElementSibling
  if (!prev || prev.tagName !== 'LI') return
  const listType = list.tagName === 'OL' ? 'OL' : 'UL'
  let nested = null
  for (let i = prev.children.length - 1; i >= 0; i--) {
    const child = prev.children[i]
    if (child.tagName === listType) {
      nested = child
      break
    }
    if (child.tagName === 'UL' || child.tagName === 'OL') nested = child
  }
  if (!nested) {
    nested = document.createElement(listType)
    prev.appendChild(nested)
  }
  nested.appendChild(li)
  placeCaretInLi(li)
}

function outdentListItem() {
  const li = getActiveListItem()
  if (!li) return
  const list = li.parentNode
  if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) return
  const parentLi = list.parentNode && list.parentNode.tagName === 'LI' ? list.parentNode : null
  if (!parentLi) return
  list.removeChild(li)
  if (!list.children.length) parentLi.removeChild(list)
  parentLi.parentNode.insertBefore(li, parentLi.nextSibling)
  placeCaretInLi(li)
}

function Editor({ note, onUpdate, onDelete, onCloseNote, persisted }) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [tags, setTags] = useState(note.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saved, setSaved] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const linkUrlRef = useRef(null)
  const editorRef = useRef(null)
  const mountedRef = useRef(false)
  const fixingRef = useRef(false)
  const prevSlugRef = useRef(note.slug)
  const lastSavedRef = useRef({ title: note.title, body: note.body, tags: note.tags || [] })
  useEffect(() => {
    if (!mountedRef.current || prevSlugRef.current !== note.slug) {
      mountedRef.current = true
      setTitle(note.title)
      setTags(note.tags || [])
      setSaved(true)
      lastSavedRef.current = { title: note.title, body: note.body, tags: note.tags || [] }
      prevSlugRef.current = note.slug
      setBody(note.body)
      if (editorRef.current) {
        editorRef.current.innerHTML = renderMarkdown(note.body) || '<br>'
      }
    }
  }, [note])

  useEffect(() => {
    const lastSaved = lastSavedRef.current
    const hasChanges = title !== lastSaved.title || body !== lastSaved.body || JSON.stringify(tags) !== JSON.stringify(lastSaved.tags)
    setSaved(!hasChanges)
  }, [title, body, tags])
  const saveNow = useCallback(async () => {
    setSaved(true)
    await onUpdate(note.slug, { title, body, tags })
    lastSavedRef.current = { title, body, tags }
  }, [note.slug, title, body, tags, onUpdate])

  const computeBody = useCallback(() => {
    const el = editorRef.current
    if (!el) return ''
    try {
      fixListDom(el)
    } catch {}
    const html = el.innerHTML
    if (!html || html === '<br>') return ''
    return turndown.turndown(html)
  }, [])

  const syncFromEditor = useCallback(() => {
    if (!editorRef.current || fixingRef.current) return
    fixingRef.current = true
    setBody(computeBody())
    fixingRef.current = false
  }, [computeBody])

  const maybeAutoFormat = useCallback(() => {
    const el = editorRef.current
    if (!el || fixingRef.current) return false
    if (caretInsideCode()) return false
    const goal = getBlockGoal()
    if (!goal) return false
    const caretAtEnd = goal.blockText.length - goal.caretInBlock <= 1
    const blockType = caretAtEnd ? isCompletedBlockPattern(goal.blockText) : null
    let inline = null
    if (!blockType) {
      inline = isCompletedInlinePattern(goal.blockText, goal.caretInBlock)
    }
    if (!blockType && !inline) return false
    const oldBlockText = goal.blockText
    const rendered = renderMarkdown(oldBlockText)
    if (!rendered) return false
    let caretTarget = null
    fixingRef.current = true
    try {
      if (goal.block === el) {
        el.innerHTML = rendered
        caretTarget = el.querySelector('p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, ul, ol')
      } else {
        const holder = goal.block.parentNode
        const index = Array.prototype.indexOf.call(holder.children, goal.block)
        goal.block.outerHTML = rendered
        const placed = holder.children[index]
        caretTarget = placed && placed.nodeType === Node.ELEMENT_NODE
          ? placed.querySelector('p, li, h1, h2, h3, h4, h5, h6, blockquote, pre') || placed
          : placed
      }
    } catch {}
    fixingRef.current = false
    const block = caretTarget
    const renderedText = block ? block.textContent : el.innerText || el.textContent
    const mapped = resolveCaretOffset(oldBlockText, goal.caretInBlock, renderedText)
    const target = block || el
    requestAnimationFrame(() => {
      restoreCaretInBlock(target, mapped, caretAtEnd)
    })
    return true
  }, [])

  const handleInput = useCallback(() => {
    maybeAutoFormat()
    syncFromEditor()
  }, [maybeAutoFormat, syncFromEditor])

  const cmd = useCallback((fn) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    fn()
    syncFromEditor()
  }, [syncFromEditor])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      cmd(() => {
        if (e.shiftKey) {
          outdentListItem()
        } else {
          indentListItem()
        }
      })
    }
  }, [cmd])

  return (
    <div className="editor">
      <div className="editor-header">
        <input
          type="text"
          className="editor-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
        />
        <div className="editor-actions">
          <button className="save-button" onClick={saveNow} disabled={saved}>Save</button>
          {persisted && (
            <button className="delete-button" onClick={() => setShowDeleteModal(true)} title="Delete note">Delete</button>
          )}
          <button className="close-button" onClick={() => { if (!saved) { setShowCloseModal(true) } else { onCloseNote() } }} title="Close note">✕</button>
        </div>
      </div>
      <div className="editor-tags">
        {tags.map(tag => (
          <span key={tag} className="tag-chip">
            {tag}
            <button className="tag-remove" onClick={() => setTags(tags.filter(t => t !== tag))}>×</button>
          </span>
        ))}
        <input
          type="text"
          className="tag-input"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              const value = tagInput.trim().replace(/,/g, '').toLowerCase()
              if (value && !tags.includes(value)) {
                setTags([...tags, value])
              }
              setTagInput('')
            }
          }}
          placeholder="Add tag..."
        />
      </div>
      <div className="editor-toolbar">
        <button className="tb-btn" onClick={() => cmd(() => document.execCommand('bold'))} title="Bold"><strong>B</strong></button>
        <button className="tb-btn" onClick={() => cmd(() => document.execCommand('italic'))} title="Italic"><em>I</em></button>
        <button className="tb-btn" onClick={() => cmd(() => document.execCommand('strikeThrough'))} title="Strikethrough"><s>S</s></button>
        <span className="tb-sep" />
        <button className="tb-btn" onClick={() => cmd(() => document.execCommand('formatBlock', false, 'h1'))} title="Heading 1">H1</button>
        <button className="tb-btn" onClick={() => cmd(() => document.execCommand('formatBlock', false, 'h2'))} title="Heading 2">H2</button>
        <button className="tb-btn" onClick={() => cmd(() => document.execCommand('formatBlock', false, 'h3'))} title="Heading 3">H3</button>
        <span className="tb-sep" />
        <button className="tb-btn" onClick={() => cmd(() => document.execCommand('insertUnorderedList'))} title="Bullet list">•</button>
        <button className="tb-btn" onClick={() => cmd(() => document.execCommand('insertOrderedList'))} title="Numbered list">1.</button>
        <button className="tb-btn" onClick={() => cmd(() => document.execCommand('formatBlock', false, 'blockquote'))} title="Blockquote">❝</button>
        <span className="tb-sep" />
        <button className="tb-btn" onClick={() => {
          const sel = window.getSelection()
          setLinkText(sel.toString())
          setLinkUrl('')
          setShowLinkModal(true)
          setTimeout(() => linkUrlRef.current?.focus(), 50)
        }} title="Link">Link</button>
        <span className="tb-sep" />
        <button className="tb-btn" onClick={() => cmd(() => {
          const sel = window.getSelection()
          if (sel.toString()) {
            document.execCommand('insertHTML', false, `<code>${sel.toString()}</code>`)
          }
        })} title="Inline code">&lt;/&gt;</button>
        <button className="tb-btn" onClick={() => cmd(() => {
          document.execCommand('insertHTML', false, '<pre><code>code</code></pre>')
        })} title="Code block">{"{ }"}</button>
      </div>
      <div className="editor-body">
        <div
          ref={editorRef}
          className="editor-wysiwyg"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />
      </div>
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="link-modal" onClick={e => e.stopPropagation()}>
            <h3 className="link-modal-title">Add Link</h3>
            <label className="link-modal-label">Text</label>
            <input
              className="link-modal-input"
              value={linkText}
              onChange={e => setLinkText(e.target.value)}
              placeholder="Link text"
            />
            <label className="link-modal-label">URL</label>
            <input
              ref={linkUrlRef}
              className="link-modal-input"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://..."
              onKeyDown={e => {
                if (e.key === 'Enter' && linkUrl) {
                  cmd(() => {
                    if (linkText) {
                      document.execCommand('insertHTML', false, `<a href="${linkUrl}">${linkText}</a>`)
                    } else {
                      document.execCommand('createLink', false, linkUrl)
                    }
                  })
                  setShowLinkModal(false)
                }
              }}
            />
            <div className="link-modal-actions">
              <button className="link-modal-btn link-modal-cancel" onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button className="link-modal-btn link-modal-apply" disabled={!linkUrl} onClick={() => {
                cmd(() => {
                  if (linkText) {
                    document.execCommand('insertHTML', false, `<a href="${linkUrl}">${linkText}</a>`)
                  } else {
                    document.execCommand('createLink', false, linkUrl)
                  }
                })
                setShowLinkModal(false)
              }}>Apply</button>
            </div>
          </div>
        </div>
      )}
      {showCloseModal && (
        <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <p className="modal-message">You have unsaved changes. Do you want to save them before closing?</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowCloseModal(false)} title="Keep editing the note">Keep editing</button>
              <button className="modal-confirm" onClick={() => { setShowCloseModal(false); onCloseNote() }} title="Close the note without saving changes">Discard changes</button>
              <button className="modal-save" onClick={async () => { await saveNow(); setShowCloseModal(false); onCloseNote() }} title="Save the changes and close the note">Save and close</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <ConfirmModal
          message="Are you sure you want to delete this note?"
          confirmLabel="Delete"
          onConfirm={() => { setShowDeleteModal(false); onDelete(note.slug) }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}

export default Editor
