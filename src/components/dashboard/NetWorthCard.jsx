import { usePortfolio } from '../../context/PortfolioContext';
import AnimatedNumber from '../ui/AnimatedNumber';
import { formatCurrency, formatPercent, getChangeColor } from '../../utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { generatePortfolioHistory } from '../../utils/calculations';
import { useMemo } from 'react';

export default function NetWorthCard() {
  const { state, computed } = usePortfolio();
  const { totalValue, totalPnL, totalPnLPercent, dailyChange } = computed;
  const isPositive = dailyChange.change >= 0;
  
  const sparklineData = useMemo(() => 
    generatePortfolioHistory(state.holdings, 7), 
    [state.holdings]
  );

  return (
    <div className="glass-card no-hover networth-card animate-fade-in-up stagger-1">
      <div className="networth-header">
        <span className="networth-label">Net Worth</span>
        <div className={`networth-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{formatPercent(dailyChange.changePercent)}</span>
          <span className="networth-change-label">today</span>
        </div>
      </div>
      
      <div className="networth-value">
        <AnimatedNumber value={totalValue} formatter={formatCurrency} />
      </div>
      
      <div className="networth-sparkline">
        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={sparklineData}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fill="url(#sparkGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="networth-footer">
        <div className="networth-stat">
          <span className="networth-stat-label">Total Invested</span>
          <span className="networth-stat-value">{formatCurrency(computed.totalInvested)}</span>
        </div>
        <div className="networth-stat">
          <span className="networth-stat-label">Total P&L</span>
          <span className={`networth-stat-value ${getChangeColor(totalPnL)}`}>
            {formatCurrency(totalPnL)} ({formatPercent(totalPnLPercent)})
          </span>
        </div>
      </div>
    </div>
  );
}
