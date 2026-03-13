import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoImage from '../assets/image.png';
import { GoogleLogin } from '@react-oauth/google';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch('http://localhost:5006/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google login failed');

      localStorage.setItem('thinkmap_token', data.token);
      localStorage.setItem('thinkmap_user', JSON.stringify(data.user));
      toast.success('Welcome!');
      onLogin(data.user);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
// ... existing handleSubmit code ...
    e.preventDefault();
    setLoading(true); // Set loading to true on submission
    try {
      const res = await fetch('http://localhost:5006/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('thinkmap_token', data.token);
      localStorage.setItem('thinkmap_user', JSON.stringify(data.user));

      toast.success('Welcome back!');
      onLogin(data.user);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false); // Set loading to false after request
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#09090b',
      color: '#f9fafb',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#18181b',
        padding: '2.5rem',
        borderRadius: '24px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        border: '1px solid #27272a'
      }}>
        <div 
          onClick={() => navigate('/')}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', cursor: 'pointer' }}
        >
          <img src={logoImage} alt="ThinkMap Logo" style={{ height: '48px', width: 'auto' }} />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: '#9ca3af', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Please enter your details to sign in
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #27272a',
                backgroundColor: '#09090b',
                color: '#f9fafb',
                fontSize: '1rem',
                outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #27272a',
                backgroundColor: '#09090b',
                color: '#f9fafb',
                fontSize: '1rem',
                outline: 'none'
              }}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#ffffff',
              color: '#09090b',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }}></div>
          <span style={{ color: '#71717a', fontSize: '0.8rem', fontWeight: '500' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              toast.error('Google Login Failed');
            }}
            theme="filled_black"
            shape="pill"
            width="250px"
            size="medium"
          />
        </div>

        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#9ca3af' }}>
          Don't have an account? {' '}
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'none'
            }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
