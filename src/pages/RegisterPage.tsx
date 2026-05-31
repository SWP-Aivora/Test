import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Mail, Lock, Briefcase, Award, AlertCircle, Loader } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'EXPERT'>('CLIENT');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const registeredRole = await register(fullName, email, role, password);
      if (registeredRole === 'CLIENT') {
        navigate('/client/dashboard');
      } else {
        navigate('/expert/dashboard');
      }
    } catch (err: any) {
      console.error('[Register] Error during user registration:', err);
      setError(err?.message || 'Registration failed. This email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative'
    }}>
      {/* Background radial overlay */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        opacity: 0.1,
        bottom: '15%',
        right: '20%',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '500px',
        padding: '2.5rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
        zIndex: 1,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <div style={{
              background: 'var(--accent)',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 0 10px var(--accent-glow)'
            }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.3rem',
              fontWeight: 800,
              letterSpacing: '-0.03em'
            }}>AIVORA</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Create Account</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Register to post projects or monetize your expertise</p>
        </div>

        {/* Error wrapper */}
        {error && (
          <div className="badge badge-danger" style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            textTransform: 'none',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            fontWeight: 500
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Dual-Role Selector cards */}
          <div>
            <label className="input-label">Select Your Account Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
              <div
                onClick={() => !loading && setRole('CLIENT')}
                className={`glass-panel ${role === 'CLIENT' ? 'active-role' : ''}`}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: role === 'CLIENT' ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: role === 'CLIENT' ? 'var(--accent-glow)' : 'hsla(222, 47%, 14%, 0.2)',
                  transition: 'var(--transition)'
                }}
              >
                <Briefcase size={20} color={role === 'CLIENT' ? 'var(--accent)' : 'var(--text-secondary)'} style={{ marginBottom: '0.4rem', margin: '0 auto 0.4rem auto' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: role === 'CLIENT' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Client</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>I want to hire & post jobs</div>
              </div>

              <div
                onClick={() => !loading && setRole('EXPERT')}
                className={`glass-panel ${role === 'EXPERT' ? 'active-role' : ''}`}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: role === 'EXPERT' ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: role === 'EXPERT' ? 'var(--accent-glow)' : 'hsla(222, 47%, 14%, 0.2)',
                  transition: 'var(--transition)'
                }}
              >
                <Award size={20} color={role === 'EXPERT' ? 'var(--accent)' : 'var(--text-secondary)'} style={{ marginBottom: '0.4rem', margin: '0 auto 0.4rem auto' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: role === 'EXPERT' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Expert</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>I want to apply & earn coins</div>
              </div>
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="name-input">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-secondary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="name-input"
                type="text"
                placeholder="John Doe"
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="email-register">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-secondary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="email-register"
                type="email"
                placeholder="john@example.com"
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="password-register">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-secondary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="password-register"
                type="password"
                placeholder="At least 6 characters"
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={18} className="spinner" style={{ animationDuration: '0.8s', width: '18px', height: '18px' }} /> Creating Workspace...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Log in</Link>
        </div>
      </div>
    </div>
  );
};
