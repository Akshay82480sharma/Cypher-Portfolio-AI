import { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import NetWorthCard from '../components/dashboard/NetWorthCard';
import PnLCard from '../components/dashboard/PnLCard';
import AllocationChart from '../components/dashboard/AllocationChart';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import TopMovers from '../components/dashboard/TopMovers';
import { calculateHealthScore } from '../services/aiEngine';
import { Briefcase, Brain, Target, Bell, RefreshCw, FlaskConical, Wifi, WifiOff, Radio } from 'lucide-react';
import './Dashboard.css';

function LiveStatusBadge() {
  const { marketStatus } = usePortfolio();
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const update = () => {
      if (!marketStatus.lastUpdated) {
        setTimeAgo('connecting...');
        return;
      }
      const seconds = Math.floor((Date.now() - marketStatus.lastUpdated) / 1000);
      if (seconds < 5) setTimeAgo('just now');
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [marketStatus.lastUpdated]);

  const isLive = marketStatus.dataSource === 'live' || marketStatus.dataSource === 'partial';
  const isSimulated = marketStatus.dataSource === 'simulated';
  const isConnecting = marketStatus.dataSource === 'connecting';

  const statusLabel = marketStatus.dataSource === 'live' ? 'LIVE' 
    : marketStatus.dataSource === 'partial' ? 'LIVE' 
    : isSimulated ? 'SIMULATED' : 'CONNECTING';

  return (
    <div className={`live-status-badge ${isLive ? 'live' : isSimulated ? 'simulated' : 'connecting'}`}>
      <span className="live-status-dot" />
      <span className="live-status-label">{statusLabel}</span>
      {marketStatus.liveCount > 0 && (
        <span className="live-status-time">· {marketStatus.liveCount}/{marketStatus.totalCount}</span>
      )}
      {marketStatus.lastUpdated && (
        <span className="live-status-time">· {timeAgo}</span>
      )}
      {marketStatus.isMarketOpen && (
        <span className="live-status-market">· NSE Open</span>
      )}
    </div>
  );
}

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
        <div className="page-header-row">
          <div>
            <h1>Dashboard</h1>
            <p>Your portfolio at a glance</p>
          </div>
          <LiveStatusBadge />
        </div>
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
