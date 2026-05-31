import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClientLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Activity, CheckCircle, Bot, ArrowRight, Wallet, UserCheck } from 'lucide-react';
import api from '../../services/api';

interface JobSummary {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface ProjectSummary {
  id: string;
  title: string;
  expertName: string;
  status: string;
  fundedMilestonesCount: number;
  totalMilestonesCount: number;
}

export const ClientDashboard: React.FC = () => {
  useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [stats, setStats] = useState({ openJobs: 0, activeProjects: 0, balance: 0, held: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch wallet stats
        const walletRes = await api.get('/wallet/me');
        const balance = walletRes.data?.balance || 0;
        const held = walletRes.data?.heldBalance || 0;

        // 2. Fetch projects
        let activeProjCount = 0;
        try {
          const projectsRes = await api.get('/projects', { params: { pageSize: 5 } });
          const items = projectsRes.data?.items || [];
          setProjects(items);
          activeProjCount = projectsRes.data?.totalItems || 0;
        } catch (projErr) {
          console.warn('[ClientDashboard] Failed to fetch live projects, mocking data...', projErr);
          setProjects([
            {
              id: 'mock-p1',
              title: 'Build AI Product UI/UX Interface Redesign',
              expertName: 'Alice Dev',
              status: 'ACTIVE',
              fundedMilestonesCount: 1,
              totalMilestonesCount: 2,
            }
          ]);
          activeProjCount = 1;
        }

        // 3. Fetch jobs
        let openJobsCount = 0;
        try {
          const jobsRes = await api.get('/jobs', { params: { pageSize: 5 } });
          const items = jobsRes.data?.items || [];
          setJobs(items);
          openJobsCount = jobsRes.data?.totalItems || 0;
        } catch (jobErr) {
          console.warn('[ClientDashboard] Failed to fetch live client jobs, mocking data...', jobErr);
          setJobs([
            {
              id: 'mock-j1',
              title: 'Mobile Fintech Wallet App iOS Development',
              status: 'OPEN',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'mock-j2',
              title: 'Web3 Escrow smart contracts auditing',
              status: 'DRAFT',
              createdAt: new Date().toISOString(),
            }
          ]);
          openJobsCount = 1;
        }

        setStats({
          openJobs: openJobsCount,
          activeProjects: activeProjCount,
          balance: Number(balance) || 0,
          held: Number(held) || 0
        });

      } catch (err) {
        console.error('[ClientDashboard] Error retrieving dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadgeClass = (status: any) => {
    if (status === undefined || status === null) return 'badge-muted';
    const s = String(status).toUpperCase();
    switch (s) {
      case 'DRAFT':
      case 'PENDING_PAYMENT':
      case 'CLOSED':
      case '0': 
      case '5':
        return 'badge-muted';
      case 'OPEN':
      case '1': 
        return 'badge-primary';
      case 'IN_PROGRESS':
      case 'ACTIVE':
      case 'IN_REVIEW':
      case '2': 
        return 'badge-warning';
      case 'COMPLETED':
      case '3':
      case '4':
        return 'badge-success';
      case 'CANCELLED':
      case 'DISPUTED':
        return 'badge-danger';
      default:
        return 'badge-muted';
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
        case '0': case 'DRAFT': return 'Draft';
        case '1': case 'OPEN': return 'Open';
        case '2': case 'IN_PROGRESS': return 'In Progress';
        case '3': case 'COMPLETED': return 'Completed';
        case '4': case 'CANCELLED': return 'Cancelled';
        case '5': case 'CLOSED': return 'Closed';
        default: return String(status);
      }
    }
  };

  return (
    <ClientLayout>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <div className="skeleton skeleton-card" style={{ height: '110px' }}></div>
            <div className="skeleton skeleton-card" style={{ height: '110px' }}></div>
            <div className="skeleton skeleton-card" style={{ height: '110px' }}></div>
            <div className="skeleton skeleton-card" style={{ height: '110px' }}></div>
          </div>
          <div className="skeleton skeleton-card" style={{ height: '300px' }}></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'var(--accent-glow)', padding: '0.75rem', borderRadius: '12px', color: 'var(--accent)' }}>
                <Briefcase size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Job Posts</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem' }}>{stats.openJobs}</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'var(--warning-glow)', padding: '0.75rem', borderRadius: '12px', color: 'var(--warning)' }}>
                <Activity size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Projects</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem' }}>{stats.activeProjects}</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'var(--success-glow)', padding: '0.75rem', borderRadius: '12px', color: 'var(--success)' }}>
                <Wallet size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Available Wallet</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem', fontFamily: 'var(--font-heading)' }}>
                  {stats.balance.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'var(--danger-glow)', padding: '0.75rem', borderRadius: '12px', color: 'var(--danger)' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Locked Escrow</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem', fontFamily: 'var(--font-heading)' }}>
                  {stats.held.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* AI CTA Wizard Banner */}
          <div className="glass-panel glow-panel-indigo" style={{
            padding: '2.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, hsla(250, 89%, 65%, 0.15) 0%, hsla(222, 47%, 12%, 0.8) 100%)',
            border: '1px solid rgba(250, 89%, 65%, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', maxWidth: '650px' }}>
              <div style={{
                background: 'var(--accent)',
                padding: '1rem',
                borderRadius: '16px',
                color: '#fff',
                boxShadow: '0 4px 20px var(--accent-glow)'
              }}>
                <Bot size={36} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>Need an expert? Draft with Aivora AI</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Simply state what you want to achieve. The AI assistant will automatically translate your goals into polished requirements, project budgets, timelines, and draft appropriate milestones.
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/client/jobs/new')} className="btn btn-primary btn-lg" style={{ padding: '0.9rem 1.8rem' }}>
              Launch AI Assistant <ArrowRight size={18} />
            </button>
          </div>

          {/* Core Body Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
            
            {/* Active Contracts / Projects */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="var(--warning)" /> Active Workspaces
              </h2>

              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '0.95rem' }}>No active contracts. Hire an expert from your job listings to start.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {projects.map((proj) => (
                    <div key={proj.id} className="glass-card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{proj.title}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                            <UserCheck size={14} /> Expert: {proj.expertName}
                          </span>
                        </div>
                         <span className={`badge ${getStatusBadgeClass(proj.status)}`}>{getStatusText(proj.status, true)}</span>
                      </div>

                      {/* Milestone Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          <span>Milestone Escrow Progress</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {proj.fundedMilestonesCount} / {proj.totalMilestonesCount} Funded
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
                        <Link to={`/client/projects/${proj.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                          Manage Milestones
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Job Listings */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} color="var(--accent)" /> Recent Job Posts
              </h2>

              {jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>You haven't posted any jobs yet.</p>
                  <button onClick={() => navigate('/client/jobs/new')} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    Post First Job
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {jobs.map((job) => (
                    <div key={job.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border)'
                    }}>
                      <div style={{ overflow: 'hidden', paddingRight: '1rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 500, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{job.title}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Posted: {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                         <span className={`badge ${getStatusBadgeClass(job.status)}`}>{getStatusText(job.status, false)}</span>
                        <Link to={`/client/jobs/${job.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <Link to="/client/jobs" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}>
                      View All Listings
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </ClientLayout>
  );
};
