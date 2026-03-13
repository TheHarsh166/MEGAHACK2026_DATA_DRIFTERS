import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Leaderboard from '../components/Leaderboard';
import PlantProgress from '../components/PlantProgress';

const ProgressPage = ({ user }) => {
  const [stats, setStats] = useState({
    points: 0,
    streak: 0,
    dailySolved: 0,
    totalSolved: 0,
    misconceptions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await fetch(`http://127.0.0.1:8000/api/student-stats/${user.id}`);
        if (resp.ok) {
          const data = await resp.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  return (
    <div className="progress-page" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Your Learning Progress</h1>
        <p style={{ color: '#9ca3af' }}>Track your mastery highlights and global standing.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {/* Streak Card */}
        <div style={{ padding: '1.5rem', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔥</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.streak} Days</div>
          <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Daily Learning Streak</div>
        </div>

        {/* Questions Solved Card */}
        <div style={{ padding: '1.5rem', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.dailySolved}</div>
          <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Solved Today ({stats.totalSolved} lifetime)</div>
        </div>

        {/* Misconceptions Card */}
        <div style={{ padding: '1.5rem', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#ef4444' }}>Learning Gaps</h3>
          {stats.misconceptions?.length > 0 ? (
            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>
              {stats.misconceptions.slice(0, 3).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#22c55e', margin: 0 }}>No misconceptions detected! Keep it up.</p>
          )}
        </div>
      </div>

      <Leaderboard />
    </div>
  );
};

export default ProgressPage;
