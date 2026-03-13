import React from 'react';

/**
 * AnswerFeedback
 * Displays the result of Gemini's answer evaluation.
 * Strictly neutral theme (Zinc/Black/White/Grey).
 */
function AnswerFeedback({ result }) {
  if (!result) return null;

  const { score, result: status, feedback, misconception, recommendations } = result;

  const getBackgroundColor = () => {
    if (status === 'correct') return 'rgba(255, 255, 255, 0.05)';
    if (status === 'partial') return 'rgba(161, 161, 170, 0.05)';
    return 'rgba(63, 63, 70, 0.05)';
  };

  const getBorderColor = () => {
    if (status === 'correct') return '#ffffff';
    if (status === 'partial') return '#a1a1aa';
    return '#3f3f46';
  };

  const getTextColor = () => {
    if (status === 'correct') return '#ffffff';
    if (status === 'partial') return '#e4e4e7';
    return '#a1a1aa';
  };

  return (
    <div style={{
      padding: '1.25rem',
      borderRadius: '12px',
      border: '1px solid',
      marginTop: '1.5rem',
      textAlign: 'left',
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      color: getTextColor(),
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.05em' }}>{status}</h3>
        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#ffffff' }}>SCORE: {Math.round(score * 100)}%</span>
      </div>
      <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', lineHeight: '1.6', color: '#d4d4d8' }}>{feedback}</p>
      
      {result.correctAnswer && (
        <div style={{ 
          marginTop: '1.25rem', 
          padding: '1rem', 
          backgroundColor: '#18181b', 
          border: '1px solid #27272a', 
          borderRadius: '8px' 
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 'bold' }}>Correct Answer</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#ffffff', fontWeight: '500' }}>
            {result.correctAnswer}
          </p>
        </div>
      )}

      {misconception && misconception.misconception_detected && (
        <div style={{ 
          marginTop: '1.25rem', 
          padding: '1rem', 
          backgroundColor: '#09090b', 
          border: '1px dashed #3f3f46', 
          borderRadius: '8px' 
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 'bold' }}>Analysis</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#d4d4d8' }}>
            {misconception.explanation}
          </p>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div style={{ marginTop: '1.75rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 'bold' }}>Recommended Learning</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recommendations.slice(0, 3).map((rec, i) => (
              <div key={i} style={{ 
                padding: '1rem', 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '8px',
                position: 'relative',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#ffffff', marginBottom: '0.25rem' }}>{rec.title}</div>
                  {rec.url && (
                    <a 
                      href={rec.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.3rem 0.75rem',
                        fontSize: '0.7rem',
                        backgroundColor: '#27272a',
                        color: '#ffffff',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {rec.type === 'Video' ? 'WATCH' : 'VIEW'}
                    </a>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 'bold' }}>{rec.type} • {rec.difficulty}</div>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '0.5rem' }}>{rec.content_preview}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnswerFeedback;
