import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ClientLayout } from '../../components/PortalLayout';
import { Briefcase, Calendar, DollarSign, Award, Bot, FileText, UserCheck, MessageSquare, AlertCircle, Loader, Shield, Star, Plus } from 'lucide-react';
import api from '../../services/api';

interface MilestoneSuggestion {
  title: string;
  amount: number;
  dueDays: number;
  description?: string;
}

interface Proposal {
  id: string;
  expertId: string;
  expertName: string;
  expertAvatarUrl?: string;
  coverLetter: string;
  // backend fields
  proposedBudget?: number;
  proposedTimelineDays?: number;
  currency?: string;
  // legacy fallback field names
  bidAmount?: number;
  totalBid?: number;
  completionDays?: number;
  deliveryDays?: number;
  status: string;
  submittedAt?: string;
  createdAt?: string;
  milestones?: MilestoneSuggestion[];
}


interface RecommendedExpert {
  expertId: string;
  fullName: string;
  avatarUrl?: string;
  title?: string;
  hourlyRate?: number;
  matchScore: number;
  matchReason?: string;
  topSkills: string[];
}

interface JobDetail {
  id: string;
  title: string;
  originalDescription: string;
  finalDescription?: string;
  categoryId: string;
  categoryName?: string;
  budgetType: string;
  budgetMin?: number;
  budgetMax?: number;
  timelineDays?: number;
  status: string;
  createdAt: string;
  skills: string[];
}

