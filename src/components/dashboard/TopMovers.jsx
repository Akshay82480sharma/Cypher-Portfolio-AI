import { useMemo } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { calculatePnLPercent } from '../../utils/calculations';
import { formatCurrency, formatPercent, getChangeColor } from '../../utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TopMovers() {
  const { state } = usePortfolio();

  const { gainers, losers } = useMemo(() => {
    const sorted = [...state.holdings].map(h => ({
      ...h,
      dailyChangePct: h.previousClose ? ((h.currentPrice - h.previousClose) / h.previousClose) * 100 : 0,
      dailyChange: h.previousClose ? (h.currentPrice - h.previousClose) * h.quantity : 0,
    })).sort((a, b) => b.dailyChangePct - a.dailyChangePct);

    return {
      gainers: sorted.filter(h => h.dailyChangePct > 0).slice(0, 3),
      losers: sorted.filter(h => h.dailyChangePct < 0).slice(-3).reverse(),
    };
  }, [state.holdings]);

  return (
    <div className="glass-card no-hover topmovers-card animate-fade-in-up stagger-5">
      <h3 className="card-title">Top Movers Today</h3>
      
      <div className="topmovers-sections">
        <div className="topmovers-section">
          <div className="topmovers-section-header">
            <TrendingUp size={14} className="text-gain" />
            <span className="topmovers-section-label text-gain">Gainers</span>
          </div>
          {gainers.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2)' }}>No gainers today</p>
          ) : (
            gainers.map(h => (
              <div key={h.id} className="topmovers-item">
                <div className="topmovers-info">
                  <span className="topmovers-symbol">{h.symbol.replace('.NS', '')}</span>
                  <span className="topmovers-name">{h.name}</span>
                </div>
                <div className="topmovers-values">
                  <span className="topmovers-price">{formatCurrency(h.currentPrice)}</span>
                  <span className="topmovers-change text-gain">{formatPercent(h.dailyChangePct)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="topmovers-divider" />

        <div className="topmovers-section">
          <div className="topmovers-section-header">
            <TrendingDown size={14} className="text-loss" />
            <span className="topmovers-section-label text-loss">Losers</span>
          </div>
          {losers.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2)' }}>No losers today</p>
          ) : (
            losers.map(h => (
              <div key={h.id} className="topmovers-item">
                <div className="topmovers-info">
                  <span className="topmovers-symbol">{h.symbol.replace('.NS', '')}</span>
                  <span className="topmovers-name">{h.name}</span>
                </div>
                <div className="topmovers-values">
                  <span className="topmovers-price">{formatCurrency(h.currentPrice)}</span>
                  <span className="topmovers-change text-loss">{formatPercent(h.dailyChangePct)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
