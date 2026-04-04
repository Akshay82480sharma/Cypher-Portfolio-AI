import { useState, useMemo } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { generatePortfolioHistory } from '../../utils/calculations';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ranges = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-date">{label}</span>
      <div className="chart-tooltip-row">
        <span style={{ color: '#3b82f6' }}>●</span>
        <span>Portfolio: {formatCurrency(payload[0]?.value)}</span>
      </div>
      {payload[1] && (
        <div className="chart-tooltip-row">
          <span style={{ color: '#8b5cf6' }}>●</span>
          <span>Nifty 50: {payload[1]?.value?.toLocaleString('en-IN')}</span>
        </div>
      )}
    </div>
  );
};

export default function PerformanceChart() {
  const { state } = usePortfolio();
  const [activeRange, setActiveRange] = useState('1M');

  const data = useMemo(() => {
    const days = ranges.find(r => r.label === activeRange)?.days || 30;
    return generatePortfolioHistory(state.holdings, days);
  }, [state.holdings, activeRange]);

  return (
    <div className="glass-card no-hover performance-card animate-fade-in-up stagger-4">
      <div className="performance-header">
        <h3 className="card-title">Performance</h3>
        <div className="performance-range-selector">
          {ranges.map(r => (
            <button
              key={r.label}
              className={`range-btn ${activeRange === r.label ? 'active' : ''}`}
              onClick={() => setActiveRange(r.label)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="performance-chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
              tickLine={false}
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getDate()}/${d.getMonth()+1}`;
              }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6', stroke: '#0a0e1a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="performance-legend">
        <span className="performance-legend-item">
          <span className="legend-dot" style={{ background: '#3b82f6' }} />
          Your Portfolio
        </span>
      </div>
    </div>
  );
}
