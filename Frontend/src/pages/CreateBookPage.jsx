import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConceptGraph from '../components/ConceptGraph.jsx';
import QuizPanel from '../components/QuizPanel.jsx';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { mlApi } from '../services/mlApi';
import NotesPanel from '../components/NotesPanel.jsx';

/**
 * CreateBookPage
 * Allows users to generate a study map from text or file.
 * If an 'id' param exists, it loads that specific book map.
 */
function CreateBookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [file, setFile] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'notes'

  const [recommendation, setRecommendation] = useState(null);
  const [knowledgeStates, setKnowledgeStates] = useState({});

  // Effect to load book if viewing
  useEffect(() => {
    if (id) {
      const fetchBook = async () => {
        try {
          const books = await api.get('/books');
          const book = books.find(b => b._id === id || b.id === id);
          if (book) {
            setResult(book.hierarchy);
            setText(book.sourceText || '');
            setIsViewing(true);
            fetchRecommendation(book.hierarchy);
          }
        } catch (err) {
          toast.error('Failed to load book mapping');
        }
      };
      fetchBook();
    } else {
      setResult(null);
      setText('');
      setIsViewing(false);
      setRecommendation(null);
    }
  }, [id]);

  const fetchRecommendation = async (hierarchy) => {
    const userString = localStorage.getItem('thinkmap_user');
    if (!userString) return;
    const user = JSON.parse(userString);
    
    try {
      const data = await mlApi.post('/recommend-concept', {
        userId: user.id,
        hierarchy
      });
      if (data.concept) setRecommendation(data);
    } catch (err) {
      console.error('Failed to fetch recommendation:', err);
    }
  };

  // Fetch knowledge states
  const fetchKnowledgeStates = async () => {
    const userString = localStorage.getItem('thinkmap_user');
    if (!userString) return;
    const user = JSON.parse(userString);
    if (!user.id) return;

    try {
      const data = await mlApi.get(`/student-knowledge/${user.id}`);
      setKnowledgeStates(data.conceptStates || {});
    } catch (err) {
      console.error('Failed to fetch knowledge states:', err);
    }
  };

  useEffect(() => {
    fetchKnowledgeStates();
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`http://127.0.0.1:8005/api/topic-hierarchy-file`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        const hierarchy = data.hierarchy;
        setResult(hierarchy);
        
        // Save to MongoDB
        const mainTopic = Object.keys(hierarchy)[0] || 'Untitled Study Book';
        const newBookData = {
          title: mainTopic,
          date: new Date().toLocaleDateString(),
          hierarchy: hierarchy,
          sourceText: `Generated from file: ${file.name}`
        };
        
        const savedBook = await api.post('/books', newBookData);
        toast.success('Study Map generated from file!');
        // Switch to viewing the newly created book
        if (savedBook?._id) navigate(`/book/${savedBook._id}`);
      }
    } catch (err) {
      setError(err.message || 'Error processing file');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitText = async (e) => {
    e.preventDefault();
    if (isViewing) return; 

    setError(null);
    setResult(null);
    setSelectedConcept(null);

    if (!text.trim()) {
      setError('Please enter some text.');
      return;
    }

    setLoading(true);
    try {
      const data = await mlApi.post('/topic-hierarchy', { text });
      
      const hierarchy = data.hierarchy;
      setResult(hierarchy);
      
      const mainTopic = Object.keys(hierarchy)[0] || 'Untitled Study Book';
      const newBookData = {
        title: mainTopic,
        date: new Date().toLocaleDateString(),
        hierarchy: hierarchy,
        sourceText: text
      };
      
      try {
        const savedBook = await api.post('/books', newBookData);
        toast.success('Book saved to your cloud library!');
        if (savedBook?._id) navigate(`/book/${savedBook._id}`);
      } catch (err) {
        console.error('Failed to save to cloud:', err);
        toast.error('Failed to sync to cloud, but view is ready.');
      }
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const handleConceptSelect = (node) => {
    if (node.group === 'concept' || node.group === 'subtopic') {
      setSelectedConcept(node.id);
    }
  };

  const handleRecommendationClick = () => {
    if (recommendation?.concept) {
      setSelectedConcept(recommendation.concept);
    }
  };

  const openContextualTutor = () => {
    const mainTopic = result ? Object.keys(result)[0] : 'this topic';
    window.dispatchEvent(new CustomEvent('tutor-activate', { 
      detail: { 
        concept: mainTopic, 
        explanation: `I'm studying ${mainTopic}. Can you help me understand the key connections in this mastery map?` 
      } 
    }));
  };

  const handleQuizClose = () => {
    setSelectedConcept(null);
    fetchKnowledgeStates();
    if (result) fetchRecommendation(result);
  };

  return (
    <div className="create-book-page">
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ marginBottom: '0.5rem', color: '#ffffff', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          AI Content Lab
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>{isViewing ? result && Object.keys(result)[0] : 'Generate Study Book'}</h1>
            <p>{isViewing ? (viewMode === 'map' ? 'Mastery Map view' : 'AI Study Notes') : 'Transform any educational content into a structured learning map.'}</p>
          </div>
          
          {isViewing && (
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#18181b', padding: '0.4rem', borderRadius: '12px', border: '1px solid #27272a' }}>
              <button 
                onClick={() => setViewMode('map')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: viewMode === 'map' ? '#ffffff' : 'transparent',
                  color: viewMode === 'map' ? '#000' : '#71717a',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Mastery Map
              </button>
              <button 
                onClick={() => setViewMode('notes')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: viewMode === 'notes' ? '#ffffff' : 'transparent',
                  color: viewMode === 'notes' ? '#000' : '#71717a',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                View Notes
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="layout" style={{ display: 'grid', gridTemplateColumns: (result && !isViewing) ? '0.8fr 2.2fr' : '1fr', gap: '2rem' }}>
        {!isViewing && (
          <section className="panel" style={{ border: '1px solid #27272a', background: 'linear-gradient(145deg, #09090b 0%, #18181b 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Input Content</h2>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#ffffff10', color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 'bold' }}>Multi-Modal AI</span>
            </div>

            <div style={{ marginBottom: '2rem' }}>
               <h3 style={{ fontSize: '0.9rem', color: '#71717a', marginBottom: '1rem', textTransform: 'uppercase' }}>Option 1: Paste Text</h3>
               <form onSubmit={handleSubmitText} className="form">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your source text or describe a topic (e.g., Quantum Physics fundamentals)..."
                  rows={6}
                  style={{ marginBottom: '1rem' }}
                />
                <button 
                  type="submit" 
                  disabled={loading || !!file} 
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#18181b',
                    color: '#ffffff',
                    border: '1px solid #27272a',
                    borderRadius: '9999px',
                    transition: 'all 0.2s',
                    cursor: (loading || !!file) ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && !file) e.currentTarget.style.backgroundColor = '#27272a';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && !file) e.currentTarget.style.backgroundColor = '#18181b';
                  }}
                >
                  {loading && !file ? 'Analyzing Text...' : 'Generate from Text'}
                </button>
              </form>
            </div>

            <div style={{ padding: '1.5rem', border: '2px dashed #27272a', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
               <h3 style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '1rem', textTransform: 'uppercase' }}>Option 2: Upload Files</h3>
               <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '1rem' }}>Support for PDF, Images (PNG/JPG), and DOCX</p>
               
               <input 
                 type="file" 
                 accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
                 onChange={(e) => setFile(e.target.files[0])}
                 style={{ 
                   marginBottom: '1rem',
                   color: '#71717a',
                   fontSize: '0.85rem'
                 }}
               />
               
               {file && (
                 <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#18181b', borderRadius: '6px', fontSize: '0.85rem' }}>
                   Selected: <span style={{ color: '#ffffff' }}>{file.name}</span> ({(file.size / 1024 / 1024).toFixed(2)} MB)
                 </div>
               )}

               <button 
                onClick={handleFileUpload} 
                disabled={loading || !file} 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  fontWeight: 'bold',
                  backgroundColor: file ? '#ffffff' : '#27272a',
                  color: file ? '#000' : '#71717a'
                }}>
                  {loading && file ? 'Processing File...' : 'Generate from File'}
               </button>
            </div>
          </section>
        )}

        {result && (
          <section className="panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid #27272a', background: 'transparent' }}>
            {viewMode === 'map' ? (
              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0 }}>Mastery Map</h2>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button 
                      onClick={openContextualTutor}
                      style={{
                        padding: '0.4rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: '#18181b',
                        color: '#f8fafc',
                        border: '1px solid #27272a',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Ask Tutor
                    </button>
                    <p style={{ fontSize: '0.8rem', color: '#71717a', margin: 0 }}>Click on nodes to practice</p>
                  </div>
                </div>

                {recommendation && (
                  <div 
                    onClick={handleRecommendationClick}
                    style={{ 
                      marginBottom: '1.5rem', 
                      padding: '1rem 1.5rem', 
                      backgroundColor: recommendation.priority === 'high' ? '#ef444410' : '#18181b', 
                      borderRadius: '12px', 
                      border: `1px solid ${recommendation.priority === 'high' ? '#ef444420' : '#27272a'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = recommendation.priority === 'high' ? '#ef4444' : '#ffffff20'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = recommendation.priority === 'high' ? '#ef444420' : '#27272a'}
                  >
                    <div style={{ 
                      fontSize: '1rem', 
                      backgroundColor: '#ffffff05', 
                      padding: '0.4rem', 
                      borderRadius: '10px',
                      color: '#ffffff'
                    }}>
                      NEXT
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: recommendation.priority === 'high' ? '#f87171' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                        Next Best Concept
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#ffffff' }}>
                        {recommendation.concept}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#71717a' }}>
                        {recommendation.reason}
                      </div>
                    </div>
                  </div>
                )}

                <ConceptGraph 
                  data={result} 
                  onSelectNode={handleConceptSelect} 
                  knowledgeStates={knowledgeStates}
                />
              </div>
            ) : (
              <div style={{ padding: '2rem' }}>
                <NotesPanel 
                  userId={JSON.parse(localStorage.getItem('thinkmap_user') || '{}').id}
                  hierarchy={result}
                />
              </div>
            )}
          </section>
        )}
      </main>

      {selectedConcept && (
        <QuizPanel 
          concept={selectedConcept} 
          onClose={handleQuizClose} 
        />
      )}

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default CreateBookPage;
