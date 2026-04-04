import { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { calculateHealthScore, detectRisks, generateRecommendations } from '../services/aiEngine';
import { Brain, ShieldAlert, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './AIAdvisor.css';

export default function AIAdvisor() {
  const { state } = usePortfolio();

  const healthScore = useMemo(() => calculateHealthScore(state.holdings), [state.holdings]);
  const risks = useMemo(() => detectRisks(state.holdings), [state.holdings]);
  const recommendations = useMemo(() => generateRecommendations(state.holdings), [state.holdings]);

  const scoreColor = healthScore.score >= 7 ? '#10b981' : healthScore.score >= 5 ? '#f59e0b' : '#ef4444';
  const scoreLabel = healthScore.score >= 8 ? 'Excellent' : healthScore.score >= 6 ? 'Good' : healthScore.score >= 4 ? 'Fair' : 'Poor';

  return (
    <div className="page-container advisor-page">
      <div className="page-header">
        <h1>AI Advisor</h1>
        <p>Intelligent insights powered by rule-based analysis</p>
      </div>

      <div className="advisor-grid">
        {/* Health Score Gauge */}
        <div className="glass-card no-hover health-card animate-fade-in-up stagger-1">
          <div className="health-card-header">
            <Brain size={20} className="health-icon" />
            <h3 className="card-title">Portfolio Health Score</h3>
          </div>
          <div className="health-gauge-container">
            <svg viewBox="0 0 200 120" className="health-gauge-svg">
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="40%" stopColor="#f59e0b" />
                  <stop offset="70%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="rgba(148,163,184,0.1)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Score arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(healthScore.score / 10) * 251.2} 251.2`}
                className="gauge-progress"
              />
              {/* Needle */}
              <line
                x1="100"
                y1="100"
                x2={100 + 60 * Math.cos(Math.PI - (healthScore.score / 10) * Math.PI)}
                y2={100 - 60 * Math.sin(Math.PI - (healthScore.score / 10) * Math.PI)}
                stroke={scoreColor}
                strokeWidth="3"
                strokeLinecap="round"
                className="gauge-needle"
              />
              <circle cx="100" cy="100" r="5" fill={scoreColor} />
            </svg>
            <div className="health-gauge-value">
              <span className="health-gauge-number" style={{ color: scoreColor }}>{healthScore.score}</span>
              <span className="health-gauge-max">/10</span>
            </div>
            <span className="health-gauge-label" style={{ color: scoreColor }}>{scoreLabel}</span>
          </div>

          {/* Breakdown */}
          <div className="health-breakdown">
            {Object.entries(healthScore.breakdown).map(([key, data]) => (
              <div key={key} className="health-breakdown-item">
                <div className="health-breakdown-header">
                  <span className="health-breakdown-label">{data.label}</span>
                  <span className="health-breakdown-score">{data.score.toFixed(1)}/10</span>
                </div>
                <div className="health-breakdown-bar">
                  <div
                    className="health-breakdown-fill"
                    style={{
                      width: `${data.score * 10}%`,
                      background: data.score >= 7 ? 'var(--gain)' : data.score >= 5 ? 'var(--warning)' : 'var(--loss)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risks */}
        <div className="glass-card no-hover risks-card animate-fade-in-up stagger-2">
          <div className="risks-header">
            <ShieldAlert size={20} />
            <h3 className="card-title">Risk Analysis</h3>
            <span className="risk-count badge badge-warning">{risks.length} issues</span>
          </div>
          <div className="risks-list">
            {risks.length === 0 ? (
              <div className="risk-empty">
                <CheckCircle size={32} className="text-gain" />
                <p>No major risks detected. Your portfolio looks healthy!</p>
              </div>
            ) : (
              risks.map(risk => (
                <div key={risk.id} className={`risk-item risk-${risk.severity}`}>
                  <div className="risk-severity-bar" />
                  <div className="risk-content">
                    <div className="risk-title-row">
                      {risk.severity === 'critical' ? <AlertTriangle size={14} /> : 
                       risk.severity === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                      <span className="risk-title">{risk.title}</span>
                    </div>
                    <p className="risk-description">{risk.description}</p>
                  </div>
                  <span className={`badge badge-${risk.severity}`}>{risk.severity}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card no-hover recommendations-card animate-fade-in-up stagger-3">
        <div className="recommendations-header">
          <TrendingUp size={20} />
          <h3 className="card-title">AI Recommendations</h3>
        </div>
        <div className="recommendations-grid">
          {recommendations.map(rec => (
            <div key={rec.id} className="recommendation-item">
              <div className="recommendation-top">
                <span className={`badge badge-${rec.action.toLowerCase()}`}>{rec.action}</span>
                <span className={`badge badge-${rec.priority === 'high' ? 'critical' : rec.priority === 'medium' ? 'warning' : 'info'}`}>
                  {rec.priority}
                </span>
              </div>
              <div className="recommendation-asset">
                <span className="recommendation-symbol">{rec.symbol}</span>
                <span className="recommendation-name">{rec.name}</span>
              </div>
              <p className="recommendation-reason">{rec.reason}</p>
              <div className="recommendation-impact">
                <span className="recommendation-impact-label">Impact:</span>
                <span>{rec.impact}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="advisor-disclaimer">
          ⚠️ These are rule-based suggestions, not financial advice. Always consult a SEBI-registered advisor before making investment decisions.
        </div>
      </div>
    </div>
  );
}
