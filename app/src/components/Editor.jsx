import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

function Editor({ note, onUpdate, showPreview, onCloseNote }) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [tags, setTags] = useState(note.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saved, setSaved] = useState(true)
  const prevSlugRef = useRef(note.slug)
  const lastSavedRef = useRef({ title: note.title, body: note.body, tags: note.tags || [] })

  useEffect(() => {
    if (prevSlugRef.current !== note.slug) {
      setTitle(note.title)
      setBody(note.body)
      setTags(note.tags || [])
      setSaved(true)
      lastSavedRef.current = { title: note.title, body: note.body, tags: note.tags || [] }
      prevSlugRef.current = note.slug
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

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const value = tagInput.trim().replace(/,/g, '').toLowerCase()
      if (value && !tags.includes(value)) {
        setTags([...tags, value])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
  }

  const handleBodyChange = (e) => {
    setBody(e.target.value)
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <input
          type="text"
          className="editor-title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title..."
        />
        <div className="editor-actions">
          <button
            className="save-button"
            onClick={saveNow}
            disabled={saved}
          >
            Save
          </button>
          <button className="close-button" onClick={onCloseNote} title="Close note">✕</button>
        </div>
      </div>
      <div className="editor-tags">
        {tags.map(tag => (
          <span key={tag} className="tag-chip">
            {tag}
            <button className="tag-remove" onClick={() => removeTag(tag)}>×</button>
          </span>
        ))}
        <input
          type="text"
          className="tag-input"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Add tag..."
        />
      </div>
      <div className="editor-body">
        <textarea
          className="editor-textarea"
          value={body}
          onChange={handleBodyChange}
          placeholder="Start writing..."
        />
        {showPreview && (
          <div className="editor-preview">
            <ReactMarkdown>{body}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

export default Editor
