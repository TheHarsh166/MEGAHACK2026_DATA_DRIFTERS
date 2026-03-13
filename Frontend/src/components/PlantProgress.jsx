import React, { useMemo } from 'react';

/**
 * PlantProgress Component
 * Visualizes progress through a growing plant animation.
 * 
 * @param {number} completed - Number of completed tasks/concepts
 * @param {number} total - Total number of tasks/concepts
 * @param {string} label - Label for the concept/category
 */
const PlantProgress = ({ completed = 0, total = 10, label = "Learning Path" }) => {
  const progress = total > 0 ? Math.min(completed / total, 1) : 0;
  const percentage = Math.round(progress * 100);
  
  // Stages: 0 (Seed), 1 (Sprout), 2 (Growing), 3 (Bud), 4 (Bloom)
  const stage = Math.floor(progress * 4.99);

  // Animation variants for SVG
  const plantStages = useMemo(() => [
    // Stage 0: Seed (just dirt/pot)
    <g key="s0" className="stage-0">
      <circle cx="50" cy="75" r="3" fill="#22c55e" opacity="0.6" />
    </g>,
    // Stage 1: Sprout
    <g key="s1" className="stage-1">
      <path d="M50 75 Q48 65 52 60" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M52 60 Q58 58 60 62" fill="#22c55e" />
    </g>,
    // Stage 2: Growing
    <g key="s2" className="stage-2">
      <path d="M50 75 Q50 60 50 50" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M50 65 Q40 60 38 65" fill="#22c55e" />
      <path d="M50 55 Q60 50 62 55" fill="#22c55e" />
    </g>,
    // Stage 3: Bud
    <g key="s3" className="stage-3">
      <path d="M50 75 L50 40" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M50 55 Q40 50 38 55" fill="#22c55e" />
      <path d="M50 45 Q60 40 62 45" fill="#22c55e" />
      <circle cx="50" cy="38" r="6" fill="#16a34a" />
    </g>,
    // Stage 4: Bloom
    <g key="s4" className="stage-4">
      <path d="M50 75 L50 35" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M50 60 Q35 55 33 60" fill="#22c55e" />
      <path d="M50 50 Q65 45 67 50" fill="#22c55e" />
      {/* Flower petals */}
      <circle cx="50" cy="30" r="10" fill="#16a34a" />
      <circle cx="50" cy="22" r="6" fill="#86efac" />
      <circle cx="50" cy="38" r="6" fill="#86efac" />
      <circle cx="42" cy="30" r="6" fill="#86efac" />
      <circle cx="58" cy="30" r="10" fill="#86efac" opacity="0.8" />
      <circle cx="50" cy="30" r="4" fill="#facc15" />
      {/* Sparkles */}
      <g className="sparkles">
        <circle cx="20" cy="20" r="1.5" fill="#facc15" />
        <circle cx="80" cy="25" r="1" fill="#facc15" />
        <circle cx="30" cy="40" r="1" fill="#facc15" />
        <circle cx="70" cy="15" r="1.5" fill="#facc15" />
      </g>
    </g>
  ], []);

  return (
    <div className="plant-progress-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1.5rem',
      backgroundColor: '#0f172a',
      borderRadius: '16px',
      border: '1px solid #1e293b',
      width: '240px',
      transition: 'transform 0.3s ease',
      cursor: 'default'
    }}>
      <div className="plant-visual" style={{ 
        position: 'relative', 
        width: '100px', 
        height: '140px',
        marginBottom: '1rem'
      }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          {/* Use CSS classes for animations */}
          <style>{`
            @keyframes grow {
              from { transform: scale(0.5) translateY(20px); opacity: 0; }
              to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .stage-1, .stage-2, .stage-3, .stage-4 {
              animation: grow 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
              transform-origin: bottom;
            }
            @keyframes twinkle {
              0%, 100% { opacity: 0.2; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
            }
            .sparkles circle {
              animation: twinkle 1.5s infinite ease-in-out;
            }
            .sparkles circle:nth-child(2) { animation-delay: 0.3s; }
            .sparkles circle:nth-child(3) { animation-delay: 0.7s; }
            .sparkles circle:nth-child(4) { animation-delay: 1.1s; }
          `}</style>
          
          {/* Pot */}
          <path d="M30 75 L70 75 L65 95 L35 95 Z" fill="#d97706" />
          <rect x="25" y="75" width="50" height="5" rx="2" fill="#b45309" />
          
          {/* Plant Stages */}
          {plantStages.slice(0, stage + 1)}
        </svg>
      </div>

      <div style={{ width: '100%', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 'bold' }}>{label}</span>
          <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>{percentage}%</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          backgroundColor: '#1e293b', 
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${percentage}%`, 
            height: '100%', 
            backgroundColor: '#22c55e', 
            boxShadow: '0 0 10px #22c55e80',
            transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)'
          }}></div>
        </div>
      </div>
      
      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
        {completed} / {total} concepts mastered
      </div>
    </div>
  );
};

export default PlantProgress;
