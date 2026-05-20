function Sidebar({ notes, searchQuery, onSearchChange, onCreateNote, onSelectNote, activeNoteSlug }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <input
          type="text"
          className="sidebar-search"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button className="sidebar-new" onClick={onCreateNote}>
          New Note
        </button>
      </div>
      <div className="sidebar-list">
        {notes.map((note) => (
          <div
            key={note.slug}
            className={`sidebar-item ${note.slug === activeNoteSlug ? 'active' : ''}`}
            onClick={() => onSelectNote(note)}
          >
            <div className="sidebar-item-title">{note.title}</div>
            <div className="sidebar-item-date">{note.updated}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
