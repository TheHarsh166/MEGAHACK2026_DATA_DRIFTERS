import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#0f172a',
      color: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '2rem 1.5rem',
      boxSizing: 'border-box',
      borderRight: '1px solid #1e293b'
    }}>
      <div>
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#38bdf8' }}>ThinkMap AI</h2>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>Cognitive Lab</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              textAlign: 'left',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: isActive('/dashboard') ? '#1e293b' : 'transparent',
              color: isActive('/dashboard') ? '#f9fafb' : '#9ca3af',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate('/create-book')}
            style={{
              textAlign: 'left',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: isActive('/create-book') ? '#1e293b' : 'transparent',
              color: isActive('/create-book') ? '#f9fafb' : '#9ca3af',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Create Book
          </button>
          <button 
            onClick={() => navigate('/progress')}
            style={{
              textAlign: 'left',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: isActive('/progress') ? '#1e293b' : 'transparent',
              color: isActive('/progress') ? '#f9fafb' : '#9ca3af',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Progress
          </button>
        </nav>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.5rem', padding: '0 1rem' }}>
          {user?.email}
        </p>
        
        <button style={{
          textAlign: 'left',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backgroundColor: 'transparent',
          color: '#9ca3af',
          border: 'none',
          fontSize: '1rem',
          cursor: 'pointer'
        }}>
          Settings
        </button>
        
        <button 
          onClick={() => {
            onLogout();
            navigate('/login');
          }}
          style={{
            textAlign: 'left',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: '#ef4444',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
