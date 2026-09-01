import { useState, useEffect, useCallback, useRef } from 'react'
import ConfirmModal from './ConfirmModal'
import { renderMarkdown } from '../utils/markdown'
import { htmlToMarkdown } from '../utils/html-to-markdown'
import { isCompletedBlockPattern, isCompletedInlinePattern, resolveCaretOffset, isTableHeader, buildTableMarkdown } from '../utils/autoformat'

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

function getColumnCount(table) {
  const firstRow = table.querySelector('thead tr, tbody tr')
  return firstRow ? firstRow.children.length : 0
}

function getOrCreateTbody(table) {
  let tbody = table.querySelector('tbody')
  if (!tbody) {
    tbody = document.createElement('tbody')
    table.appendChild(tbody)
  }
  return tbody
}

function insertTableRow(table, above) {
  const count = Math.max(getColumnCount(table), 1)
  const row = document.createElement('tr')
  for (let i = 0; i < count; i++) {
    const td = document.createElement('td')
    td.appendChild(document.createTextNode('\u00A0'))
    row.appendChild(td)
  }
  const tbody = getOrCreateTbody(table)
  if (above) {
    const first = tbody.querySelector('tr')
    if (first) first.parentNode.insertBefore(row, first)
    else tbody.appendChild(row)
  } else {
    tbody.appendChild(row)
  }
  return row
}

function insertTableColumn(table, before) {
  const rows = table.querySelectorAll('thead tr, tbody tr')
  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i]
    const isHeader = tr.parentNode && tr.parentNode.tagName === 'THEAD'
    const cell = document.createElement(isHeader ? 'th' : 'td')
    cell.appendChild(document.createTextNode('\u00A0'))
    if (before) tr.insertBefore(cell, tr.firstChild)
    else tr.appendChild(cell)
  }
}

function nearestTable(node) {
  let el = node && node.nodeType === Node.ELEMENT_NODE ? node : (node && node.parentNode)
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    if (el.tagName === 'TABLE') return el
    el = el.parentNode
  }
  return null
}

function detectTableZone(e, rect) {
  const edge = 24
  let zone = null
  if (e.clientX > rect.left && e.clientX < rect.right) {
    if (rect.bottom - e.clientY <= edge) zone = 'bottom'
  }
  if (e.clientY > rect.top && e.clientY < rect.bottom) {
    if (e.clientX - rect.left <= edge) zone = 'left'
    else if (rect.right - e.clientX <= edge) zone = 'right'
  }
  return zone
}

