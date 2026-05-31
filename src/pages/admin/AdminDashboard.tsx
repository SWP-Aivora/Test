import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/PortalLayout';
import { Scale, ShieldAlert, DollarSign, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { getDisputeStatusBadge, getDisputeStatusText, isDisputeResolved } from '../../utils/statusMappers';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface DisputeSummary { id: string; milestoneId: string; milestoneTitle: string; projectName: string; claimantName: string; respondentName: string; escrowAmount: number; reason: string; status: string; createdAt: string; }

export const AdminDashboard: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeSummary[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalDisputes: 0, totalEscrow: 0 });

  useEffect(() => {
    const fetchDisputes = async () => {
      setLoading(true);
      try {
        const res = await api.get('/disputes', { params: { pageSize: 50 } });
        const items = res.data?.items || [];
        setDisputes(items);
        const active = items.filter((d: any) => !isDisputeResolved(d.status));
        setStats({ totalDisputes: active.length, totalEscrow: active.reduce((a: number, c: any) => a + (Number(c.escrowAmount) || 0), 0) });
      } catch {
        const mock = [{ id: 'disp-1', milestoneId: 'm-2', milestoneTitle: 'Responsive CSS layout', projectName: 'Build AI Product UI/UX', claimantName: 'Google DevTeam', respondentName: 'Alice Design', escrowAmount: 600, reason: 'Deliverable unsatisfactory', status: 'OPEN', createdAt: new Date().toISOString() }];
        setDisputes(mock);
        setStats({ totalDisputes: 1, totalEscrow: 600 });
      } finally { setLoading(false); }
    };
    fetchDisputes();
  }, []);

  const filtered = disputes.filter(d => filterStatus === 'ACTIVE' ? !isDisputeResolved(d.status) : isDisputeResolved(d.status));

  return (
    <AdminLayout>
      {loading ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, hsla(346, 84%, 61%, 0.08) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
              <div style={{ background: 'var(--danger-glow)', padding: '1rem', borderRadius: '16px', color: 'var(--danger)', boxShadow: '0 0 10px var(--danger-glow)' }}><ShieldAlert size={32} /></div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Disputes</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>{stats.totalDisputes} Campaigns</div>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, hsla(250, 89%, 65%, 0.05) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
              <div style={{ background: 'var(--accent-glow)', padding: '1rem', borderRadius: '16px', color: 'var(--accent)' }}><DollarSign size={32} /></div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Escrow Locked</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-heading)' }}>{formatCurrency(stats.totalEscrow)}</div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Scale size={18} color="var(--danger)" /> Dispute Queue</h2>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.2rem', display: 'flex' }}>
                <button onClick={() => setFilterStatus('ACTIVE')} className={`btn ${filterStatus === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.35rem 1rem', fontSize: '0.75rem', border: 'none', borderRadius: '6px' }}>Active</button>
                <button onClick={() => setFilterStatus('RESOLVED')} className={`btn ${filterStatus === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.35rem 1rem', fontSize: '0.75rem', border: 'none', borderRadius: '6px' }}>Resolved</button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
                <Scale size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                <p>No disputes matching filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.map(disp => (
                  <div key={disp.id} className="glass-card" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span className={`badge ${getDisputeStatusBadge(disp.status)}`}>{getDisputeStatusText(disp.status)}</span>
                        <span className="badge badge-muted" style={{ textTransform: 'none' }}>Project: {disp.projectName}</span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{disp.milestoneTitle}</h3>
                      <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        <span>Claimant: <strong>{disp.claimantName}</strong></span>
                        <span>Respondent: <strong>{disp.respondentName}</strong></span>
                        <span>Opened: {formatDate(disp.createdAt)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: '220px', justifyContent: 'flex-end', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Escrow</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>{formatCurrency(disp.escrowAmount)}</div>
                      </div>
                      <Link to={`/admin/disputes/${disp.id}`} className="btn btn-primary btn-sm" style={{ padding: '0.45rem 1.25rem' }}>Arbitrate <ChevronRight size={14} /></Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
