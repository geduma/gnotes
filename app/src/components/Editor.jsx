import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

function Editor({ note, onUpdate, showPreview }) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [saved, setSaved] = useState(true)
  const prevSlugRef = useRef(note.slug)
  const hasUnsavedChanges = useRef(false)
  const savedTitleRef = useRef(note.title)
  const savedBodyRef = useRef(note.body)

  useEffect(() => {
    if (prevSlugRef.current !== note.slug) {
      setTitle(note.title)
      setBody(note.body)
      setSaved(true)
      prevSlugRef.current = note.slug
      hasUnsavedChanges.current = false
      savedTitleRef.current = note.title
      savedBodyRef.current = note.body
    }
  }, [note])

  useEffect(() => {
    if (title !== savedTitleRef.current || body !== savedBodyRef.current) {
      hasUnsavedChanges.current = true
      setSaved(false)
    }
    const timer = setTimeout(() => {
      if (hasUnsavedChanges.current) {
        onUpdate(note.slug, { title, body, tags: note.tags })
        savedTitleRef.current = title
        savedBodyRef.current = body
        hasUnsavedChanges.current = false
        setSaved(true)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [title, body, note.slug, note.tags, onUpdate])

  const saveNow = useCallback(() => {
    onUpdate(note.slug, { title, body, tags: note.tags })
    savedTitleRef.current = title
    savedBodyRef.current = body
    hasUnsavedChanges.current = false
    setSaved(true)
  }, [note.slug, title, body, note.tags, onUpdate])

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
          <span className={`save-status ${saved ? 'saved' : 'unsaved'}`}>
            {saved ? 'Saved' : 'Unsaved'}
          </span>
          <button
            className="save-button"
            onClick={saveNow}
            disabled={saved}
          >
            Save
          </button>
        </div>
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