function pointerNearTable(e, table, margin) {
  if (!table || !table.isConnected) return false
  const rect = table.getBoundingClientRect()
  return e.clientX >= rect.left - margin && e.clientX <= rect.right + margin &&
         e.clientY >= rect.top - margin && e.clientY <= rect.bottom + margin
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
  const [mode, setMode] = useState('edit')
  const [tableHover, setTableHover] = useState(null)
  const linkUrlRef = useRef(null)
  const tableLeaveTimerRef = useRef(null)
  const editorRef = useRef(null)
  const mountedRef = useRef(false)
  const fixingRef = useRef(false)
  const prevSlugRef = useRef(note.slug)
  const prevModeRef = useRef('edit')
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
      setMode('edit')
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

  useEffect(() => {
    if (prevModeRef.current === 'markdown' && mode === 'edit' && editorRef.current) {
      editorRef.current.innerHTML = renderMarkdown(body) || '<br>'
    }
    prevModeRef.current = mode
  }, [mode, body])

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
    return htmlToMarkdown(html)
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
    let rendered = ''
    let scope = null
    let startIndex = -1
    if (blockType === 'table' && goal.block.parentNode) {
      const prev = goal.block.previousElementSibling
      const prevText = (prev && prev.textContent || '').trim()
      if (prev && isTableHeader(prevText)) {
        scope = goal.block.parentNode
        startIndex = Array.prototype.indexOf.call(scope.children, prev)
        rendered = renderMarkdown(buildTableMarkdown(prevText, oldBlockText))
      }
    }
    if (!rendered) rendered = renderMarkdown(oldBlockText)
    if (!rendered) return false
    let caretTarget = null
    fixingRef.current = true
    try {
      if (scope) {
        const endIndex = Array.prototype.indexOf.call(scope.children, goal.block)
        const count = endIndex - startIndex + 1
        const anchor = scope.children[endIndex + 1] || null
        for (let i = 0; i < count; i++) {
          const n = scope.children[startIndex]
          if (n && n.parentNode) n.parentNode.removeChild(n)
        }
        const template = document.createElement('div')
        template.innerHTML = rendered.trim() + '<p><br></p>'
        const fragment = document.createDocumentFragment()
        while (template.firstChild) fragment.appendChild(template.firstChild)
        scope.insertBefore(fragment, anchor)
        caretTarget = scope.querySelector('table tbody tr td, table thead tr th')
      } else if (goal.block === el) {
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

  const toggleMode = useCallback(() => {
    if (mode === 'edit') {
      setMode('markdown')
      try {
        syncFromEditor()
      } catch {
        setBody(editorRef.current ? editorRef.current.innerText : body)
      }
    } else {
      setMode('edit')
    }
  }, [mode, syncFromEditor, body])

  const scheduleTableHoverHide = useCallback(() => {
    if (tableLeaveTimerRef.current) clearTimeout(tableLeaveTimerRef.current)
    tableLeaveTimerRef.current = setTimeout(() => {
      setTableHover(null)
      tableLeaveTimerRef.current = null
    }, 300)
  }, [])

  const handleEditorMouseMove = useCallback((e) => {
    if (tableLeaveTimerRef.current) {
      clearTimeout(tableLeaveTimerRef.current)
      tableLeaveTimerRef.current = null
    }
    if (mode !== 'edit') {
      if (tableHover) setTableHover(null)
      return
    }
    const table = nearestTable(e.target)
    if (!table) {
      if (tableHover && pointerNearTable(e, tableHover.table, 32)) {
        setTableHover({ ...tableHover, rect: tableHover.table.getBoundingClientRect() })
      } else {
        scheduleTableHoverHide()
      }
      return
    }
    const rect = table.getBoundingClientRect()
    const zone = detectTableZone(e, rect)
    if (zone) {
      setTableHover({ table, zone, rect })
      return
    }
    if (tableHover && tableHover.table === table) {
      setTableHover({ ...tableHover, rect })
    } else {
      scheduleTableHoverHide()
    }
  }, [mode, tableHover, scheduleTableHoverHide])

  const handleEditorMouseLeave = useCallback(() => {
    scheduleTableHoverHide()
  }, [scheduleTableHoverHide])

  const handleOverlayMouseEnter = useCallback(() => {
    if (tableLeaveTimerRef.current) {
      clearTimeout(tableLeaveTimerRef.current)
      tableLeaveTimerRef.current = null
    }
  }, [])

  const handleOverlayMouseLeave = useCallback(() => {
    scheduleTableHoverHide()
  }, [scheduleTableHoverHide])

  const handleTableAdd = useCallback((action) => {
    if (tableLeaveTimerRef.current) {
      clearTimeout(tableLeaveTimerRef.current)
      tableLeaveTimerRef.current = null
    }
    const hov = tableHover
    if (!hov || !hov.table || !hov.table.isConnected) {
      setTableHover(null)
      return
    }
    const table = hov.table
    if (action === 'rowBelow') insertTableRow(table, false)
    else if (action === 'colLeft') insertTableColumn(table, true)
    else if (action === 'colRight') insertTableColumn(table, false)
    setTableHover(null)
    syncFromEditor()
  }, [tableHover, syncFromEditor])

  useEffect(() => {
    if (!tableHover || mode !== 'edit') return
    const updateRect = () => {
      const table = tableHover.table
      if (!table || !table.isConnected) {
        setTableHover(null)
        return
      }
      setTableHover({ ...tableHover, rect: table.getBoundingClientRect() })
    }
    const editor = editorRef.current
    if (!editor) return
    editor.addEventListener('scroll', updateRect, { passive: true })
    window.addEventListener('scroll', updateRect, { passive: true })
    return () => {
      editor.removeEventListener('scroll', updateRect)
      window.removeEventListener('scroll', updateRect)
    }
  }, [tableHover, mode])

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
          const tableHTML = '<table><thead><tr><th>Header</th><th>Header</th></tr></thead><tbody><tr><td>A</td><td>B</td></tr></tbody></table><p><br></p>'
          document.execCommand('insertHTML', false, tableHTML)
          const tbl = editorRef.current && editorRef.current.querySelector('table')
          if (tbl) {
            const firstCell = tbl.querySelector('td, th')
            if (firstCell) {
              const sel = window.getSelection()
              const range = document.createRange()
              range.selectNodeContents(firstCell)
              range.collapse(true)
              sel.removeAllRanges()
              sel.addRange(range)
            }
          }
        })} title="Insert table">▦</button>
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
        <span className="tb-sep" />
        <label className="md-toggle" title="Toggle between formatted editor and raw Markdown">
          <span className="md-toggle-label">MD</span>
          <input
            type="checkbox"
            className="md-toggle-input"
            checked={mode === 'markdown'}
            onChange={toggleMode}
          />
          <span className="md-toggle-track">
            <span className="md-toggle-thumb" />
          </span>
        </label>
      </div>
      <div className="editor-body">
        {mode === 'edit' ? (
          <div
            ref={editorRef}
            className="editor-wysiwyg"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onMouseMove={handleEditorMouseMove}
            onMouseLeave={handleEditorMouseLeave}
          />
        ) : (
          <textarea
            className="md-textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
          />
        )}
        {tableHover && tableHover.rect && (
          <div
            className="table-add-handles"
            onMouseEnter={handleOverlayMouseEnter}
            onMouseLeave={handleOverlayMouseLeave}
          >
            {tableHover.zone === 'bottom' && (
              <button
                className="table-add-handle"
                style={{
                  left: tableHover.rect.left + (tableHover.rect.width / 2),
                  top: tableHover.rect.bottom - 6,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleTableAdd('rowBelow')}
                title="Add row below"
              >+</button>
            )}
            {(tableHover.zone === 'left' || tableHover.zone === 'right') && (
              <button
                className="table-add-handle"
                style={{
                  left: tableHover.zone === 'left' ? tableHover.rect.left + 6 : tableHover.rect.right - 6,
                  top: tableHover.rect.top + (tableHover.rect.height / 2),
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleTableAdd(tableHover.zone === 'left' ? 'colLeft' : 'colRight')}
                title={tableHover.zone === 'left' ? 'Add column left' : 'Add column right'}
              >+</button>
            )}
          </div>
        )}
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
