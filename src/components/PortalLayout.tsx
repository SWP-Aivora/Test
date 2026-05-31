import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  Wallet, 
  MessageSquare, 
  User, 
  LogOut, 
  Sparkles, 
  Bot, 
  Scale,
  DollarSign
} from 'lucide-react';
import api from '../services/api';

// Dynamic Wallet balance checker for top bars
export const WalletCounter: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
  const [balance, setBalance] = useState<number>(0);
  const [heldBalance, setHeldBalance] = useState<number>(0);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get('/wallet/me');
        if (response.data) {
          setBalance(Number(response.data.balance) || 0);
          setHeldBalance(Number(response.data.heldBalance) || 0);
        }
      } catch (err) {
        console.warn('[WalletCounter] Failed to retrieve balance:', err);
      }
    };
    fetchBalance();
  }, [refreshTrigger]);

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <div className="badge badge-success" style={{ padding: '0.4rem 0.8rem', fontWeight: 600 }}>
        <DollarSign size={14} /> {balance.toLocaleString()} AICOIN
      </div>
      {heldBalance > 0 && (
        <div className="badge badge-warning" style={{ padding: '0.4rem 0.8rem', fontWeight: 600 }}>
          Held: {heldBalance.toLocaleString()}
        </div>
      )}
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

// ==========================================
// 1. CLIENT PORTAL LAYOUT
// ==========================================
export const ClientLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Role Guard
  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/login');
      else if (user.role !== 'CLIENT') navigate('/expert/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== 'CLIENT') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <aside className="sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem' }}>
            <div style={{ background: 'var(--accent)', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem' }}>AIVORA</span>
            <span className="badge badge-primary" style={{ fontSize: '0.55rem', padding: '0.15rem 0.4rem' }}>CLIENT</span>
          </div>

          {/* Navigation Links */}
          <nav>
            <ul className="nav-list">
              <li>
                <NavLink to="/client/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={18} /> Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/client/jobs" className={({ isActive }) => `nav-link ${isActive || location.pathname.includes('/client/jobs') ? 'active' : ''}`}>
                  <Briefcase size={18} /> Manage Jobs
                </NavLink>
              </li>
              <li>
                <NavLink to="/client/jobs/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Bot size={18} /> AI Job Creator
                </NavLink>
              </li>
              <li>
                <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <MessageSquare size={18} /> Real-time Chat
                </NavLink>
              </li>
              <li>
                <NavLink to="/client/wallet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Wallet size={18} /> Wallet & Coins
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {/* Footer Profile logout */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={18} color="var(--text-secondary)" />
              )}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* Header toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Client Control Center</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Welcome back, {user.fullName.split(' ')[0]}</span>
          </div>
          <WalletCounter />
        </div>
        {children}
      </main>
    </div>
  );
};

// ==========================================
// 2. EXPERT PORTAL LAYOUT
// ==========================================
export const ExpertLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Role Guard
  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/login');
      else if (user.role !== 'EXPERT') navigate('/client/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== 'EXPERT') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <aside className="sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem' }}>
            <div style={{ background: 'var(--accent)', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem' }}>AIVORA</span>
            <span className="badge badge-success" style={{ fontSize: '0.55rem', padding: '0.15rem 0.4rem' }}>EXPERT</span>
          </div>

          {/* Navigation Links */}
          <nav>
            <ul className="nav-list">
              <li>
                <NavLink to="/expert/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={18} /> Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/expert/jobs" className={({ isActive }) => `nav-link ${isActive || location.pathname.includes('/expert/jobs') ? 'active' : ''}`}>
                  <Briefcase size={18} /> Find Work
                </NavLink>
              </li>
              <li>
                <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <MessageSquare size={18} /> Real-time Chat
                </NavLink>
              </li>
              <li>
                <NavLink to="/expert/wallet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Wallet size={18} /> Earnings & Wallet
                </NavLink>
              </li>
              <li>
                <NavLink to="/expert/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <User size={18} /> My Profile
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {/* Footer Profile logout */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={18} color="var(--text-secondary)" />
              )}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* Header toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Expert Workstation</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Welcome back, {user.fullName.split(' ')[0]}</span>
          </div>
          <WalletCounter />
        </div>
        {children}
      </main>
    </div>
  );
};

// ==========================================
// 3. ADMIN PORTAL LAYOUT
// ==========================================
export const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Role Guard
  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/login');
      else if (user.role !== 'ADMIN') navigate('/client/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <aside className="sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem' }}>
            <div style={{ background: 'var(--accent)', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem' }}>AIVORA</span>
            <span className="badge badge-danger" style={{ fontSize: '0.55rem', padding: '0.15rem 0.4rem' }}>ADMIN</span>
          </div>

          {/* Navigation Links */}
          <nav>
            <ul className="nav-list">
              <li>
                <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={18} /> Overview
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/dashboard" className="nav-link active">
                  <Scale size={18} /> Dispute Center
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {/* Footer Profile logout */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={18} color="var(--text-secondary)" />
              )}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>System Manager</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* Header toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Admin Command Cockpit</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>System Overseer Dashboard</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};
