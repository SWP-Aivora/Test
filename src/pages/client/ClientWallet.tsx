import React, { useEffect, useState } from 'react';
import { ClientLayout } from '../../components/PortalLayout';
import { useToast } from '../../context/ToastContext';
import { Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, Loader, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { getTransactionTypeBadge, mapTransactionType, mapTransactionDirection } from '../../utils/statusMappers';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface Transaction { id: string; amount: number; direction: 'IN' | 'OUT'; type: string; description?: string; createdAt: string; }

export const ClientWallet: React.FC = () => {
  const { showToast } = useToast();
  const [balance, setBalance] = useState(0);
  const [heldBalance, setHeldBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [depositAmount, setDepositAmount] = useState('5000');
  const [depositDesc, setDepositDesc] = useState('Developer local testing fund');
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  const fetchWallet = async () => {
    try {
      const wRes = await api.get('/wallet/me');
      setBalance(Number(wRes.data?.availableBalance) || 0);
      setHeldBalance(Number(wRes.data?.heldBalance) || 0);
      try {
        const hRes = await api.get('/payments/history', { params: { pageSize: 20 } });
        setTransactions((hRes.data?.items || []).map((item: any) => ({ ...item, type: mapTransactionType(item.type), direction: mapTransactionDirection(item.direction) })));
      } {
        setTransactions([{ id: 't-1', amount: 5000, direction: 'IN', type: 'DEMO_DEPOSIT', description: 'Demo wallet initialization', createdAt: new Date(Date.now() - 86400000).toISOString() }]);
      }
    } catch { setTransactions([{ id: 't-1', amount: 5000, direction: 'IN', type: 'DEMO_DEPOSIT', description: 'Demo wallet initialization', createdAt: new Date(Date.now() - 86400000).toISOString() }]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWallet(); }, [refreshTrigger]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setDepositing(true);
    setDepositSuccess(false);
    try {
      await api.post('/wallet/deposit-demo', { amount: Number(depositAmount), description: depositDesc || undefined });
      setDepositSuccess(true);
      setDepositAmount('1000');
      setRefreshTrigger(p => p + 1);
      showToast('success', 'Deposit successful!');
      setTimeout(() => setDepositSuccess(false), 4000);
    } catch (err: any) { showToast('error', err?.message || 'Deposit failed.'); }
    finally { setDepositing(false); }
  };

  const getTxIcon = (direction: 'IN' | 'OUT', type: string) => {
    if (type.includes('LOCK') || type.includes('HOLD')) return <ShieldCheck size={18} color="var(--warning)" />;
    return direction === 'IN' ? <ArrowDownLeft size={18} color="var(--success)" /> : <ArrowUpRight size={18} color="var(--danger)" />;
  };

  return (
    <ClientLayout>
      {loading ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, hsla(250, 89%, 65%, 0.08) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Available Balance</span>
                  <Wallet size={20} color="var(--accent)" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{formatCurrency(balance)}</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ready to fund milestones</p>
              </div>
              <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, hsla(142, 70%, 45%, 0.05) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Locked Escrow</span>
                  <ShieldCheck size={20} color="var(--success)" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--success)' }}>{formatCurrency(heldBalance)}</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Funds in contract checkpoints</p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Transaction Ledger</h3>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>No transactions found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {transactions.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px', display: 'flex', flexShrink: 0 }}>{getTxIcon(t.direction, t.type)}</div>
                        <div style={{ overflow: 'hidden' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t.description || 'System Payout'}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                            <span className={`badge ${getTransactionTypeBadge(t.type)}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>{t.type.replace(/_/g, ' ')}</span>
                            {formatDateTime(t.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: t.direction === 'IN' ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' }}>
                        {t.direction === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="glass-panel glow-panel-indigo" style={{ padding: '2rem', border: '1px solid rgba(250, 89%, 65%, 0.2)' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginBottom: '0.25rem' }}><Sparkles size={18} color="var(--accent)" /><h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Sandbox Demo</h3></div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Simulate deposits to test escrow.</p>
            </div>
            {depositSuccess && <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', textTransform: 'none', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 500 }}>Deposit successful!</div>}
            <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="input-label">Amount ($) *</label>
                <input type="number" className="input-field" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="e.g., 5000" required disabled={depositing} />
              </div>
              <div>
                <label className="input-label">Description</label>
                <input type="text" className="input-field" value={depositDesc} onChange={(e) => setDepositDesc(e.target.value)} placeholder="e.g., Testing fund" disabled={depositing} />
              </div>
              <button type="submit" disabled={depositing || !depositAmount} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                {depositing ? <><Loader size={16} className="spinner" /> Depositing...</> : 'Deposit Demo Coins'}
              </button>
            </form>
          </aside>
        </div>
      )}
    </ClientLayout>
  );
};