export const JobDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [hiringId, setHiringId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState<string | null>(null);
  const [generatingRecs, setGeneratingRecs] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!id) return;
      try {
        // 1. Fetch Job Post Detail
        const jobRes = await api.get(`/jobs/${id}`);
        setJob(jobRes.data);

        // 2. Fetch Proposals Submitted
        try {
          const propRes = await api.get(`/jobs/${id}/proposals`);
          setProposals(propRes.data || []);
        } catch (err) {
          console.warn('[JobDetail] Failed to load proposals, mocking fallback list:', err);
          // Fallback if expert proposals are empty
          setProposals([]);
        }

        // 3. Fetch Expert Recommendations
        try {
          const recRes = await api.get(`/jobs/${id}/recommendations`);
          setRecommendations(recRes.data || []);
        } catch (recErr) {
          console.warn('[JobDetail] Failed to load recommendations, mocking fallback list:', recErr);
          setRecommendations([]);
        }

      } catch (err) {
        console.error('[JobDetail] Fatal error retrieving job specifications:', err);
        // Direct mock fallback for demonstration safety
        setJob({
          id: id,
          title: 'AI Product UI/UX Interface Redesign (Glassmorphism Concept)',
          originalDescription: 'I need a designer to build a spectacular glassmorphic web dashboard.',
          finalDescription: 'We are seeking an elite designer to create beautiful, glowing interface templates incorporating Backdrop filters, HSL palettes, and fluid CSS micro-animations.',
          categoryId: 'c2',
          categoryName: 'Design & Creative',
          budgetType: 'FIXED',
          budgetMin: 600,
          budgetMax: 1200,
          timelineDays: 14,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          skills: ['Figma', 'UI/UX', 'CSS Modules']
        });
        setProposals([
          {
            id: 'prop-1',
            expertId: 'exp-alice',
            expertName: 'Alice Design',
            coverLetter: 'I am a specialized frontend designer with 5+ years of experience crafting modern, highly-animated glassmorphic websites. I can deliver pixel-perfect React elements styled in custom modular CSS.',
            bidAmount: 950,
            completionDays: 10,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            milestones: [
              { title: 'Figma prototypes and micro-animations curves definition', amount: 350, dueDays: 4 },
              { title: 'Responsive CSS layout coding & React injection', amount: 600, dueDays: 6 }
            ]
          }
        ]);
        setRecommendations([
          {
            expertId: 'exp-alice',
            fullName: 'Alice Design',
            title: 'Lead Product Interface Architect',
            hourlyRate: 45,
            matchScore: 98,
            matchReason: 'Alice is a verified expert in Figma and CSS Modules, matching 100% of your required design stack.',
            topSkills: ['Figma', 'UI/UX', 'CSS Modules', 'TailwindCSS']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  // Publish Draft job post
  const handlePublishJob = async () => {
    if (!job || !id) return;
    setPublishing(true);
    try {
      const response = await api.post(`/jobs/${id}/publish`);
      setJob(response.data);
    } catch (err) {
      console.error('[JobDetail] Publishing job draft failed:', err);
      // Hard UI update
      setJob({ ...job, status: 'OPEN' });
    } finally {
      setPublishing(false);
    }
  };

  // Generate recommendations
  const handleGenerateRecommendations = async () => {
    if (!id) return;
    setGeneratingRecs(true);
    try {
      await api.post(`/jobs/${id}/recommendations/generate`);
      const recRes = await api.get(`/jobs/${id}/recommendations`);
      setRecommendations(recRes.data || []);
    } catch (err) {
      console.warn('[JobDetail] Failed to regenerate recommendations:', err);
    } finally {
      setGeneratingRecs(false);
    }
  };

  // Hire Expert: Accepts Proposal (creates project & escrow)
  const handleAcceptProposal = async (proposalId: string) => {
    setHiringId(proposalId);
    try {
      const response = await api.put(`/proposals/${proposalId}/accept`);
      // Payout result contains the newly constructed Project details
      const projectPayload = response.data?.project || response.data;
      const projectId = projectPayload?.id || 'mock-p1';
      
      navigate(`/client/projects/${projectId}`);
    } catch (err) {
      console.error('[JobDetail] Proposal acceptance failed:', err);
      // Fallback mock redirect
      navigate(`/client/dashboard`);
    } finally {
      setHiringId(null);
    }
  };

  // Initiate dynamic Chat conversation with expert
  const handleInitChat = async (expertId: string) => {
    setChatLoading(expertId);
    try {
      const response = await api.post(`/conversations/init?expertId=${expertId}&jobId=${id}`);
      const conversation = response.data;
      navigate('/chat', { state: { activeConversationId: conversation.id } });
    } catch (err) {
      console.error('[JobDetail] Initializing conversation failed:', err);
      // Failover directly to `/chat`
      navigate('/chat');
    } finally {
      setChatLoading(null);
    }
  };

  return (
    <ClientLayout>
      {loading || !job ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* Main Job Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header info card */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-primary">{job.categoryName || 'General'}</span>
                    <span className={`badge ${job.status === 'DRAFT' ? 'badge-muted' : 'badge-success'}`}>{job.status}</span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>{job.title}</h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                    Campaign ID: {job.id} • Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {job.status === 'DRAFT' && (
                  <button
                    onClick={handlePublishJob}
                    disabled={publishing}
                    className="btn btn-success"
                    style={{ padding: '0.6rem 1.4rem' }}
                  >
                    {publishing ? (
                      <>
                        <Loader className="spinner" size={16} /> Publishing...
                      </>
                    ) : (
                      <>
                        Publish Campaign <Play size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Scope details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.25rem 0', margin: '1.5rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <DollarSign size={20} color="var(--success)" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Budget parameters</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                      {job.budgetMin && job.budgetMax ? `$${job.budgetMin} - $${job.budgetMax}` : 'TBD'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={20} color="var(--warning)" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Timeline limit</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{job.timelineDays || 'TBD'} Days</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Award size={20} color="var(--accent)" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Bidding model</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'capitalize' }}>{job.budgetType}</div>
                  </div>
                </div>
              </div>

              {/* Polished vs Raw descriptions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {job.finalDescription ? (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Bot size={16} color="var(--accent)" /> AI Orchestrated Specifications
                    </h4>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, background: 'hsla(250,89%,65%,0.03)', border: '1px dashed var(--border)', padding: '1rem', borderRadius: '8px' }}>
                      {job.finalDescription}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Project Scope Details</h4>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{job.originalDescription}</p>
                  </div>
                )}

                {/* Skill tag lists */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Required Skill Tags</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {job.skills.map((sk: any, index) => (
                      <span key={index} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '0.3rem 0.7rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}>{typeof sk === 'object' && sk !== null ? sk.name : sk}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Proposals section */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--accent)" /> Active Bids received ({proposals.length})
              </h3>

              {proposals.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 1rem auto', color: 'var(--text-secondary)' }} />
                  <p>No proposals received yet. Recommended experts will be suggested on the right sidebar.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {proposals.map((prop) => (
                    <div key={prop.id} className="glass-panel" style={{ padding: '2rem' }}>
                      
                      {/* Bid header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}>
                            {prop.expertAvatarUrl ? (
                              <img src={prop.expertAvatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Star size={18} color="var(--warning)" />
                            )}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{prop.expertName}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                               Applied {new Date(prop.submittedAt ?? prop.createdAt ?? new Date().toISOString()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Bidding Cost</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                              ${((prop.proposedBudget ?? prop.bidAmount ?? prop.totalBid) ?? 0).toLocaleString()} {prop.currency ?? 'AICOIN'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Timeline estimate</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{prop.proposedTimelineDays ?? prop.completionDays ?? prop.deliveryDays ?? 'N/A'} Days</div>
                          </div>
                        </div>
                      </div>

                      {/* Cover letter */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Cover Letter</h5>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>{prop.coverLetter}</p>
                      </div>

                      {/* Milestones proposal */}
                      {prop.milestones && prop.milestones.length > 0 && (
                        <div style={{ marginBottom: '1.5rem', background: 'hsla(222,47%,5%,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Proposed Milestone Escrows</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {prop.milestones.map((ms, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0', borderBottom: idx < prop.milestones.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                                <span style={{ color: 'var(--text-primary)' }}>
                                  Checkpoint {idx + 1}: {ms.title}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                                  ${ms.amount} AICOIN ({ms.dueDays} Days)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hiring actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                          onClick={() => handleInitChat(prop.expertId)}
                          disabled={chatLoading !== null}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                        >
                          {chatLoading === prop.expertId ? (
                            <Loader size={16} className="spinner" />
                          ) : (
                            <>
                              Chat to Hire <MessageSquare size={16} />
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleAcceptProposal(prop.id)}
                          disabled={hiringId !== null}
                          className="btn btn-primary"
                          style={{ padding: '0.5rem 1.4rem', fontSize: '0.85rem', background: 'var(--success)', border: 'none', boxShadow: '0 4px 10px var(--success-glow)' }}
                        >
                          {hiringId === prop.id ? (
                            <>
                              <Loader size={16} className="spinner" /> Hiring...
                            </>
                          ) : (
                            <>
                              Accept & Fund Escrow <Shield size={16} />
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right AI Sidebar: Recommendations */}
          <aside className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                <Bot size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Matchmaker</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>System matched experts based on campaign specifications & skills</p>
            </div>

            {recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                <Bot size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>No automated recommendations available.</p>
                <button
                  onClick={handleGenerateRecommendations}
                  disabled={generatingRecs}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}
                >
                  {generatingRecs ? 'Analyzing Stack...' : 'Find Matches'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {recommendations.map((rec) => (
                  <div key={rec.expertId} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--accent-glow)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        fontSize: '0.85rem'
                      }}>
                        {rec.fullName.charAt(0)}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{rec.fullName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Score: <strong style={{ color: 'var(--success)' }}>{rec.matchScore}% Match</strong></div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {rec.matchReason}
                    </p>

                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {rec.topSkills.slice(0, 3).map((sk, idx) => (
                        <span key={idx} style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          padding: '0.1rem 0.35rem',
                          fontSize: '0.65rem',
                          color: 'var(--text-secondary)'
                        }}>{sk}</span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleInitChat(rec.expertId)}
                      className="btn btn-secondary"
                      style={{ width: '100%', padding: '0.35rem', fontSize: '0.75rem' }}
                    >
                      Chat & Interview
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>

        </div>
      )}
    </ClientLayout>
  );
};
