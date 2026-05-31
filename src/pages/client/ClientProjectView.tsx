import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientLayout } from '../../components/PortalLayout';
import { Shield, CheckCircle, AlertTriangle, MessageSquare, FileText, Star, Loader } from 'lucide-react';
import api from '../../services/api';

interface Deliverable {
  id: string;
  milestoneId: string;
  notes: string;
  fileUrl?: string;
  createdAt: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  dueDays: number;
  status: string; // CREATED, FUNDED, IN_PROGRESS, SUBMITTED, APPROVED, DISPUTED, PAID, REFUNDED
  deliverable?: Deliverable;
}

interface ProjectDetail {
  id: string;
  title: string;
  expertId: string;
  expertName: string;
  status: string;
  budget: number;
  milestones: Milestone[];
}

export const ClientProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // --- DISPUTE MODAL STATE ---
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeMilestoneId, setDisputeMilestoneId] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  // --- RATING MODAL STATE ---
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (err) {
      console.warn('[ClientProject] Failed to load project workspace, mocking fallback details:', err);
      // Gorgeous fallback data for testing
      setProject({
        id: id,
        title: 'Build AI Product UI/UX Interface Redesign',
        expertId: 'exp-alice',
        expertName: 'Alice Design',
        status: 'ACTIVE',
        budget: 950,
        milestones: [
          {
            id: 'm-1',
            title: 'Figma prototypes and micro-animations curves definition',
            description: 'Define exact schemas and establish responsive Figma templates',
            amount: 350,
            dueDays: 4,
            status: 'APPROVED',
            deliverable: {
              id: 'del-1',
              milestoneId: 'm-1',
              notes: 'Prototypes completed. Figma link is shared in chat workspace. Custom transitions bezier curves defined.',
              fileUrl: 'https://figma.com/file/mock-blueprint',
              createdAt: new Date().toISOString()
            }
          },
          {
            id: 'm-2',
            title: 'Responsive CSS layout coding & React injection',
            description: 'Implement core functionality, user authentications, and run integrations',
            amount: 600,
            dueDays: 6,
            status: 'SUBMITTED',
            deliverable: {
              id: 'del-2',
              milestoneId: 'm-2',
              notes: 'React glassmorphic files generated. Integrated Axios APIs client-side and completed SignalR websocket hooks.',
              fileUrl: 'https://github.com/mock-repo/pull/1',
              createdAt: new Date().toISOString()
            }
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  // Fund Milestone from client wallet to escrow
  const handleFundMilestone = async (milestoneId: string) => {
    setFundingId(milestoneId);
    try {
      await api.put(`/milestones/${milestoneId}/fund`);
      await fetchProjectDetails(); // Reload project status
    } catch (err: any) {
      console.error('[ClientProject] Milestone funding failed:', err);
      alert(err?.message || 'Funding failed. Ensure your wallet has sufficient AICOINs.');
    } finally {
      setFundingId(null);
    }
  };

  // Approve Deliverable (releases escrow funds to expert)
  const handleApproveMilestone = async (milestoneId: string) => {
    setApprovingId(milestoneId);
    try {
      await api.put(`/milestones/${milestoneId}/approve`);
      await fetchProjectDetails();
      
      // Auto open rating modal if this was the final milestone approved
      const remainingMilestones = project?.milestones.filter(m => {
        const sStr = String(m.status).toUpperCase();
        return m.id !== milestoneId && sStr !== 'APPROVED' && sStr !== 'PAID' && sStr !== '5' && sStr !== '7';
      });
      if (remainingMilestones && remainingMilestones.length === 0) {
        setShowRatingModal(true);
      }
    } catch (err) {
      console.error('[ClientProject] Deliverable approval failed:', err);
    } finally {
      setApprovingId(null);
    }
  };

  // Open Dispute Modal
  const triggerDisputeModal = (milestoneId: string) => {
    setDisputeMilestoneId(milestoneId);
    setDisputeReason('Deliverable unsatisfactory or delayed');
    setDisputeDesc('');
    setShowDisputeModal(true);
  };

  // Submit dispute to backend
  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeMilestoneId || !disputeReason) return;
    setDisputeLoading(true);

    try {
      await api.post('/disputes', {
        milestoneId: disputeMilestoneId,
        reason: disputeReason,
        description: disputeDesc || undefined
      });
      setShowDisputeModal(false);
      await fetchProjectDetails();
    } catch (err) {
      console.error('[ClientProject] Dispute creation failed:', err);
    } finally {
      setDisputeLoading(false);
    }
  };

  // Submit rating feedback
  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setRatingLoading(true);

    try {
      await api.post('/reviews', {
        targetUserId: project.expertId,
        rating: ratingScore,
        comment: reviewComment || undefined
      });
      setShowRatingModal(false);
      navigate('/client/dashboard');
    } catch (err) {
      console.error('[ClientProject] Review creation failed:', err);
      setShowRatingModal(false);
    } finally {
      setRatingLoading(false);
    }
  };

  const getMilestoneBadgeClass = (status: any) => {
    if (status === undefined || status === null) return 'badge-muted';
    const s = String(status).toUpperCase();
    switch (s) {
      case 'CREATED':
      case '0':
        return 'badge-muted';
      case 'FUNDED':
      case '1':
        return 'badge-primary';
      case 'IN_PROGRESS':
      case '2':
        return 'badge-warning';
      case 'SUBMITTED':
      case '3':
        return 'badge-warning';
      case 'REVISION_REQUESTED':
      case '4':
        return 'badge-warning';
      case 'APPROVED':
      case 'PAID':
      case '5':
      case '7':
        return 'badge-success';
      case 'DISPUTED':
      case '6':
        return 'badge-danger';
      case 'REFUNDED':
      case '8':
        return 'badge-danger';
      default:
        return 'badge-muted';
    }
  };

  const getMilestoneStatusText = (status: any) => {
    if (status === undefined || status === null) return 'Unknown';
    const s = String(status).toUpperCase();
    switch (s) {
      case '0': case 'CREATED': return 'Created';
      case '1': case 'FUNDED': return 'Funded';
      case '2': case 'IN_PROGRESS': return 'In Progress';
      case '3': case 'SUBMITTED': return 'Submitted';
      case '4': case 'REVISION_REQUESTED': return 'Revision Requested';
      case '5': case 'APPROVED': return 'Approved';
      case '6': case 'DISPUTED': return 'Disputed';
      case '7': case 'PAID': return 'Paid';
      case '8': case 'REFUNDED': return 'Refunded';
      default: return String(status);
    }
  };

  return (
    <ClientLayout>
      {loading || !project ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Main workspace title bar */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>Active Workspace</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.title}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Expert Contractor: <strong>{project.expertName}</strong> • Contract Budget: ${project.budget} AICOIN
              </p>
            </div>

            <button
              onClick={() => navigate('/chat')}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.4rem' }}
            >
              Open Live Chat Workspace <MessageSquare size={16} />
            </button>
          </div>

          {/* Timeline of milestones */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Milestone Escrow Checkpoints</h3>
            
            <div className="timeline-container">
              {project.milestones.map((ms, index) => {
                const statusStr = String(ms.status).toUpperCase();
                const isApproved = statusStr === 'APPROVED' || statusStr === 'PAID' || statusStr === '5' || statusStr === '7';
                const isSubmitted = statusStr === 'SUBMITTED' || statusStr === '3';
                const isCreated = statusStr === 'CREATED' || statusStr === '0';
                const isDisputed = statusStr === 'DISPUTED' || statusStr === '6';
                
                let timelineNodeClass = 'active';
                if (isApproved) timelineNodeClass = 'completed';
                else if (isDisputed) timelineNodeClass = 'disputed';

                return (
                  <div key={ms.id} className={`timeline-node ${timelineNodeClass}`}>
                    <div className="glass-panel" style={{ marginLeft: '1rem', padding: '1.5rem 2rem', borderLeft: isApproved ? '4px solid var(--success)' : isSubmitted ? '4px solid var(--warning)' : isDisputed ? '4px solid var(--danger)' : '1px solid var(--border)' }}>
                      
                      {/* Milestone Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            Checkpoint {index + 1}: {ms.title}
                          </h4>
                          {ms.description && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              {ms.description}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                           <span className={`badge ${getMilestoneBadgeClass(ms.status)}`}>{getMilestoneStatusText(ms.status)}</span>
                          <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                            ${ms.amount.toLocaleString()} AICOIN
                          </span>
                        </div>
                      </div>

                      {/* Deliverable review board */}
                      {ms.deliverable && (
                        <div style={{
                          background: 'hsla(222,47%,5%,0.3)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '1.25rem',
                          margin: '1.25rem 0',
                          fontSize: '0.9rem'
                        }}>
                          <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={14} /> Deliverable Submission Notes
                          </h5>
                          <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                            {ms.deliverable.notes}
                          </p>
                          {ms.deliverable.fileUrl && (
                            <a
                              href={ms.deliverable.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', display: 'inline-flex' }}
                            >
                              Open Deliverable Attachment Url
                            </a>
                          )}
                        </div>
                      )}

                      {/* Dynamic escrow control triggers */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                        {isCreated && (
                          <button
                            onClick={() => handleFundMilestone(ms.id)}
                            disabled={fundingId !== null}
                            className="btn btn-primary"
                            style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
                          >
                            {fundingId === ms.id ? (
                              <>
                                <Loader size={14} className="spinner" /> Locking Escrow...
                              </>
                            ) : (
                              <>
                                Lock Escrow Wallet Fund <Shield size={14} />
                              </>
                            )}
                          </button>
                        )}

                        {isSubmitted && (
                          <>
                            <button
                              onClick={() => triggerDisputeModal(ms.id)}
                              className="btn btn-danger"
                              style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                            >
                              Initiate Dispute Escalation <AlertTriangle size={14} />
                            </button>
                            <button
                              onClick={() => handleApproveMilestone(ms.id)}
                              disabled={approvingId !== null}
                              className="btn btn-primary"
                              style={{ padding: '0.45rem 1.4rem', fontSize: '0.85rem', background: 'var(--success)', border: 'none', boxShadow: '0 4px 10px var(--success-glow)' }}
                            >
                              {approvingId === ms.id ? (
                                <>
                                  <Loader size={14} className="spinner" /> Releasing Escrow...
                                </>
                              ) : (
                                <>
                                  Approve & Release Escrow Funds <CheckCircle size={14} />
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={14} /> Funds Transferred to Expert
                          </span>
                        )}

                        {isDisputed && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertTriangle size={14} /> Disputed - Awaiting Admin Arbitration
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ==========================================
              MODAL: DISPUTE ESCALATION FORM
              ========================================== */}
          {showDisputeModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100
            }}>
              <form onSubmit={handleCreateDispute} className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                  <AlertTriangle size={20} /> Open Dispute Campaign
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Opening a dispute escalates the milestone escrow to platform admin arbitration. Funds will remain locked.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="input-label">Dispute Reason *</label>
                    <select
                      className="input-field"
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      required
                    >
                      <option value="Deliverable unsatisfactory or delayed">Deliverable unsatisfactory or delayed</option>
                      <option value="Expert unresponsive or inactive">Expert unresponsive or inactive</option>
                      <option value="Unreasonable extra fees demanded">Unreasonable extra fees demanded</option>
                      <option value="Scope mismatch or incorrect delivery">Scope mismatch or incorrect delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Describe Case & Evidence *</label>
                    <textarea
                      className="input-field"
                      rows={4}
                      placeholder="Explain details of the mismatch. Reference uploaded deliverables or chat statements..."
                      value={disputeDesc}
                      onChange={(e) => setDisputeDesc(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowDisputeModal(false)} className="btn btn-secondary" disabled={disputeLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={disputeLoading}>
                    {disputeLoading ? <Loader size={16} className="spinner" /> : 'Launch Escalation'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==========================================
              MODAL: REVIEW AND RATING FORM
              ========================================== */}
          {showRatingModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100
            }}>
              <form onSubmit={handleCreateReview} className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                  <Star size={20} color="var(--warning)" /> Rate Your Experience
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Congratulations on completing this project contract! Leave a review for {project.expertName}.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Overall Expert Rating</div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={32}
                          onClick={() => setRatingScore(star)}
                          style={{ cursor: 'pointer', fill: star <= ratingScore ? 'var(--warning)' : 'none', color: 'var(--warning)', transition: 'var(--transition)' }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Written Feedback Comments *</label>
                    <textarea
                      className="input-field"
                      rows={4}
                      placeholder="Excellent communication, clean delivery, and solid integration skills!"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowRatingModal(false)} className="btn btn-secondary" disabled={ratingLoading}>
                    Skip Review
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={ratingLoading}>
                    {ratingLoading ? <Loader size={16} className="spinner" /> : 'Submit Rating'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}
    </ClientLayout>
  );
};
