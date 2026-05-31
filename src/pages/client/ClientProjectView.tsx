import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientLayout } from '../../components/PortalLayout';
import { Shield, CheckCircle, AlertTriangle, MessageSquare, FileText, Star, Loader } from 'lucide-react';
import api from '../../services/api';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { getMilestoneStatusBadge, getMilestoneStatusText, isMilestoneCompleted } from '../../utils/statusMappers';
import { formatCurrency } from '../../utils/formatters';

interface Deliverable { id: string; milestoneId: string; notes: string; fileUrl?: string; createdAt: string; }
interface Milestone { id: string; title: string; description?: string; amount: number; dueDays: number; status: string; deliverable?: Deliverable; }
interface ProjectDetail { id: string; title: string; expertId: string; expertName: string; status: string; budget: number; milestones: Milestone[]; }

export const ClientProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeMilestoneId, setDisputeMilestoneId] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{ type: 'fund' | 'approve'; milestoneId: string } | null>(null);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch {
      setProject({
        id, title: 'Build AI Product UI/UX Interface Redesign',
        expertId: 'exp-alice', expertName: 'Alice Design',
        status: 'ACTIVE', budget: 950,
        milestones: [
          { id: 'm-1', title: 'Figma prototypes and micro-animations curves definition', description: 'Define exact schemas and establish responsive Figma templates', amount: 350, dueDays: 4, status: 'APPROVED', deliverable: { id: 'del-1', milestoneId: 'm-1', notes: 'Prototypes completed.', fileUrl: 'https://figma.com/file/mock-blueprint', createdAt: new Date().toISOString() } },
          { id: 'm-2', title: 'Responsive CSS layout coding & React injection', description: 'Implement core functionality', amount: 600, dueDays: 6, status: 'SUBMITTED', deliverable: { id: 'del-2', milestoneId: 'm-2', notes: 'React glassmorphic files generated.', fileUrl: 'https://github.com/mock-repo/pull/1', createdAt: new Date().toISOString() } },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjectDetails(); }, [id]);

  const handleFundMilestone = async (milestoneId: string) => {
    setFundingId(milestoneId);
    try {
      await api.put(`/milestones/${milestoneId}/fund`);
      await fetchProjectDetails();
      showToast('success', 'Milestone funded successfully! Escrow locked.');
    } catch (err: any) {
      showToast('error', err?.message || 'Funding failed. Ensure sufficient AICOIN balance.');
    } finally {
      setFundingId(null);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    setApprovingId(milestoneId);
    try {
      await api.put(`/milestones/${milestoneId}/approve`);
      await fetchProjectDetails();
      showToast('success', 'Milestone approved! Escrow released to expert.');
      const remaining = project?.milestones.filter(m => m.id !== milestoneId && !isMilestoneCompleted(m.status));
      if (remaining && remaining.length === 0) setShowRatingModal(true);
    } catch (err: any) {
      showToast('error', err?.message || 'Approval failed.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeMilestoneId || !disputeReason) return;
    setDisputeLoading(true);
    try {
      await api.post('/disputes', { milestoneId: disputeMilestoneId, reason: disputeReason, description: disputeDesc || undefined });
      setShowDisputeModal(false);
      await fetchProjectDetails();
      showToast('success', 'Dispute opened. Admin will review the case.');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to open dispute.');
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setRatingLoading(true);
    try {
      await api.post('/reviews', {
        projectId: project.id,
        expertId: project.expertId,
        rating: ratingScore,
        comment: reviewComment || undefined,
      });
      setShowRatingModal(false);
      showToast('success', 'Review submitted. Thank you!');
      navigate('/client/dashboard');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to submit review.');
      setShowRatingModal(false);
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <ClientLayout>
      {loading || !project ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Header */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span className="badge badge-warning" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>Active Workspace</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.title}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Expert Contractor: <strong>{project.expertName}</strong> • Budget: {formatCurrency(project.budget)}
              </p>
            </div>
            <button onClick={() => navigate('/chat')} className="btn btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
              Open Live Chat <MessageSquare size={16} />
            </button>
          </div>

          {/* Milestones Timeline */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Milestone Escrow Checkpoints</h3>
            <div className="timeline-container">
              {project.milestones.map((ms, index) => (
                <div key={ms.id} className={`timeline-node ${isMilestoneCompleted(ms.status) ? 'completed' : ms.status === '6' || String(ms.status).toUpperCase() === 'DISPUTED' ? 'disputed' : 'active'}`}>
                  <div className="glass-panel" style={{ marginLeft: '1rem', padding: '1.5rem 2rem', borderLeft: isMilestoneCompleted(ms.status) ? '4px solid var(--success)' : ms.status === '6' || String(ms.status).toUpperCase() === 'DISPUTED' ? '4px solid var(--danger)' : ms.status === '3' || String(ms.status).toUpperCase() === 'SUBMITTED' ? '4px solid var(--warning)' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Checkpoint {index + 1}: {ms.title}</h4>
                        {ms.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{ms.description}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge ${getMilestoneStatusBadge(ms.status)}`}>{getMilestoneStatusText(ms.status)}</span>
                        <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>{formatCurrency(ms.amount)}</span>
                      </div>
                    </div>

                    {ms.deliverable && (
                      <div style={{ background: 'hsla(222,47%,5%,0.3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', margin: '1.25rem 0', fontSize: '0.9rem' }}>
                        <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FileText size={14} /> Deliverable Submission Notes
                        </h5>
                        <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>{ms.deliverable.notes}</p>
                        {ms.deliverable.fileUrl && (
                          <a href={ms.deliverable.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}>
                            Open Attachment
                          </a>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      {(ms.status === '0' || String(ms.status).toUpperCase() === 'CREATED') && (
                        <button onClick={() => setConfirmAction({ type: 'fund', milestoneId: ms.id })} disabled={fundingId !== null} className="btn btn-primary btn-sm">
                          {fundingId === ms.id ? <><Loader size={14} className="spinner" /> Locking...</> : <><Shield size={14} /> Lock Escrow Fund</>}
                        </button>
                      )}
                      {(ms.status === '3' || String(ms.status).toUpperCase() === 'SUBMITTED') && (
                        <>
                          <button onClick={() => { setDisputeMilestoneId(ms.id); setDisputeReason('Deliverable unsatisfactory or delayed'); setDisputeDesc(''); setShowDisputeModal(true); }} className="btn btn-outline-danger btn-sm">
                            <AlertTriangle size={14} /> Dispute
                          </button>
                          <button onClick={() => setConfirmAction({ type: 'approve', milestoneId: ms.id })} disabled={approvingId !== null} className="btn btn-success btn-sm">
                            {approvingId === ms.id ? <><Loader size={14} className="spinner" /> Releasing...</> : <><CheckCircle size={14} /> Approve & Release</>}
                          </button>
                        </>
                      )}
                      {isMilestoneCompleted(ms.status) && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} /> Funds Transferred
                        </span>
                      )}
                      {(ms.status === '6' || String(ms.status).toUpperCase() === 'DISPUTED') && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={14} /> Awaiting Admin Arbitration
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispute Modal */}
          {showDisputeModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <form onSubmit={handleCreateDispute} className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                  <AlertTriangle size={20} /> Open Dispute Campaign
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Escalates to admin arbitration. Funds remain locked.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="input-label">Dispute Reason *</label>
                    <select className="input-field" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} required>
                      <option value="Deliverable unsatisfactory or delayed">Deliverable unsatisfactory or delayed</option>
                      <option value="Expert unresponsive or inactive">Expert unresponsive or inactive</option>
                      <option value="Unreasonable extra fees demanded">Unreasonable extra fees demanded</option>
                      <option value="Scope mismatch or incorrect delivery">Scope mismatch or incorrect delivery</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Describe Case & Evidence *</label>
                    <textarea className="input-field" rows={4} placeholder="Explain details..." value={disputeDesc} onChange={(e) => setDisputeDesc(e.target.value)} required />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowDisputeModal(false)} className="btn btn-secondary" disabled={disputeLoading}>Cancel</button>
                  <button type="submit" className="btn btn-danger" disabled={disputeLoading}>
                    {disputeLoading ? <Loader size={16} className="spinner" /> : 'Launch Escalation'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rating Modal */}
          {showRatingModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <form onSubmit={handleCreateReview} className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                  <Star size={20} color="var(--warning)" /> Rate Your Experience
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Leave a review for {project.expertName}.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Overall Expert Rating</div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={32} onClick={() => setRatingScore(star)}
                          style={{ cursor: 'pointer', fill: star <= ratingScore ? 'var(--warning)' : 'none', color: 'var(--warning)', transition: 'var(--transition)' }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Written Feedback *</label>
                    <textarea className="input-field" rows={4} placeholder="Excellent communication, clean delivery..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} required />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowRatingModal(false)} className="btn btn-secondary" disabled={ratingLoading}>Skip</button>
                  <button type="submit" className="btn btn-primary" disabled={ratingLoading}>
                    {ratingLoading ? <Loader size={16} className="spinner" /> : 'Submit Rating'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Confirm Dialog */}
          <ConfirmDialog
            isOpen={confirmAction !== null}
            title={confirmAction?.type === 'fund' ? 'Fund Milestone?' : 'Approve Milestone?'}
            message={
              confirmAction?.type === 'fund'
                ? 'This will lock funds from your wallet into escrow. You can cancel before the expert submits work.'
                : 'This will release escrow funds to the expert. Ensure you are satisfied with the deliverable.'
            }
            confirmLabel={confirmAction?.type === 'fund' ? 'Fund' : 'Approve & Release'}
            variant={confirmAction?.type === 'fund' ? 'info' : 'warning'}
            onConfirm={() => {
              if (confirmAction?.type === 'fund') handleFundMilestone(confirmAction.milestoneId);
              else if (confirmAction?.type === 'approve') handleApproveMilestone(confirmAction.milestoneId);
              setConfirmAction(null);
            }}
            onCancel={() => setConfirmAction(null)}
          />
        </div>
      )}
    </ClientLayout>
  );
};
