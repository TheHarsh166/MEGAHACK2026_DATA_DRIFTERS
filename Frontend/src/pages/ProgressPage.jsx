import React, { useState, useEffect } from 'react';
import { mlApi } from '../services/mlApi';
import Leaderboard from '../components/Leaderboard';
import PlantProgress from '../components/PlantProgress';
import { Flame, BookOpen } from 'lucide-react';

const ProgressPage = ({ user }) => {
  const [stats, setStats] = useState({
    points: 0,
    streak: 0,
    dailySolved: 0,
    totalSolved: 0,
    misconceptions: []
  });
  const [knowledge, setKnowledge] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [statsData, knowledgeData] = await Promise.all([
          mlApi.get(`/student-stats/${user.id}`),
          mlApi.get(`/student-knowledge/${user.id}`)
        ]);
        setStats(statsData);
        setKnowledge(knowledgeData.conceptStates || {});
      } catch (err) {
        console.error("Failed to fetch progress data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Calculate knowledge stats
  const knowledgeStats = Object.values(knowledge);
  const totalConcepts = Math.max(knowledgeStats.length, 5);
  const masteredConcepts = knowledgeStats.filter(s => s === 'green').length;
  const inProgressConcepts = knowledgeStats.filter(s => s === 'yellow').length;

  return (
    <div className="progress-page" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.25rem', margin: '0 0 0.5rem 0', color: '#ffffff' }}>Your Learning Progress</h1>
        <p style={{ color: '#71717a' }}>Track your mastery highlights and global standing.</p>
      </header>

      {/* Growth Progress Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff' }}>Knowledge Growth</h2>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, #27272a, transparent)' }}></div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          overflowX: 'auto', 
          padding: '0.5rem 0.5rem 1.5rem 0.5rem',
          scrollbarWidth: 'none'
        }}>
          <PlantProgress 
            loading={loading}
            completed={masteredConcepts} 
            total={totalConcepts} 
            label="Mastered Concepts" 
          />
          <PlantProgress 
            loading={loading}
            completed={masteredConcepts + inProgressConcepts} 
            total={totalConcepts} 
            label="Overall Learning" 
          />
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        {/* Streak Card */}
        <div className="panel" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '1rem',
            color: '#ffffff'
          }}>
            <Flame size={28} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.5rem' }}>{stats.streak} Days</div>
          <div style={{ color: '#71717a', fontSize: '0.85rem' }}>Daily Learning Streak</div>
        </div>

        {/* Questions Solved Card */}
        <div className="panel" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '1rem',
            color: '#ffffff'
          }}>
            <BookOpen size={28} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.5rem' }}>{stats.dailySolved}</div>
          <div style={{ color: '#71717a', fontSize: '0.85rem' }}>Solved Today ({stats.totalSolved} lifetime)</div>
        </div>

        {/* Misconceptions Card */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Focus Areas</h3>
          {stats.misconceptions?.length > 0 ? (
            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: '#71717a' }}>
              {stats.misconceptions.slice(0, 3).map((m, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{m}</li>)}
            </ul>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#4ade80', margin: 0 }}>No misconceptions detected! Keep it up.</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff' }}>Global Rankings</h2>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, #27272a, transparent)' }}></div>
      </div>

      <Leaderboard />
    </div>
  );
};

export default ProgressPage;
