import { useState, useMemo } from 'react';
import { calculateSIPFutureValue, calculateLumpsumFV } from '../utils/calculations';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FlaskConical, TrendingUp, IndianRupee, Clock, Percent } from 'lucide-react';
import './Simulator.css';

export default function Simulator() {
  const [monthlyAmount, setMonthlyAmount] = useState(25000);
  const [lumpsum, setLumpsum] = useState(100000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(15);

  const results = useMemo(() => {
    const sipFV = calculateSIPFutureValue(monthlyAmount, annualReturn, years);
    const lumpsumFV = calculateLumpsumFV(lumpsum, annualReturn, years);
    const totalFV = sipFV + lumpsumFV;
    const totalInvested = lumpsum + (monthlyAmount * 12 * years);
    const wealthGained = totalFV - totalInvested;

    // Generate chart data
    const data = [];
    for (let y = 0; y <= years; y++) {
      const sipVal = calculateSIPFutureValue(monthlyAmount, annualReturn, y);
      const lumpVal = calculateLumpsumFV(lumpsum, annualReturn, y);
      const invested = lumpsum + (monthlyAmount * 12 * y);
      data.push({
        year: y,
        projected: Math.round(sipVal + lumpVal),
        invested: Math.round(invested),
      });
    }

    return { totalFV, totalInvested, wealthGained, sipFV, lumpsumFV, data };
  }, [monthlyAmount, lumpsum, annualReturn, years]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <span className="chart-tooltip-label">Year {label}</span>
        <div className="chart-tooltip-row">
          <span style={{ color: '#8b5cf6' }}>●</span>
          <span>Projected: {formatCurrency(payload[0]?.value)}</span>
        </div>
        <div className="chart-tooltip-row">
          <span style={{ color: '#3b82f6' }}>●</span>
          <span>Invested: {formatCurrency(payload[1]?.value)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container simulator-page">
      <div className="page-header">
        <h1>What-If Simulator</h1>
        <p>Visualize your investment future</p>
      </div>

      <div className="simulator-layout">
        {/* Controls */}
        <div className="glass-card no-hover simulator-controls animate-fade-in-up stagger-1">
          <h3 className="card-title">
            <FlaskConical size={18} /> Adjust Parameters
          </h3>

          <div className="sim-control">
            <div className="sim-control-header">
              <label className="sim-label">
                <IndianRupee size={14} /> Monthly SIP
              </label>
              <span className="sim-value">{formatCurrency(monthlyAmount, 0)}</span>
            </div>
            <input
              type="range" min="1000" max="500000" step="1000"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(parseInt(e.target.value))}
              className="sim-slider"
              id="sip-slider"
            />
            <div className="sim-range-labels">
              <span>₹1K</span><span>₹5L</span>
            </div>
          </div>

          <div className="sim-control">
            <div className="sim-control-header">
              <label className="sim-label">
                <IndianRupee size={14} /> Lumpsum Investment
              </label>
              <span className="sim-value">{formatCurrency(lumpsum, 0)}</span>
            </div>
            <input
              type="range" min="0" max="5000000" step="10000"
              value={lumpsum}
              onChange={(e) => setLumpsum(parseInt(e.target.value))}
              className="sim-slider"
              id="lumpsum-slider"
            />
            <div className="sim-range-labels">
              <span>₹0</span><span>₹50L</span>
            </div>
          </div>

          <div className="sim-control">
            <div className="sim-control-header">
              <label className="sim-label">
                <Percent size={14} /> Expected Return
              </label>
              <span className="sim-value">{annualReturn}%</span>
            </div>
            <input
              type="range" min="4" max="30" step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(parseFloat(e.target.value))}
              className="sim-slider"
              id="return-slider"
            />
            <div className="sim-range-labels">
              <span>4%</span><span>30%</span>
            </div>
          </div>

          <div className="sim-control">
            <div className="sim-control-header">
              <label className="sim-label">
                <Clock size={14} /> Investment Duration
              </label>
              <span className="sim-value">{years} years</span>
            </div>
            <input
              type="range" min="1" max="40" step="1"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value))}
              className="sim-slider"
              id="years-slider"
            />
            <div className="sim-range-labels">
              <span>1 yr</span><span>40 yrs</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="simulator-results">
          {/* Summary Cards */}
          <div className="sim-results-grid">
            <div className="glass-card no-hover sim-result-card animate-fade-in-up stagger-2">
              <span className="sim-result-label">Future Value</span>
              <span className="sim-result-value text-gain">{formatCompactCurrency(results.totalFV)}</span>
              <span className="sim-result-sub">Total projected value</span>
            </div>
            <div className="glass-card no-hover sim-result-card animate-fade-in-up stagger-3">
              <span className="sim-result-label">Total Invested</span>
              <span className="sim-result-value">{formatCompactCurrency(results.totalInvested)}</span>
              <span className="sim-result-sub">Lumpsum + SIP contributions</span>
            </div>
            <div className="glass-card no-hover sim-result-card animate-fade-in-up stagger-4">
              <span className="sim-result-label">Wealth Gained</span>
              <span className="sim-result-value" style={{ color: 'var(--accent-purple)' }}>
                {formatCompactCurrency(results.wealthGained)}
              </span>
              <span className="sim-result-sub">Power of compounding! 🚀</span>
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card no-hover sim-chart-card animate-fade-in-up stagger-5">
            <h3 className="card-title">
              <TrendingUp size={18} /> Growth Projection
            </h3>
            <div className="sim-chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={results.data}>
                  <defs>
                    <linearGradient id="simProjGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="simInvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                  <XAxis
                    dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}y`}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => formatCompactCurrency(v)}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="projected" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#simProjGrad)" />
                  <Area type="monotone" dataKey="invested" stroke="#3b82f6" strokeWidth={1.5} fill="url(#simInvGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="sim-chart-legend">
              <span className="performance-legend-item">
                <span className="legend-dot" style={{ background: '#8b5cf6' }} /> Projected Value
              </span>
              <span className="performance-legend-item">
                <span className="legend-dot" style={{ background: '#3b82f6' }} /> Amount Invested
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
