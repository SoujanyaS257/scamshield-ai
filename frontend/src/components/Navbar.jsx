/**
 * Navbar.jsx — Sticky top navigation bar
 *
 * Features:
 *  - Logo with emoji
 *  - Navigation links (highlights active page)
 *  - Dark / Light mode toggle (persisted to localStorage)
 *
 * WHY STICKY?
 *  User can scroll results while navbar stays visible.
 *  backdrop-blur gives the frosted glass effect on scroll.
 */

import { useState, useEffect } from 'react'
import { Link, useLocation }   from 'react-router-dom'

// Navigation link definitions
// Adding a new page = add one object here
const NAV_LINKS = [
  { path: '/',          label: 'Analyze',   emoji: '🔍' },
  { path: '/dashboard', label: 'Dashboard', emoji: '📊' },
  { path: '/about',     label: 'About',     emoji: 'ℹ️'  },
]

export default function Navbar() {
  const location = useLocation()

  // Initialize dark mode from localStorage
  // () => ... is a lazy initializer — only runs once on mount
  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  )

  // Whenever dark changes, update the <html> class and localStorage
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  return (
    <nav className="sticky top-0 z-50
                    bg-white/80 dark:bg-gray-900/80
                    backdrop-blur-md
                    border-b border-gray-200 dark:border-gray-700
                    transition-colors duration-200">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────────── */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
          >
            <span className="text-2xl transition-transform
                             group-hover:scale-110 duration-200">
              🛡️
            </span>
            <span className="font-black text-lg
                             bg-gradient-to-r from-indigo-600 to-purple-600
                             bg-clip-text text-transparent">
              ScamShield AI
            </span>
          </Link>

          {/* ── Nav links + Dark toggle ───────────────────── */}
          <div className="flex items-center gap-1">

            {NAV_LINKS.map(({ path, label, emoji }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-1.5
                    px-3 py-2 rounded-lg
                    text-sm font-medium
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {/* Show emoji on mobile, label on desktop */}
                  <span className="sm:hidden">{emoji}</span>
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}

            {/* ── Dark mode toggle ──────────────────────── */}
            <button
              onClick={() => setDark(prev => !prev)}
              className="ml-2 p-2 rounded-lg
                         bg-gray-100 dark:bg-gray-800
                         hover:bg-gray-200 dark:hover:bg-gray-700
                         transition-colors duration-150
                         text-lg"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              {dark ? '☀️' : '🌙'}
            </button>

          </div>
        </div>
      </div>
    </nav>
  )
}