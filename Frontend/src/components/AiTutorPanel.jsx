import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Mic, Volume2, User, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AitutorAvatar from './AitutorAvatar.jsx';

const AiTutorPanel = ({ isOpen, onClose, misunderstoodConcept, originalExplanation, userId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const synth = window.speechSynthesis;
  
  // Animation loop for mouth movement
  useEffect(() => {
    let animationFrame;
    const animateMouth = () => {
      if (isSpeaking) {
        // Random amplitude between 0 and 1 while speaking
        setAudioAmplitude(Math.random() * 0.8 + 0.2);
      } else {
        setAudioAmplitude(0);
      }
      animationFrame = requestAnimationFrame(animateMouth);
    };
    
    animateMouth();
    return () => cancelAnimationFrame(animationFrame);
  }, [isSpeaking]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Start initial greeting
      startFirstMessage();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startFirstMessage = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || 'anonymous',
          misunderstood_concept: misunderstoodConcept,
          student_explanation: originalExplanation,
          history: [] // First message
        })
      });
      
      const data = await resp.json();
      if (data.response) {
        const welcomeMsg = { role: 'assistant', content: data.response };
        setMessages([welcomeMsg]);
        speakText(data.response);
      }
    } catch (err) {
      console.error("Failed to start tutor", err);
      setMessages([{ role: 'assistant', content: "I noticed you had a slight misconception about this concept! Let's talk about it." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMsg = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const historyForAPI = messages.map(m => ({ role: m.role, content: m.content }));
      historyForAPI.push({ role: 'user', content: inputValue });

      const resp = await fetch('http://127.0.0.1:8000/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || 'anonymous',
          misunderstood_concept: misunderstoodConcept,
          student_explanation: originalExplanation,
          history: historyForAPI
        })
      });
      
      const data = await resp.json();
      if (data.response) {
        const tutorMsg = { role: 'assistant', content: data.response };
        setMessages(prev => [...prev, tutorMsg]);
        speakText(data.response);
      }
    } catch (err) {
      console.error("Failed to get tutor response", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having some trouble responding right now. But let's keep trying!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text) => {
    if (synth.speaking) {
      synth.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Find a nice teacher-like voice if possible
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="tutor-panel"
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '80px',
        width: '380px',
        height: '600px',
        backgroundColor: '#0f172a',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(56, 189, 248, 0.1)',
        border: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1001,
        overflow: 'hidden'
      }}
    >
      {/* Header with Avatar Viewport */}
      <div style={{ 
        position: 'relative', 
        height: '240px', 
        background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ position: 'absolute', top: '15px', left: '20px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Tutor Active</span>
        </div>
        
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: '#334155', border: 'none', borderRadius: '50%', padding: '6px', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <AitutorAvatar isSpeaking={isSpeaking} audioAmplitude={audioAmplitude} />
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '0.75rem 1rem',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                backgroundColor: msg.role === 'user' ? '#38bdf8' : '#1e293b',
                color: msg.role === 'user' ? '#0f172a' : '#f1f5f9',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <div style={{ marginTop: '3px' }}>
                {msg.role === 'assistant' ? <Sparkles size={14} /> : null}
              </div>
              {msg.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', borderRadius: '4px 18px 18px 18px', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '0.85rem' }}>
            Thinking...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div style={{ padding: '1.25rem', borderTop: '1px solid #334155', backgroundColor: '#0f172a' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          backgroundColor: '#1e293b', 
          borderRadius: '16px', 
          padding: '8px 12px',
          border: '1px solid #334155'
        }}>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask your tutor..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#f1f5f9',
              fontSize: '0.9rem',
              outline: 'none',
              padding: '4px 0'
            }}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{ 
              backgroundColor: '#38bdf8', 
              color: '#0f172a', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !inputValue.trim() || isLoading ? 0.5 : 1
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AiTutorPanel;
