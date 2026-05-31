import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const role = await login(email, password);
      // Dynamic routing based on logged-in role
      if (role === 'CLIENT') {
        navigate('/client/dashboard');
      } else if (role === 'EXPERT') {
        navigate('/expert/dashboard');
      } else if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('[Login] Error during authentication:', err);
      setError(err?.message || 'Invalid credentials. Please verify and try again.');
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
      {/* Visual background details */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
        opacity: 0.12,
        top: '20%',
        left: '25%',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '3rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
        zIndex: 1,
        position: 'relative'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <div style={{
              background: 'var(--accent)',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 0 10px var(--accent-glow)'
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.4rem',
              fontWeight: 800,
              letterSpacing: '-0.03em'
            }}>AIVORA</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Log in to secure milestone-based project workspace</p>
        </div>

        {/* Error notification block */}
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
            marginBottom: '1.5rem',
            fontWeight: 500
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="input-label" htmlFor="email-input">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-secondary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="email-input"
                type="email"
                placeholder="you@domain.com"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="input-label" htmlFor="password-input" style={{ marginBottom: 0 }}>Password</label>
              <a href="#" style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500 }}>Forgot password?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-secondary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="password-input"
                type="password"
                placeholder="••••••••••••"
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
                <Loader size={18} className="spinner" style={{ animationDuration: '0.8s', width: '18px', height: '18px' }} /> Authenticating...
              </>
            ) : (
              'Access Account'
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          New to Aivora? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create an account</Link>
        </div>
      </div>
    </div>
  );
};
