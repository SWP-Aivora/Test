import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExpertLayout } from '../../components/PortalLayout';
import { useToast } from '../../context/ToastContext';
import { ShieldAlert, CheckCircle2, AlertCircle, FileText, Send, MessageSquare, Loader } from 'lucide-react';
import api from '../../services/api';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { getMilestoneStatusBadge, getMilestoneStatusText, isMilestoneCompleted } from '../../utils/statusMappers';
import { formatCurrency } from '../../utils/formatters';

interface Deliverable { id: string; notes: string; fileUrl?: string; createdAt: string; }
interface Milestone { id: string; title: string; description?: string; amount: number; dueDays: number; status: string; deliverable?: Deliverable; }
interface ProjectDetail { id: string; title: string; clientId: string; clientName: string; status: string; budget: number; milestones: Milestone[]; }

export const ExpertProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitMilestoneId, setSubmitMilestoneId] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [submittingWork, setSubmittingWork] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const fetchProject = async () => {
    if (!id) return;
    try { const res = await api.get(`/projects/${id}`); setProject(res.data); }
    catch {
      setProject({
        id, title: 'Build AI Product UI/UX', clientId: 'cl-google', clientName: 'Google DevTeam',
        status: 'ACTIVE', budget: 950,
        milestones: [
          { id: 'm-1', title: 'Figma prototypes', amount: 350, dueDays: 4, status: 'APPROVED', deliverable: { id: 'del-1', notes: 'Done.', fileUrl: 'https://figma.com/mock', createdAt: new Date().toISOString() } },
          { id: 'm-2', title: 'Responsive CSS layout coding', amount: 600, dueDays: 6, status: 'FUNDED' },
        ],
      });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const triggerSubmitModal = (milestoneId: string) => {
    setSubmitMilestoneId(milestoneId);
    setSubmitNotes('');
    setSubmitFileUrl('https://github.com/mock-repo/pull/1');
    setShowSubmitModal(true);
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitMilestoneId || !submitNotes) return;
    setSubmittingWork(true);
    try {
      await api.post(`/milestones/${submitMilestoneId}/deliverables`, {
        milestoneId: submitMilestoneId,
        notes: submitNotes,
        fileUrl: submitFileUrl || undefined,
      });
      setShowSubmitModal(false);
      await fetchProject();
      showToast('success', 'Deliverable submitted! Awaiting client review.');
    } catch (err: any) { showToast('error', err?.message || 'Submission failed.'); }
    finally { setSubmittingWork(false); }
  };

  return (
    <ExpertLayout>
      {loading || !project ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>Active Workstation</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.title}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Client: <strong>{project.clientName}</strong> • Budget: {formatCurrency(project.budget)}</p>
            </div>
            <button onClick={() => navigate('/chat')} className="btn btn-primary" style={{ padding: '0.6rem 1.4rem' }}>Open Chat <MessageSquare size={16} /></button>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Contract Checkpoints</h3>
            <div className="timeline-container">
              {project.milestones.map((ms, index) => (
                <div key={ms.id} className={`timeline-node ${isMilestoneCompleted(ms.status) ? 'completed' : ms.status === '6' || String(ms.status).toUpperCase() === 'DISPUTED' ? 'disputed' : 'active'}`}>
                  <div className="glass-panel" style={{ marginLeft: '1rem', padding: '1.5rem 2rem', borderLeft: isMilestoneCompleted(ms.status) ? '4px solid var(--success)' : ms.status === '3' || String(ms.status).toUpperCase() === 'SUBMITTED' ? '4px solid var(--warning)' : ms.status === '6' || String(ms.status).toUpperCase() === 'DISPUTED' ? '4px solid var(--danger)' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Checkpoint {index + 1}: {ms.title}</h4>
                        {ms.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{ms.description}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge ${getMilestoneStatusBadge(ms.status)}`}>{getMilestoneStatusText(ms.status)}</span>
                        <span className="badge badge-success">{formatCurrency(ms.amount)}</span>
                      </div>
                    </div>
                    {ms.deliverable && (
                      <div style={{ background: 'hsla(222,47%,5%,0.3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', margin: '1.25rem 0', fontSize: '0.9rem' }}>
                        <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FileText size={14} /> Your Submission</h5>
                        <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>{ms.deliverable.notes}</p>
                        {ms.deliverable.fileUrl && <a href={ms.deliverable.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}>Open Attachment</a>}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      {(ms.status === '0' || String(ms.status).toUpperCase() === 'CREATED') && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={14} /> Awaiting client funding</span>
                      )}
                      {(ms.status === '1' || String(ms.status).toUpperCase() === 'FUNDED' || ms.status === '2' || String(ms.status).toUpperCase() === 'IN_PROGRESS') && (
                        <button onClick={() => triggerSubmitModal(ms.id)} className="btn btn-primary btn-sm">Submit Work <Send size={14} /></button>
                      )}
                      {(ms.status === '3' || String(ms.status).toUpperCase() === 'SUBMITTED') && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={14} /> Awaiting Client Review</span>
                      )}
                      {isMilestoneCompleted(ms.status) && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={14} /> Paid!</span>
                      )}
                      {(ms.status === '6' || String(ms.status).toUpperCase() === 'DISPUTED') && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ShieldAlert size={14} /> Under Dispute</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showSubmitModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <form onSubmit={handleSubmitDeliverable} className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}><Send size={20} /> Submit Deliverable</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Provide completion notes and files.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="input-label">Completion Notes *</label>
                    <textarea className="input-field" rows={4} placeholder="Describe what was done..." value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} required disabled={submittingWork} />
                  </div>
                  <div>
                    <label className="input-label">File URL (Optional)</label>
                    <input type="url" className="input-field" placeholder="https://github.com/..." value={submitFileUrl} onChange={(e) => setSubmitFileUrl(e.target.value)} disabled={submittingWork} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowSubmitModal(false)} className="btn btn-secondary" disabled={submittingWork}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingWork || !submitNotes}>
                    {submittingWork ? <Loader size={16} className="spinner" /> : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <ConfirmDialog isOpen={confirmSubmit} title="Submit Deliverable?" message="This will notify the client for review. You can't edit after submission." variant="info" confirmLabel="Submit" onConfirm={() => { setConfirmSubmit(false); }} onCancel={() => setConfirmSubmit(false)} />
        </div>
      )}
    </ExpertLayout>
  );
};
