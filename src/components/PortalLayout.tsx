import React, { useEffect, useState, useCallback, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Briefcase, Wallet, MessageSquare,
  User, LogOut, Sparkles, Bot, Scale, DollarSign, Menu, X
} from 'lucide-react';
import api from '../services/api';

// Dynamic Wallet balance checker for top bars
export const WalletCounter: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [heldBalance, setHeldBalance] = useState<number>(0);
  const cacheTime = useRef<number>(0);

  const fetchBalance = useCallback(async () => {
    // Cache for 30 seconds to prevent excessive API calls
    const now = Date.now();
    if (now - cacheTime.current < 30000 && cacheTime.current > 0) return;

    try {
      const response = await api.get('/wallet/me');
      if (response.data) {
        setBalance(Number(response.data.balance) || 0);
        setHeldBalance(Number(response.data.heldBalance) || 0);
        cacheTime.current = now;
      }
    } catch {
      // Silently fail — wallet balance is non-critical
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 60000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

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

const SidebarBrand: React.FC<{ role: string; badgeClass: string }> = ({ role, badgeClass }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem' }}>
    <div style={{ background: 'var(--accent)', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
      <Sparkles size={16} color="#fff" />
    </div>
    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem' }}>AIVORA</span>
    <span className={`badge ${badgeClass}`} style={{ fontSize: '0.55rem', padding: '0.15rem 0.4rem' }}>{role}</span>
  </div>
);

const UserInfo: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'var(--border)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', overflow: 'hidden',
        }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={18} color="var(--text-secondary)" />
          )}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{user.fullName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{user.email}</div>
        </div>
      </div>
      <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
};

const MobileNavHeader: React.FC<{ role: string; badgeClass: string; onMenuClick: () => void }> = ({ role, badgeClass, onMenuClick }) => (
  <div className="mobile-header">
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ background: 'var(--accent)', padding: '0.35rem', borderRadius: '6px', display: 'flex' }}>
        <Sparkles size={14} color="#fff" />
      </div>
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem' }}>AIVORA</span>
      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.5rem', padding: '0.1rem 0.35rem' }}>{role}</span>
    </div>
    <button className="mobile-menu-btn" onClick={onMenuClick}>
      <Menu size={20} />
    </button>
  </div>
);

// ==========================================
// CLIENT PORTAL LAYOUT
// ==========================================
export const ClientLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'CLIENT') navigate('/login');
  }, [user, navigate]);

  if (!user) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );

  const navItems = [
    { to: '/client/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/client/jobs', icon: Briefcase, label: 'Manage Jobs' },
    { to: '/client/jobs/new', icon: Bot, label: 'AI Job Creator' },
    { to: '/chat', icon: MessageSquare, label: 'Real-time Chat' },
    { to: '/client/wallet', icon: Wallet, label: 'Wallet & Coins' },
  ];

  return (
    <div className="dashboard-grid">
      {/* Mobile header */}
      <MobileNavHeader role="CLIENT" badgeClass="badge-primary" onMenuClick={() => setSidebarOpen(true)} />

      {/* Mobile overlay */}
      <div className={`mobile-nav-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" style={{ display: 'none' }} onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <SidebarBrand role="CLIENT" badgeClass="badge-primary" />
          <nav>
            <ul className="nav-list">
              {navItems.map(item => (
                <li key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    <item.icon size={18} /> {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <UserInfo />
      </aside>

      <main className="main-content">
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
// EXPERT PORTAL LAYOUT
// ==========================================
export const ExpertLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'EXPERT') navigate('/login');
  }, [user, navigate]);

  if (!user) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );

  const navItems = [
    { to: '/expert/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expert/jobs', icon: Briefcase, label: 'Find Work' },
    { to: '/chat', icon: MessageSquare, label: 'Real-time Chat' },
    { to: '/expert/wallet', icon: Wallet, label: 'Earnings & Wallet' },
    { to: '/expert/profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="dashboard-grid">
      <MobileNavHeader role="EXPERT" badgeClass="badge-success" onMenuClick={() => setSidebarOpen(true)} />
      <div className={`mobile-nav-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" style={{ display: 'none' }} onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <SidebarBrand role="EXPERT" badgeClass="badge-success" />
          <nav>
            <ul className="nav-list">
              {navItems.map(item => (
                <li key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    <item.icon size={18} /> {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <UserInfo />
      </aside>

      <main className="main-content">
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
// ADMIN PORTAL LAYOUT
// ==========================================
export const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') navigate('/login');
  }, [user, navigate]);

  if (!user) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/dashboard', icon: Scale, label: 'Dispute Center' },
  ];

  return (
    <div className="dashboard-grid">
      <MobileNavHeader role="ADMIN" badgeClass="badge-danger" onMenuClick={() => setSidebarOpen(true)} />
      <div className={`mobile-nav-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" style={{ display: 'none' }} onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <SidebarBrand role="ADMIN" badgeClass="badge-danger" />
          <nav>
            <ul className="nav-list">
              {navItems.map((item, i) => (
                <li key={i}>
                  <NavLink to={item.to} className="nav-link active" onClick={() => setSidebarOpen(false)}>
                    <item.icon size={18} /> {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <UserInfo />
      </aside>

      <main className="main-content">
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
