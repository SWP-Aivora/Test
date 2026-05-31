import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/PortalLayout';
import { useToast } from '../../context/ToastContext';
import { Scale, FileText, Send, User, ChevronLeft, Loader } from 'lucide-react';
import api from '../../services/api';
import { getDisputeStatusBadge, getDisputeStatusText } from '../../utils/statusMappers';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface Evidence { id: string; userId: string; userName: string; notes: string; fileUrl?: string; createdAt: string; }
interface DisputeDetail { id: string; milestoneId: string; milestoneTitle: string; projectName: string; claimantId: string; claimantName: string; respondentId: string; respondentName: string; escrowAmount: number; reason: string; description?: string; status: string; resolutionType?: string; resolutionNote?: string; clientRefundAmount?: number; expertReleaseAmount?: number; evidences: Evidence[]; createdAt: string; }

export const DisputeArbitration: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  const [clientPercentage, setClientPercentage] = useState(50);
  const [resolutionType, setResolutionType] = useState('SPLIT');
  const [resolutionNote, setResolutionNote] = useState('');

  const fetchDispute = async () => {
    if (!id) return;
    try { const res = await api.get(`/disputes/${id}`); setDispute(res.data); }
    catch {
      setDispute({
        id, milestoneId: 'm-2', milestoneTitle: 'Responsive CSS layout coding',
        projectName: 'Build AI Product UI/UX', claimantId: 'cl-google', claimantName: 'Google DevTeam',
        respondentId: 'exp-alice', respondentName: 'Alice Design', escrowAmount: 600,
        reason: 'Deliverable unsatisfactory or delayed',
        description: 'Failed to apply proper CSS transitions. Layouts look rigid.',
        status: 'OPEN', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        evidences: [
          { id: 'ev-1', userId: 'cl-google', userName: 'Google DevTeam', notes: 'Premium transitions not integrated.', fileUrl: 'https://figma.com/mock', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
          { id: 'ev-2', userId: 'exp-alice', userName: 'Alice Design', notes: 'Build compiles cleanly with zero errors.', fileUrl: 'https://github.com/mock/pull/1', createdAt: new Date(Date.now() - 86400000).toISOString() },
        ],
      });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDispute(); }, [id]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setClientPercentage(val);
    if (val === 100) setResolutionType('REFUND');
    else if (val === 0) setResolutionType('RELEASE');
    else setResolutionType('SPLIT');
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setResolutionType(val);
    if (val === 'REFUND') setClientPercentage(100);
    else if (val === 'RELEASE') setClientPercentage(0);
    else if (val === 'SPLIT' && (clientPercentage === 100 || clientPercentage === 0)) setClientPercentage(50);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispute || !id || !resolutionNote) return;
    setResolving(true);
    const total = Number(dispute.escrowAmount);
    const clientRefund = Math.round((total * (clientPercentage / 100)) * 100) / 100;
    const expertRelease = Math.round((total - clientRefund) * 100) / 100;
    try {
      await api.put(`/disputes/${id}/resolve`, { resolutionType, resolutionNote, clientRefundAmount: clientRefund, expertReleaseAmount: expertRelease });
      showToast('success', 'Dispute resolved!');
      navigate('/admin/dashboard');
    } catch { navigate('/admin/dashboard'); }
    finally { setResolving(false); }
  };

  const totalAmount = dispute ? Number(dispute.escrowAmount) : 0;
  const refundAmount = Math.round((totalAmount * (clientPercentage / 100)) * 100) / 100;
  const releaseAmount = Math.round((totalAmount - refundAmount) * 100) / 100;

  return (
    <AdminLayout>
      {loading || !dispute ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center' }}><ChevronLeft size={16} /> Back</button>
            <div>
              <span className="badge badge-danger">Dispute Cockpit</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>Case #{dispute.id.substring(0, 8)}</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Case Details</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <tbody>
                    {[
                      ['Milestone', dispute.milestoneTitle],
                      ['Project', dispute.projectName],
                      ['Claimant', dispute.claimantName],
                      ['Respondent', dispute.respondentName],
                      ['Escrow', formatCurrency(dispute.escrowAmount)],
                      ['Reason', dispute.reason],
                    ].map(([label, val], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>{label}</td>
                        <td style={{ padding: '0.75rem 0', color: label === 'Escrow' ? 'var(--success)' : label === 'Reason' ? 'var(--danger)' : 'var(--text-primary)', fontWeight: label === 'Escrow' || label === 'Reason' ? 700 : 600 }}>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dispute.description && (
                  <div style={{ marginTop: '1.5rem', background: 'hsla(222,47%,5%,0.3)', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Claimant Statement</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{dispute.description}</p>
                  </div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={18} color="var(--accent)" /> Evidence ({dispute.evidences.length})</h3>
                {dispute.evidences.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No evidence submitted.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {dispute.evidences.map(ev => (
                      <div key={ev.id} className="glass-card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} color="var(--accent)" /><strong style={{ fontSize: '0.9rem' }}>{ev.userName}</strong></div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatDateTime(ev.createdAt)}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>{ev.notes}</p>
                        {ev.fileUrl && <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}>Open Document</a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="glass-panel glow-panel-indigo" style={{ padding: '2rem', border: '1px solid rgba(250,89%,65%,0.25)', position: 'sticky', top: '2rem' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginBottom: '0.25rem' }}><Scale size={18} color="var(--danger)" /><h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Arbitration Verdict</h3></div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Determine escrow split.</p>
              </div>

              {dispute.status === 'RESOLVED' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                  <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', justifyContent: 'center' }}>CASE CLOSED</div>
                  <div style={{ background: 'hsla(222,47%,5%,0.3)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}><strong>Type:</strong> {dispute.resolutionType}</div>
                    <div style={{ marginBottom: '0.5rem' }}><strong>Refund:</strong> {formatCurrency(dispute.clientRefundAmount)}</div>
                    <div style={{ marginBottom: '0.5rem' }}><strong>Release:</strong> {formatCurrency(dispute.expertReleaseAmount)}</div>
                    <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}><strong>Notes:</strong> {dispute.resolutionNote}</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label className="input-label">Resolution Type *</label>
                    <select className="input-field" value={resolutionType} onChange={handleTypeChange} required disabled={resolving}>
                      <option value="SPLIT">Custom Split</option>
                      <option value="REFUND">100% Refund to Client</option>
                      <option value="RELEASE">100% Release to Expert</option>
                    </select>
                  </div>

                  {resolutionType === 'SPLIT' && (
                    <div style={{ background: 'hsla(222,47%,5%,0.3)', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 500 }}>
                        <span>Refund Client</span><span>Release Expert</span>
                      </div>
                      <input type="range" min="0" max="100" step="5" value={clientPercentage} onChange={handleSliderChange}
                        style={{ width: '100%', height: '6px', background: 'var(--border)', outline: 'none', borderRadius: '3px', cursor: 'pointer', marginBottom: '1rem', accentColor: 'var(--accent)' }} disabled={resolving} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        <span style={{ color: 'var(--accent)' }}>{clientPercentage}%</span>
                        <span style={{ color: 'var(--warning)' }}>{100 - clientPercentage}%</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="glass-card" style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Client Refund</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}>{formatCurrency(refundAmount)}</div>
                    </div>
                    <div className="glass-card" style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Expert Release</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--warning)', fontFamily: 'var(--font-heading)' }}>{formatCurrency(releaseAmount)}</div>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Official Notes *</label>
                    <textarea className="input-field" rows={4} placeholder="e.g., Based on evidence, split resolved accordingly." value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} required disabled={resolving} />
                  </div>

                  <button type="submit" disabled={resolving || !resolutionNote} className="btn btn-danger btn-lg" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', background: 'var(--danger)', boxShadow: '0 4px 15px var(--danger-glow)', border: 'none' }}>
                    {resolving ? <><Loader size={16} className="spinner" /> Executing...</> : <><Send size={16} /> Execute Settlement</>}
                  </button>
                </form>
              )}
            </aside>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
