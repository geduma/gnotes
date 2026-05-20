import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'

function Editor({ note, onUpdate, showPreview }) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    setTitle(note.title)
    setBody(note.body)
    setSaved(true)
  }, [note])

  useEffect(() => {
    setSaved(false)
    const timer = setTimeout(() => {
      if (title !== note.title || body !== note.body) {
        onUpdate(note.slug, { title, body, tags: note.tags })
        setSaved(true)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [title, body, note.slug, note.title, note.body, note.tags, onUpdate])

  const saveNow = useCallback(() => {
    onUpdate(note.slug, { title, body, tags: note.tags })
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
