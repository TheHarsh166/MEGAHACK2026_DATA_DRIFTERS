import React, { useState, useEffect } from 'react';
import { mlApi } from '../services/mlApi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NotesPanel
 * Displays AI-generated notes for attempted concepts.
 * Highlights concepts where misconceptions were detected.
 */
function NotesPanel({ userId, hierarchy, onClose }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mlApi.post('/notes/generate', { 
          userId, 
          hierarchy 
        });
        setNotes(data.notes || []);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        setError("Unable to generate notes. Have you attempted any quizzes yet?");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [userId, hierarchy]);

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="notes-container" style={{ padding: '1rem', color: '#e2e8f0' }}>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .notes-print-area, .notes-print-area * { visibility: visible; }
            .notes-print-area { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%;
              color: black !important;
              background: white !important;
            }
            .no-print { display: none !important; }
            h2, h3 { color: black !important; }
            p { color: #333 !important; }
          }
        `}
      </style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }} className="no-print">
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff' }}>AI Study Notes</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={handleDownloadPDF}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#000',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Download PDF
          </button>
          <div style={{ fontSize: '0.8rem', color: '#71717a', backgroundColor: '#18181b', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid #27272a' }}>
            {notes.length} Concepts Attempted
          </div>
        </div>
      </div>

      <div className="notes-print-area">
        <div className="no-print" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffffff02', borderRadius: '8px', fontSize: '0.85rem', color: '#71717a', border: '1px solid #27272a' }}>
          These notes are personalized based on your quiz performance. Highlighted sections address specific areas where you might have misconceptions.
        </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }}></div>
          <p style={{ color: '#71717a' }}>AI is synthesizing your notes...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#ef444410', borderRadius: '12px', border: '1px solid #ef444420' }}>
          <p style={{ color: '#f87171' }}>{error}</p>
        </div>
      ) : notes.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#09090b', borderRadius: '12px', border: '1px dashed #27272a' }}>
          <p style={{ color: '#71717a' }}>No notes generated yet. Start by taking a quiz on any concept in the map!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {notes.map((note, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{
                borderLeft: note.highlight ? '4px solid #ef4444' : '4px solid #ffffff',
                paddingLeft: '1.5rem',
                backgroundColor: note.highlight ? '#ef444405' : 'transparent'
              }}
            >
              <h3 style={{ 
                fontSize: '1.1rem', 
                marginBottom: '0.75rem', 
                color: note.highlight ? '#f87171' : '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {note.header}
                {note.highlight && <span style={{ fontSize: '0.7rem', backgroundColor: '#ef444420', color: '#ef4444', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>Review Needed</span>}
              </h3>
              <p style={{ 
                lineHeight: '1.6', 
                fontSize: '0.95rem', 
                color: '#cbd5e1',
                textDecoration: note.highlight ? 'underline wavy #ef444440' : 'none',
                backgroundColor: note.highlight ? '#ef444410' : 'transparent',
                padding: note.highlight ? '0.5rem' : '0',
                borderRadius: '4px'
              }}>
                {note.content}
              </p>
            </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotesPanel;
