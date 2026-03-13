import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/image.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height, nodes = [];
    
    class Node {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#71717a'; // Zinc 500
        ctx.fill();
      }
    }

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      nodes = [];
      for (let i = 0; i < 60; i++) nodes.push(new Node());
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      nodes.forEach(node => {
        node.update();
        node.draw();
        
        nodes.forEach(other => {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(113, 113, 122, ${0.1 * (1 - dist/150)})`;
            ctx.stroke();
          }
        });
      });
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', init);
    init();
    animate();

    return () => window.removeEventListener('resize', init);
  }, []);

  return (
    <div className="antialiased overflow-x-hidden bg-[#09090b] text-zinc-100 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        .glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .hero-gradient {
          background: radial-gradient(circle at 50% 50%, #111827 0%, #09090b 70%);
        }
        .glow-emerald {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
        }
        .text-gradient {
          background: linear-gradient(to right, #ffffff 30%, #a78bfa 60%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .node-green { fill: #10b981; filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4)); }
        .node-purple { fill: #8b5cf6; filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.4)); }
        .node-rose { fill: #f43f5e; filter: drop-shadow(0 0 8px rgba(244, 63, 94, 0.4)); }
        .node-zinc { fill: #52525b; filter: drop-shadow(0 0 5px #52525b); }
        .node-dim { fill: #27272a; filter: drop-shadow(0 0 2px #27272a); }
        .line-flow {
          stroke-dasharray: 100;
          animation: dash 10s linear infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: -1000; }
        }
      `}} />

      {/* BEGIN: Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logoImage} alt="ThinkMap Logo" className="h-8 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a className="hover:text-white transition-colors" href="#problem">Methodology</a>
            <a className="hover:text-white transition-colors" href="#features">Intelligence</a>
            <a className="hover:text-white transition-colors" href="#dashboard">For Educators</a>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 bg-zinc-100 text-zinc-950 font-bold rounded-full text-sm hover:scale-105 transition-all duration-300"
          >
            Get Access
          </button>
        </div>
      </nav>
      {/* END: Navigation */}

      {/* BEGIN: Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center hero-gradient pt-20 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-40" id="hero-canvas"></canvas>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 glass rounded-full text-emerald-400/80 text-xs font-bold uppercase tracking-widest border border-emerald-500/10">
            Powered by Multi-Dimensional Reasoning Models
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gradient">
            Fix Misconceptions.<br/>Unlock True Understanding.
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            ThinkMap AI analyzes student reasoning patterns to detect hidden conceptual gaps that traditional multiple-choice systems miss.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-zinc-100 text-zinc-950 font-bold rounded-xl shadow-lg shadow-white/5 hover:scale-105 transition-transform"
            >
              Start Mapping Now
            </button>
          </div>

          <div className="relative grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass p-6 rounded-2xl text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-zinc-600"></div>
                <span className="text-xs font-mono text-zinc-500">STUDENT_REASONING_LOG</span>
              </div>
              <p className="text-zinc-300 italic text-sm leading-relaxed">
                "I think the object slows down because the force runs out after the push..."
              </p>
            </div>
            <div className="glass p-6 rounded-2xl text-left border-zinc-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-zinc-100 glow-zinc"></div>
                <span className="text-xs font-mono text-zinc-100">MISCONCEPTION_DETECTED</span>
              </div>
              <p className="text-zinc-100 text-sm font-semibold">
                Impetus Fallacy Detected. Student lacks understanding of Newton's First Law (Inertia).
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* END: Hero Section */}

      {/* BEGIN: Problem Section */}
      <section className="py-24 bg-[#09090b]" id="problem">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Problem With Modern Learning</h2>
            <p className="text-zinc-400">Standard assessments treat knowledge as binary. We see the layers beneath.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1 text-zinc-200">Binary Grading</h4>
                  <p className="text-zinc-400 text-sm">Treating "Wrong" as a simple lack of information, ignoring the logic that led there.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-950">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1 text-zinc-200">ThinkMap Reasoning Analysis</h4>
                  <p className="text-zinc-400 text-sm">Identifying the specific mental model flaw to provide targeted remediation.</p>
                </div>
              </div>
            </div>
            <div className="glass aspect-video rounded-3xl p-8 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-100 w-[75%]"></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
                  <span>Reasoning Depth</span>
                  <span>84% Latent Misconception</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: Problem Section */}

      {/* BEGIN: Solution Features */}
      <section className="py-24 relative" id="features">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-white/5"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-t from-zinc-900/10 to-transparent blur-3xl -z-10"></div>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-3xl group">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-zinc-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9.663 17h4.674a1 1 0 00.707-.293l4.853-4.853a1 1 0 000-1.414L15.044 5.586a1 1 0 00-.707-.293H9.663a1 1 0 00-.707.293L4.103 10.44a1 1 0 000 1.414l4.853 4.853a1 1 0 00.707.293z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Semantic Analysis</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Our LLMs process unstructured student explanations to map their internal logic against a standard domain model.</p>
            </div>
            <div className="glass p-8 rounded-3xl group">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-zinc-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Concept Dependencies</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Visualize exactly which foundational concepts are blocking progress on advanced topics using dependency graphs.</p>
            </div>
            <div className="glass p-8 rounded-3xl group">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-zinc-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.618.309a6 6 0 01-3.86.517l-2.388-.477a2 2 0 00-1.022.547l-1.16 1.16a2 2 0 001.414 3.414h15.656a2 2 0 001.414-3.414l-1.16-1.16z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Dynamic Remediation</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Automatically generated micro-lessons tailored to the student's unique "flavor" of misunderstanding.</p>
            </div>
          </div>
        </div>
      </section>
      {/* END: Solution Features */}

      {/* BEGIN: Concept Map Visualizer */}
      <section className="py-24 bg-[#09090b]/50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 italic">Your Knowledge, Visualized</h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-12">Real-time mapping of conceptual mastery across your entire curriculum.</p>
          <div className="glass relative aspect-[16/9] rounded-[2rem] overflow-hidden p-12 border border-white/5">
            <svg className="w-full h-full" viewBox="0 0 800 450">
              <defs>
                <marker id="arrow" markerHeight="7" markerWidth="10" orient="auto" refX="0" refY="3.5">
                  <polygon fill="#3f3f46" points="0 0, 10 3.5, 0 7"></polygon>
                </marker>
              </defs>
              <line className="line-flow" stroke="#3f3f46" strokeWidth="2" x1="150" x2="350" y1="225" y2="125"></line>
              <line className="line-flow" stroke="#3f3f46" strokeWidth="2" x1="150" x2="350" y1="225" y2="325"></line>
              <line className="line-flow" stroke="#3f3f46" strokeWidth="2" x1="350" x2="550" y1="125" y2="125"></line>
              <line className="line-flow" stroke="#3f3f46" strokeWidth="2" x1="350" x2="550" y1="325" y2="325"></line>
              <circle className="node-green" cx="150" cy="225" r="30"></circle>
              <text className="text-[12px] fill-zinc-500 font-bold" textAnchor="middle" x="150" y="275">Algebra Basics</text>
              <circle className="node-purple" cx="350" cy="125" r="30"></circle>
              <text className="text-[12px] fill-zinc-500 font-bold" textAnchor="middle" x="350" y="175">Linear Equations</text>
              <circle className="node-rose" cx="350" cy="325" r="30"></circle>
              <text className="text-[12px] fill-zinc-500 font-bold" textAnchor="middle" x="350" y="375">Coordinate Geometry</text>
              <circle className="node-purple" cx="550" cy="125" r="30"></circle>
              <text className="text-[12px] fill-zinc-500 font-bold" textAnchor="middle" x="550" y="175">Multivariate Calc</text>
              <circle className="node-rose" cx="550" cy="325" r="30"></circle>
              <text className="text-[12px] fill-zinc-500 font-bold" textAnchor="middle" x="550" y="375">Vector Spaces</text>
            </svg>
            <div className="absolute bottom-10 right-10 flex flex-col gap-4">
              <div className="flex items-center gap-3 glass px-4 py-2 rounded-full">
                <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mastered</span>
              </div>
              <div className="items-center gap-3 hidden md:flex glass px-4 py-2 rounded-full">
                <div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">In Progress</span>
              </div>
              <div className="flex items-center gap-3 glass px-4 py-2 rounded-full">
                <div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Knowledge Gap</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: Concept Map Visualizer */}

      {/* BEGIN: Dashboard Mockup */}
      <section className="py-24" id="dashboard">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">Sleek Analytics for the Modern Educator.</h2>
              <p className="text-zinc-400 mb-8">Stop guessing which students need help. Our heatmap identifying "Concept Fragility" tells you exactly where to focus tomorrow's lesson.</p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-100">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  Classroom-wide misconception heatmaps
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-100">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  Individual student trajectory projections
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 w-full">
              <div className="glass rounded-3xl p-8 relative">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-bold text-lg text-white">Knowledge Heatmap</h4>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                    <div className="w-3 h-3 rounded-full bg-zinc-600"></div>
                    <div className="w-3 h-3 rounded-full bg-zinc-400"></div>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(28)].map((_, i) => {
                    const colors = [
                      'bg-emerald-500/40', 
                      'bg-emerald-500/20', 
                      'bg-violet-500/40', 
                      'bg-violet-500/20', 
                      'bg-rose-500/40',
                      'bg-zinc-800',
                      'bg-zinc-700'
                    ];
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    return (
                      <div key={i} className={`aspect-square ${randomColor} rounded-sm transition-colors duration-500 hover:scale-110 cursor-pointer`}></div>
                    );
                  })}
                </div>
                <div className="absolute -top-6 -right-6 glass p-4 rounded-2xl shadow-2xl">
                  <div className="text-[10px] text-white font-bold mb-1 uppercase tracking-wider">Alert</div>
                  <div className="text-xs font-medium text-zinc-400">85% struggle with 'Inertia'</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: Dashboard Mockup */}

      {/* BEGIN: Tech Stack */}
      <section className="py-12 border-y border-white/5 bg-[#09090b]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale transition-all duration-500">
            <span className="text-sm font-bold tracking-tighter uppercase text-zinc-500">Sentence Transformers</span>
            <span className="text-sm font-bold tracking-tighter uppercase text-zinc-500">Faiss Vector DB</span>
            <span className="text-sm font-bold tracking-tighter uppercase text-zinc-500">PyTorch</span>
            <span className="text-sm font-bold tracking-tighter uppercase text-zinc-500">OpenAI GPT-4o</span>
            <span className="text-sm font-bold tracking-tighter uppercase text-zinc-500">HuggingFace</span>
          </div>
        </div>
      </section>
      {/* END: Tech Stack */}

      {/* BEGIN: Final CTA */}
      <footer className="py-32 relative overflow-hidden bg-[#09090b]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-8 text-white">Build True Understanding.</h2>
          <p className="text-xl text-zinc-400 mb-12">Join 500+ forward-thinking schools transforming the way we measure human intelligence.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-10 py-5 bg-white text-zinc-950 font-bold rounded-2xl hover:bg-zinc-200 transition-all"
            >
              Get Started for Free
            </button>
            <button className="px-10 py-5 glass text-white font-bold rounded-2xl hover:bg-white/5">
              Talk to Sales
            </button>
          </div>
          <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-center items-center gap-6 text-zinc-500 text-xs uppercase tracking-widest">
            <span>© 2024 ThinkMap AI. All rights reserved.</span>
          </div>
        </div>
      </footer>
      {/* END: Final CTA */}
    </div>
  );
};

export default LandingPage;
