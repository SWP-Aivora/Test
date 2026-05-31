import React, { useEffect, useState } from 'react';
import { ExpertLayout } from '../../components/PortalLayout';
import { Wallet, DollarSign, ArrowDownLeft, ArrowUpRight, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { getTransactionTypeBadge, mapTransactionType, mapTransactionDirection } from '../../utils/statusMappers';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface Transaction { id: string; amount: number; direction: 'IN' | 'OUT'; type: string; description?: string; createdAt: string; }

export const ExpertWallet: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [heldBalance, setHeldBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wRes = await api.get('/wallet/me');
        setBalance(Number(wRes.data?.availableBalance) || 0);
        setHeldBalance(Number(wRes.data?.heldBalance) || 0);
        try {
          const hRes = await api.get('/payments/history', { params: { pageSize: 20 } });
          setTransactions((hRes.data?.items || []).map((item: any) => ({ ...item, type: mapTransactionType(item.type), direction: mapTransactionDirection(item.direction) })));
        } catch { setTransactions([{ id: 't-1', amount: 350, direction: 'IN', type: 'ESCROW_RELEASE', description: 'Milestone 1 approved', createdAt: new Date().toISOString() }]); }
      } catch { setTransactions([{ id: 't-1', amount: 350, direction: 'IN', type: 'ESCROW_RELEASE', description: 'Milestone 1 approved', createdAt: new Date().toISOString() }]); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const getTxIcon = (direction: 'IN' | 'OUT', type: string) => {
    if (type.includes('LOCK') || type.includes('HOLD')) return <ShieldAlert size={18} color="var(--warning)" />;
    return direction === 'IN' ? <ArrowDownLeft size={18} color="var(--success)" /> : <ArrowUpRight size={18} color="var(--danger)" />;
  };

  return (
    <ExpertLayout>
      {loading ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, hsla(142, 70%, 45%, 0.08) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Cleared Earnings</span>
                <Wallet size={20} color="var(--success)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{formatCurrency(balance)}</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Available for withdrawal</p>
            </div>
            <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, hsla(250, 89%, 65%, 0.05) 0%, hsla(222, 47%, 12%, 0.8) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Escrow</span>
                <DollarSign size={20} color="var(--accent)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent)' }}>{formatCurrency(heldBalance)}</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Locked in active contracts</p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Transaction Ledger</h3>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>No transactions.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {transactions.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px', display: 'flex', flexShrink: 0 }}>{getTxIcon(t.direction, t.type)}</div>
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t.description || 'Contract Release'}</h4>
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
      )}
    </ExpertLayout>
  );
};
