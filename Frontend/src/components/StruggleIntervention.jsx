import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Lightbulb, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { mlApi } from '../services/mlApi';

const StruggleIntervention = ({ isOpen, onHelpSelect, concept, questionText, onSkip }) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);
  const [activeType, setActiveType] = useState(null);

  const fetchHelp = async (type) => {
    setLoading(true);
    setActiveType(type);
    try {
      const data = await mlApi.post('/get-support-content', {
        type,
        questionText,
        concept
      });
      setContent(data.content);
    } catch (err) {
      setContent("Try thinking about how the core principles of " + concept + " apply here.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
          <div style={{ backgroundColor: '#fbbf24', padding: '8px', borderRadius: '10px' }}>
            <HelpCircle size={20} color="#0f172a" />
          </div>
          <div>
            <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem' }}>Need a little help?</h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>It looks like this one is a bit tricky. How can we support you?</p>
          </div>
        </div>

        {!content ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <HelpButton 
              icon={<Lightbulb size={16} />} 
              label="Show Hint" 
              onClick={() => fetchHelp('hint')} 
              color="#fbbf24"
            />
            <HelpButton 
              icon={<BookOpen size={16} />} 
              label="Give Example" 
              onClick={() => fetchHelp('example')} 
              color="#38bdf8"
            />
            <HelpButton 
              icon={<Layers size={16} />} 
              label="Simplify" 
              onClick={() => fetchHelp('simplify')} 
              color="#a855f7"
            />
            <HelpButton 
              icon={<ArrowRight size={16} />} 
              label="Skip for Now" 
              onClick={onSkip} 
              color="#94a3b8"
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              padding: '1rem', 
              backgroundColor: '#0f172a', 
              borderRadius: '12px', 
              borderLeft: `4px solid ${activeType === 'hint' ? '#fbbf24' : activeType === 'example' ? '#38bdf8' : '#a855f7'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 'bold', 
                color: activeType === 'hint' ? '#fbbf24' : activeType === 'example' ? '#38bdf8' : '#a855f7',
                textTransform: 'uppercase'
              }}>
                {activeType}
              </span>
              <button 
                onClick={() => setContent(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Back to options
              </button>
            </div>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {loading ? "Generating..." : content}
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

const HelpButton = ({ icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px',
      backgroundColor: '#334155',
      border: '1px solid #475569',
      borderRadius: '12px',
      color: '#f1f5f9',
      fontSize: '0.85rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#475569';
      e.currentTarget.style.borderColor = color;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#334155';
      e.currentTarget.style.borderColor = '#475569';
    }}
  >
    <span style={{ color }}>{icon}</span>
    {label}
  </button>
);

export default StruggleIntervention;
