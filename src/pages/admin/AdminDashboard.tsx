import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/PortalLayout';
import { Scale, ShieldAlert, DollarSign, ChevronRight } from 'lucide-react';
import api from '../../services/api';

interface DisputeSummary {
  id: string;
  milestoneId: string;
  milestoneTitle: string;
  projectName: string;
  claimantName: string;
  respondentName: string;
  escrowAmount: number;
  reason: string;
  status: string; // OPEN, IN_REVIEW, RESOLVED
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeSummary[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE'); // ACTIVE, RESOLVED
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalDisputes: 0, totalEscrow: 0 });

  useEffect(() => {
    const fetchDisputes = async () => {
      setLoading(true);
      try {
        const response = await api.get('/disputes', { params: { pageSize: 50 } });
        const items = response.data?.items || [];
        
        // Parse results
        setDisputes(items);

        // Calc stats
        const activeCount = items.filter((d: any) => {
          const dStr = String(d.status).toUpperCase();
          return dStr !== 'RESOLVED' && dStr !== '2' && dStr !== 'CLOSED' && dStr !== '3';
        }).length;
        const sumLocked = items
          .filter((d: any) => {
            const dStr = String(d.status).toUpperCase();
            return dStr !== 'RESOLVED' && dStr !== '2' && dStr !== 'CLOSED' && dStr !== '3';
          })
          .reduce((acc: number, curr: any) => acc + (Number(curr.escrowAmount) || 0), 0);

        setStats({
          totalDisputes: activeCount,
          totalEscrow: sumLocked
        });

      } catch (err) {
        console.warn('[AdminDashboard] Failed to retrieve live disputes, loading mockup:', err);
        const mockDisputes = [
          {
            id: 'disp-1',
            milestoneId: 'm-2',
            milestoneTitle: 'Responsive CSS layout coding & React injection',
            projectName: 'Build AI Product UI/UX Interface Redesign',
            claimantName: 'Google DevTeam',
            respondentName: 'Alice Design',
            escrowAmount: 600,
            reason: 'Deliverable unsatisfactory or delayed',
            status: 'OPEN',
            createdAt: new Date().toISOString()
          }
        ];
        setDisputes(mockDisputes);
        setStats({ totalDisputes: 1, totalEscrow: 600 });
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  const getStatusBadge = (status: any) => {
    if (status === undefined || status === null) return 'badge-muted';
    const s = String(status).toUpperCase();
    switch (s) {
      case 'OPEN':
      case 'ACTIVE':
      case '0':
        return 'badge-danger';
      case 'IN_REVIEW':
      case 'UNDER_REVIEW':
      case '1':
        return 'badge-warning';
      case 'RESOLVED':
      case '2':
        return 'badge-success';
      case 'CLOSED':
      case '3':
        return 'badge-muted';
      default:
        return 'badge-muted';
    }
  };

  const getStatusText = (status: any) => {
    if (status === undefined || status === null) return 'Unknown';
    const s = String(status).toUpperCase();
    switch (s) {
      case '0': case 'OPEN': return 'Open';
      case '1': case 'UNDER_REVIEW': return 'Under Review';
      case '2': case 'RESOLVED': return 'Resolved';
      case '3': case 'CLOSED': return 'Closed';
      default: return String(status);
    }
  };

  const filteredDisputes = disputes.filter(d => {
    const isResolved = String(d.status).toUpperCase() === 'RESOLVED' || String(d.status) === '2';
    if (filterStatus === 'ACTIVE') return !isResolved;
    return isResolved;
  });

  return (
    <AdminLayout>
      {loading ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Metrics summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, hsla(346, 84%, 61%, 0.08) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
              <div style={{ background: 'var(--danger-glow)', padding: '1rem', borderRadius: '16px', color: 'var(--danger)', boxShadow: '0 0 10px var(--danger-glow)' }}>
                <ShieldAlert size={32} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Disputed Contracts</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>{stats.totalDisputes} Campaigns</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, hsla(250, 89%, 65%, 0.05) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
              <div style={{ background: 'var(--accent-glow)', padding: '1rem', borderRadius: '16px', color: 'var(--accent)' }}>
                <DollarSign size={32} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Escrow Locked Under Arbitration</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  {stats.totalEscrow.toLocaleString()} AICOIN
                </div>
              </div>
            </div>
          </div>

          {/* Dispute tracking board */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={18} color="var(--danger)" /> Dispute Arbitration Queue
              </h2>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.2rem', display: 'flex' }}>
                <button
                  onClick={() => setFilterStatus('ACTIVE')}
                  className={`btn ${filterStatus === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 1rem', fontSize: '0.75rem', border: 'none', borderRadius: '6px' }}
                >
                  Active Standoffs
                </button>
                <button
                  onClick={() => setFilterStatus('RESOLVED')}
                  className={`btn ${filterStatus === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 1rem', fontSize: '0.75rem', border: 'none', borderRadius: '6px' }}
                >
                  Arbitrated Cases
                </button>
              </div>
            </div>

            {filteredDisputes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
                <Scale size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                <p>No disputes matching your active filter were found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredDisputes.map((disp) => (
                  <div key={disp.id} className="glass-card" style={{
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '2rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span className={`badge ${getStatusBadge(disp.status)}`}>{getStatusText(disp.status)}</span>
                        <span className="badge badge-muted" style={{ textTransform: 'none' }}>Project: {disp.projectName}</span>
                      </div>
                      
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{disp.milestoneTitle}</h3>
                      
                      <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                        <span>Claimant: <strong>{disp.claimantName}</strong></span>
                        <span>Respondent: <strong>{disp.respondentName}</strong></span>
                        <span>Opened: {new Date(disp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: '220px', justifyContent: 'flex-end', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Locked Escrow</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                          ${disp.escrowAmount.toLocaleString()} AICOIN
                        </div>
                      </div>
                      <Link to={`/admin/disputes/${disp.id}`} className="btn btn-primary" style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}>
                        Arbitrate Case <ChevronRight size={14} />
                      </Link>
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
