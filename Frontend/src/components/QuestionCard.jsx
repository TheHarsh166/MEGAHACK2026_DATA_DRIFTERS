import React, { useState } from 'react';
import { model } from '../services/geminiClient';
import { parseLLMResponse } from '../utils/parseLLMResponse';
import AnswerFeedback from './AnswerFeedback.jsx';
import { api } from '../services/api';
import toast from 'react-hot-toast';

/**
 * QuestionCard
 * Handles an individual question, user input, and evaluation via Gemini.
 */
function QuestionCard({ concept, questionData, index, onSuccess }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!selectedOption) return;
    if (!reasoning.trim()) {
      toast.error("Please provide a reasoning for your choice.");
      return;
    }

    setLoading(true);
    setResult(null);

    const user = JSON.parse(localStorage.getItem('thinkmap_user') || '{}');

    // All questions are now standard MCQs
    const selectedOptionNumber = questionData.options.findIndex(opt => opt === selectedOption) + 1;

    try {
      // Check if server is reachable first
      const healthCheck = await fetch('http://127.0.0.1:8000/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      }).catch(() => null);
      
      if (!healthCheck || !healthCheck.ok) {
        throw new Error('ML server is not running. Please start the server on port 8000.');
      }

      const resp = await fetch('http://127.0.0.1:8000/api/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id || 'anonymous',
          questionId: questionData.id || `${concept}_${index}`.replace(/\s+/g, '_'),
          concept: concept,
          selectedAnswer: selectedOption,
          selectedOptionNumber: selectedOptionNumber,
          questionText: questionData.question,
          options: questionData.options || [],
          correctAnswer: questionData.answer,
          explanation: reasoning
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout for the actual request
      });

      if (!resp.ok) {
        const errorText = await resp.text().catch(() => 'Unknown error');
        throw new Error(`API error (${resp.status}): ${errorText}`);
      }

      const data = await resp.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Map integrated response back to what AnswerFeedback expects
      // new states: green (correct), yellow (partial), red (incorrect)
      const evaluation = {
        score: data.state === 'green' ? 1 : data.state === 'yellow' ? 0.5 : 0,
        result: data.state === 'green' ? 'correct' : data.state === 'yellow' ? 'partial' : 'incorrect',
        points: data.points || 0,
        feedback: data.feedback || "Thank you for your submission.",
        misconception: data.misconception,
        recommendations: data.recommendations || [],
        correctAnswer: questionData.answer
      };

      setResult(evaluation);

      // Trigger AI Tutor if misconception detected
      if (evaluation.misconception && evaluation.misconception.misconception_detected) {
        window.dispatchEvent(new CustomEvent('tutor-activate', { 
          detail: { 
            concept: concept, 
            explanation: reasoning 
          } 
        }));
      }

      // Trigger refresh in parent
      if (onSuccess) onSuccess();

      // Save to MongoDB (Node.js backend) - This is now redundant since ML service stores everything
      try {
        await api.post('/quizzes', {
          concept,
          question: questionData.question,
          options: questionData.options,
          selectedOption: selectedOption,
          selectedOptionNumber: selectedOptionNumber,
          correctAnswer: questionData.answer,
          evaluation: evaluation
        });
      } catch (saveErr) {
        console.error('Failed to sync quiz result to Node.js backend:', saveErr);
      }
    } catch (error) {
      console.error("Evaluation failed", error);
      toast.error("Evaluation failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="question-card" style={{
      padding: '1.5rem',
      backgroundColor: '#0f172a',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      border: '1px solid #1e293b',
      textAlign: 'left'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ 
          fontSize: '0.75rem', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em', 
          color: '#38bdf8',
          fontWeight: 'bold'
        }}>
          Question {index + 1} — {questionData.type}
        </span>
        <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', color: '#f9fafb' }}>{questionData.question}</h3>
      </div>

      <div className="answer-input" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {questionData.options.map((option, i) => (
          <label key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: selectedOption === option ? '#1e293b' : '#020617',
            border: `1px solid ${selectedOption === option ? '#38bdf8' : '#1e293b'}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            <input
              type="radio"
              name={`question-${index}`}
              value={option}
              checked={selectedOption === option}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={result !== null}
              style={{ accentColor: '#38bdf8' }}
            />
            <span style={{ color: '#e5e7eb' }}>{option}</span>
          </label>
        ))}
        
        <div style={{ marginTop: '1rem' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Explain your reasoning:</p>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            disabled={result !== null}
            placeholder="Why did you choose this option?"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: '#020617',
              border: '1px solid #1e293b',
              color: '#f9fafb',
              fontSize: '0.95rem',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !selectedOption || result !== null}
        style={{
          marginTop: '1.25rem',
          width: '100%',
          padding: '0.75rem',
          borderRadius: '9999px',
          backgroundColor: result ? '#1e293b' : '#38bdf8',
          color: result ? '#9ca3af' : '#020617',
          fontWeight: 'bold',
          cursor: (loading || !selectedOption || result !== null) ? 'default' : 'pointer',
          opacity: (loading || !selectedOption) ? 0.7 : 1,
          border: 'none',
          transition: 'transform 0.1s'
        }}
      >
        {loading ? 'Evaluating...' : result ? 'Submitted' : 'Submit Answer'}
      </button>

      {result && <AnswerFeedback result={result} />}
    </div>
  );
}

export default QuestionCard;
