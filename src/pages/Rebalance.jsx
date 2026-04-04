import { useMemo, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { calculateRebalance } from '../services/rebalanceEngine';
import { suggestTargetAllocation } from '../services/aiEngine';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from '../services/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { RefreshCw, ArrowRight, ArrowDown, ArrowUp } from 'lucide-react';
import './Rebalance.css';

export default function Rebalance() {
  const { state } = usePortfolio();
  const [riskProfile, setRiskProfile] = useState('moderate');

  const targetAllocation = useMemo(() => suggestTargetAllocation(riskProfile), [riskProfile]);
  const rebalanceData = useMemo(() => calculateRebalance(state.holdings, targetAllocation), [state.holdings, targetAllocation]);

  const chartData = rebalanceData.comparison.map(c => ({
    name: c.label,
    current: c.currentPct,
    target: c.targetPct,
    type: c.type,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <span className="chart-tooltip-label">{label}</span>
        {payload.map((p, i) => (
          <div key={i} className="chart-tooltip-row">
            <span style={{ color: p.color }}>●</span>
            <span>{p.name}: {p.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container rebalance-page">
      <div className="page-header">
        <h1>Rebalance</h1>
        <p>Optimize your portfolio allocation</p>
      </div>

      {/* Risk Profile Selector */}
      <div className="glass-card no-hover profile-selector animate-fade-in-up stagger-1">
        <h3 className="card-title">Risk Profile</h3>
        <div className="profile-options">
          {['conservative', 'moderate', 'aggressive'].map(profile => (
            <button
              key={profile}
              className={`profile-btn ${riskProfile === profile ? 'active' : ''}`}
              onClick={() => setRiskProfile(profile)}
            >
              <span className="profile-btn-name">{profile.charAt(0).toUpperCase() + profile.slice(1)}</span>
              <span className="profile-btn-desc">
                {profile === 'conservative' ? 'Lower risk, stable returns' :
                 profile === 'moderate' ? 'Balanced risk & reward' :
                 'Higher risk, growth focus'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rebalance-grid">
        {/* Chart Comparison */}
        <div className="glass-card no-hover rebalance-chart-card animate-fade-in-up stagger-2">
          <h3 className="card-title">Current vs Target Allocation</h3>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Bar dataKey="current" name="Current" radius={[4, 4, 0, 0]} fill="#3b82f6" opacity={0.8} />
                <Bar dataKey="target" name="Target" radius={[4, 4, 0, 0]} fill="#8b5cf6" opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="drift-indicator">
            <span className="drift-label">Total Drift:</span>
            <span className={`drift-value ${rebalanceData.totalDrift > 15 ? 'text-loss' : rebalanceData.totalDrift > 8 ? 'text-warning' : 'text-gain'}`}>
              {rebalanceData.totalDrift.toFixed(1)}%
            </span>
            <span className={`badge ${rebalanceData.isRebalanceNeeded ? 'badge-warning' : 'badge-buy'}`}>
              {rebalanceData.isRebalanceNeeded ? 'Rebalance Needed' : 'Looking Good'}
            </span>
          </div>
        </div>

        {/* Allocation Comparison Table */}
        <div className="glass-card no-hover comparison-card animate-fade-in-up stagger-3">
          <h3 className="card-title">Allocation Breakdown</h3>
          <div className="comparison-list">
            {rebalanceData.comparison.map(comp => (
              <div key={comp.type} className="comparison-item">
                <div className="comparison-header">
                  <div className="comparison-type">
                    <span className="comparison-dot" style={{ background: ASSET_TYPE_COLORS[comp.type] }} />
                    <span className="comparison-label">{comp.label}</span>
                  </div>
                  <span className={`badge badge-${comp.action.toLowerCase()}`}>{comp.action}</span>
                </div>
                <div className="comparison-bars">
                  <div className="comparison-bar-row">
                    <span className="comparison-bar-label">Current</span>
                    <div className="comparison-bar-track">
                      <div className="comparison-bar-fill" style={{ width: `${comp.currentPct}%`, background: ASSET_TYPE_COLORS[comp.type] }} />
                    </div>
                    <span className="comparison-bar-value">{comp.currentPct}%</span>
                  </div>
                  <div className="comparison-bar-row">
                    <span className="comparison-bar-label">Target</span>
                    <div className="comparison-bar-track">
                      <div className="comparison-bar-fill target" style={{ width: `${comp.targetPct}%`, background: ASSET_TYPE_COLORS[comp.type], opacity: 0.4 }} />
                    </div>
                    <span className="comparison-bar-value">{comp.targetPct}%</span>
                  </div>
                </div>
                {comp.action !== 'HOLD' && (
                  <div className="comparison-diff">
                    {comp.drift > 0 ? <ArrowDown size={12} className="text-loss" /> : <ArrowUp size={12} className="text-gain" />}
                    <span className={comp.drift > 0 ? 'text-loss' : 'text-gain'}>
                      {comp.action === 'SELL' ? 'Reduce by' : 'Increase by'} {formatCurrency(Math.abs(comp.valueDiff))}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trade Suggestions */}
      {rebalanceData.trades.length > 0 && (
        <div className="glass-card no-hover trades-card animate-fade-in-up stagger-4">
          <div className="trades-header">
            <RefreshCw size={20} />
            <h3 className="card-title">Suggested Trades</h3>
          </div>
          <div className="trades-list">
            {rebalanceData.trades.map((trade, idx) => (
              <div key={idx} className={`trade-item trade-${trade.action.toLowerCase()}`}>
                <span className={`badge badge-${trade.action.toLowerCase()}`}>{trade.action}</span>
                <div className="trade-info">
                  <span className="trade-symbol">{trade.symbol}</span>
                  <span className="trade-name">{trade.name}</span>
                </div>
                <div className="trade-value">
                  <span className="trade-amount">{formatCurrency(trade.estimatedValue)}</span>
                  <span className="trade-reason">{trade.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
