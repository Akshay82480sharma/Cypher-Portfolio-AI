import { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { analyzeGoal } from '../services/goalCalculator';
import { formatCurrency, formatCompactCurrency, formatPercent } from '../utils/formatters';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Modal from '../components/ui/Modal';
import { Target, Plus, Clock, TrendingUp, AlertCircle, Trash2 } from 'lucide-react';
import './Goals.css';

const GOAL_ICONS = ['🏖️', '🏠', '🛡️', '✈️', '🎓', '🚗', '💍', '🏥', '📱', '💰'];

export default function Goals() {
  const { state, dispatch } = usePortfolio();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '', icon: '🎯', targetAmount: '', currentAmount: '',
    monthlyContribution: '', targetDate: '', expectedReturn: '12', priority: 'medium',
  });

  const goalAnalysis = useMemo(() => {
    return state.goals.map(goal => ({ ...goal, analysis: analyzeGoal(goal) }));
  }, [state.goals]);

  const handleAddGoal = () => {
    if (!formData.name || !formData.targetAmount || !formData.targetDate) return;
    dispatch({
      type: 'ADD_GOAL',
      payload: {
        name: formData.name,
        icon: formData.icon,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        monthlyContribution: parseFloat(formData.monthlyContribution) || 0,
        targetDate: formData.targetDate,
        expectedReturn: parseFloat(formData.expectedReturn),
        priority: formData.priority,
      },
    });
    setShowAddModal(false);
    setFormData({ name: '', icon: '🎯', targetAmount: '', currentAmount: '', monthlyContribution: '', targetDate: '', expectedReturn: '12', priority: 'medium' });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-row">
          <span style={{ color: '#3b82f6' }}>●</span>
          <span>Projected: {formatCurrency(payload[0]?.value)}</span>
        </div>
        {payload[1] && (
          <div className="chart-tooltip-row">
            <span style={{ color: '#64748b' }}>●</span>
            <span>Invested: {formatCurrency(payload[1]?.value)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container goals-page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Goals</h1>
            <p>Track your financial milestones</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} id="add-goal-btn">
            <Plus size={18} /> New Goal
          </button>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="goals-grid">
        {goalAnalysis.map((goal, idx) => {
          const a = goal.analysis;
          return (
            <div
              key={goal.id}
              className={`glass-card no-hover goal-card animate-fade-in-up stagger-${idx + 1}`}
              onClick={() => setSelectedGoal(goal)}
            >
              <div className="goal-card-header">
                <div className="goal-icon">{goal.icon}</div>
                <div className="goal-meta">
                  <h3 className="goal-name">{goal.name}</h3>
                  <span className={`badge badge-${goal.priority === 'high' ? 'critical' : goal.priority === 'medium' ? 'warning' : 'info'}`}>
                    {goal.priority}
                  </span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_GOAL', payload: goal.id }); }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Progress Ring */}
              <div className="goal-progress-container">
                <svg viewBox="0 0 100 100" className="goal-progress-svg">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={a.isOnTrack ? '#10b981' : '#f59e0b'}
                    strokeWidth="6"
                    strokeDasharray={`${a.progress * 2.51} 251.2`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                  />
                </svg>
                <div className="goal-progress-text">
                  <span className="goal-progress-pct">{Math.round(a.progress)}%</span>
                </div>
              </div>

              <div className="goal-amounts">
                <div className="goal-amount-row">
                  <span className="goal-amount-label">Current</span>
                  <span className="goal-amount-value">{formatCompactCurrency(goal.currentAmount)}</span>
                </div>
                <div className="goal-amount-row">
                  <span className="goal-amount-label">Target</span>
                  <span className="goal-amount-value">{formatCompactCurrency(goal.targetAmount)}</span>
                </div>
              </div>

              <div className="goal-stats">
                <div className="goal-stat">
                  <Clock size={12} />
                  <span>{a.yearsRemaining} yrs left</span>
                </div>
                <div className="goal-stat">
                  <TrendingUp size={12} />
                  <span>SIP: {formatCurrency(a.requiredSIP, 0)}/mo</span>
                </div>
              </div>

              <div className={`goal-status ${a.isOnTrack ? 'on-track' : 'off-track'}`}>
                {a.isOnTrack ? '✅ On Track' : '⚠️ Needs attention'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <Modal isOpen={!!selectedGoal} onClose={() => setSelectedGoal(null)} title={`${selectedGoal.icon} ${selectedGoal.name}`} size="lg">
          <div className="goal-detail">
            <div className="goal-detail-grid">
              <div className="goal-detail-stat">
                <span className="goal-detail-label">Target Amount</span>
                <span className="goal-detail-value">{formatCurrency(selectedGoal.targetAmount)}</span>
              </div>
              <div className="goal-detail-stat">
                <span className="goal-detail-label">Current Amount</span>
                <span className="goal-detail-value">{formatCurrency(selectedGoal.currentAmount)}</span>
              </div>
              <div className="goal-detail-stat">
                <span className="goal-detail-label">Monthly SIP (Current)</span>
                <span className="goal-detail-value">{formatCurrency(selectedGoal.monthlyContribution)}</span>
              </div>
              <div className="goal-detail-stat">
                <span className="goal-detail-label">Required SIP</span>
                <span className="goal-detail-value" style={{ color: selectedGoal.analysis.isOnTrack ? 'var(--gain)' : 'var(--warning)' }}>
                  {formatCurrency(selectedGoal.analysis.requiredSIP)}
                </span>
              </div>
              <div className="goal-detail-stat">
                <span className="goal-detail-label">Projected Total</span>
                <span className="goal-detail-value">{formatCompactCurrency(selectedGoal.analysis.projectedTotal)}</span>
              </div>
              <div className="goal-detail-stat">
                <span className="goal-detail-label">{selectedGoal.analysis.surplus >= 0 ? 'Surplus' : 'Shortfall'}</span>
                <span className="goal-detail-value" style={{ color: selectedGoal.analysis.surplus >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                  {formatCompactCurrency(Math.abs(selectedGoal.analysis.surplus))}
                </span>
              </div>
            </div>

            <div className="goal-chart-container">
              <h4 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Projected Growth</h4>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={selectedGoal.analysis.projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v}y`} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => formatCompactCurrency(v)} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="rgba(59,130,246,0.1)" />
                  <Area type="monotone" dataKey="invested" stroke="#64748b" strokeWidth={1.5} fill="rgba(148,163,184,0.05)" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Goal Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Goal" size="md">
        <div className="form-group">
          <label className="form-label">Goal Name</label>
          <input type="text" className="form-input" placeholder="e.g., Retirement Fund" value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} id="goal-name-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Icon</label>
          <div className="icon-picker">
            {GOAL_ICONS.map(icon => (
              <button key={icon} className={`icon-btn ${formData.icon === icon ? 'active' : ''}`}
                onClick={() => setFormData(p => ({ ...p, icon }))}>{icon}</button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Target Amount (₹)</label>
            <input type="number" className="form-input" placeholder="e.g., 5000000" value={formData.targetAmount}
              onChange={(e) => setFormData(p => ({ ...p, targetAmount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Current Savings (₹)</label>
            <input type="number" className="form-input" placeholder="e.g., 100000" value={formData.currentAmount}
              onChange={(e) => setFormData(p => ({ ...p, currentAmount: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Monthly SIP (₹)</label>
            <input type="number" className="form-input" placeholder="e.g., 25000" value={formData.monthlyContribution}
              onChange={(e) => setFormData(p => ({ ...p, monthlyContribution: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Target Date</label>
            <input type="date" className="form-input" value={formData.targetDate}
              onChange={(e) => setFormData(p => ({ ...p, targetDate: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Expected Return (%/year)</label>
            <input type="number" className="form-input" value={formData.expectedReturn}
              onChange={(e) => setFormData(p => ({ ...p, expectedReturn: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={formData.priority}
              onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddGoal} disabled={!formData.name || !formData.targetAmount || !formData.targetDate}>
            <Target size={16} /> Create Goal
          </button>
        </div>
      </Modal>
    </div>
  );
}
