import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../assets/image.png';
import { X, Sparkles, LayoutDashboard, Database, BarChart2, Settings, LogOut } from 'lucide-react';

function Sidebar({ user, onLogout, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
      <div style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#09090b',
        color: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2rem 1.5rem',
        boxSizing: 'border-box',
        borderRight: '1px solid #27272a'
      }}>
        <div>
          <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={logoImage} alt="ThinkMap Logo" style={{ height: '32px', width: 'auto' }} />
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={onClose}
              className="desktop-hide"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              <X size={24} />
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              onClick={() => { navigate('/dashboard'); onClose?.(); }}
              style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: isActive('/dashboard') ? '#27272a' : 'transparent',
                color: isActive('/dashboard') ? '#f9fafb' : '#71717a',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <LayoutDashboard size={20} />
              Dashboard
            </button>
            <button 
              onClick={() => { navigate('/create-book'); onClose?.(); }}
              style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: isActive('/create-book') ? '#27272a' : 'transparent',
                color: isActive('/create-book') ? '#f9fafb' : '#71717a',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <Database size={20} />
              Create Book
            </button>
            <button 
              onClick={() => { navigate('/progress'); onClose?.(); }}
              style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: isActive('/progress') ? '#27272a' : 'transparent',
                color: isActive('/progress') ? '#f9fafb' : '#71717a',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <BarChart2 size={20} />
              Progress
            </button>

            <div style={{ margin: '1rem 0', borderTop: '1px solid #27272a' }}></div>

            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('tutor-activate', { 
                  detail: { concept: 'General Guidance', explanation: 'Help me master my concepts!' } 
                }));
                onClose?.();
              }}
              style={{
                textAlign: 'left',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
                color: '#ffffff',
                border: '1px solid #27272a',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                marginTop: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#3f3f46';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 255, 255, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#27272a';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
              }}
            >
              <div style={{ 
                backgroundColor: '#27272a', 
                borderRadius: '8px', 
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={20} />
              </div>
              AI Tutor
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: '0.5rem', padding: '0 1rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email}
          </p>
          
          <button style={{
            textAlign: 'left',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: '#71717a',
            border: 'none',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Settings size={20} />
            Settings
          </button>
          
          <button 
            onClick={() => {
              onLogout();
              navigate('/login');
              onClose?.();
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
