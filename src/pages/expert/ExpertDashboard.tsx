import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ExpertLayout } from '../../components/PortalLayout';
import { Briefcase, Award, TrendingUp, ArrowRight, ShieldCheck, User } from 'lucide-react';
import api from '../../services/api';
import { getProjectStatusBadge, getProjectStatusText, getProposalStatusBadge, getProposalStatusText } from '../../utils/statusMappers';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ProjectSummary { id: string; title: string; clientName: string; status: string; fundedMilestonesCount: number; totalMilestonesCount: number; }
interface ProposalSummary { id: string; jobId: string; jobTitle: string; bidAmount: number; completionDays: number; status: string; createdAt: string; }

export const ExpertDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [stats, setStats] = useState({ earnings: 0, activeProjects: 0, pendingBids: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, projRes, propRes] = await Promise.allSettled([
          api.get('/wallet/me'),
          api.get('/projects', { params: { pageSize: 5 } }),
          api.get('/proposals/me'),
        ]);

        if (walletRes.status === 'fulfilled') setStats(s => ({ ...s, earnings: Number(walletRes.value.data?.balance) || 0 }));

        if (projRes.status === 'fulfilled') {
          const items = projRes.value.data?.items || [];
          setProjects(items);
          setStats(s => ({ ...s, activeProjects: projRes.value.data?.totalItems || 0 }));
        } else {
          setProjects([{ id: 'mock-p1', title: 'Build AI Product UI/UX', clientName: 'Google DevTeam', status: 'ACTIVE', fundedMilestonesCount: 1, totalMilestonesCount: 2 }]);
          setStats(s => ({ ...s, activeProjects: 1 }));
        }

        if (propRes.status === 'fulfilled') {
          const items = propRes.value.data || [];
          setProposals(items);
          setStats(s => ({ ...s, pendingBids: items.filter((p: any) => { const s = String(p.status).toUpperCase(); return s === 'PENDING' || s === 'SUBMITTED' || s === '0'; }).length }));
        } else {
          setProposals([{ id: 'mock-prop1', jobId: 'mock-j1', jobTitle: 'Build Full-Stack E-Commerce', bidAmount: 1800, completionDays: 20, status: 'PENDING', createdAt: new Date().toISOString() }]);
          setStats(s => ({ ...s, pendingBids: 1 }));
        }
      } catch (err) { console.error('[ExpertDashboard]', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <ExpertLayout>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '110px' }} />)}
          </div>
          <div className="skeleton skeleton-card" style={{ height: '300px' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: TrendingUp, color: 'var(--success)', bg: 'var(--success-glow)', label: 'Total Earned', value: formatCurrency(stats.earnings) },
              { icon: Briefcase, color: 'var(--accent)', bg: 'var(--accent-glow)', label: 'Active Projects', value: stats.activeProjects },
              { icon: Award, color: 'var(--warning)', bg: 'var(--warning-glow)', label: 'Pending Proposals', value: stats.pendingBids },
            ].map((m, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: m.bg, padding: '0.75rem', borderRadius: '12px', color: m.color }}><m.icon size={24} /></div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem' }}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel glow-panel-emerald" style={{ padding: '2rem 2.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.5rem' }}>Looking for your next gig?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: '600px' }}>Browse hundreds of live campaigns. Secure payments, guaranteed escrow payouts.</p>
            </div>
            <button onClick={() => navigate('/expert/jobs')} className="btn btn-success" style={{ padding: '0.8rem 1.6rem', flexShrink: 0 }}>
              Explore Jobs <ArrowRight size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--success)" /> Active Contracts
              </h2>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>No active contracts.</p>
                  <button onClick={() => navigate('/expert/jobs')} className="btn btn-secondary btn-sm">Browse Jobs</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {projects.map(proj => (
                    <div key={proj.id} className="glass-card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{proj.title}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><User size={14} /> Client: {proj.clientName}</span>
                        </div>
                        <span className={`badge ${getProjectStatusBadge(proj.status)}`}>{getProjectStatusText(proj.status)}</span>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          <span>Progress</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{proj.fundedMilestonesCount}/{proj.totalMilestonesCount}</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--success)', width: proj.totalMilestonesCount > 0 ? `${(proj.fundedMilestonesCount / proj.totalMilestonesCount) * 100}%` : '0%', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <Link to={`/expert/projects/${proj.id}`} className="btn btn-secondary btn-sm">Submit Deliverables</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} color="var(--accent)" /> Outstanding Proposals
              </h2>
              {proposals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>No outstanding proposals.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {proposals.map(prop => (
                    <div key={prop.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ overflow: 'hidden', paddingRight: '1rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 500, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{prop.jobTitle}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Bid: ${prop.bidAmount} • {prop.completionDays}d</span>
                      </div>
                      <span className={`badge ${getProposalStatusBadge(prop.status)}`} style={{ flexShrink: 0 }}>{getProposalStatusText(prop.status)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <Link to="/expert/jobs" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}>Apply For More</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ExpertLayout>
  );
};
