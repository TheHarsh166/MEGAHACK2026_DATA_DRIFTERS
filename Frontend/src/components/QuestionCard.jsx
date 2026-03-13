import React, { useState } from 'react';
import { model } from '../services/geminiClient';
import { parseLLMResponse } from '../utils/parseLLMResponse';
import AnswerFeedback from './AnswerFeedback.jsx';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { mlApi } from '../services/mlApi';

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
      const data = await mlApi.post('/submit-answer', {
        userId: user.id || 'anonymous',
        questionId: questionData.id || `${concept}_${index}`.replace(/\s+/g, '_'),
        concept: concept,
        selectedAnswer: selectedOption,
        selectedOptionNumber: selectedOptionNumber,
        questionText: questionData.question,
        options: questionData.options || [],
        correctAnswer: questionData.answer,
        explanation: reasoning
      });
      
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
    <div style={{
      marginTop: '1.5rem',
      padding: '1.25rem',
      backgroundColor: '#18181b',
      borderRadius: '12px',
      border: '1px solid #27272a',
      textAlign: 'left'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ 
          fontSize: '0.75rem', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em', 
          color: '#ffffff',
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
            backgroundColor: selectedOption === option ? '#27272a' : '#09090b',
            border: `1px solid ${selectedOption === option ? '#ffffff' : '#27272a'}`,
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
              style={{ accentColor: '#ffffff' }}
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
              border: '1px solid #27272a',
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
          backgroundColor: result ? '#27272a' : '#ffffff',
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
