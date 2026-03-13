import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './App.css'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'
import Sidebar from './components/Sidebar.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import CreateBookPage from './pages/CreateBookPage.jsx'
import ProgressPage from './pages/ProgressPage.jsx'
import LandingPage from './pages/LandingPage.jsx'

import AiTutorPanel from './components/AiTutorPanel.jsx'

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('thinkmap_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const GOOGLE_CLIENT_ID = "249056325389-2o3fsklitrvu7d63fevu73f5408a9r6l.apps.googleusercontent.com"; // From .env

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

  // Mobile Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    setSidebarOpen(false)
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
                <>
                  {/* Mobile Hamburger Menu */}
                  <button 
                    className="mobile-toggle"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ width: '20px', height: '2px', background: '#ffffff' }}></div>
                      <div style={{ width: '20px', height: '2px', background: '#ffffff' }}></div>
                      <div style={{ width: '20px', height: '2px', background: '#ffffff' }}></div>
                    </div>
                  </button>

                  {/* Sidebar Overlay for Mobile */}
                  <div 
                    className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  />

                  <div className="sidebar-layout">
                    <Sidebar 
                      user={user} 
                      onLogout={handleLogout} 
                      isOpen={sidebarOpen}
                      onClose={() => setSidebarOpen(false)}
                    />
                    
                    <div className="app">
                      <Routes>
                        <Route path="/dashboard" element={<DashboardPage user={user} />} />
                        <Route path="/create-book" element={<CreateBookPage />} />
                        <Route path="/progress" element={<ProgressPage user={user} />} />
                        <Route path="/book/:id" element={<CreateBookPage />} />
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                      </Routes>
                    </div>
                  </div>

                  <AiTutorPanel 
                    isOpen={tutorOpen} 
                    onClose={() => setTutorOpen(false)} 
                  />
                </>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  )
}

export default App
