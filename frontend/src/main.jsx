/**
 * main.jsx — React application entry point
 *
 * This is the FIRST file that runs.
 * It mounts the React app into the <div id="root"> in index.html.
 *
 * We apply the saved dark mode BEFORE React renders
 * to prevent the "flash of wrong theme" (FOWT).
 */

import React    from 'react'
import ReactDOM from 'react-dom/client'
import App      from './App.jsx'
import './index.css'   // Tailwind CSS (MUST import here)

// ── Apply saved theme before first render ─────────────────────
// Without this, dark mode users see a white flash on page load
const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
}

// ── Mount React app ───────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)