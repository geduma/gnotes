import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import Spinner from './components/Spinner'
import LoginModal from './components/LoginModal'
import { useAuth } from './hooks/useAuth'
import { generateUniqueSlug } from './utils/slug'
import { fetchNotes, createNote, updateNote, deleteNote } from './utils/api'
import * as localDB from './utils/local-db'

function App() {
  const { user, logout } = useAuth()
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [error, setError] = useState(null)
  const loadingRef = useRef(0)
  const pendingSlugsRef = useRef(new Set())
  const notesRef = useRef(notes)

  useEffect(() => { notesRef.current = notes }, [notes])

  const isPrivate = !!user

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
    setError(null)
    await wrap(async () => {
      try {
        if (isPrivate) {
          if (!user?.ownerHash) {
            throw new Error('User data is incomplete — missing owner identifier')
          }
          const data = await fetchNotes(user.ownerHash)
          setNotes(data)
        } else {
          const data = await localDB.getAllNotes()
          setNotes(data)
        }
      } catch (err) {
        console.error('Error loading notes:', err)
        setError(err.message || 'Failed to load notes')
        setNotes([])
      }
    })
  }, [isPrivate, user, wrap])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const createNewNote = () => {
    const title = 'Untitled Note'
    const now = new Date().toISOString().split('T')[0]
    const allSlugs = [...notesRef.current.map(n => n.slug), ...pendingSlugsRef.current]
    const slug = generateUniqueSlug(title, allSlugs)

    pendingSlugsRef.current.add(slug)
    setActiveNote({ slug, title, updated: now, tags: [], body: '' })
    setMobileSidebarOpen(false)
  }

  const saveNewNote = async (slug, updatedFields) => {
    const { title, body, tags } = updatedFields
    const now = new Date().toISOString().split('T')[0]
    const allSlugs = [...notesRef.current.map(n => n.slug), ...pendingSlugsRef.current].filter(s => s !== slug)
    const finalSlug = generateUniqueSlug(title, allSlugs)

    await wrap(async () => {
      try {
        pendingSlugsRef.current.delete(slug)
        if (isPrivate) {
          const result = await createNote({ slug: finalSlug, title, body, tags, updated: now, owner: user.ownerHash })
          await loadNotes()
          setActiveNote({ title, body, tags, updated: now, slug: result.slug || finalSlug, owner: user.ownerHash })
        } else {
          const note = { slug: finalSlug, title, body, tags, updated: now }
          await localDB.createNote(note)
          await loadNotes()
          setActiveNote(note)
        }
      } catch (error) {
        console.error('Error saving note:', error)
      }
    })
  }

  const updateExistingNote = async (slug, updatedFields) => {
    if (pendingSlugsRef.current.has(slug)) {
      return saveNewNote(slug, updatedFields)
    }

    const note = notesRef.current.find(n => n.slug === slug)
    if (!note) return

    const merged = { ...note, ...updatedFields, updated: new Date().toISOString().split('T')[0] }
    const existingSlugs = notesRef.current.map(n => n.slug).filter(s => s !== slug)
    const newSlug = generateUniqueSlug(merged.title, existingSlugs)
    const finalSlug = newSlug !== slug ? newSlug : null

    if (isPrivate) {
      const body = { ...updatedFields, updated: merged.updated, owner: user.ownerHash }
      if (finalSlug) body.newSlug = finalSlug
      await wrap(async () => {
        try {
          const result = await updateNote(slug, body)
          const resolvedSlug = result.slug
          await loadNotes()
          setActiveNote({ ...merged, slug: resolvedSlug, owner: user.ownerHash })
        } catch (error) {
          console.error('Error updating note:', error)
        }
      })
    } else {
      if (finalSlug) {
        merged.slug = finalSlug
        await wrap(async () => {
          try {
            await localDB.deleteNote(slug)
            await localDB.createNote(merged)
            await loadNotes()
            setActiveNote(merged)
          } catch (error) {
            console.error('Error updating note:', error)
          }
        })
      } else {
        await wrap(async () => {
          try {
            await localDB.updateNote(slug, { ...updatedFields, updated: merged.updated })
            await loadNotes()
            setActiveNote(merged)
          } catch (error) {
            console.error('Error updating note:', error)
          }
        })
      }
    }
  }

  const deleteExistingNote = async (slug) => {
    await wrap(async () => {
      try {
        if (isPrivate) {
          await deleteNote(slug, user.ownerHash)
        } else {
          await localDB.deleteNote(slug)
        }
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

  const handleLogout = () => {
    pendingSlugsRef.current.clear()
    setActiveNote(null)
    logout()
  }

  const isPersisted = activeNote && notesRef.current.some(n => n.slug === activeNote.slug)

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
        user={user}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />
      <button className="menu-toggle" onClick={() => setMobileSidebarOpen(prev => !prev)}>
        <span></span><span></span><span></span>
      </button>
      <div className="app-main">
        {activeNote ? (
          <Editor
            key={activeNote.slug}
            note={activeNote}
            onUpdate={updateExistingNote}
            onDelete={deleteExistingNote}
            onCloseNote={handleCloseNote}
            persisted={isPersisted}
          />
        ) : (
          <div className="editor-empty">
            {error ? (
              <div className="error-banner">
                <p>{error}</p>
                <button className="error-retry" onClick={loadNotes}>Retry</button>
              </div>
            ) : (
              <p>Select or create a note</p>
            )}
          </div>
        )}
        <div className="app-footer">by @geduma ☕</div>
      </div>
      {loading > 0 && <Spinner />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  )
}

export default App
