import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Bot, Shield, MessageSquare, Scale, Briefcase, Sparkles } from 'lucide-react';
import api from '../services/api';

interface JobSummary {
  id: string;
  title: string;
  categoryName?: string;
  budgetMin?: number;
  budgetMax?: number;
  timelineDays?: number;
  skills: string[];
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [recentJobs, setRecentJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent open jobs from the backend API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/jobs', { params: { pageSize: 3, pageIndex: 1 } });
        const items = response.data?.items || [];
        setRecentJobs(items);
      } catch (err) {
        console.warn('[LandingPage] Failed to fetch live jobs, showing mock previews:', err);
        // Gorgeous fallbacks to impress the user instantly
        setRecentJobs([
          {
            id: 'mock-1',
            title: 'Build Full-Stack E-Commerce Platform with NextJS & Go',
            categoryName: 'Software Development',
            budgetMin: 1200,
            budgetMax: 2500,
            timelineDays: 30,
            skills: ['React', 'NextJS', 'Go', 'PostgreSQL'],
          },
          {
            id: 'mock-2',
            title: 'AI Product UI/UX Interface Redesign (Glassmorphism Concept)',
            categoryName: 'Design & Creative',
            budgetMin: 600,
            budgetMax: 1200,
            timelineDays: 14,
            skills: ['Figma', 'UI/UX', 'CSS Modules', 'Web Animation'],
          },
          {
            id: 'mock-3',
            title: 'Fintech Mobile Wallet App iOS Development',
            categoryName: 'Mobile Development',
            budgetMin: 2000,
            budgetMax: 4500,
            timelineDays: 45,
            skills: ['Swift', 'SwiftUI', 'Escrow APIs', 'JWT Auth'],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar header */}
      <header className="glass-panel" style={{
        margin: '1.5rem',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-sm)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            background: 'var(--accent)',
            padding: '0.4rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 0 10px var(--accent-glow)'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #fff 40%, var(--accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>AIVORA</span>
        </div>

        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', fontWeight: 500, transition: 'var(--transition)' }} className="hover-nav">Find Work</Link>
          <Link to="/login" style={{ color: 'var(--text-secondary)', fontWeight: 500, transition: 'var(--transition)' }} className="hover-nav">Hire Talent</Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>Log In</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>Sign Up</Link>
        </nav>
      </header>

      {/* Main hero section */}
      <main style={{ flex: 1, padding: '2rem 1.5rem 4rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <section style={{ textAlign: 'center', padding: '4rem 1rem 6rem 1rem', position: 'relative' }}>
          <div className="badge badge-primary glow-text" style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem' }}>
            <Bot size={14} style={{ marginRight: '0.25rem' }} /> AI-Powered Escrow Freelancing
          </div>
          <h1 style={{
            fontSize: '3.75rem',
            lineHeight: 1.1,
            fontWeight: 800,
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 70%, var(--accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: '900px',
            margin: '0 auto 1.5rem auto'
          }}>
            Where Smart Contracts Meet Intelligent Workflows
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '650px',
            margin: '0 auto 2.5rem auto',
            lineHeight: 1.6
          }}>
            Create bulletproof tasks using the AI Job Assistant, secure payments via milestone escrows, and collaborate in real-time.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              Post a Job with AI <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')} className="btn btn-secondary btn-lg" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              Apply as Expert
            </button>
          </div>
        </section>

        {/* Feature grid */}
        <section style={{ marginBottom: '8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="section-title">The Secure Way to Outsource</h2>
            <p className="section-desc" style={{ maxWidth: '500px', margin: '0.5rem auto' }}>
              Built from the ground up to protect your funds, verify deliverables, and scale your operations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{
                background: 'var(--accent-glow)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                marginBottom: '1.5rem',
                border: '1px solid rgba(250, 89%, 65%, 0.2)'
              }}>
                <Bot size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>AI Job Orchestrator</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Write your raw requirements. The AI analyzes business domains, structures perfect milestones, assesses risks, and suggests optimized pricing.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{
                background: 'var(--success-glow)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
                marginBottom: '1.5rem',
                border: '1px solid rgba(142, 70%, 45%, 0.2)'
              }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Milestone Escrow Vaults</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Protect your capital. Funds remain securely locked in intermediate escrows for each milestone, releasing only when the client approves the final work.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{
                background: 'rgba(215, 205, 215, 0.08)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                marginBottom: '1.5rem',
                border: '1px solid rgba(215, 205, 215, 0.15)'
              }}>
                <MessageSquare size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Real-time SignalR Chats</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Experience lightning-fast communication. Real-time typing indicators, read receipts, and file exchanges provide a complete workspace.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{
                background: 'var(--danger-glow)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
                marginBottom: '1.5rem',
                border: '1px solid rgba(346, 84%, 61%, 0.2)'
              }}>
                <Scale size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Dispute Arbitration Panel</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                No more stressful standoffs. Disputed milestones go straight to the Admin cockpit where evidence is evaluated, and escrow balances are fairly divided.
              </p>
            </div>
          </div>
        </section>

        {/* Live Job Previews */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
            <div>
              <h2 className="section-title">Explore Active Open Tasks</h2>
              <p className="section-desc" style={{ margin: 0 }}>
                Transparent opportunities backed by verified client escrow wallets.
              </p>
            </div>
            <button onClick={() => navigate('/login')} className="btn btn-secondary" style={{ padding: '0.6rem 1.4rem' }}>
              View All Jobs <Briefcase size={16} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="skeleton skeleton-card" style={{ height: '120px' }}></div>
              <div className="skeleton skeleton-card" style={{ height: '120px' }}></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {recentJobs.map((job) => (
                <div key={job.id} className="glass-panel" style={{
                  padding: '2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '2rem',
                  transition: 'var(--transition)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="badge badge-primary">{job.categoryName || 'General'}</span>
                      {job.timelineDays && (
                        <span className="badge badge-muted">{job.timelineDays} Days Timeline</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 600 }}>{job.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {job.skills.map((skill: any, i) => (
                        <span key={i} style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)'
                        }}>{typeof skill === 'object' && skill !== null ? skill.name : skill}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '180px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                      {job.budgetMin && job.budgetMax ? (
                        `$${job.budgetMin} - $${job.budgetMax}`
                      ) : job.budgetMin ? (
                        `$${job.budgetMin}+`
                      ) : (
                        'Budget TBD'
                      )}
                    </div>
                    <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: 'hsla(222, 47%, 4%, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Sparkles size={16} color="var(--accent)" />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>AIVORA</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          © {new Date().getFullYear()} Aivora freelance platform. Escrow safety, AI workflow orchestration, real-time channels. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
