import { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  LayoutDashboard, Briefcase, Brain, Target, Bell, RefreshCw,
  FlaskConical, ChevronLeft, ChevronRight, Zap, TrendingUp
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'advisor', label: 'AI Advisor', icon: Brain },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'rebalance', label: 'Rebalance', icon: RefreshCw },
  { id: 'simulator', label: 'Simulator', icon: FlaskConical },
];

export default function Sidebar() {
  const { state, dispatch, computed } = usePortfolio();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (pageId) => {
    dispatch({ type: 'SET_PAGE', payload: pageId });
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        <Zap size={20} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <TrendingUp size={22} />
          </div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-name">Cypher</span>
              <span className="sidebar-logo-badge">AI</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = state.activePage === item.id;
            const showBadge = item.id === 'alerts' && computed.unreadAlerts > 0;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.id)}
                data-tooltip={collapsed ? item.label : undefined}
              >
                <div className="sidebar-nav-icon">
                  <Icon size={20} />
                  {showBadge && (
                    <span className="sidebar-nav-badge">{computed.unreadAlerts}</span>
                  )}
                </div>
                {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
                {isActive && <div className="sidebar-nav-indicator" />}
              </button>
            );
          })}
        </nav>

        {/* Collapse button */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Footer */}
        {!collapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-disclaimer">
              ⚠️ Not financial advice
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
