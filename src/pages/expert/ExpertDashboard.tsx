import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ExpertLayout } from '../../components/PortalLayout';
import { Briefcase, Award, TrendingUp, ArrowRight, ShieldCheck, User } from 'lucide-react';
import api from '../../services/api';

interface ProjectSummary {
  id: string;
  title: string;
  clientName: string;
  status: string;
  fundedMilestonesCount: number;
  totalMilestonesCount: number;
}

interface ProposalSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  bidAmount: number;
  completionDays: number;
  status: string;
  createdAt: string;
}

export const ExpertDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [stats, setStats] = useState({ earnings: 0, activeProjects: 0, pendingBids: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpertDashboard = async () => {
      try {
        // 1. Fetch wallet & earnings
        const walletRes = await api.get('/wallet/me');
        const balance = walletRes.data?.balance || 0;

        // 2. Fetch expert projects
        let activeProj = 0;
        try {
          const projRes = await api.get('/projects', { params: { pageSize: 5 } });
          const items = projRes.data?.items || [];
          setProjects(items);
          activeProj = projRes.data?.totalItems || 0;
        } catch (projErr) {
          console.warn('[ExpertDashboard] Failed to fetch live contracts, mocking list:', projErr);
          setProjects([
            {
              id: 'mock-p1',
              title: 'Build AI Product UI/UX Interface Redesign',
              clientName: 'Google DevTeam',
              status: 'ACTIVE',
              fundedMilestonesCount: 1,
              totalMilestonesCount: 2
            }
          ]);
          activeProj = 1;
        }

        // 3. Fetch proposals submitted by the authenticated expert
        let pendingCount = 0;
        try {
          const propRes = await api.get('/proposals/me');
          const items = propRes.data || [];
          setProposals(items);
          pendingCount = items.filter((p: any) => {
            const pStr = String(p.status).toUpperCase();
            return pStr === 'PENDING' || pStr === 'SUBMITTED' || pStr === '0';
          }).length;
        } catch (propErr) {
          console.warn('[ExpertDashboard] Failed to fetch live proposals, mocking list:', propErr);
          const mockProps = [
            {
              id: 'mock-prop1',
              jobId: 'mock-j1',
              jobTitle: 'Build Full-Stack E-Commerce Platform with NextJS',
              bidAmount: 1800,
              completionDays: 20,
              status: 'PENDING',
              createdAt: new Date().toISOString()
            }
          ];
          setProposals(mockProps);
          pendingCount = 1;
        }

        setStats({
          earnings: Number(balance) || 0,
          activeProjects: activeProj,
          pendingBids: pendingCount
        });

      } catch (err) {
        console.error('[ExpertDashboard] Error retrieving dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpertDashboard();
  }, []);

  const getStatusBadgeClass = (status: any, isProject = false) => {
    if (status === undefined || status === null) return 'badge-muted';
    const s = String(status).toUpperCase();
    if (isProject) {
      switch (s) {
        case '0': case 'PENDING_PAYMENT': return 'badge-muted';
        case '1': case 'ACTIVE': return 'badge-primary';
        case '2': case 'IN_REVIEW': return 'badge-warning';
        case '3': case 'DISPUTED': return 'badge-danger';
        case '4': case 'COMPLETED': return 'badge-success';
        case '5': case 'CANCELLED': return 'badge-danger';
        default: return 'badge-muted';
      }
    } else {
      switch (s) {
        case '0': case 'SUBMITTED': case 'PENDING': return 'badge-muted';
        case '1': case 'SHORTLISTED': return 'badge-primary';
        case '2': case 'ACCEPTED': return 'badge-success';
        case '3': case 'REJECTED': return 'badge-danger';
        case '4': case 'WITHDRAWN': return 'badge-danger';
        default: return 'badge-muted';
      }
    }
  };

  const getStatusText = (status: any, isProject = false) => {
    if (status === undefined || status === null) return 'Unknown';
    const s = String(status).toUpperCase();
    if (isProject) {
      switch (s) {
        case '0': case 'PENDING_PAYMENT': return 'Pending Payment';
        case '1': case 'ACTIVE': return 'Active';
        case '2': case 'IN_REVIEW': return 'In Review';
        case '3': case 'DISPUTED': return 'Disputed';
        case '4': case 'COMPLETED': return 'Completed';
        case '5': case 'CANCELLED': return 'Cancelled';
        default: return String(status);
      }
    } else {
      switch (s) {
        case '0': case 'SUBMITTED': case 'PENDING': return 'Submitted';
        case '1': case 'SHORTLISTED': return 'Shortlisted';
        case '2': case 'ACCEPTED': return 'Accepted';
        case '3': case 'REJECTED': return 'Rejected';
        case '4': case 'WITHDRAWN': return 'Withdrawn';
        default: return String(status);
      }
    }
  };

  return (
    <ExpertLayout>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div className="skeleton skeleton-card" style={{ height: '110px' }}></div>
            <div className="skeleton skeleton-card" style={{ height: '110px' }}></div>
            <div className="skeleton skeleton-card" style={{ height: '110px' }}></div>
          </div>
          <div className="skeleton skeleton-card" style={{ height: '300px' }}></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'var(--success-glow)', padding: '0.75rem', borderRadius: '12px', color: 'var(--success)' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Earned Balance</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem', fontFamily: 'var(--font-heading)' }}>
                  {stats.earnings.toLocaleString()} AICOIN
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'var(--accent-glow)', padding: '0.75rem', borderRadius: '12px', color: 'var(--accent)' }}>
                <Briefcase size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Projects</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem' }}>{stats.activeProjects}</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'var(--warning-glow)', padding: '0.75rem', borderRadius: '12px', color: 'var(--warning)' }}>
                <Award size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Proposals</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem' }}>{stats.pendingBids}</div>
              </div>
            </div>
          </div>

          {/* Find Jobs Campaign Banner CTA */}
          <div className="glass-panel glow-panel-emerald" style={{
            padding: '2rem 2.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, hsla(142, 70%, 45%, 0.08) 0%, hsla(222, 47%, 12%, 0.85) 100%)',
            border: '1px solid rgba(142, 70%, 45%, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.5rem' }}>Looking for your next gig? Find Open Campaigns</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: '600px' }}>
                Browse hundreds of live campaigns requiring your specialized tech stack. Secure payments, guaranteed escrow payouts.
              </p>
            </div>
            <button onClick={() => navigate('/expert/jobs')} className="btn btn-success" style={{ padding: '0.8rem 1.6rem' }}>
              Explore Job Listings <ArrowRight size={16} />
            </button>
          </div>

          {/* Active Workspaces & Applications */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
            
            {/* Active Projects */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--success)" /> Active Contracts
              </h2>

              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>No active contracts found.</p>
                  <button onClick={() => navigate('/expert/jobs')} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    Browse Open Jobs
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {projects.map((proj) => (
                    <div key={proj.id} className="glass-card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{proj.title}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <User size={14} /> Client: {proj.clientName}
                          </span>
                        </div>
                        <span className={`badge ${getStatusBadgeClass(proj.status, true)}`}>{getStatusText(proj.status, true)}</span>
                      </div>

                      {/* Timeline status indicator */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          <span>Contract Progress Timeline</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {proj.fundedMilestonesCount} / {proj.totalMilestonesCount} Checkpoints Funded
                          </span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            background: 'var(--success)',
                            width: proj.totalMilestonesCount > 0 ? `${(proj.fundedMilestonesCount / proj.totalMilestonesCount) * 100}%` : '0%',
                            borderRadius: '3px',
                            transition: 'width 0.4s ease'
                          }}></div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <Link to={`/expert/projects/${proj.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                          Submit Deliverables
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bids Submitted */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} color="var(--accent)" /> Outstanding Proposals
              </h2>

              {proposals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '0.95rem' }}>No outstanding proposals submitted.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {proposals.map((prop) => (
                    <div key={prop.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border)'
                    }}>
                      <div style={{ overflow: 'hidden', paddingRight: '1rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 500, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {prop.jobTitle}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span>Bid: ${prop.bidAmount}</span>
                          <span>Time: {prop.completionDays} Days</span>
                        </span>
                      </div>

                      <span className={`badge ${getStatusBadgeClass(prop.status, false)}`} style={{ flexShrink: 0 }}>
                        {getStatusText(prop.status, false)}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <Link to="/expert/jobs" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}>
                      Apply For More Jobs
                    </Link>
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
