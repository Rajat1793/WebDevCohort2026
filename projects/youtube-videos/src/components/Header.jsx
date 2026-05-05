import { useState } from 'react'
import './Header.css'

export default function Header({ searchQuery, onSearch }) {
  const [focused, setFocused] = useState(false)

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <a href="#" className="logo" aria-label="YouTube Videos">
          <svg
            className="logo-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022z"
              fill="var(--papaya)"
            />
            <path d="M10 15.5V8.5L16 12L10 15.5Z" fill="white" />
          </svg>
          <span className="logo-text">
            <span className="logo-brand">FreeAPI</span>
            <span className="logo-sub">Videos</span>
          </span>
        </a>

        {/* Search */}
        <div className={`search-wrapper ${focused ? 'focused' : ''}`}>
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label="Search videos"
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => onSearch('')}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Badge */}
        <div className="header-badge">
          <span className="badge-dot" />
          <span>Live API</span>
        </div>
      </div>
    </header>
  )
}
