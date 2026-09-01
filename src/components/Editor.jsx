import { useState, useEffect, useCallback, useRef } from 'react'
import TurndownService from 'turndown'
import ConfirmModal from './ConfirmModal'
import { renderMarkdown } from '../utils/markdown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  bulletListMarker: '-'
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

function Editor({ note, onUpdate, onDelete, onCloseNote, persisted }) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [tags, setTags] = useState(note.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saved, setSaved] = useState(true)
  const [mode, setMode] = useState('edit')
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

  const saveNow = useCallback(async () => {
    setSaved(true)
    await onUpdate(note.slug, { title, body, tags })
    lastSavedRef.current = { title, body, tags }
  }, [note.slug, title, body, tags, onUpdate])

  const syncFromEditor = useCallback(() => {
    if (!editorRef.current || fixingRef.current) return
    fixingRef.current = true
    fixListDom(editorRef.current)
    const html = editorRef.current.innerHTML
    fixingRef.current = false
    if (!html || html === '<br>') {
      setBody('')
    } else {
      setBody(turndown.turndown(html))
    }
  }, [])

  const handleInput = useCallback(() => {
    syncFromEditor()
  }, [syncFromEditor])

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
          document.execCommand('outdent')
        } else {
          document.execCommand('indent')
        }
      })
    }
  }, [cmd])

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      if (prev === 'edit') {
        syncFromEditor()
        return 'markdown'
      }
      if (editorRef.current) {
        editorRef.current.innerHTML = renderMarkdown(body) || '<br>'
      }
      return 'edit'
    })
  }, [body, syncFromEditor])

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
        <span className="tb-sep" />
        <button
          className={`tb-btn mode-toggle ${mode === 'markdown' ? 'active' : ''}`}
          onClick={toggleMode}
          title="Toggle Markdown source"
        >MD</button>
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
          />
        ) : (
          <textarea
            className="md-textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
          />
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
            <p className="modal-message">You have unsaved changes</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => { setShowCloseModal(false); onCloseNote() }}>Cancelar</button>
              <button className="modal-cancel" onClick={async () => { await saveNow(); setShowCloseModal(false); onCloseNote() }}>Confirmar</button>
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
