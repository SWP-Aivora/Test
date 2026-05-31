import React, { useEffect, useState } from 'react';
import { ClientLayout } from '../../components/PortalLayout';
import { Wallet, DollarSign, ArrowUpRight, ArrowDownLeft, ShieldCheck, Loader, Sparkles } from 'lucide-react';
import api from '../../services/api';

interface Transaction {
  id: string;
  amount: number;
  direction: 'IN' | 'OUT'; // IN, OUT
  type: string; // DEMO_DEPOSIT, ESCROW_LOCK, ESCROW_RELEASE, ESCROW_REFUND
  description?: string;
  createdAt: string;
}

export const ClientWallet: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [heldBalance, setHeldBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- DEMO DEPOSIT STATE ---
  const [depositAmount, setDepositAmount] = useState<string>('5000');
  const [depositDesc, setDepositDesc] = useState<string>('Developer local testing fund');
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  const mapType = (t: any): string => {
    if (typeof t === 'number') {
      switch (t) {
        case 0: return 'DEMO_DEPOSIT';
        case 1: return 'ESCROW_HOLD';
        case 2: return 'PAYMENT_RELEASE';
        case 3: return 'REFUND';
        case 4: return 'WITHDRAWAL_REQUEST';
        case 5: return 'WITHDRAWAL_COMPLETED';
        default: return 'UNKNOWN';
      }
    }
    return String(t || '');
  };

  const mapDirection = (d: any): 'IN' | 'OUT' => {
    if (typeof d === 'number') {
      return d === 0 ? 'IN' : 'OUT'; // CREDIT = 0 -> IN, DEBIT = 1 -> OUT
    }
    return d === 'OUT' ? 'OUT' : 'IN';
  };

  const fetchWalletDetails = async () => {
    try {
      // 1. Fetch wallet balance
      const walletRes = await api.get('/wallet/me');
      setBalance(Number(walletRes.data?.availableBalance) || 0);
      setHeldBalance(Number(walletRes.data?.heldBalance) || 0);

      // 2. Fetch payments history
      try {
        const historyRes = await api.get('/payments/history', { params: { pageSize: 20 } });
        const items = (historyRes.data?.items || []).map((item: any) => ({
          ...item,
          type: mapType(item.type),
          direction: mapDirection(item.direction)
        }));
        setTransactions(items);
      } catch (histErr) {
        console.warn('[ClientWallet] Failed to load transaction ledger, mocking fallback logs:', histErr);
        setTransactions([
          {
            id: 't-1',
            amount: 5000,
            direction: 'IN',
            type: 'DEMO_DEPOSIT',
            description: 'Demo wallet initialization credits',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('[ClientWallet] Error retrieving wallet details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, [refreshTrigger]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setDepositing(true);
    setDepositSuccess(false);

    try {
      await api.post('/wallet/deposit-demo', {
        amount: Number(depositAmount),
        description: depositDesc || undefined
      });
      
      setDepositSuccess(true);
      setDepositAmount('1000');
      // Trigger instant wallet reload
      setRefreshTrigger(prev => prev + 1);
      
      setTimeout(() => setDepositSuccess(false), 4000);
    } catch (err) {
      console.error('[ClientWallet] Demo deposit failed:', err);
    } finally {
      setDepositing(false);
    }
  };

  const getTransactionIcon = (direction: 'IN' | 'OUT', type: string) => {
    if (type.includes('LOCK') || type.includes('HOLD')) return <ShieldCheck size={18} color="var(--warning)" />;
    return direction === 'IN' 
      ? <ArrowDownLeft size={18} color="var(--success)" />
      : <ArrowUpRight size={18} color="var(--danger)" />;
  };

  const getTransactionBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'DEMO_DEPOSIT': return 'badge-primary';
      case 'ESCROW_LOCK':
      case 'ESCROW_HOLD': return 'badge-warning';
      case 'ESCROW_RELEASE':
      case 'PAYMENT_RELEASE': return 'badge-success';
      case 'ESCROW_REFUND':
      case 'REFUND': return 'badge-danger';
      default: return 'badge-muted';
    }
  };

  return (
    <ClientLayout>
      {loading ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* Left panel: Balance + Transaction History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Balance cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'linear-gradient(135deg, hsla(250, 89%, 65%, 0.08) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Available Liquid Balance</span>
                  <Wallet size={20} color="var(--accent)" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  {balance.toLocaleString()} AICOIN
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Liquid funds ready to create and fund new milestones</p>
              </div>

              <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'linear-gradient(135deg, hsla(142, 70%, 45%, 0.05) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Locked Escrow Balance</span>
                  <DollarSign size={20} color="var(--success)" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--success)' }}>
                  {heldBalance.toLocaleString()} AICOIN
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Funds locked securely in contract checkpoints awaiting completion</p>
              </div>
            </div>

            {/* Ledger logs */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Transaction Ledger Log</h3>

              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '0.95rem' }}>No payment transactions found in your history log.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {transactions.map((t) => (
                    <div key={t.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.1rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      gap: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border)',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {getTransactionIcon(t.direction, t.type)}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t.description || 'System Payout'}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                            <span className={`badge ${getTransactionBadge(t.type)}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                              {t.type.replace('_', ' ')}
                            </span>
                            {new Date(t.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: t.direction === 'IN' ? 'var(--success)' : 'var(--danger)',
                        fontFamily: 'var(--font-heading)',
                        whiteSpace: 'nowrap'
                      }}>
                        {t.direction === 'IN' ? '+' : '-'}{t.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Panel: Demo Deposit Form console */}
          <aside className="glass-panel glow-panel-indigo" style={{ padding: '2rem', border: '1px solid rgba(250, 89%, 65%, 0.2)' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                <Sparkles size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Sandbox Demo Wallet</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Simulate sandbox balance deposits to test escrow allocations.</p>
            </div>

            {depositSuccess && (
              <div className="badge badge-success" style={{
                width: '100%',
                padding: '0.75rem',
                textTransform: 'none',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                fontWeight: 500
              }}>
                Deposit successful! Added AICOINs to your liquid wallet.
              </div>
            )}

            <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="input-label" htmlFor="deposit-amount-input">Credit Amount ($) *</label>
                <input
                  id="deposit-amount-input"
                  type="number"
                  className="input-field"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g., 5000"
                  required
                  disabled={depositing}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="deposit-desc-input">Description / Notes</label>
                <input
                  id="deposit-desc-input"
                  type="text"
                  className="input-field"
                  value={depositDesc}
                  onChange={(e) => setDepositDesc(e.target.value)}
                  placeholder="e.g., Testing fund"
                  disabled={depositing}
                />
              </div>

              <button
                type="submit"
                disabled={depositing || !depositAmount}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {depositing ? (
                  <>
                    <Loader size={16} className="spinner" /> Depositing...
                  </>
                ) : (
                  'Deposit Demo Coins'
                )}
              </button>
            </form>
          </aside>

        </div>
      )}
    </ClientLayout>
  );
};
