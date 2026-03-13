import React, { useState, useEffect } from 'react';
import { mlApi } from '../services/mlApi';

const Leaderboard = () => {
  const [filter, setFilter] = useState('daily');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await mlApi.get(`/leaderboard?timeframe=${filter}`);
        setMembers(data.members || []);
      } catch (err) {
        console.error("Leaderboard fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [filter]);

  const filters = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'lifetime', label: 'Lifetime' }
  ];

  return (
    <div className="leaderboard" style={{ backgroundColor: '#09090b', borderRadius: '20px', border: '1px solid #27272a', overflow: 'hidden' }}>
      <div style={{ padding: '2rem', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Global Leaderboard</h2>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#18181b', padding: '0.4rem', borderRadius: '12px', border: '1px solid #27272a' }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filter === f.id ? '#ffffff' : 'transparent',
                color: filter === f.id ? '#09090b' : '#71717a',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '1rem' }}>Rank</th>
              <th style={{ padding: '1rem' }}>Member</th>
              <th style={{ padding: '1rem' }}>Progress</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td colSpan="4" style={{ padding: '0.5rem 1rem' }}>
                    <div className="skeleton-row skeleton-shimmer"></div>
                  </td>
                </tr>
              ))
            ) : members.length > 0 ? members.map((m, i) => (
              <tr key={m.userId} style={{ borderBottom: '1px solid #27272a80', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ffffff05'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '1.25rem 1rem' }}>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: i === 0 ? '#ffffff' : i === 1 ? '#e4e4e7' : i === 2 ? '#a1a1aa' : 'transparent',
                    color: i < 3 ? '#000' : '#71717a',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {i + 1}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 1rem' }}>
                  <div style={{ fontWeight: '600' }}>{m.name || m.userId.substring(0, 8)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.lastActive || 'Recently active'}</div>
                </td>
                <td style={{ padding: '1.25rem 1rem' }}>
                  <div style={{ width: '120px', height: '8px', backgroundColor: '#27272a', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.25rem' }}>
                    <div style={{ width: `${m.progress || 0}%`, height: '100%', backgroundColor: '#ffffff' }}></div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#71717a' }}>{m.solved} concepts mastered</div>
                </td>
                <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: 'bold', color: '#ffffff' }}>
                  {m.points?.toLocaleString()}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>No members found in this timeframe.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
