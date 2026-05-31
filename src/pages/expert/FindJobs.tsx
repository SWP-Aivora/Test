import React, { useEffect, useState } from 'react';
import { ExpertLayout } from '../../components/PortalLayout';
import { Search, Briefcase, DollarSign, Calendar, Sparkles, Filter, Award, Loader, Send, ChevronRight, X, Plus } from 'lucide-react';
import api from '../../services/api';

interface JobSummary {
  id: string;
  title: string;
  categoryName?: string;
  budgetMin?: number;
  budgetMax?: number;
  timelineDays?: number;
  createdAt: string;
  skills: string[];
}

interface JobDetail extends JobSummary {
  originalDescription: string;
  finalDescription?: string;
  budgetType: string;
}

interface Category {
  id: string;
  name: string;
}

interface MilestoneInput {
  title: string;
  description: string;
  amount: number;
  dueDays: number;
}

export const FindJobs: React.FC = () => {
  // Navigation & Listing States
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Active Job Detail Selection
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- PROPOSAL FORM STATE ---
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState<string>('500');
  const [completionDays, setCompletionDays] = useState<string>('10');
  
  // Custom Milestone Builder array
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: 'Initial Draft & Design Prototypes', description: 'Complete mock designs and database design blueprints', amount: 200, dueDays: 4 },
    { title: 'Functional Frontend/Backend Integration', description: 'Deploy core logic and compile builds successfully', amount: 300, dueDays: 6 }
  ]);

  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/jobs', {
        params: {
          categoryId: selectedCategory || undefined,
          pageSize: 20,
          pageIndex: 1
        }
      });
      setJobs(response.data?.items || []);
    } catch (err) {
      console.warn('[FindJobs] Failed to load live jobs, mocking listings...', err);
      // Gorgeous Fallbacks
      setJobs([
        {
          id: 'mock-1',
          title: 'Build Full-Stack E-Commerce Platform with NextJS & Go',
          categoryName: 'Software Development',
          budgetMin: 1200,
          budgetMax: 2500,
          timelineDays: 30,
          createdAt: new Date().toISOString(),
          skills: ['React', 'NextJS', 'Go', 'PostgreSQL']
        },
        {
          id: 'mock-2',
          title: 'AI Product UI/UX Interface Redesign (Glassmorphism Concept)',
          categoryName: 'Design & Creative',
          budgetMin: 600,
          budgetMax: 1200,
          timelineDays: 14,
          createdAt: new Date().toISOString(),
          skills: ['Figma', 'UI/UX', 'CSS Modules', 'Web Animation']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Load category lists for filter dropdown
    const fetchCategories = async () => {
      try {
        const catRes = await api.get('/categories');
        setCategories(catRes.data || []);
      } catch (err) {
        console.warn('[FindJobs] Failed to load categories, mocking dropdown:', err);
        setCategories([
          { id: 'c1', name: 'Software Development' },
          { id: 'c2', name: 'Design & Creative' },
          { id: 'c3', name: 'Writing & Translation' }
        ]);
      }
    };
    fetchCategories();
  }, [selectedCategory]);

  const handleSelectJob = async (jobId: string) => {
    setLoadingDetail(true);
    setSelectedJob(null);
    setProposalSuccess(false);
    setCoverLetter('');
    
    try {
      const response = await api.get(`/jobs/${jobId}`);
      setSelectedJob(response.data);
      
      // Auto-prefill bid cost estimation fields based on job limits
      const budgetMax = response.data.budgetMax || 1000;
      const budgetMin = response.data.budgetMin || 500;
      setBidAmount(budgetMax.toString());
      setCompletionDays((response.data.timelineDays || 10).toString());

      // Auto distribute custom milestones cost
      const ms1 = Math.round(budgetMax * 0.4);
      const ms2 = budgetMax - ms1;
      setMilestones([
        { title: 'Development Setup & initial mock layouts', description: 'Setup visual repository and design blueprints', amount: ms1, dueDays: 4 },
        { title: 'Core Logic implementation and deployment integration', description: 'Completed functional code compiled and published', amount: ms2, dueDays: 6 }
      ]);
    } catch (err) {
      console.warn('[FindJobs] Failed to retrieve details, using local fallback:', err);
      // Hard fallback details
      const fallbackSummary = jobs.find(j => j.id === jobId);
      if (fallbackSummary) {
        setSelectedJob({
          ...fallbackSummary,
          originalDescription: 'I need a designer to build a spectacular glassmorphic web dashboard.',
          finalDescription: 'We are seeking an elite designer to create beautiful, glowing interface templates incorporating Backdrop filters, HSL palettes, and fluid CSS micro-animations.',
          budgetType: 'FIXED'
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  // Add a dynamic milestone line in the builder
  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: 100, dueDays: 3 }]);
  };

  // Remove a milestone line
  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, idx) => idx !== index));
  };

  const handleMilestoneChange = (index: number, field: keyof MilestoneInput, value: any) => {
    const updated = [...milestones];
    updated[index] = {
      ...updated[index],
      [field]: field === 'amount' || field === 'dueDays' ? Number(value) : value
    };
    setMilestones(updated);
    
    // Auto-update sum cost fields
    if (field === 'amount') {
      const sum = updated.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      setBidAmount(sum.toString());
    }
  };

  // Submit proposal to backend
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !coverLetter) return;
    setSubmittingProposal(true);

    try {
      const payload = {
        coverLetter,
        bidAmount: Number(bidAmount),
        completionDays: Number(completionDays),
        // Map dynamic expert milestones structure to C# endpoint format
        milestones: milestones.map(m => ({
          title: m.title || 'Work Milestone Checkpoint',
          description: m.description || undefined,
          amount: m.amount,
          dueDays: m.dueDays
        }))
      };

      await api.post(`/jobs/${selectedJob.id}/proposals`, payload);
      setProposalSuccess(true);
      setCoverLetter('');
      
      // Refresh matching job views
      fetchJobs();
    } catch (err: any) {
      console.error('[FindJobs] Proposal submission failed:', err);
      alert(err?.message || 'Failed to submit proposal. You may have already applied.');
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Filter listings client-side by keyword
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ExpertLayout>
      <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '1.2fr 1fr' : '1fr', gap: '2rem', transition: 'grid-template-columns 0.3s ease' }}>
        
        {/* Left Side: Job Board listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Search toolbars */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search skills, tech stacks, or keywords..."
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <Filter size={16} color="var(--text-secondary)" />
              <select
                className="input-field"
                style={{ padding: '0.75rem 2rem 0.75rem 1rem', width: '220px' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Listings container */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="skeleton skeleton-card" style={{ height: '140px' }}></div>
              <div className="skeleton skeleton-card" style={{ height: '140px' }}></div>
              <div className="skeleton skeleton-card" style={{ height: '140px' }}></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Briefcase size={36} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <p>No active campaigns match your query. Try clearing filters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job.id)}
                  className="glass-panel"
                  style={{
                    padding: '2rem',
                    cursor: 'pointer',
                    border: selectedJob?.id === job.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    boxShadow: selectedJob?.id === job.id ? '0 0 15px var(--accent-glow)' : 'var(--shadow-sm)',
                    background: selectedJob?.id === job.id ? 'hsla(222,47%,16%,0.4)' : 'var(--surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '2rem',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="badge badge-primary">{job.categoryName || 'General'}</span>
                      {job.timelineDays && (
                        <span className="badge badge-muted">{job.timelineDays} Days Limit</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{job.title}</h3>
                    
                    {/* Skills list */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {job.skills.map((sk: any, idx) => (
                        <span key={idx} style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>{typeof sk === 'object' && sk !== null ? sk.name : sk}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                      {job.budgetMin && job.budgetMax ? `$${job.budgetMin} - $${job.budgetMax}` : 'TBD'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      Apply Now <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Bid details overlay Panel */}
        {selectedJob && (
          <aside className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', overflowY: 'auto' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ overflow: 'hidden' }}>
                <div className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>{selectedJob.categoryName || 'General'}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedJob.title}</h3>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                
                {/* Description details */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Campaign Specifications</h4>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)', background: 'hsla(222,47%,5%,0.3)', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    {selectedJob.finalDescription || selectedJob.originalDescription}
                  </p>
                </div>

                {/* Scope stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Budget parameters</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-heading)', marginTop: '0.15rem' }}>
                      {selectedJob.budgetMin && selectedJob.budgetMax ? `$${selectedJob.budgetMin} - $${selectedJob.budgetMax}` : 'TBD'}
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Timeline limit</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.15rem' }}>
                      {selectedJob.timelineDays || 'TBD'} Days
                    </div>
                  </div>
                </div>

                {/* Bidding application success screen */}
                {proposalSuccess ? (
                  <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--success)', background: 'rgba(142,70,45%,0.04)' }}>
                    <Award size={36} color="var(--success)" style={{ margin: '0 auto 1rem auto' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem' }}>Proposal Submitted!</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Your custom milestone structured proposal is registered. Clients will review details and may contact you via chat workspace.
                    </p>
                  </div>
                ) : (
                  /* Form Proposal structure submitter */
                  <form onSubmit={handleSubmitProposal} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <Sparkles size={16} color="var(--accent)" />
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Submit Professional Proposal</h4>
                    </div>

                    <div>
                      <label className="input-label" htmlFor="cover-letter-input">Cover Letter / Pitch Pitch *</label>
                      <textarea
                        id="cover-letter-input"
                        className="input-field"
                        rows={4}
                        placeholder="Detail your experience with NextJS/Go, Figma prototypes coding, or frontend integrations. Pitch why you match..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        required
                        disabled={submittingProposal}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label className="input-label" htmlFor="bid-amount-input">Bid Target Amount ($) *</label>
                        <input
                          id="bid-amount-input"
                          type="number"
                          className="input-field"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          required
                          disabled={submittingProposal}
                        />
                      </div>

                      <div>
                        <label className="input-label" htmlFor="completion-days-input">Completion Days *</label>
                        <input
                          id="completion-days-input"
                          type="number"
                          className="input-field"
                          value={completionDays}
                          onChange={(e) => setCompletionDays(e.target.value)}
                          required
                          disabled={submittingProposal}
                        />
                      </div>
                    </div>

                    {/* Milestones dynamic builder list */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <label className="input-label" style={{ marginBottom: 0 }}>Escrow Milestones Schedule ({milestones.length})</label>
                        <button
                          type="button"
                          onClick={handleAddMilestone}
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}
                          disabled={submittingProposal}
                        >
                          <Plus size={12} /> Add Checkpoint
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {milestones.map((ms, idx) => (
                          <div key={idx} className="glass-card" style={{ padding: '1rem', position: 'relative' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(idx)}
                              style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                              disabled={submittingProposal || milestones.length <= 1}
                            >
                              <X size={14} />
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <input
                                type="text"
                                className="input-field"
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                placeholder={`Checkpoint ${idx + 1} Title`}
                                value={ms.title}
                                onChange={(e) => handleMilestoneChange(idx, 'title', e.target.value)}
                                required
                                disabled={submittingProposal}
                              />
                              <input
                                type="text"
                                className="input-field"
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                placeholder="Brief deliverables description..."
                                value={ms.description}
                                onChange={(e) => handleMilestoneChange(idx, 'description', e.target.value)}
                                disabled={submittingProposal}
                              />
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <input
                                  type="number"
                                  className="input-field"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                  placeholder="Amount ($)"
                                  value={ms.amount || ''}
                                  onChange={(e) => handleMilestoneChange(idx, 'amount', e.target.value)}
                                  required
                                  disabled={submittingProposal}
                                />
                                <input
                                  type="number"
                                  className="input-field"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                  placeholder="Days Limit"
                                  value={ms.dueDays || ''}
                                  onChange={(e) => handleMilestoneChange(idx, 'dueDays', e.target.value)}
                                  required
                                  disabled={submittingProposal}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingProposal || !coverLetter}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
                    >
                      {submittingProposal ? (
                        <>
                          <Loader size={18} className="spinner" /> Uploading Proposal...
                        </>
                      ) : (
                        <>
                          Submit Escrow Proposal <Send size={16} />
                        </>
                      )}
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
