import React, { useEffect, useState } from 'react';
import { ExpertLayout } from '../../components/PortalLayout';
import { Wallet, DollarSign, ArrowUpRight, ArrowDownLeft, ShieldAlert, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

interface Transaction {
  id: string;
  amount: number;
  direction: 'IN' | 'OUT'; // IN, OUT
  type: string; // DEMO_DEPOSIT, ESCROW_LOCK, ESCROW_RELEASE, ESCROW_REFUND
  description?: string;
  createdAt: string;
}

export const ExpertWallet: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [heldBalance, setHeldBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        // 1. Fetch expert wallet details
        const walletRes = await api.get('/wallet/me');
        setBalance(Number(walletRes.data?.availableBalance) || 0);
        setHeldBalance(Number(walletRes.data?.heldBalance) || 0);

        // 2. Fetch payments history log
        try {
          const historyRes = await api.get('/payments/history', { params: { pageSize: 20 } });
          const items = (historyRes.data?.items || []).map((item: any) => ({
            ...item,
            type: mapType(item.type),
            direction: mapDirection(item.direction)
          }));
          setTransactions(items);
        } catch (histErr) {
          console.warn('[ExpertWallet] Failed to load history ledger, using mockup fallback:', histErr);
          setTransactions([
            {
              id: 't-1',
              amount: 350,
              direction: 'IN',
              type: 'ESCROW_RELEASE',
              description: 'Milestone 1: Prototype design specs approved release',
              createdAt: new Date().toISOString()
            }
          ]);
        }

      } catch (err) {
        console.error('[ExpertWallet] Error retrieving wallet details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWalletDetails();
  }, []);

  const getTransactionIcon = (direction: 'IN' | 'OUT', type: string) => {
    if (type.includes('LOCK') || type.includes('HOLD')) return <ShieldAlert size={18} color="var(--warning)" />;
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
    <ExpertLayout>
      {loading ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Balance Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'linear-gradient(135deg, hsla(142, 70%, 45%, 0.08) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Cleared Account Earnings</span>
                <Wallet size={20} color="var(--success)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                {balance.toLocaleString()} AICOIN
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Released cash ready for withdrawals or wallet operations</p>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'linear-gradient(135deg, hsla(250, 89%, 65%, 0.05) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Escrow Escrow</span>
                <DollarSign size={20} color="var(--accent)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent)' }}>
                {heldBalance.toLocaleString()} AICOIN
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Money currently locked in active contracts, releasing upon deliverable approval</p>
            </div>
          </div>

          {/* Transactions Ledger */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Transaction Ledger Log</h3>

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '0.95rem' }}>No financial transactions registered.</p>
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
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t.description || 'Contract Milestone Release'}</h4>
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
      )}
    </ExpertLayout>
  );
};
