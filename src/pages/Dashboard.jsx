import { usePortfolio } from '../context/PortfolioContext';
import NetWorthCard from '../components/dashboard/NetWorthCard';
import PnLCard from '../components/dashboard/PnLCard';
import AllocationChart from '../components/dashboard/AllocationChart';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import TopMovers from '../components/dashboard/TopMovers';
import { calculateHealthScore } from '../services/aiEngine';
import { Briefcase, Brain, Target, Bell, RefreshCw, FlaskConical } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { state, dispatch, computed } = usePortfolio();
  const healthScore = calculateHealthScore(state.holdings);

  const quickActions = [
    { id: 'portfolio', label: 'Add Holding', icon: Briefcase, page: 'portfolio' },
    { id: 'advisor', label: 'AI Insights', icon: Brain, page: 'advisor' },
    { id: 'goals', label: 'Set Goal', icon: Target, page: 'goals' },
    { id: 'alerts', label: 'View Alerts', icon: Bell, page: 'alerts', badge: computed.unreadAlerts },
    { id: 'rebalance', label: 'Rebalance', icon: RefreshCw, page: 'rebalance' },
    { id: 'simulator', label: 'Simulate', icon: FlaskConical, page: 'simulator' },
  ];

  return (
    <div className="page-container dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your portfolio at a glance</p>
      </div>

      {/* Top Row: Net Worth + P&L + Health Score */}
      <div className="dashboard-top-row">
        <NetWorthCard />
        <PnLCard />
        <div className="glass-card no-hover health-score-mini animate-fade-in-up stagger-3">
          <span className="health-label">Portfolio Health</span>
          <div className="health-score-circle">
            <svg viewBox="0 0 100 100" className="health-svg">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={healthScore.score >= 7 ? '#10b981' : healthScore.score >= 5 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                strokeDasharray={`${healthScore.score * 26.4} 264`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="health-progress"
              />
            </svg>
            <div className="health-score-value">
              <span className="health-score-number">{healthScore.score}</span>
              <span className="health-score-max">/10</span>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'advisor' })}
          >
            View Details →
          </button>
        </div>
      </div>

      {/* Chart Row */}
      <div className="dashboard-chart-row">
        <PerformanceChart />
        <AllocationChart />
      </div>

      {/* Bottom Row */}
      <div className="dashboard-bottom-row">
        <TopMovers />
        
        {/* Quick Actions */}
        <div className="glass-card no-hover quick-actions-card animate-fade-in-up stagger-6">
          <h3 className="card-title">Quick Actions</h3>
          <div className="quick-actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  className="quick-action-btn"
                  onClick={() => dispatch({ type: 'SET_PAGE', payload: action.page })}
                >
                  <div className="quick-action-icon">
                    <Icon size={20} />
                    {action.badge > 0 && (
                      <span className="quick-action-badge">{action.badge}</span>
                    )}
                  </div>
                  <span className="quick-action-label">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
