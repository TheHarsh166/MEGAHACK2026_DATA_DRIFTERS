import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

const AiTutorPanel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Provided D-ID Agent Share link
  const agentUrl = "https://studio.d-id.com/agents/share?id=v2_agt_Wol27-gY&utm_source=copy&key=WjI5dloyeGxMVzloZFhSb01ud3hNVFU0TVRVMk56UTFOVFEyTXpZM05EVXpNRE02UjJaSGFEUnNZMGt3YWtaSVRHSmtNM296U0ZBNQ==";

  return (
    <motion.div 
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="tutor-panel"
      style={{
        position: 'fixed',
        right: '25px',
        bottom: '25px',
        width: '450px',
        height: '700px',
        backgroundColor: '#09090b',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.1)',
        border: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2000,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: '12px 20px', 
        background: '#18181b', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #27272a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffffff', boxShadow: '0 0 8px #ffffff' }}></div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', letterSpacing: '0.02em' }}>AI Learning Tutor</span>
        </div>
        
        <button 
          onClick={onClose}
          style={{ 
            background: 'rgba(39, 39, 42, 0.5)', 
            border: 'none', 
            borderRadius: '10px', 
            padding: '6px', 
            color: '#71717a', 
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}
        >
          <X size={20} />
        </button>
      </div>

      {/* D-ID Agent Iframe */}
      <div style={{ flex: 1, backgroundColor: '#000' }}>
        <iframe
          src={agentUrl}
          title="D-ID AI Tutor"
          width="100%"
          height="100%"
          frameBorder="0"
          allow="microphone; camera; clipboard-write;"
          style={{ border: 'none' }}
        ></iframe>
      </div>
    </motion.div>
  );
};

export default AiTutorPanel;
