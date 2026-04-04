import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatPercent, getChangeColor } from '../../utils/formatters';
import { ASSET_TYPE_LABELS } from '../../services/mockData';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function PnLCard() {
  const { computed } = usePortfolio();
  const { dailyChange, typeAllocations } = computed;
  const isPositive = dailyChange.change >= 0;

  return (
    <div className="glass-card no-hover pnl-card animate-fade-in-up stagger-2">
      <div className="pnl-header">
        <span className="pnl-label">Today's P&L</span>
        <div className={`pnl-icon ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
        </div>
      </div>
      
      <div className={`pnl-value ${getChangeColor(dailyChange.change)}`}>
        {dailyChange.change >= 0 ? '+' : ''}{formatCurrency(dailyChange.change)}
      </div>
      
      <div className={`pnl-percent ${getChangeColor(dailyChange.changePercent)}`}>
        {formatPercent(dailyChange.changePercent)}
      </div>
      
      <div className="pnl-breakdown">
        {Object.entries(typeAllocations).map(([type, data]) => {
          // Simulate per-type daily change
          const typeChange = (Math.random() - 0.4) * 2;
          return (
            <div key={type} className="pnl-breakdown-item">
              <span className="pnl-breakdown-label">{ASSET_TYPE_LABELS[type] || type}</span>
              <span className={`pnl-breakdown-value ${getChangeColor(typeChange)}`}>
                {formatPercent(typeChange)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
