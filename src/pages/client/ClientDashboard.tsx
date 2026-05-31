import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClientLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Activity, CheckCircle, Bot, ArrowRight, Wallet, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { getJobStatusBadge, getJobStatusText, getProjectStatusBadge, getProjectStatusText } from '../../utils/statusMappers';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface JobSummary { id: string; title: string; status: string; createdAt: string; }
interface ProjectSummary { id: string; title: string; expertName: string; status: string; fundedMilestonesCount: number; totalMilestonesCount: number; }

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
        // Fetch all data in parallel with individual error handling
        const [walletRes, projectsRes, jobsRes] = await Promise.allSettled([
          api.get('/wallet/me'),
          api.get('/projects', { params: { pageSize: 5 } }),
          api.get('/jobs', { params: { pageSize: 5 } }),
        ]);

        // Wallet
        if (walletRes.status === 'fulfilled') {
          setStats(s => ({
            ...s,
            balance: Number(walletRes.value.data?.balance) || 0,
            held: Number(walletRes.value.data?.heldBalance) || 0,
          }));
        }

        // Projects
        if (projectsRes.status === 'fulfilled') {
          const items = projectsRes.value.data?.items || [];
          setProjects(items);
          setStats(s => ({ ...s, activeProjects: projectsRes.value.data?.totalItems || 0 }));
        } else {
          setProjects([{ id: 'mock-p1', title: 'Build AI Product UI/UX Interface Redesign', expertName: 'Alice Dev', status: 'ACTIVE', fundedMilestonesCount: 1, totalMilestonesCount: 2 }]);
          setStats(s => ({ ...s, activeProjects: 1 }));
        }

        // Jobs
        if (jobsRes.status === 'fulfilled') {
          const items = jobsRes.value.data?.items || [];
          setJobs(items);
          setStats(s => ({ ...s, openJobs: jobsRes.value.data?.totalItems || 0 }));
        } else {
          setJobs([
            { id: 'mock-j1', title: 'Mobile Fintech Wallet App iOS Development', status: 'OPEN', createdAt: new Date().toISOString() },
            { id: 'mock-j2', title: 'Web3 Escrow smart contracts auditing', status: 'DRAFT', createdAt: new Date().toISOString() },
          ]);
          setStats(s => ({ ...s, openJobs: 2 }));
        }
      } catch (err) {
        console.error('[ClientDashboard] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <ClientLayout>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '110px' }} />)}
          </div>
          <div className="skeleton skeleton-card" style={{ height: '300px' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: Briefcase, color: 'var(--accent)', bg: 'var(--accent-glow)', label: 'Active Job Posts', value: stats.openJobs },
              { icon: Activity, color: 'var(--warning)', bg: 'var(--warning-glow)', label: 'Active Projects', value: stats.activeProjects },
              { icon: Wallet, color: 'var(--success)', bg: 'var(--success-glow)', label: 'Available Wallet', value: formatCurrency(stats.balance) },
              { icon: CheckCircle, color: 'var(--danger)', bg: 'var(--danger-glow)', label: 'Locked Escrow', value: formatCurrency(stats.held) },
            ].map((m, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: m.bg, padding: '0.75rem', borderRadius: '12px', color: m.color }}>
                  <m.icon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem' }}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* AI CTA */}
          <div className="glass-panel glow-panel-indigo" style={{
            padding: '2.5rem', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, hsla(250, 89%, 65%, 0.15) 0%, hsla(222, 47%, 12%, 0.8) 100%)',
            border: '1px solid rgba(250, 89%, 65%, 0.25)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', maxWidth: '650px' }}>
              <div style={{ background: 'var(--accent)', padding: '1rem', borderRadius: '16px', color: '#fff', boxShadow: '0 4px 20px var(--accent-glow)' }}>
                <Bot size={36} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>Need an expert? Draft with Aivora AI</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Simply state what you want to achieve. The AI assistant will translate your goals into polished requirements, budgets, timelines, and milestones.
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/client/jobs/new')} className="btn btn-primary btn-lg" style={{ padding: '0.9rem 1.8rem', flexShrink: 0 }}>
              Launch AI Assistant <ArrowRight size={18} />
            </button>
          </div>

          {/* Projects & Jobs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '2rem' }}>
            {/* Active Projects */}
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
                  {projects.map(proj => (
                    <div key={proj.id} className="glass-card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{proj.title}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                            <UserCheck size={14} /> Expert: {proj.expertName}
                          </span>
                        </div>
                        <span className={`badge ${getProjectStatusBadge(proj.status)}`}>{getProjectStatusText(proj.status)}</span>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          <span>Milestone Escrow Progress</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{proj.fundedMilestonesCount} / {proj.totalMilestonesCount} Funded</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', background: 'var(--success)',
                            width: proj.totalMilestonesCount > 0 ? `${(proj.fundedMilestonesCount / proj.totalMilestonesCount) * 100}%` : '0%',
                            borderRadius: '3px', transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <Link to={`/client/projects/${proj.id}`} className="btn btn-secondary btn-sm">Manage Milestones</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Jobs */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} color="var(--accent)" /> Recent Job Posts
              </h2>
              {jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>You haven't posted any jobs yet.</p>
                  <button onClick={() => navigate('/client/jobs/new')} className="btn btn-secondary btn-sm">Post First Job</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {jobs.map(job => (
                    <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ overflow: 'hidden', paddingRight: '1rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 500, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{job.title}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Posted: {formatDate(job.createdAt)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                        <span className={`badge ${getJobStatusBadge(job.status)}`}>{getJobStatusText(job.status)}</span>
                        <Link to={`/client/jobs/${job.id}`} className="btn btn-secondary btn-sm">Review</Link>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <Link to="/client/jobs" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}>View All Listings</Link>
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
