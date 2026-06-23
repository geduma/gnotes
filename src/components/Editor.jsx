import { useState, useEffect, useCallback, useRef } from 'react'
import TurndownService from 'turndown'
import ConfirmModal from './ConfirmModal'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**'
})

function mdToHtml(md) {
  if (!md) return ''
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^-{3,}$/gm, '<hr>')
  html = html.split(/\n\n+/).map(block => {
    if (/^<h[1-3]|<pre|<blockquote|<hr|<li|<ul|<ol/i.test(block)) return block
    if (/^\d+\. /.test(block) || /^[-*] /.test(block)) return block
    return `<p>${block.replace(/\n/g, '<br>')}</p>`
  }).join('\n')
  return html
}

function Editor({ note, onUpdate, onDelete, onCloseNote, persisted }) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [tags, setTags] = useState(note.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saved, setSaved] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const linkUrlRef = useRef(null)
  const editorRef = useRef(null)
  const prevSlugRef = useRef(note.slug)
  const lastSavedRef = useRef({ title: note.title, body: note.body, tags: note.tags || [] })
  useEffect(() => {
    if (prevSlugRef.current !== note.slug) {
      setTitle(note.title)
      setTags(note.tags || [])
      setSaved(true)
      lastSavedRef.current = { title: note.title, body: note.body, tags: note.tags || [] }
      prevSlugRef.current = note.slug
      setBody(note.body)
      if (editorRef.current) {
        editorRef.current.innerHTML = mdToHtml(note.body) || '<br>'
      }
    }
  }, [note])

  useEffect(() => {
    const lastSaved = lastSavedRef.current
    const hasChanges = title !== lastSaved.title || body !== lastSaved.body || JSON.stringify(tags) !== JSON.stringify(lastSaved.tags)
    setSaved(!hasChanges)
    const timer = setTimeout(() => {
      if (hasChanges) {
        onUpdate(note.slug, { title, body, tags })
        lastSavedRef.current = { title, body, tags }
        setSaved(true)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [title, body, tags, note.slug, onUpdate])

  const saveNow = useCallback(() => {
    onUpdate(note.slug, { title, body, tags })
    lastSavedRef.current = { title, body, tags }
    setSaved(true)
  }, [note.slug, title, body, tags, onUpdate])

  const syncFromEditor = useCallback(() => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
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
          <button className="close-button" onClick={onCloseNote} title="Close note">✕</button>
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
      <div className="editor-body">
        <div
          ref={editorRef}
          className="editor-wysiwyg"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
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
      {showDeleteModal && (
        <ConfirmModal
          message="Are you sure you want to delete this note?"
          onConfirm={() => { setShowDeleteModal(false); onDelete(note.slug) }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}

export default Editor
