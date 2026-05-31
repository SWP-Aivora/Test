import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientLayout } from '../../components/PortalLayout';
import { useToast } from '../../context/ToastContext';
import { Calendar, DollarSign, Award, Bot, FileText, MessageSquare, AlertCircle, Loader, Shield, Star, Play } from 'lucide-react';
import api from '../../services/api';
import { getJobStatusBadge, getJobStatusText } from '../../utils/statusMappers';
import { formatDate } from '../../utils/formatters';

interface MilestoneSuggestion { title: string; amount: number; dueDays: number; description?: string; }
interface Proposal { id: string; expertId: string; expertName: string; expertAvatarUrl?: string; coverLetter: string; proposedBudget?: number; proposedTimelineDays?: number; bidAmount?: number; totalBid?: number; completionDays?: number; deliveryDays?: number; status: string; submittedAt?: string; createdAt?: string; milestones?: MilestoneSuggestion[]; }
interface RecommendedExpert { expertId: string; fullName: string; avatarUrl?: string; title?: string; hourlyRate?: number; matchScore: number; matchReason?: string; topSkills: string[]; }
interface JobDetail { id: string; title: string; originalDescription: string; finalDescription?: string; categoryId: string; categoryName?: string; budgetType: string; budgetMin?: number; budgetMax?: number; timelineDays?: number; status: string; createdAt: string; skills: string[]; }

