import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

function Editor({ note, onUpdate, showPreview }) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [tags, setTags] = useState(note.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saved, setSaved] = useState(true)
  const prevSlugRef = useRef(note.slug)
  const hasUnsavedChanges = useRef(false)
  const savedTitleRef = useRef(note.title)
  const savedBodyRef = useRef(note.body)
  const savedTagsRef = useRef(note.tags || [])

  useEffect(() => {
    if (prevSlugRef.current !== note.slug) {
      setTitle(note.title)
      setBody(note.body)
      setTags(note.tags || [])
      setSaved(true)
      prevSlugRef.current = note.slug
      hasUnsavedChanges.current = false
      savedTitleRef.current = note.title
      savedBodyRef.current = note.body
      savedTagsRef.current = note.tags || []
    }
  }, [note])

  useEffect(() => {
    if (title !== savedTitleRef.current || body !== savedBodyRef.current || JSON.stringify(tags) !== JSON.stringify(savedTagsRef.current)) {
      hasUnsavedChanges.current = true
      setSaved(false)
    }
    const timer = setTimeout(() => {
      if (hasUnsavedChanges.current) {
        onUpdate(note.slug, { title, body, tags })
        savedTitleRef.current = title
        savedBodyRef.current = body
        savedTagsRef.current = tags
        hasUnsavedChanges.current = false
        setSaved(true)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [title, body, tags, note.slug, onUpdate])

  const saveNow = useCallback(() => {
    onUpdate(note.slug, { title, body, tags })
    savedTitleRef.current = title
    savedBodyRef.current = body
    savedTagsRef.current = tags
    hasUnsavedChanges.current = false
    setSaved(true)
  }, [note.slug, title, body, tags, onUpdate])

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const value = tagInput.trim().replace(/,/g, '').toLowerCase()
      if (value && !tags.includes(value)) {
        const newTags = [...tags, value]
        setTags(newTags)
        savedTagsRef.current = newTags
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    const newTags = tags.filter(t => t !== tagToRemove)
    setTags(newTags)
    savedTagsRef.current = newTags
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
