import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientLayout } from '../../components/PortalLayout';
import { Sparkles, Bot, AlertTriangle, HelpCircle, Check, FileText, ArrowLeft, ArrowRight, DollarSign, Calendar, Loader, Plus, X } from 'lucide-react';
import api from '../../services/api';

interface Category {
  id: string;
  name: string;
}

interface Skill {
  id: string;
  name: string;
  categoryId: string;
}

interface SuggestedMilestone {
  title: string;
  description?: string;
  amount: number;
  dueDays: number;
  acceptanceCriteria?: string;
}

interface AISuggestion {
  id: string;
  rawInput: string;
  suggestedTitle?: string;
  suggestedDescription?: string;
  suggestedBudgetMin?: number;
  suggestedBudgetMax?: number;
  suggestedTimelineDays?: number;
  suggestedSkills: string[];
  suggestedMilestones: SuggestedMilestone[];
  clarifyingQuestions: string[];
  riskWarnings: string[];
}

export const JobCreateWizard: React.FC = () => {
  const navigate = useNavigate();
  
  // App Config & Taxonomy State
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  // Workflow Mode: 'AI' or 'MANUAL'
  const [mode, setMode] = useState<'AI' | 'MANUAL'>('AI');
  const [wizardStep, setWizardStep] = useState<number>(1); // 1: Input, 2: Suggestion Review, 3: Skill Mapping & Accept

  // --- MANUAL FORM STATE ---
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualBudgetType, setManualBudgetType] = useState<number>(0); // 0: FIXED, 1: HOURLY
  const [manualBudgetMin, setManualBudgetMin] = useState<number>(100);
  const [manualBudgetMax, setManualBudgetMax] = useState<number>(500);
  const [manualTimeline, setManualTimeline] = useState<number>(14);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // --- AI ASSISTANT STATE ---
  const [rawInput, setRawInput] = useState('');
  const [businessDomain, setBusinessDomain] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [aiBudgetMin, setAiBudgetMin] = useState<string>('');
  const [aiBudgetMax, setAiBudgetMax] = useState<string>('');
  const [aiTimeline, setAiTimeline] = useState<string>('');
  
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

  // --- ACCEPTANCE STATE ---
  const [acceptCategory, setAcceptCategory] = useState('');
  const [acceptSkills, setAcceptSkills] = useState<string[]>([]);
  const [accepting, setAccepting] = useState(false);

  // Load Categories & Skills
  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const catRes = await api.get('/categories');
        const catList = catRes.data || [];
        
        const skillRes = await api.get('/skills');
        const skillList = skillRes.data || [];

        if (catList.length === 0 || skillList.length === 0) {
          throw new Error('Database taxonomy is empty, falling back to mock taxonomy');
        }

        setCategories(catList);
        setSkills(skillList);
      } catch (err) {
        console.warn('[JobWizard] Failed to load taxonomy, fallback mock loading:', err);
        setCategories([
          { id: 'c1', name: 'Software Development' },
          { id: 'c2', name: 'Design & Creative' },
          { id: 'c3', name: 'Writing & Translation' },
        ]);
        setSkills([
          { id: 's1', name: 'React', categoryId: 'c1' },
          { id: 's2', name: 'NodeJS', categoryId: 'c1' },
          { id: 's3', name: 'Figma', categoryId: 'c2' },
          { id: 's4', name: 'UI/UX', categoryId: 'c2' },
        ]);
      } finally {
        setLoadingTaxonomy(false);
      }
    };
    loadTaxonomy();
  }, []);

  // Filter skills based on chosen category
  const getFilteredSkills = (categoryId: string) => {
    return skills.filter(s => s.categoryId === categoryId);
  };

  // Submit standard manual job post
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualDesc || !manualCategory) return;
    
    setSubmitting(true);
    try {
      const payload = {
        title: manualTitle,
        originalDescription: manualDesc,
        finalDescription: manualDesc,
        categoryId: manualCategory,
        budgetType: Number(manualBudgetType),
        budgetMin: Number(manualBudgetMin),
        budgetMax: Number(manualBudgetMax),
        timelineDays: Number(manualTimeline),
        deadline: new Date(Date.now() + Number(manualTimeline) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        experienceLevel: 1, // Intermediate
        visibility: 0, // Public
        skillIds: selectedSkills
      };

      const response = await api.post('/jobs', payload);
      // Publish draft immediately to open job board
      await api.post(`/jobs/${response.data.id}/publish`);
      
      navigate(`/client/jobs/${response.data.id}`);
    } catch (err) {
      console.error('[JobWizard] Standard submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Call AI Assistant endpoint to generate suggestions
  const handleAIGenerate = async () => {
    if (!rawInput) return;
    setAiGenerating(true);
    try {
      const payload = {
        rawInput,
        businessDomain: businessDomain || undefined,
        expectedOutcome: expectedOutcome || undefined,
        budgetMin: aiBudgetMin ? Number(aiBudgetMin) : undefined,
        budgetMax: aiBudgetMax ? Number(aiBudgetMax) : undefined,
        timelineDays: aiTimeline ? Number(aiTimeline) : undefined,
      };

      const response = await api.post('/ai/job-assistant', payload);
      
      // Load response suggestions
      const data = response.data as AISuggestion;
      setAiSuggestion(data);
      
      // Auto pre-fill active mapping properties
      if (categories.length > 0) setAcceptCategory(categories[0].id);

      setWizardStep(2); // Jump to review sheet
    } catch (err) {
      console.warn('[JobWizard] AI Generation error, fallback mock UI:', err);
      // Visual Fallback
      setAiSuggestion({
        id: 'mock-suggestion-uuid',
        rawInput,
        suggestedTitle: `Custom Engineered Software: ${rawInput.substring(0, 30)}...`,
        suggestedDescription: `POLISHED BY AIVORA AI:\nWe are looking to develop a secure, highly-performant software product based on the requirements: "${rawInput}". The product must satisfy all target deliverables in high standard.`,
        suggestedBudgetMin: aiBudgetMin ? Number(aiBudgetMin) : 800,
        suggestedBudgetMax: aiBudgetMax ? Number(aiBudgetMax) : 1800,
        suggestedTimelineDays: aiTimeline ? Number(aiTimeline) : 21,
        suggestedSkills: ['React', 'TypeScript', 'Escrow Security'],
        suggestedMilestones: [
          {
            title: 'Design System & API Architecture',
            description: 'Define exact schemas and establish responsive Figma templates',
            amount: aiBudgetMin ? Number(aiBudgetMin) * 0.4 : 350,
            dueDays: 7,
            acceptanceCriteria: 'Clean designs and schema files exported'
          },
          {
            title: 'Full Stack Logic & Delivery',
            description: 'Implement core functionality, user authentications, and run integrations',
            amount: aiBudgetMin ? Number(aiBudgetMin) * 0.6 : 650,
            dueDays: 14,
            acceptanceCriteria: 'Complete logic runs cleanly and successfully compiled'
          }
        ],
        clarifyingQuestions: [
          'What external authentication providers do you plan to use (Google, Apple, OAuth)?',
          'Do we require multitenant billing configurations at this stage?'
        ],
        riskWarnings: [
          'Integrating escrow APIs might introduce sandbox-to-production latency delays.',
          'Shorter timeline requires fast review loops on deliverables.'
        ]
      });
      if (categories.length > 0) setAcceptCategory(categories[0].id);
      setWizardStep(2);
    } finally {
      setAiGenerating(false);
    }
  };

  // Reject Suggestion (goes back to prompt refinement)
  const handleAIReject = async () => {
    if (!aiSuggestion) return;
    try {
      // Soft register rejection reason in the backend
      await api.post(`/ai/job-assistant/${aiSuggestion.id}/reject`, { reason: 'User requested refinement' });
    } catch (err) {
      console.warn('[JobWizard] Rejection log ignored:', err);
    }
    setAiSuggestion(null);
    setWizardStep(1);
  };

  // Finalize Category and Skills mapping, then Accept and publish Draft
  const handleAIAccept = async () => {
    if (!aiSuggestion) return;
    setAccepting(true);
    try {
      // 1. Accept backend AI suggestion which outputs a Draft Job
      const response = await api.post(`/ai/job-assistant/${aiSuggestion.id}/accept`, {
        categoryId: acceptCategory || undefined,
        selectedSkillIds: acceptSkills.length > 0 ? acceptSkills : undefined
      });

      // Response contains actual Job Post details
      const spawnedJob = response.data.job;

      // 2. Automatically publish draft to make it live
      await api.post(`/jobs/${spawnedJob.id}/publish`);
      
      navigate(`/client/jobs/${spawnedJob.id}`);
    } catch (err) {
      console.error('[JobWizard] Accepting AI suggestion failed:', err);
      // Fallback redirect mock
      navigate('/client/dashboard');
    } finally {
      setAccepting(false);
    }
  };

  const handleToggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const handleToggleAcceptSkill = (skillId: string) => {
    if (acceptSkills.includes(skillId)) {
      setAcceptSkills(acceptSkills.filter(id => id !== skillId));
    } else {
      setAcceptSkills([...acceptSkills, skillId]);
    }
  };

  return (
    <ClientLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
        
        {/* Step headers / Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className="section-title">Create a New Job Post</h2>
            <p className="section-desc">Choose between a manual structured form or hiring with AI Orchestration assistance.</p>
          </div>

          {wizardStep === 1 && (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.25rem',
              display: 'flex'
            }}>
              <button
                onClick={() => setMode('AI')}
                className={`btn ${mode === 'AI' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', border: 'none', borderRadius: '6px' }}
              >
                <Bot size={16} /> Use AI Orchestrator
              </button>
              <button
                onClick={() => setMode('MANUAL')}
                className={`btn ${mode === 'MANUAL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', border: 'none', borderRadius: '6px' }}
              >
                <FileText size={16} /> Manual Form
              </button>
            </div>
          )}
        </div>

        {loadingTaxonomy ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* ==========================================
                AI ORCHESTRATION WIZARD: STEP 1 (INPUTS)
                ========================================== */}
            {mode === 'AI' && wizardStep === 1 && (
              <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent)' }}>
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Aivora AI Task Planner</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Provide your raw guidelines, and watch the AI coordinate your scope</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label className="input-label">Describe your project requirements (Raw Input) *</label>
                    <textarea
                      className="input-field"
                      rows={5}
                      placeholder="e.g., I need a freelance developer to construct a beautiful NextJS landing page with dark mode aesthetics and lock it with Firebase authentication."
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label className="input-label">Business Domain (Optional)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., E-commerce, Fintech, Healthcare"
                        value={businessDomain}
                        onChange={(e) => setBusinessDomain(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="input-label">Expected Core Outcomes (Optional)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., High SEO ranking, rapid checkout flow"
                        value={expectedOutcome}
                        onChange={(e) => setExpectedOutcome(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label className="input-label">Target Min Budget ($) (Optional)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Min coins"
                        value={aiBudgetMin}
                        onChange={(e) => setAiBudgetMin(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="input-label">Target Max Budget ($) (Optional)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Max coins"
                        value={aiBudgetMax}
                        onChange={(e) => setAiBudgetMax(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="input-label">Target Timeline (Days) (Optional)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="e.g., 14"
                        value={aiTimeline}
                        onChange={(e) => setAiTimeline(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                  <button
                    onClick={handleAIGenerate}
                    disabled={aiGenerating || !rawInput}
                    className="btn btn-primary btn-lg"
                    style={{ padding: '0.85rem 2.5rem' }}
                  >
                    {aiGenerating ? (
                      <>
                        <Loader className="spinner" size={18} style={{ animationDuration: '0.8s' }} /> Generating Solution Blueprint...
                      </>
                    ) : (
                      <>
                        Create with AI Orchestrator <Sparkles size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ==========================================
                AI ORCHESTRATION WIZARD: STEP 2 (AI SHEET REVIEW)
                ========================================== */}
            {mode === 'AI' && wizardStep === 2 && aiSuggestion && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass-panel glow-panel-indigo" style={{ padding: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                      <div className="badge badge-primary glow-text" style={{ marginBottom: '0.5rem' }}>
                        <Bot size={12} style={{ marginRight: '2px' }} /> AI Generation Summary
                      </div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{aiSuggestion.suggestedTitle}</h3>
                    </div>
                    <button onClick={handleAIReject} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                      <ArrowLeft size={16} /> Refine Prompt
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Suggested Description */}
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={16} color="var(--accent)" /> AI Polished Description
                      </h4>
                      <div style={{
                        background: 'hsla(222, 47%, 5%, 0.4)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1.25rem',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        color: 'var(--text-primary)'
                      }}>
                        {aiSuggestion.suggestedDescription}
                      </div>
                    </div>

                    {/* Estimates Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                        <DollarSign size={24} color="var(--success)" />
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Suggested Escrow Budget</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                            ${aiSuggestion.suggestedBudgetMin} - ${aiSuggestion.suggestedBudgetMax} AICOIN
                          </div>
                        </div>
                      </div>

                      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                        <Calendar size={24} color="var(--warning)" />
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Suggested Completion Limit</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                            {aiSuggestion.suggestedTimelineDays} Days
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Schedules */}
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Suggested Escrow Milestones</h4>
                      <div className="timeline-container">
                        {aiSuggestion.suggestedMilestones.map((ms, index) => (
                          <div key={index} className="timeline-node active">
                            <div className="glass-card" style={{ marginLeft: '0.5rem', padding: '1.25rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h5 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                                  Milestone {index + 1}: {ms.title}
                                </h5>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <span className="badge badge-success">${ms.amount} AICOIN</span>
                                  <span className="badge badge-muted">{ms.dueDays} Days</span>
                                </div>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                                {ms.description}
                              </p>
                              {ms.acceptanceCriteria && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderLeft: '2px solid var(--accent)', paddingLeft: '0.5rem', marginTop: '0.4rem' }}>
                                  <strong>Acceptance Criteria:</strong> {ms.acceptanceCriteria}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risks and Clarifying Warnings */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                      {aiSuggestion.riskWarnings.length > 0 && (
                        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(346, 84%, 61%, 0.2)', background: 'rgba(346, 84%, 61%, 0.03)' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <AlertTriangle size={16} /> AI Assessed Risk Warnings
                          </h4>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {aiSuggestion.riskWarnings.map((risk, i) => (
                              <li key={i}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiSuggestion.clarifyingQuestions.length > 0 && (
                        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(250, 89%, 65%, 0.2)', background: 'rgba(250, 89%, 65%, 0.03)' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <HelpCircle size={16} /> Clarifying Questions
                          </h4>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {aiSuggestion.clarifyingQuestions.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Accept action footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '2rem' }}>
                    <button onClick={handleAIReject} className="btn btn-secondary">
                      Reject & Redraft
                    </button>
                    <button onClick={() => setWizardStep(3)} className="btn btn-primary btn-lg">
                      Proceed to Category Mapping <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                AI ORCHESTRATION WIZARD: STEP 3 (CATEGORY MAPPING & CONFIRM)
                ========================================== */}
            {mode === 'AI' && wizardStep === 3 && aiSuggestion && (
              <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent)' }}>
                    <Check size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Finalize Taxonomy Mapping</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Map the AI-generated task to standard platform categories and skills</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label className="input-label">Project Core Category *</label>
                    <select
                      className="input-field"
                      value={acceptCategory}
                      onChange={(e) => {
                        setAcceptCategory(e.target.value);
                        setAcceptSkills([]); // Reset skills on change
                      }}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Match Project Skill Tags</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      AI suggested tags: {aiSuggestion.suggestedSkills.join(', ')}. Select corresponding tags below to trigger perfect expert matches.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {getFilteredSkills(acceptCategory).map((sk) => {
                        const active = acceptSkills.includes(sk.id);
                        return (
                          <div
                            key={sk.id}
                            onClick={() => handleToggleAcceptSkill(sk.id)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: '8px',
                              border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                              background: active ? 'var(--accent-glow)' : 'rgba(255,255,255,0.03)',
                              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'var(--transition)'
                            }}
                          >
                            {sk.name}
                            {active ? <X size={12} /> : <Plus size={12} />}
                          </div>
                        );
                      })}
                      {getFilteredSkills(acceptCategory).length === 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No specific skill badges configured for this category.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                  <button onClick={() => setWizardStep(2)} className="btn btn-secondary">
                    <ArrowLeft size={16} /> Back to Blueprint
                  </button>
                  <button
                    onClick={handleAIAccept}
                    disabled={accepting}
                    className="btn btn-primary btn-lg"
                    style={{ padding: '0.85rem 2.5rem' }}
                  >
                    {accepting ? (
                      <>
                        <Loader className="spinner" size={18} /> Instantiating Escrow Post...
                      </>
                    ) : (
                      <>
                        Approve and Publish Post <Check size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ==========================================
                STANDARD MANUAL POST FORM WORKFLOW
                ========================================== */}
            {mode === 'MANUAL' && (
              <form onSubmit={handleManualSubmit} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Standard Job Builder</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manually structure your scope details, parameters, and deliverables</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label className="input-label" htmlFor="manual-title-input">Job Campaign Title *</label>
                    <input
                      id="manual-title-input"
                      type="text"
                      className="input-field"
                      placeholder="e.g., React Frontend developer for Escrow system dashboard"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="input-label" htmlFor="manual-desc-input">Scope Specifications & Deliverables *</label>
                    <textarea
                      id="manual-desc-input"
                      className="input-field"
                      rows={6}
                      placeholder="Write your task overview, deliverables, timeline requirements, and expert expectations..."
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label className="input-label" htmlFor="manual-category-select">Job Category *</label>
                      <select
                        id="manual-category-select"
                        className="input-field"
                        value={manualCategory}
                        onChange={(e) => {
                          setManualCategory(e.target.value);
                          setSelectedSkills([]);
                        }}
                        required
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="input-label" htmlFor="manual-budget-type-select">Budget Type *</label>
                      <select
                        id="manual-budget-type-select"
                        className="input-field"
                        value={manualBudgetType}
                        onChange={(e) => setManualBudgetType(Number(e.target.value))}
                        required
                      >
                        <option value={0}>Fixed Price Escrow Contract</option>
                        <option value={1}>Hourly Billing Contract</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label className="input-label" htmlFor="manual-min-budget-input">Minimum Budget ($)</label>
                      <input
                        id="manual-min-budget-input"
                        type="number"
                        className="input-field"
                        value={manualBudgetMin}
                        onChange={(e) => setManualBudgetMin(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="input-label" htmlFor="manual-max-budget-input">Maximum Budget ($)</label>
                      <input
                        id="manual-max-budget-input"
                        type="number"
                        className="input-field"
                        value={manualBudgetMax}
                        onChange={(e) => setManualBudgetMax(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="input-label" htmlFor="manual-timeline-input">Timeline Days</label>
                      <input
                        id="manual-timeline-input"
                        type="number"
                        className="input-field"
                        value={manualTimeline}
                        onChange={(e) => setManualTimeline(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {manualCategory && (
                    <div>
                      <label className="input-label">Select Required Skills Tags</label>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {getFilteredSkills(manualCategory).map((sk) => {
                          const active = selectedSkills.includes(sk.id);
                          return (
                            <div
                              key={sk.id}
                              onClick={() => handleToggleSkill(sk.id)}
                              style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                                background: active ? 'var(--accent-glow)' : 'rgba(255,255,255,0.03)',
                                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                transition: 'var(--transition)'
                              }}
                            >
                              {sk.name}
                              {active ? <X size={12} /> : <Plus size={12} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary btn-lg"
                    style={{ padding: '0.85rem 2.5rem' }}
                  >
                    {submitting ? (
                      <>
                        <Loader className="spinner" size={18} /> Publishing Listings...
                      </>
                    ) : (
                      'Publish Job Listing'
                    )}
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
