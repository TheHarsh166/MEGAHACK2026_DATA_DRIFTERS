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

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('thinkmap_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

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
                    <Route path="/progress" element={<ProgressPage user={user} />} />
                    <Route path="/book/:id" element={<CreateBookPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </div>
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
