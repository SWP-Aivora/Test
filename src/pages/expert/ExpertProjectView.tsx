import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExpertLayout } from '../../components/PortalLayout';
import { ShieldAlert, CheckCircle2, AlertCircle, FileText, Send, MessageSquare, Loader } from 'lucide-react';
import api from '../../services/api';

interface Deliverable {
  id: string;
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
  clientId: string;
  clientName: string;
  status: string;
  budget: number;
  milestones: Milestone[];
}

export const ExpertProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // --- SUBMIT WORK MODAL STATE ---
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitMilestoneId, setSubmitMilestoneId] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [submittingWork, setSubmittingWork] = useState(false);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (err) {
      console.warn('[ExpertProject] Failed to load contract details, using fallback mockup:', err);
      setProject({
        id: id,
        title: 'Build AI Product UI/UX Interface Redesign',
        clientId: 'cl-google',
        clientName: 'Google DevTeam',
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
            status: 'FUNDED' // Ready for work!
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

  const triggerSubmitModal = (milestoneId: string) => {
    setSubmitMilestoneId(milestoneId);
    setSubmitNotes('');
    setSubmitFileUrl('https://github.com/mock-repo/pull/1');
    setShowSubmitModal(true);
  };

  // Submit Deliverable to backend
  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitMilestoneId || !submitNotes) return;
    setSubmittingWork(true);

    try {
      await api.post(`/milestones/${submitMilestoneId}/deliverables`, {
        notes: submitNotes,
        fileUrl: submitFileUrl || undefined
      });
      
      setShowSubmitModal(false);
      await fetchProjectDetails(); // Reload status
    } catch (err) {
      console.error('[ExpertProject] Deliverable submission failed:', err);
    } finally {
      setSubmittingWork(false);
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
    <ExpertLayout>
      {loading || !project ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Main workspace title bar */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>Active Workstation</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.title}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Client Employer: <strong>{project.clientName}</strong> • Escrow Value: ${project.budget} AICOIN
              </p>
            </div>

            <button
              onClick={() => navigate('/chat')}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.4rem' }}
            >
              Open Client Chat Workspace <MessageSquare size={16} />
            </button>
          </div>

          {/* Timeline checkposts */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Contract Checkpoints</h3>

            <div className="timeline-container">
              {project.milestones.map((ms, index) => {
                const statusStr = String(ms.status).toUpperCase();
                const isApproved = statusStr === 'APPROVED' || statusStr === 'PAID' || statusStr === '5' || statusStr === '7';
                const isSubmitted = statusStr === 'SUBMITTED' || statusStr === '3';
                const isFunded = statusStr === 'FUNDED' || statusStr === 'IN_PROGRESS' || statusStr === '1' || statusStr === '2';
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

                      {/* Display deliverable already submitted */}
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
                              Open Deliverable Attachment
                            </a>
                          )}
                        </div>
                      )}

                      {/* Work actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                        {isCreated && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertCircle size={14} /> Awaiting client wallet funding escrow.
                          </span>
                        )}

                        {isFunded && (
                          <button
                            onClick={() => triggerSubmitModal(ms.id)}
                            className="btn btn-primary"
                            style={{ padding: '0.45rem 1.4rem', fontSize: '0.85rem' }}
                          >
                            Submit Milestone Deliverable <Send size={14} />
                          </button>
                        )}

                        {isSubmitted && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertCircle size={14} /> Work Submitted - Awaiting Client Review & Payout
                          </span>
                        )}

                        {isApproved && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={14} /> Milestone Paid successfully! Funds released.
                          </span>
                        )}

                        {isDisputed && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ShieldAlert size={14} /> Escrow Disputed - Admin evaluating evidence.
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
              MODAL: DELIVERABLE SUBMISSION FORM
              ========================================== */}
          {showSubmitModal && (
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
              <form onSubmit={handleSubmitDeliverable} className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                  <Send size={20} /> Submit Milestone Deliverable
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Provide complete verification files and implementation notes to request final escrow release.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="input-label" htmlFor="submit-notes-input">Completion Notes & Verification Steps *</label>
                    <textarea
                      id="submit-notes-input"
                      className="input-field"
                      rows={4}
                      placeholder="e.g., Re-architected styles into central variables. Replaced login screens forms and ran automated Typechecks compiles cleanly."
                      value={submitNotes}
                      onChange={(e) => setSubmitNotes(e.target.value)}
                      required
                      disabled={submittingWork}
                    />
                  </div>

                  <div>
                    <label className="input-label" htmlFor="submit-file-input">Verification Link / File Url (Optional)</label>
                    <input
                      id="submit-file-input"
                      type="url"
                      className="input-field"
                      placeholder="e.g., https://github.com/my-project/pull/1"
                      value={submitFileUrl}
                      onChange={(e) => setSubmitFileUrl(e.target.value)}
                      disabled={submittingWork}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowSubmitModal(false)} className="btn btn-secondary" disabled={submittingWork}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submittingWork || !submitNotes}>
                    {submittingWork ? <Loader size={16} className="spinner" /> : 'Upload Submission'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}
    </ExpertLayout>
  );
};