export const JobDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [hiringId, setHiringId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState<string | null>(null);
  const [generatingRecs, setGeneratingRecs] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      if (!id) return;
      try {
        const jobRes = await api.get(`/jobs/${id}`);
        setJob(jobRes.data);

        try { const pRes = await api.get(`/jobs/${id}/proposals`); setProposals(pRes.data || []); } catch { setProposals([]); }
        try { const rRes = await api.get(`/jobs/${id}/recommendations`); setRecommendations(rRes.data || []); } catch { setRecommendations([]); }
      } catch {
        setJob({ id, title: 'AI Product UI/UX Interface Redesign', originalDescription: 'Need a designer', finalDescription: 'Seeking elite designer for glassmorphic UI.', categoryId: 'c2', categoryName: 'Design & Creative', budgetType: 'FIXED', budgetMin: 600, budgetMax: 1200, timelineDays: 14, status: 'OPEN', createdAt: new Date().toISOString(), skills: ['Figma', 'UI/UX', 'CSS Modules'] });
        setProposals([{ id: 'prop-1', expertId: 'exp-alice', expertName: 'Alice Design', coverLetter: '5+ years experience.', bidAmount: 950, completionDays: 10, status: 'PENDING', createdAt: new Date().toISOString(), milestones: [{ title: 'Figma prototypes', amount: 350, dueDays: 4 }, { title: 'CSS layout coding', amount: 600, dueDays: 6 }] }]);
        setRecommendations([{ expertId: 'exp-alice', fullName: 'Alice Design', title: 'Lead UI Architect', hourlyRate: 45, matchScore: 98, matchReason: '100% skill match.', topSkills: ['Figma', 'UI/UX', 'CSS Modules'] }]);
      } finally { setLoading(false); }
    };
    fetchAll();
  }, [id]);

  const handlePublishJob = async () => {
    if (!job || !id) return;
    setPublishing(true);
    try {
      const response = await api.post(`/jobs/${id}/publish`);
      setJob(response.data);
      showToast('success', 'Job published!');
    } catch {
      setJob(prev => prev ? { ...prev, status: 'OPEN' } : null);
      showToast('info', 'Job marked as open (offline).');
    } finally { setPublishing(false); }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    setHiringId(proposalId);
    try {
      const response = await api.put(`/proposals/${proposalId}/accept`);
      const projectPayload = response.data?.project || response.data;
      const projectId = projectPayload?.id;
      showToast('success', 'Proposal accepted! Project created.');
      if (projectId) navigate(`/client/projects/${projectId}`);
      else navigate('/client/dashboard');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to accept proposal.');
      navigate('/client/dashboard');
    } finally { setHiringId(null); }
  };

  const handleInitChat = async (expertId: string) => {
    setChatLoading(expertId);
    try {
      const response = await api.post(`/conversations/init?expertId=${expertId}&jobId=${id}`);
      navigate('/chat', { state: { activeConversationId: response.data.id } });
    } catch { navigate('/chat'); }
    finally { setChatLoading(null); }
  };

  const handleGenerateRecommendations = async () => {
    if (!id) return;
    setGeneratingRecs(true);
    try {
      await api.post(`/jobs/${id}/recommendations/generate`);
      const rRes = await api.get(`/jobs/${id}/recommendations`);
      setRecommendations(rRes.data || []);
      showToast('success', 'Recommendations generated!');
    } catch { showToast('error', 'Failed to generate recommendations.'); }
    finally { setGeneratingRecs(false); }
  };

  const badge = job ? getJobStatusBadge(job.status) : 'badge-muted';
  const statusText = job ? getJobStatusText(job.status) : '';


  return (
    <ClientLayout>
      {loading || !job ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Job Header */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-primary">{job.categoryName || 'General'}</span>
                    <span className={`badge ${badge}`}>{statusText}</span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>{job.title}</h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>ID: {job.id} • Posted {formatDate(job.createdAt)}</div>
                </div>
                {job.status === 'DRAFT' && (
                  <button onClick={handlePublishJob} disabled={publishing} className="btn btn-success" style={{ padding: '0.6rem 1.4rem' }}>
                    {publishing ? <><Loader className="spinner" size={16} /> Publishing...</> : <><Play size={16} /> Publish Campaign</>}
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.25rem 0', margin: '1.5rem 0' }}>
                {[
                  { icon: DollarSign, color: 'var(--success)', label: 'Budget', value: job.budgetMin && job.budgetMax ? `$${job.budgetMin} - $${job.budgetMax}` : 'TBD' },
                  { icon: Calendar, color: 'var(--warning)', label: 'Timeline', value: job.timelineDays ? `${job.timelineDays} Days` : 'TBD' },
                  { icon: Award, color: 'var(--accent)', label: 'Model', value: job.budgetType },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <item.icon size={20} color={item.color} />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.label}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {job.finalDescription ? (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Bot size={16} color="var(--accent)" /> AI Orchestrated Specs</h4>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, background: 'hsla(250,89%,65%,0.03)', border: '1px dashed var(--border)', padding: '1rem', borderRadius: '8px' }}>{job.finalDescription}</p>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Project Scope</h4>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{job.originalDescription}</p>
                  </div>
                )}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Required Skills</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {job.skills.map((sk: any, i) => (
                      <span key={i} className="badge badge-muted">{typeof sk === 'object' && sk !== null ? sk.name : sk}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Proposals */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--accent)" /> Active Bids ({proposals.length})
              </h3>
              {proposals.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 1rem auto' }} />
                  <p>No proposals yet. Check recommendations on the right.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {proposals.map(prop => {
                    const tmDays = prop.proposedTimelineDays ?? prop.completionDays ?? prop.deliveryDays ?? 'N/A';
                    const timelineValue = `${tmDays}d`;
                    return (
                    <div key={prop.id} className="glass-panel" style={{ padding: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {prop.expertAvatarUrl ? <img src={prop.expertAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Star size={18} color="var(--warning)" />}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{prop.expertName}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Applied {formatDate(prop.submittedAt ?? prop.createdAt)}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Bid</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>${(prop.proposedBudget ?? prop.bidAmount ?? prop.totalBid ?? 0).toLocaleString()}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Timeline</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{timelineValue}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Cover Letter</h5>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>{prop.coverLetter}</p>
                      </div>
                      {prop.milestones && prop.milestones.length > 0 && (
                        <div style={{ marginBottom: '1.5rem', background: 'hsla(222,47%,5%,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Proposed Milestones</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {prop.milestones.map((ms, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0', borderBottom: idx < (prop.milestones?.length || 0) - 1 ? '1px dashed var(--border)' : 'none' }}>
                                <span style={{ color: 'var(--text-primary)' }}>{idx + 1}. {ms.title}</span>
                                <span style={{ fontWeight: 600, color: 'var(--success)' }}>${ms.amount} ({ms.dueDays}d)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                        <button onClick={() => handleInitChat(prop.expertId)} disabled={chatLoading !== null} className="btn btn-secondary btn-sm">
                          {chatLoading === prop.expertId ? <Loader size={16} className="spinner" /> : <><MessageSquare size={16} /> Chat</>}
                        </button>
                        <button onClick={() => handleAcceptProposal(prop.id)} disabled={hiringId !== null} className="btn btn-success btn-sm">
                          {hiringId === prop.id ? <><Loader size={16} className="spinner" /> Hiring...</> : <><Shield size={16} /> Accept & Fund</>}
                        </button>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* AI Sidebar */}
          <aside className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginBottom: '0.25rem' }}><Bot size={18} color="var(--accent)" /><h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Matchmaker</h3></div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Matched experts based on campaign specs</p>
            </div>
            {recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                <Bot size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>No recommendations yet.</p>
                <button onClick={handleGenerateRecommendations} disabled={generatingRecs} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                  {generatingRecs ? 'Analyzing...' : 'Find Matches'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {recommendations.map(rec => (
                  <div key={rec.expertId} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>{rec.fullName.charAt(0)}</div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{rec.fullName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Score: <strong style={{ color: 'var(--success)' }}>{rec.matchScore}%</strong></div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{rec.matchReason}</p>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {rec.topSkills.slice(0, 3).map((sk, i) => <span key={i} className="badge badge-muted" style={{ fontSize: '0.65rem' }}>{sk}</span>)}
                    </div>
                    <button onClick={() => handleInitChat(rec.expertId)} className="btn btn-secondary btn-sm" style={{ width: '100%', padding: '0.35rem' }}>Chat & Interview</button>
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
