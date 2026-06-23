function Sidebar({ notes, searchQuery, onSearchChange, onCreateNote, onSelectNote, activeNoteSlug, isOpen, onClose, user, onLoginClick, onLogout }) {
  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
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
              <div className="sidebar-item-title">
                {note.title}
              </div>
              <div className="sidebar-item-date">{note.updated}</div>
              {note.tags && note.tags.length > 0 && (
                <div className="sidebar-item-tags">
                  {note.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="sidebar-tag">{tag}</span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="sidebar-tag-more">+{note.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="sidebar-user">
          {user ? (
            <div className="user-info">
              <img src={user.picture} alt="" className="user-avatar" />
              <span className="user-name">{user.displayName}</span>
              <button className="user-logout" onClick={onLogout} title="Logout">✕</button>
            </div>
          ) : (
            <button className="sidebar-login" onClick={onLoginClick}>Login</button>
          )}
        </div>
      </div>
    </>
  )
}

export default Sidebar
