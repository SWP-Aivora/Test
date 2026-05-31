import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientLayout } from '../../components/PortalLayout';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Bot, AlertTriangle, HelpCircle, Check, FileText, ArrowLeft, ArrowRight, DollarSign, Calendar, Loader, Plus, X, Briefcase } from 'lucide-react';
import api from '../../services/api';

interface Category { id: string; name: string; }
interface Skill { id: string; name: string; categoryId: string; }
interface SuggestedMilestone { title: string; description?: string; amount: number; dueDays: number; acceptanceCriteria?: string; }
interface AISuggestion { id: string; rawInput: string; suggestedTitle?: string; suggestedDescription?: string; suggestedBudgetMin?: number; suggestedBudgetMax?: number; suggestedTimelineDays?: number; suggestedSkills: string[]; suggestedMilestones: SuggestedMilestone[]; clarifyingQuestions: string[]; riskWarnings: string[]; }

export const JobCreateWizard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  const [mode, setMode] = useState<'AI' | 'MANUAL'>('AI');
  const [wizardStep, setWizardStep] = useState(1);

  // Manual form
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualBudgetType, setManualBudgetType] = useState('FIXED');
  const [manualBudgetMin, setManualBudgetMin] = useState(100);
  const [manualBudgetMax, setManualBudgetMax] = useState(500);
  const [manualTimeline, setManualTimeline] = useState(14);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // AI form
  const [rawInput, setRawInput] = useState('');
  const [businessDomain, setBusinessDomain] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [aiBudgetMin, setAiBudgetMin] = useState('');
  const [aiBudgetMax, setAiBudgetMax] = useState('');
  const [aiTimeline, setAiTimeline] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

  // Accept step
  const [acceptCategory, setAcceptCategory] = useState('');
  const [acceptSkills, setAcceptSkills] = useState<string[]>([]);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const [catRes, skillRes] = await Promise.all([api.get('/categories'), api.get('/skills')]);
        setCategories(catRes.data || []);
        setSkills(skillRes.data || []);
      } catch {
        setCategories([{ id: 'c1', name: 'Software Development' }, { id: 'c2', name: 'Design & Creative' }, { id: 'c3', name: 'Writing & Translation' }]);
        setSkills([{ id: 's1', name: 'React', categoryId: 'c1' }, { id: 's2', name: 'NodeJS', categoryId: 'c1' }, { id: 's3', name: 'Figma', categoryId: 'c2' }, { id: 's4', name: 'UI/UX', categoryId: 'c2' }]);
      } finally { setLoadingTaxonomy(false); }
    };
    loadTaxonomy();
  }, []);

  const getFilteredSkills = (categoryId: string) => skills.filter(s => s.categoryId === categoryId);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualDesc || !manualCategory) return;
    setSubmitting(true);
    try {
      const response = await api.post('/jobs', {
        title: manualTitle,
        originalDescription: manualDesc,
        finalDescription: manualDesc,
        categoryId: manualCategory,
        budgetType: manualBudgetType,  // FIXED string, not number
        budgetMin: Number(manualBudgetMin),
        budgetMax: Number(manualBudgetMax),
        timelineDays: Number(manualTimeline),
        skillIds: selectedSkills,
      });
      await api.post(`/jobs/${response.data.id}/publish`);
      showToast('success', 'Job published successfully!');
      navigate(`/client/jobs/${response.data.id}`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to create job.');
    } finally { setSubmitting(false); }
  };

  const handleAIGenerate = async () => {
    if (!rawInput) return;
    setAiGenerating(true);
    try {
      const response = await api.post('/ai/job-assistant', {
        rawInput,
        businessDomain: businessDomain || undefined,
        expectedOutcome: expectedOutcome || undefined,
        budgetMin: aiBudgetMin ? Number(aiBudgetMin) : undefined,
        budgetMax: aiBudgetMax ? Number(aiBudgetMax) : undefined,
        timelineDays: aiTimeline ? Number(aiTimeline) : undefined,
      });
      const data = response.data as AISuggestion;
      setAiSuggestion(data);
      if (categories.length > 0) setAcceptCategory(categories[0].id);
      setWizardStep(2);
    } catch {
      // Fallback
      const min = aiBudgetMin ? Number(aiBudgetMin) : 800;
      setAiSuggestion({
        id: 'mock-suggestion', rawInput,
        suggestedTitle: `Custom Engineered Software: ${rawInput.substring(0, 30)}...`,
        suggestedDescription: `POLISHED BY AIVORA AI:\nWe are looking to develop a secure software product based on: "${rawInput}".`,
        suggestedBudgetMin: min, suggestedBudgetMax: min * 2,
        suggestedTimelineDays: aiTimeline ? Number(aiTimeline) : 21,
        suggestedSkills: ['React', 'TypeScript', 'Escrow Security'],
        suggestedMilestones: [
          { title: 'Design System & API Architecture', description: 'Define schemas and templates', amount: min * 0.4, dueDays: 7, acceptanceCriteria: 'Clean designs exported' },
          { title: 'Full Stack Logic & Delivery', description: 'Implement core functionality', amount: min * 0.6, dueDays: 14, acceptanceCriteria: 'Code compiles cleanly' },
        ],
        clarifyingQuestions: ['What auth providers do you plan to use?'],
        riskWarnings: ['Escrow API integration may introduce latency.'],
      });
      if (categories.length > 0) setAcceptCategory(categories[0].id);
      setWizardStep(2);
    } finally { setAiGenerating(false); }
  };

  const handleAIAccept = async () => {
    if (!aiSuggestion) return;
    setAccepting(true);
    try {
      const response = await api.post(`/ai/job-assistant/${aiSuggestion.id}/accept`, {
        categoryId: acceptCategory || undefined,
        selectedSkillIds: acceptSkills.length > 0 ? acceptSkills : undefined,
      });
      const spawnedJob = response.data.job;
      await api.post(`/jobs/${spawnedJob.id}/publish`);
      showToast('success', 'AI job created and published!');
      navigate(`/client/jobs/${spawnedJob.id}`);
    } catch {
      showToast('error', 'Failed to accept AI suggestion.');
      navigate('/client/dashboard');
    } finally { setAccepting(false); }
  };

  const toggleSkill = (skillId: string, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
    setSelected(selected.includes(skillId) ? selected.filter(id => id !== skillId) : [...selected, skillId]);
  };

  return (
    <ClientLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="section-title">Create a New Job Post</h2>
            <p className="section-desc">Choose between manual form or AI Orchestration.</p>
          </div>
          {wizardStep === 1 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.25rem', display: 'flex' }}>
              <button onClick={() => setMode('AI')} className={`btn ${mode === 'AI' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', border: 'none', borderRadius: '6px' }}>
                <Bot size={16} /> AI Orchestrator
              </button>
              <button onClick={() => setMode('MANUAL')} className={`btn ${mode === 'MANUAL' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', border: 'none', borderRadius: '6px' }}>
                <FileText size={16} /> Manual Form
              </button>
            </div>
          )}
        </div>

        {loadingTaxonomy ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><div className="spinner" /></div>
        ) : (
          <>
            {/* AI STEP 1: Input */}
            {mode === 'AI' && wizardStep === 1 && (
              <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent)' }}><Bot size={24} /></div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Aivora AI Task Planner</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Provide your raw guidelines, and watch the AI coordinate your scope</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label className="input-label">Describe your project requirements *</label>
                    <textarea className="input-field" rows={5} placeholder="e.g., I need a freelance developer to construct a beautiful NextJS landing page..." value={rawInput} onChange={(e) => setRawInput(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label className="input-label">Business Domain (Optional)</label>
                      <input type="text" className="input-field" placeholder="e.g., E-commerce, Fintech" value={businessDomain} onChange={(e) => setBusinessDomain(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">Expected Outcomes (Optional)</label>
                      <input type="text" className="input-field" placeholder="e.g., High SEO ranking" value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label className="input-label">Min Budget ($)</label>
                      <input type="number" className="input-field" placeholder="Min" value={aiBudgetMin} onChange={(e) => setAiBudgetMin(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">Max Budget ($)</label>
                      <input type="number" className="input-field" placeholder="Max" value={aiBudgetMax} onChange={(e) => setAiBudgetMax(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">Timeline (Days)</label>
                      <input type="number" className="input-field" placeholder="e.g., 14" value={aiTimeline} onChange={(e) => setAiTimeline(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                  <button onClick={handleAIGenerate} disabled={aiGenerating || !rawInput} className="btn btn-primary btn-lg" style={{ padding: '0.85rem 2.5rem' }}>
                    {aiGenerating ? <><Loader className="spinner" size={18} style={{ animationDuration: '0.8s' }} /> Generating...</> : <><Sparkles size={16} /> Create with AI</>}
                  </button>
                </div>
              </div>
            )}

            {/* AI STEP 2: Review */}
            {mode === 'AI' && wizardStep === 2 && aiSuggestion && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass-panel glow-panel-indigo" style={{ padding: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div className="badge badge-primary glow-text" style={{ marginBottom: '0.5rem' }}><Bot size={12} style={{ marginRight: '2px' }} /> AI Generation Summary</div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{aiSuggestion.suggestedTitle}</h3>
                    </div>
                    <button onClick={() => { setAiSuggestion(null); setWizardStep(1); }} className="btn btn-secondary btn-sm"><ArrowLeft size={16} /> Refine</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={16} color="var(--accent)" /> AI Polished Description</h4>
                      <div style={{ background: 'hsla(222, 47%, 5%, 0.4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{aiSuggestion.suggestedDescription}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                        <DollarSign size={24} color="var(--success)" />
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Suggested Budget</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>${aiSuggestion.suggestedBudgetMin} - ${aiSuggestion.suggestedBudgetMax}</div>
                        </div>
                      </div>
                      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                        <Calendar size={24} color="var(--warning)" />
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Timeline</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{aiSuggestion.suggestedTimelineDays} Days</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Suggested Milestones</h4>
                      <div className="timeline-container">
                        {aiSuggestion.suggestedMilestones.map((ms, index) => (
                          <div key={index} className="timeline-node active">
                            <div className="glass-card" style={{ marginLeft: '0.5rem', padding: '1.25rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h5 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Milestone {index + 1}: {ms.title}</h5>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <span className="badge badge-success">${ms.amount}</span>
                                  <span className="badge badge-muted">{ms.dueDays}d</span>
                                </div>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{ms.description}</p>
                              {ms.acceptanceCriteria && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderLeft: '2px solid var(--accent)', paddingLeft: '0.5rem', marginTop: '0.4rem' }}><strong>Criteria:</strong> {ms.acceptanceCriteria}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                      {aiSuggestion.riskWarnings.length > 0 && (
                        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(346, 84%, 61%, 0.2)', background: 'rgba(346, 84%, 61%, 0.03)' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertTriangle size={16} /> Risk Warnings</h4>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {aiSuggestion.riskWarnings.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                      {aiSuggestion.clarifyingQuestions.length > 0 && (
                        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(250, 89%, 65%, 0.2)', background: 'rgba(250, 89%, 65%, 0.03)' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><HelpCircle size={16} /> Clarifying Questions</h4>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {aiSuggestion.clarifyingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '2rem' }}>
                    <button onClick={() => { setAiSuggestion(null); setWizardStep(1); }} className="btn btn-secondary">Reject & Redraft</button>
                    <button onClick={() => setWizardStep(3)} className="btn btn-primary btn-lg">Proceed to Category Mapping <ArrowRight size={16} /></button>
                  </div>
                </div>
              </div>
            )}

            {/* AI STEP 3: Category Mapping */}
            {mode === 'AI' && wizardStep === 3 && aiSuggestion && (
              <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent)' }}><Check size={20} /></div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Finalize Taxonomy Mapping</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Map the AI-generated task to platform categories and skills</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label className="input-label">Project Category *</label>
                    <select className="input-field" value={acceptCategory} onChange={(e) => { setAcceptCategory(e.target.value); setAcceptSkills([]); }} required>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Skill Tags</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>AI suggested: {aiSuggestion.suggestedSkills.join(', ')}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {getFilteredSkills(acceptCategory).map(sk => {
                        const active = acceptSkills.includes(sk.id);
                        return (
                          <div key={sk.id} onClick={() => toggleSkill(sk.id, acceptSkills, setAcceptSkills)}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: active ? '1px solid var(--accent)' : '1px solid var(--border)', background: active ? 'var(--accent-glow)' : 'rgba(255,255,255,0.03)', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'var(--transition)' }}>
                            {sk.name}{active ? <X size={12} /> : <Plus size={12} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                  <button onClick={() => setWizardStep(2)} className="btn btn-secondary"><ArrowLeft size={16} /> Back</button>
                  <button onClick={handleAIAccept} disabled={accepting} className="btn btn-primary btn-lg" style={{ padding: '0.85rem 2.5rem' }}>
                    {accepting ? <><Loader className="spinner" size={18} /> Publishing...</> : <><Check size={18} /> Approve & Publish</>}
                  </button>
                </div>
              </div>
            )}

            {/* MANUAL FORM */}
            {mode === 'MANUAL' && (
              <form onSubmit={handleManualSubmit} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent)' }}><FileText size={20} /></div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Standard Job Builder</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manually structure your scope details</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label className="input-label">Job Title *</label>
                    <input type="text" className="input-field" placeholder="e.g., React Frontend developer" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="input-label">Scope & Deliverables *</label>
                    <textarea className="input-field" rows={6} placeholder="Write your task overview..." value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label className="input-label">Category *</label>
                      <select className="input-field" value={manualCategory} onChange={(e) => { setManualCategory(e.target.value); setSelectedSkills([]); }} required>
                        <option value="">-- Choose --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Budget Type *</label>
                      <select className="input-field" value={manualBudgetType} onChange={(e) => setManualBudgetType(e.target.value)} required>
                        <option value="FIXED">Fixed Price</option>
                        <option value="HOURLY">Hourly</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label className="input-label">Min Budget ($)</label>
                      <input type="number" className="input-field" value={manualBudgetMin} onChange={(e) => setManualBudgetMin(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="input-label">Max Budget ($)</label>
                      <input type="number" className="input-field" value={manualBudgetMax} onChange={(e) => setManualBudgetMax(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="input-label">Timeline (Days)</label>
                      <input type="number" className="input-field" value={manualTimeline} onChange={(e) => setManualTimeline(Number(e.target.value))} />
                    </div>
                  </div>
                  {manualCategory && (
                    <div>
                      <label className="input-label">Required Skills</label>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {getFilteredSkills(manualCategory).map(sk => {
                          const active = selectedSkills.includes(sk.id);
                          return (
                            <div key={sk.id} onClick={() => toggleSkill(sk.id, selectedSkills, setSelectedSkills)}
                              style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: active ? '1px solid var(--accent)' : '1px solid var(--border)', background: active ? 'var(--accent-glow)' : 'rgba(255,255,255,0.03)', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'var(--transition)' }}>
                              {sk.name}{active ? <X size={12} /> : <Plus size={12} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                  <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ padding: '0.85rem 2.5rem' }}>
                    {submitting ? <><Loader className="spinner" size={18} /> Publishing...</> : 'Publish Job Listing'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </ClientLayout>
  );
};
