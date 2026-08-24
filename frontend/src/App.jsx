/**
 * App.jsx — Root component
 *
 * Sets up React Router with our three pages.
 * Every page shares the same Navbar and footer.
 *
 * ROUTE STRUCTURE:
 *   /           → HomePage      (main analysis tool)
 *   /dashboard  → DashboardPage (scam trends)
 *   /about      → AboutPage     (project info)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar        from './components/Navbar.jsx'
import HomePage      from './pages/HomePage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import AboutPage     from './pages/AboutPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      {/* Outer wrapper: full viewport height, theme-aware background */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950
                      transition-colors duration-200">

        {/* Sticky top navigation */}
        <Navbar />

        {/* Page content — padding-bottom so footer doesn't cover content */}
        <main className="pb-16">
          <Routes>
            <Route path="/"          element={<HomePage />}      />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/about"     element={<AboutPage />}     />
          </Routes>
        </main>

        {/* Fixed bottom footer */}
        <footer className="fixed bottom-0 left-0 right-0
                           bg-white/80 dark:bg-gray-900/80
                           backdrop-blur-md
                           border-t border-gray-200 dark:border-gray-700
                           py-2 text-center
                           text-xs text-gray-400 dark:text-gray-500">
          🛡️ ScamShield AI — Built for India, Powered by AI &nbsp;|&nbsp;
          Cybercrime Helpline: <strong>1930</strong>
        </footer>

      </div>
    </BrowserRouter>
  )
}