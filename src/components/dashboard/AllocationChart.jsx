import { usePortfolio } from '../../context/PortfolioContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ASSET_TYPE_COLORS, ASSET_TYPE_LABELS } from '../../services/mockData';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">{d.label}</span>
      <span className="chart-tooltip-value">{formatCurrency(d.value)}</span>
      <span className="chart-tooltip-pct">{d.percentage.toFixed(1)}%</span>
    </div>
  );
};

export default function AllocationChart() {
  const { computed } = usePortfolio();
  const { typeAllocations, totalValue } = computed;

  const data = Object.entries(typeAllocations).map(([type, info]) => ({
    type,
    label: ASSET_TYPE_LABELS[type] || type,
    value: info.value,
    percentage: info.percentage,
    count: info.count,
    color: ASSET_TYPE_COLORS[type] || '#64748b',
  }));

  return (
    <div className="glass-card no-hover allocation-card animate-fade-in-up stagger-3">
      <h3 className="card-title">Asset Allocation</h3>
      
      <div className="allocation-content">
        <div className="allocation-chart">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="allocation-center">
            <span className="allocation-center-label">Total</span>
            <span className="allocation-center-value">
              {formatCurrency(totalValue, 0)}
            </span>
          </div>
        </div>
        
        <div className="allocation-legend">
          {data.map((item) => (
            <div key={item.type} className="allocation-legend-item">
              <div className="allocation-legend-dot" style={{ background: item.color }} />
              <span className="allocation-legend-label">{item.label}</span>
              <span className="allocation-legend-pct">{item.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
