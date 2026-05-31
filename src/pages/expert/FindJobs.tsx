import React, { useEffect, useState } from 'react';
import { ExpertLayout } from '../../components/PortalLayout';
import { useToast } from '../../context/ToastContext';
import { Search, Briefcase, Sparkles, Filter, Award, Loader, Send, ChevronRight, X, Plus } from 'lucide-react';
import api from '../../services/api';

interface JobSummary { id: string; title: string; categoryName?: string; budgetMin?: number; budgetMax?: number; timelineDays?: number; createdAt: string; skills: string[]; }
interface JobDetail extends JobSummary { originalDescription: string; finalDescription?: string; budgetType: string; }
interface Category { id: string; name: string; }
interface MilestoneInput { title: string; description: string; amount: number; dueDays: number; }

export const FindJobs: React.FC = () => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('500');
  const [completionDays, setCompletionDays] = useState('10');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: 'Initial Draft & Design', description: 'Mock designs and blueprints', amount: 200, dueDays: 4 },
    { title: 'Functional Integration', description: 'Core logic and builds', amount: 300, dueDays: 6 },
  ]);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs', { params: { categoryId: selectedCategory || undefined, pageSize: 20, pageIndex: 1 } });
      setJobs(res.data?.items || []);
    } catch {
      setJobs([
        { id: 'mock-1', title: 'Build Full-Stack E-Commerce with NextJS & Go', categoryName: 'Software Development', budgetMin: 1200, budgetMax: 2500, timelineDays: 30, createdAt: new Date().toISOString(), skills: ['React', 'NextJS', 'Go'] },
        { id: 'mock-2', title: 'AI Product UI/UX Redesign', categoryName: 'Design & Creative', budgetMin: 600, budgetMax: 1200, timelineDays: 14, createdAt: new Date().toISOString(), skills: ['Figma', 'UI/UX', 'CSS'] },
      ]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [selectedCategory]);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data || [])).catch(() => setCategories([{ id: 'c1', name: 'Software Development' }, { id: 'c2', name: 'Design & Creative' }]));
  }, []);

  const handleSelectJob = async (jobId: string) => {
    setLoadingDetail(true);
    setSelectedJob(null);
    setProposalSuccess(false);
    setCoverLetter('');
    try {
      const res = await api.get(`/jobs/${jobId}`);
      setSelectedJob(res.data);
      const max = res.data.budgetMax || 1000;
      setBidAmount(max.toString());
      setCompletionDays((res.data.timelineDays || 10).toString());
      const ms1 = Math.round(max * 0.4);
      setMilestones([
        { title: 'Development Setup & Mock Layouts', description: 'Setup repo and design blueprints', amount: ms1, dueDays: 4 },
        { title: 'Core Logic & Deployment', description: 'Functional code compiled', amount: max - ms1, dueDays: 6 },
      ]);
    } catch {
      const fallback = jobs.find(j => j.id === jobId);
      if (fallback) setSelectedJob({ ...fallback, originalDescription: 'Need a designer for glassmorphic UI.', finalDescription: 'Seeking elite designer.', budgetType: 'FIXED' });
    } finally { setLoadingDetail(false); }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !coverLetter) return;
    setSubmittingProposal(true);
    try {
      await api.post(`/jobs/${selectedJob.id}/proposals`, {
        jobId: selectedJob.id,
        coverLetter,
        proposedBudget: Number(bidAmount),
        proposedTimelineDays: Number(completionDays),
        milestones: milestones.map(m => ({ title: m.title || 'Work Milestone', description: m.description || undefined, amount: m.amount, dueDays: m.dueDays })),
      });
      setProposalSuccess(true);
      setCoverLetter('');
      fetchJobs();
      showToast('success', 'Proposal submitted!');
    } catch (err: any) { showToast('error', err?.message || 'Failed to submit proposal.'); }
    finally { setSubmittingProposal(false); }
  };

  const filteredJobs = jobs.filter(j => j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));


  return (
    <ExpertLayout>
      <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '1.2fr 1fr' : '1fr', gap: '2rem', transition: 'grid-template-columns 0.3s ease' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search skills, keywords..." className="input-field" style={{ paddingLeft: '2.75rem' }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <Filter size={16} color="var(--text-secondary)" />
              <select className="input-field" style={{ padding: '0.75rem 2rem 0.75rem 1rem', width: '200px' }} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '140px' }} />)}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Briefcase size={36} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <p>No matching jobs. Try clearing filters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredJobs.map(job => (
                <div key={job.id} onClick={() => handleSelectJob(job.id)} className="glass-panel" style={{
                  padding: '2rem', cursor: 'pointer',
                  border: selectedJob?.id === job.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                  boxShadow: selectedJob?.id === job.id ? '0 0 15px var(--accent-glow)' : 'var(--shadow-sm)',
                  background: selectedJob?.id === job.id ? 'hsla(222,47%,16%,0.4)' : 'var(--surface)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', transition: 'var(--transition)',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{job.categoryName || 'General'}</span>
                      {job.timelineDays && <span className="badge badge-muted">{job.timelineDays}d</span>}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{job.title}</h3>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {job.skills.map((sk: any, i) => <span key={i} className="badge badge-muted" style={{ fontSize: '0.75rem' }}>{typeof sk === 'object' && sk !== null ? sk.name : sk}</span>)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                      {job.budgetMin && job.budgetMax ? `$${job.budgetMin} - $${job.budgetMax}` : 'TBD'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>Apply <ChevronRight size={14} /></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedJob && (
          <aside className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ overflow: 'hidden' }}>
                <div className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>{selectedJob.categoryName || 'General'}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedJob.title}</h3>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.2rem' }}><X size={20} /></button>
            </div>

            {loadingDetail ? (
              <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description</h4>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)', background: 'hsla(222,47%,5%,0.3)', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>{selectedJob.finalDescription || selectedJob.originalDescription}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Budget</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success)' }}>{selectedJob.budgetMin && selectedJob.budgetMax ? `$${selectedJob.budgetMin} - $${selectedJob.budgetMax}` : 'TBD'}</div>
                  </div>
                  <div className="glass-card" style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Timeline</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{selectedJob && selectedJob.timelineDays ? `${selectedJob.timelineDays} days` : "TBD days"}</div>
                  </div>
                </div>

                {proposalSuccess ? (
                  <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--success)', background: 'rgba(142,70%,45%,0.04)' }}>
                    <Award size={36} color="var(--success)" style={{ margin: '0 auto 1rem auto' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem' }}>Proposal Submitted!</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Client will review and may contact you via chat.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitProposal} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}><Sparkles size={16} color="var(--accent)" /><h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Submit Proposal</h4></div>
                    <div>
                      <label className="input-label">Cover Letter *</label>
                      <textarea className="input-field" rows={4} placeholder="Detail your experience..." value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} required disabled={submittingProposal} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label className="input-label">Bid Amount ($) *</label>
                        <input type="number" className="input-field" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} required disabled={submittingProposal} />
                      </div>
                      <div>
                        <label className="input-label">Completion Days *</label>
                        <input type="number" className="input-field" value={completionDays} onChange={(e) => setCompletionDays(e.target.value)} required disabled={submittingProposal} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <label className="input-label" style={{ marginBottom: 0 }}>Milestones ({milestones.length})</label>
                        <button type="button" onClick={() => setMilestones([...milestones, { title: '', description: '', amount: 100, dueDays: 3 }])} className="btn btn-secondary btn-sm" disabled={submittingProposal}><Plus size={12} /> Add</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {milestones.map((ms, idx) => (
                          <div key={idx} className="glass-card" style={{ padding: '1rem', position: 'relative' }}>
                            <button type="button" onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} disabled={submittingProposal || milestones.length <= 1}><X size={14} /></button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <input type="text" className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} placeholder={`Checkpoint ${idx + 1} Title`} value={ms.title} onChange={(e) => { const u = [...milestones]; u[idx] = { ...u[idx], title: e.target.value }; setMilestones(u); }} required disabled={submittingProposal} />
                              <input type="text" className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} placeholder="Description" value={ms.description} onChange={(e) => { const u = [...milestones]; u[idx] = { ...u[idx], description: e.target.value }; setMilestones(u); }} disabled={submittingProposal} />
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <input type="number" className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} placeholder="Amount" value={ms.amount || ''} onChange={(e) => { const u = [...milestones]; u[idx] = { ...u[idx], amount: Number(e.target.value) }; setMilestones(u); }} required disabled={submittingProposal} />
                                <input type="number" className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} placeholder="Days" value={ms.dueDays || ''} onChange={(e) => { const u = [...milestones]; u[idx] = { ...u[idx], dueDays: Number(e.target.value) }; setMilestones(u); }} required disabled={submittingProposal} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={submittingProposal || !coverLetter} className="btn btn-primary btn-lg" style={{ width: '100%', padding: '0.8rem' }}>
                      {submittingProposal ? <><Loader size={18} className="spinner" /> Submitting...</> : <><Send size={16} /> Submit Proposal</>}
                    </button>
                  </form>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </ExpertLayout>
  );
};
