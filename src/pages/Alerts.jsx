import { usePortfolio } from '../context/PortfolioContext';
import { formatDate } from '../utils/formatters';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Check, X } from 'lucide-react';
import './Alerts.css';

export default function Alerts() {
  const { state, dispatch, computed } = usePortfolio();
  const { alerts } = state;

  const unread = alerts.filter(a => !a.read);
  const read = alerts.filter(a => a.read);

  const markRead = (id) => dispatch({ type: 'MARK_ALERT_READ', payload: id });
  const dismiss = (id) => dispatch({ type: 'DISMISS_ALERT', payload: id });

  const getIcon = (type) => {
    switch (type) {
      case 'critical': return <XCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  const handleAction = (alert) => {
    markRead(alert.id);
    if (alert.action === 'View Portfolio') dispatch({ type: 'SET_PAGE', payload: 'portfolio' });
    if (alert.action === 'View Rebalancing' || alert.action === 'Rebalance Now') dispatch({ type: 'SET_PAGE', payload: 'rebalance' });
  };

  return (
    <div className="page-container alerts-page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Smart Alerts</h1>
            <p>{computed.unreadAlerts} unread notifications</p>
          </div>
          {unread.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => unread.forEach(a => markRead(a.id))}>
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Unread */}
      {unread.length > 0 && (
        <div className="alerts-section animate-fade-in">
          <h3 className="alerts-section-title">
            <Bell size={16} /> New ({unread.length})
          </h3>
          <div className="alerts-list">
            {unread.map((alert, idx) => (
              <div key={alert.id} className={`alert-card alert-${alert.type} animate-fade-in-up stagger-${idx + 1}`}>
                <div className="alert-icon">{getIcon(alert.type)}</div>
                <div className="alert-content">
                  <div className="alert-title">{alert.title}</div>
                  <p className="alert-message">{alert.message}</p>
                  <div className="alert-footer">
                    <span className="alert-time">{formatDate(alert.timestamp, 'relative')}</span>
                    {alert.actionable && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleAction(alert)}>
                        {alert.action}
                      </button>
                    )}
                  </div>
                </div>
                <div className="alert-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => markRead(alert.id)} title="Mark as read">
                    <Check size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => dismiss(alert.id)} title="Dismiss">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div className="alerts-section animate-fade-in" style={{ marginTop: 'var(--space-8)' }}>
          <h3 className="alerts-section-title text-muted">
            <CheckCircle size={16} /> Earlier
          </h3>
          <div className="alerts-list">
            {read.map((alert) => (
              <div key={alert.id} className={`alert-card alert-${alert.type} alert-read`}>
                <div className="alert-icon">{getIcon(alert.type)}</div>
                <div className="alert-content">
                  <div className="alert-title">{alert.title}</div>
                  <p className="alert-message">{alert.message}</p>
                  <span className="alert-time">{formatDate(alert.timestamp, 'relative')}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => dismiss(alert.id)} title="Dismiss">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="glass-card no-hover empty-state animate-fade-in">
          <CheckCircle size={48} className="text-gain" />
          <h3>All clear!</h3>
          <p>No alerts at the moment. We'll notify you when something needs your attention.</p>
        </div>
      )}
    </div>
  );
}
