import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import Spinner from './components/Spinner'
import { generateUniqueSlug } from './utils/slug'
import { fetchNotes, createNote, updateNote, deleteNote } from './utils/api'

function App() {
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(0)
  const loadingRef = useRef(0)
  const pendingSlugsRef = useRef(new Set())

  const startLoading = useCallback(() => {
    loadingRef.current += 1
    setLoading(loadingRef.current)
  }, [])

  const stopLoading = useCallback(() => {
    loadingRef.current = Math.max(0, loadingRef.current - 1)
    setLoading(loadingRef.current)
  }, [])

  const wrap = useCallback(async (fn) => {
    startLoading()
    try {
      return await fn()
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  const loadNotes = useCallback(async () => {
    await wrap(async () => {
      try {
        const data = await fetchNotes()
        setNotes(data)
      } catch (error) {
        console.error('Error loading notes:', error)
        setNotes([])
      }
    })
  }, [wrap])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        setShowPreview(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const createNewNote = () => {
    const title = 'Untitled Note'
    const now = new Date().toISOString().split('T')[0]
    const allSlugs = [...notes.map(n => n.slug), ...pendingSlugsRef.current]
    const slug = generateUniqueSlug(title, allSlugs)

    pendingSlugsRef.current.add(slug)
    setActiveNote({ slug, title, updated: now, tags: [], body: '' })
    setMobileSidebarOpen(false)
  }

  const saveNewNote = async (slug, updatedFields) => {
    const { title, body, tags } = updatedFields
    const now = new Date().toISOString().split('T')[0]
    const allSlugs = [...notes.map(n => n.slug), ...pendingSlugsRef.current].filter(s => s !== slug)
    const finalSlug = generateUniqueSlug(title, allSlugs)

    await wrap(async () => {
      try {
        const result = await createNote({ slug: finalSlug, title, body, tags, updated: now })
        pendingSlugsRef.current.delete(slug)
        if (finalSlug !== slug) pendingSlugsRef.current.delete(finalSlug)
        await loadNotes()
        setActiveNote({ title, body, tags, updated: now, slug: result.slug || finalSlug })
      } catch (error) {
        console.error('Error creating note:', error)
      }
    })
  }

  const updateExistingNote = async (slug, updatedFields) => {
    if (!notes.some(n => n.slug === slug) || pendingSlugsRef.current.has(slug)) {
      return saveNewNote(slug, updatedFields)
    }

    const note = notes.find(n => n.slug === slug)
    if (!note) return

    const merged = { ...note, ...updatedFields, updated: new Date().toISOString().split('T')[0] }
    const existingSlugs = notes.map(n => n.slug).filter(s => s !== slug)
    const newSlug = generateUniqueSlug(merged.title, existingSlugs)
    const finalSlug = newSlug !== slug ? newSlug : null

    const body = { ...updatedFields, updated: merged.updated }
    if (finalSlug) body.newSlug = finalSlug

    await wrap(async () => {
      try {
        const result = await updateNote(slug, body)
        const resolvedSlug = result.slug
        await loadNotes()
        setActiveNote({ ...merged, slug: resolvedSlug })
      } catch (error) {
        console.error('Error updating note:', error)
      }
    })
  }

  const deleteExistingNote = async (slug) => {
    await wrap(async () => {
      try {
        await deleteNote(slug)
        await loadNotes()
        if (activeNote && activeNote.slug === slug) {
          setActiveNote(null)
        }
      } catch (error) {
        console.error('Error deleting note:', error)
      }
    })
  }

  const handleSelectNote = (note) => {
    setActiveNote(note)
    setMobileSidebarOpen(false)
  }

  const handleCloseNote = () => {
    if (activeNote && pendingSlugsRef.current.has(activeNote.slug)) {
      pendingSlugsRef.current.delete(activeNote.slug)
    }
    setActiveNote(null)
    setMobileSidebarOpen(true)
  }

  const isPersisted = activeNote && notes.some(n => n.slug === activeNote.slug)

  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(query) ||
      note.body.toLowerCase().includes(query) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  })

  return (
    <div className="app">
      <Sidebar
        notes={filteredNotes}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateNote={createNewNote}
        onSelectNote={handleSelectNote}
        activeNoteSlug={activeNote?.slug}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <button className="menu-toggle" onClick={() => setMobileSidebarOpen(prev => !prev)}>
        <span></span><span></span><span></span>
      </button>
      {activeNote ? (
        <Editor
          key={activeNote.slug}
          note={activeNote}
          onUpdate={updateExistingNote}
          onDelete={deleteExistingNote}
          showPreview={showPreview}
          onCloseNote={handleCloseNote}
          persisted={isPersisted}
        />
      ) : (
        <div className="editor-empty">
          <p>Select or create a note</p>
        </div>
      )}
      {loading > 0 && <Spinner />}
    </div>
  )
}

export default App
