import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './App.css'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'
import Sidebar from './components/Sidebar.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import CreateBookPage from './pages/CreateBookPage.jsx'
import LandingPage from './pages/LandingPage.jsx'

import AiTutorPanel from './components/AiTutorPanel.jsx'

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('thinkmap_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  // Tutor state
  const [tutorOpen, setTutorOpen] = useState(false)
  const [tutorContext, setTutorContext] = useState({ concept: '', explanation: '' })

  useEffect(() => {
    const handleTutorActivate = (e) => {
      setTutorContext(e.detail)
      setTutorOpen(true)
    }
    window.addEventListener('tutor-activate', handleTutorActivate)
    return () => window.removeEventListener('tutor-activate', handleTutorActivate)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleSignup = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('thinkmap_token')
    localStorage.removeItem('thinkmap_user')
    setUser(null)
  }

  const addBook = (newBook) => {
    // Books are now managed via API in pages
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/"
          element={!user ? <LandingPage /> : <Navigate to="/dashboard" />}
        />
        {/* Auth Routes */}
        <Route
          path="/login"
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/signup"
          element={!user ? <Signup onSignup={handleSignup} /> : <Navigate to="/dashboard" />}
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/*"
          element={
            user ? (
              <div className="sidebar-layout">
                <Sidebar user={user} onLogout={handleLogout} />
                <div className="app">
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage user={user} />} />
                    <Route path="/create-book" element={<CreateBookPage />} />
                    <Route path="/book/:id" element={<CreateBookPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </div>

                <AiTutorPanel 
                  isOpen={tutorOpen} 
                  onClose={() => setTutorOpen(false)} 
                  misunderstoodConcept={tutorContext.concept}
                  originalExplanation={tutorContext.explanation}
                  userId={user.id}
                />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App
