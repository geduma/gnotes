import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import { generateUniqueSlug } from './utils/slug'
import { fetchNotes, createNote, updateNote, deleteNote } from './utils/api'

function App() {
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const loadNotes = useCallback(async () => {
    try {
      const data = await fetchNotes()
      setNotes(data)
    } catch (error) {
      console.error('Error loading notes:', error)
      setNotes([])
    }
  }, [])

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

  const createNewNote = async () => {
    const title = 'Untitled Note'
    const now = new Date().toISOString().split('T')[0]
    const existingSlugs = notes.map(n => n.slug)
    const slug = generateUniqueSlug(title, existingSlugs)

    try {
      await createNote({ slug, title, body: '', tags: [], updated: now })
      await loadNotes()
      const newNote = { slug, title, updated: now, tags: [], body: '' }
      setActiveNote(newNote)
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const updateExistingNote = async (slug, updatedFields) => {
    const note = notes.find(n => n.slug === slug)
    if (!note) return

    const merged = { ...note, ...updatedFields, updated: new Date().toISOString().split('T')[0] }
    const existingSlugs = notes.map(n => n.slug).filter(s => s !== slug)
    const newSlug = generateUniqueSlug(merged.title, existingSlugs)
    const finalSlug = newSlug !== slug ? newSlug : null

    const body = { title: merged.title, body: merged.body, tags: merged.tags, updated: merged.updated }
    if (finalSlug) body.newSlug = finalSlug

    try {
      const result = await updateNote(slug, body)
      const resolvedSlug = result.slug
      await loadNotes()
      setActiveNote({ ...merged, slug: resolvedSlug })
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const deleteExistingNote = async (slug) => {
    try {
      await deleteNote(slug)
      await loadNotes()
      if (activeNote && activeNote.slug === slug) {
        setActiveNote(null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleSelectNote = (note) => {
    setActiveNote(note)
    setMobileSidebarOpen(false)
  }

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
          showPreview={showPreview}
          onCloseNote={() => { setActiveNote(null); setMobileSidebarOpen(true) }}
        />
      ) : (
        <div className="editor-empty">
          <p>Select or create a note</p>
        </div>
      )}
    </div>
  )
}

export default App
